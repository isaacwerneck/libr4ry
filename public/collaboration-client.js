import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { Awareness,encodeAwarenessUpdate,applyAwarenessUpdate } from 'y-protocols/awareness';
import {seal,open,toBase64,fromBase64} from './crypto.js';
import {draftStore} from './drafts.js';

const remote=Symbol('remote');
export class CollaborationClient {
  constructor({doc,key,book,user,url,api,onChange,onStatus,store=draftStore}) {
    Object.assign(this,{doc,key,book,user,url,api,onChange,onStatus,store});
    this.awareness=new Awareness(doc);this.queue=new Map();this.raw=[];this.ready=false;this.closed=false;
    this.incoming=Promise.resolve();this.localSave=Promise.resolve();this.drain=Promise.resolve();
    this.localId='collab:'+user.id+':'+book.id+':'+crypto.randomUUID();
    this.context='collab:'+book.id;this.localContext='collab-local:'+user.id+':'+book.id;
    doc.on('update',(update,origin)=>{
      if(origin===remote) return;
      this.raw.push(update);this.protect();
      if(!this.timer) this.timer=setTimeout(()=>{this.timer=null;this.send().catch(error=>this.fail(error));},400);
    });
    doc.on('afterTransaction',transaction=>{if(transaction.changed.size) onChange(transaction.changedParentTypes);});
    this.awareness.on('update',({added,updated,removed},origin)=>{
      if(origin===remote || !this.ready || this.closed) return;
      const bytes=encodeAwarenessUpdate(this.awareness,[...added,...updated,...removed]);
      clearTimeout(this.presenceTimer);
      this.presenceTimer=setTimeout(async()=>{
        try {if(this.ready && !this.closed) this.provider.sendStateless(JSON.stringify({type:'presence',payload:await seal(key,toBase64(bytes),this.context+':presence')}));}
        catch(error) {this.fail(error);}
      },120);
    });
  }
  fail(error) {this.error=error;this.onStatus(error.message);}
  get pending() {return this.raw.length>0 || this.queue.size>0;}
  protect() {
    this.localSave=this.localSave.then(async()=>{
      const value={state:toBase64(Y.encodeStateAsUpdate(this.doc)),queue:[...this.queue.values()]};
      const envelope=await seal(this.key,value,this.localContext);
      await this.store('put',{id:this.localId,ownerId:this.user.id,collaborationBookId:this.book.id,stamp:crypto.randomUUID(),envelope});
      this.localError=null;
    }).catch(error=>{this.localError=error;this.onStatus('Proteção local indisponível. Aguarde a confirmação do servidor antes de fechar.');});
    return this.localSave;
  }
  async recover() {
    const records=(await this.store('list')).filter(item=>item.ownerId===this.user.id && item.collaborationBookId===this.book.id);
    for(const record of records) {
      try {
        const value=await open(this.key,record.envelope,this.localContext);
        if(typeof value.state!=='string' || !Array.isArray(value.queue)) throw new Error('Rascunho colaborativo inválido.');
        Y.applyUpdate(this.doc,fromBase64(value.state),remote);
        for(const update of value.queue) {
          if(typeof update.id!=='string' || !update.payload) throw new Error('Envio colaborativo inválido.');
          this.queue.set(update.id,update);
        }
        // Estado local pode conter escrita anterior ao preparo de um envio.
        this.raw.push(Y.encodeStateAsUpdate(this.doc));
      } catch(error) {this.fail(new Error('Um rascunho colaborativo não pôde ser aberto e foi preservado: '+error.message));}
    }
  }
  async applyState(state) {
    const value=await open(this.key,state.snapshot,this.context);
    if(typeof value!=='string') throw new Error('Versão compartilhada inválida.');
    Y.applyUpdate(this.doc,fromBase64(value),remote);
    for(const update of state.updates) await this.applyUpdate(update);
  }
  async applyUpdate(update) {
    const value=await open(this.key,update.payload,this.context);
    if(typeof value!=='string') throw new Error('Edição compartilhada inválida.');
    Y.applyUpdate(this.doc,fromBase64(value),remote);
    this.queue.delete(update.id);
  }
  async start(state) {
    if(state) {await this.applyState(state);await this.recover();}
    const transport=new Y.Doc();
    this.provider=new HocuspocusProvider({url:this.url,name:this.book.id,document:transport,awareness:null,
      token:async()=>(await this.api('/api/sharing/books/'+this.book.id+'/ticket',{})).token,
      onAuthenticated:()=>{this.provider.sendStateless(JSON.stringify({type:'sync'}));},
      onStatus:({status})=>{if(status!=='connected') this.onStatus('Reconectando. O servidor gratuito pode levar cerca de um minuto para iniciar.');},
      onDisconnect:()=>{this.ready=false;},
      onAuthenticationFailed:({reason})=>{this.ready=false;this.fail(new Error('Não foi possível autorizar a colaboração: '+reason));},
      onStateless:({payload})=>{
        this.incoming=this.incoming.then(async()=>{
          const message=JSON.parse(payload);
          if(message.type==='state') {
            await this.applyState(message);this.ready=true;this.error=null;
            await this.send();this.onStatus(this.pending?'Sincronizando…':'Salvo');
          } else if(message.type==='update') {
            await this.applyUpdate(message);await this.protect();
            this.onStatus(this.pending?'Sincronizando…':'Salvo');
          } else if(message.type==='presence') {
            const value=await open(this.key,message.payload,this.context+':presence');
            if(typeof value!=='string') throw new Error('Presença compartilhada inválida.');
            applyAwarenessUpdate(this.awareness,fromBase64(value),remote);
          } else if(message.type==='error') {
            if([401,403,404].includes(message.status)) {this.ready=false;this.denied=true;this.provider.disconnect();}
            throw new Error(message.message);
          }
        }).catch(error=>this.fail(error));
      },
    });
    this.transport=transport;
    this.resend=setInterval(()=>{if(this.ready && this.pending) this.send().catch(error=>this.fail(error));},3000);
    return this;
  }
  send() {
    const run=async()=>{
      if(this.closed) return;
      if(this.raw.length) {
        const count=this.raw.length;
        const update={id:crypto.randomUUID(),payload:await seal(this.key,toBase64(Y.mergeUpdates(this.raw.slice(0,count))),this.context)};
        this.raw.splice(0,count);this.queue.set(update.id,update);await this.protect();
      }
      if(!this.ready) return;
      for(const update of this.queue.values()) this.provider.sendStateless(JSON.stringify({type:'update',...update}));
    };
    this.drain=this.drain.then(run,run).catch(error=>{this.fail(error);throw error;});
    return this.drain;
  }
  async flush() {
    await this.send();
    const deadline=Date.now()+12000;
    while(this.pending && Date.now()<deadline && !this.denied && !this.closed) await new Promise(resolve=>setTimeout(resolve,100));
    if(this.pending) throw new Error('O servidor ainda não confirmou todas as edições. O rascunho continua neste dispositivo; mantenha esta aba aberta.');
  }
  async checkpoint() {
    await this.flush();
    const state=await this.api('/api/sharing/books/'+this.book.id);
    await this.applyState(state);
    if(!state.updates.length) return;
    const through=Math.max(Number(state.snapshot_seq),...state.updates.map(update=>Number(update.seq)));
    await this.api('/api/sharing/books/'+this.book.id+'/snapshot',{through,snapshot:await seal(this.key,toBase64(Y.encodeStateAsUpdate(this.doc)),this.context)});
  }
  destroy() {
    this.closed=true;clearTimeout(this.timer);clearTimeout(this.presenceTimer);clearInterval(this.resend);
    this.awareness.setLocalState(null);this.provider?.destroy();this.transport?.destroy();this.awareness.destroy();this.doc.destroy();
  }
}
