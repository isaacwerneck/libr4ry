import {api,context} from './storage.js';
import {seal,open,fromBase64,toBase64,importKey} from './crypto.js';
import {createSharingKeys,unlockSharingKey,wrapSharedKey,unwrapSharedKey} from './sharing-crypto.js';
import {preferences} from './notebook-preferences.js';
import {organization} from './collection.js';
import {copyNotebook} from './notebook-markdown.js';
import {CollaborationClient,SharedY,createSharedDocument,commitSharedModel,readSharedModel} from '/visual-editor.js';

const localPreferences=['desk','light','layout','motion','reading','reminder','ambient','zoom'];
export function setupSharing({books,session,rootKey,current,initialize,serialize,onModel,show,refresh,notify,settle,store}) {
  const $=id=>document.getElementById('sharing-'+id);
  const clients=new Map();let keys,privateKey,url='',editing,busy=false;
  async function ensureKeys() {
    if(keys) return;
    let result=await api('/api/sharing/keys');
    if(!result.key) result=await api('/api/sharing/keys',await createSharingKeys(rootKey(),session().user.id,session().keyset.id));
    privateKey=await unlockSharingKey(rootKey(),session().user.id,session().keyset.id,result.key.private_envelope);
    keys=result.key;
    url=(await api('/api/auth-options')).collaboration || '';
  }
  async function ownerSecret(book) {
    const record=(await api('/api/notebooks')).notebooks.find(item=>item.id===book.id);
    if(!record) throw new Error('Somente o dono pode compartilhar a chave deste caderno.');
    return fromBase64(await open(rootKey(),record.wrapped_key,context(book,'key',session().keyset.id)));
  }
  function updateModel(book,changed) {
    try {readSharedModel(book.collaboration.doc,book,serialize,changed);book.generation=(book.generation || 0)+1;book.confirmed=book.generation;onModel(book,true);}
    catch(error) {book.visualError=error.message;notify(error.message);}
  }
  async function loadRoom(row) {
    await ensureKeys();
    let book=books().find(item=>item.id===row.notebook_id) || clients.get(row.notebook_id)?.book;
    const state=await api('/api/sharing/books/'+row.notebook_id);
    if(book?.collaboration) {
      book.sharing=state;book.collaboration.permission=state.permission;
      await book.collaboration.applyState(state);return book;
    }
    let key;
    if(state.owner_id===session().user.id) key=book?.key || await importKey(await ownerSecret({id:state.notebook_id,ownerId:state.owner_id}));
    else if(state.key_envelope) key=await unwrapSharedKey(state.key_envelope,privateKey,state.owner_public_key,state.notebook_id,state.owner_id,session().user.id);
    else key=await importKey(fromBase64(state.public_key));
    book ||= {id:state.notebook_id,ownerId:state.owner_id,key,title:'Caderno compartilhado',subject:'',tags:[],pages:[],tasks:[],preferences:preferences(),organization:organization()};
    book.key=key;book.sharing=state;book.generation=0;book.confirmed=0;
    if(state.personal_envelope) {
      const personal=await open(rootKey(),state.personal_envelope,'personal:'+session().user.id+':'+book.id);
      book.organization=organization(personal.organization);book.position=personal.position || null;
      book.preferences=preferences({...book.preferences,...personal.preferences});
    }
    const doc=new SharedY.Doc();
    const client=new CollaborationClient({doc,key,book,user:session().user,url,api,
      onChange:changed=>{if(book.collaboration) updateModel(book,changed);},
      onStatus:message=>{book.collaborationStatus=message;onModel(book,false);},
    });
    book.collaboration=client;client.permission=state.permission;clients.set(book.id,client);
    await client.applyState(state);
    if(state.permission!=='reader') await client.recover();
    readSharedModel(doc,book,serialize);
    if(state.permission==='reader') book.preferences.reading=true;
    if((state.owner_id===session().user.id || state.key_envelope) && !books().includes(book)) books().push(book);
    return book;
  }
  async function load() {
    await ensureKeys();
    for(const row of (await api('/api/sharing/books')).books) await loadRoom(row);
  }
  async function connect(book) {
    if(!book.collaboration) return;
    if(!url) {book.collaborationStatus='Colaboração ainda não configurada na hospedagem.';onModel(book);return;}
    if(!book.collaboration.provider) await book.collaboration.start();
    else {await book.collaboration.provider.connect();book.collaboration.provider.sendStateless(JSON.stringify({type:'sync'}));}
  }
  function personalValue(book) {
    return {organization:organization(book.organization),position:book.position || null,
      preferences:Object.fromEntries(localPreferences.map(key=>[key,book.preferences[key]]))};
  }
  async function savePersonal(book) {
    clearTimeout(book.personalTimer);
    const value=personalValue(book),serialized=JSON.stringify(value);
    if(serialized===book.personalSaved) return;
    await api('/api/sharing/books/'+book.id+'/personal',{envelope:await seal(rootKey(),value,'personal:'+session().user.id+':'+book.id)});
    book.personalSaved=serialized;
  }
  function changed(book) {
    if(!book.collaboration) return false;
    if(book.sharing.permission!=='reader') commitSharedModel(book.collaboration.doc,book,initialize);
    const serialized=JSON.stringify(personalValue(book));
    if(serialized!==book.personalSaved) {
      clearTimeout(book.personalTimer);
      book.personalTimer=setTimeout(()=>savePersonal(book).catch(error=>notify('Não foi possível guardar suas preferências: '+error.message)),900);
    }
    return true;
  }
  async function flush(book) {
    if(!book.collaboration) return;
    if(book.sharing.permission!=='reader') await book.collaboration.checkpoint();
    await savePersonal(book);
  }
  async function run(action) {
    if(busy) return;busy=true;$('form').inert=true;$('error').textContent='';
    try {await action();}
    catch(error) {$('error').textContent=error.message;}
    finally {busy=false;$('form').inert=false;}
  }
  async function settings(book) {
    if(!session()) {notify('O compartilhamento exige uma conta.');return;}
    await ensureKeys();editing=book;
    if(book.ownerId!==session().user.id) {notify('Somente o dono altera a visibilidade e a lista de acesso.');return;}
    $('heading').textContent='Acesso a '+book.title;
    $('visibility').value=book.sharing?.visibility || 'private';
    $('enabled').hidden=Boolean(book.sharing);$('options').hidden=!book.sharing;
    $('error').textContent='';
    const friends=(await api('/api/social/friends')).friends.filter(item=>item.accepted);
    $('person').replaceChildren(new Option('Escolher amizade',''),...friends.map(item=>new Option(item.display_name,item.id)));
    if(book.sharing) await accessList();
    $('dialog').showModal();
  }
  async function accessList() {
    const result=await api('/api/sharing/books/'+editing.id+'/access');
    $('list').replaceChildren(...result.access.map(person=>{
      const row=document.createElement('p');
      row.textContent=person.display_name+' · '+({editor:'pode editar',reader:'pode ler',blocked:'bloqueado'})[person.role];
      return row;
    }));
    if(!result.access.length) $('list').textContent='Nenhuma pessoa na lista de acesso.';
  }
  $('open').addEventListener('click',()=>settings(current()).catch(error=>notify(error.message)));
  $('cancel').addEventListener('click',()=>{if(!busy)$('dialog').close();});
  $('dialog').addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  $('enable').addEventListener('click',()=>run(async()=>{
    if(!url) throw new Error('Configure o servidor de colaboração antes de ativar este caderno.');
    await settle(editing);
    const doc=createSharedDocument(editing,initialize);
    try {await api('/api/sharing/books/'+editing.id+'/enable',{revision:editing.revision,snapshot:await seal(editing.key,toBase64(SharedY.encodeStateAsUpdate(doc)),'collab:'+editing.id)});}
    finally {doc.destroy();}
    await loadRoom({notebook_id:editing.id});await connect(editing);
    $('enabled').hidden=true;$('options').hidden=false;await accessList();refresh();show(editing);
  }));
  $('visibility-save').addEventListener('click',()=>run(async()=>{
    const visible=$('visibility').value==='public';
    if(visible && !window.confirm('Tornar este caderno legível para todas as contas logadas? Somente você e a whitelist poderão editar. Quem já ler poderá guardar uma cópia.')) return;
    const secret=visible?await ownerSecret(editing):null;
    try {await api('/api/sharing/books/'+editing.id+'/visibility',{visibility:visible?'public':'private',...(visible?{key:toBase64(secret),title:editing.title}:{})});}
    finally {secret?.fill(0);}
    await loadRoom({notebook_id:editing.id});refresh();$('error').textContent='Visibilidade atualizada.';
  }));
  $('search-button').addEventListener('click',()=>run(async()=>{
    const query=$('search').value.trim();if(query.length<2) throw new Error('Digite pelo menos dois caracteres do nome.');
    const result=await api('/api/social/people?q='+encodeURIComponent(query));
    $('person').replaceChildren(new Option('Escolher pessoa',''),...result.people.map(person=>new Option(person.display_name,person.id)));
    if(!result.people.length) $('error').textContent='Nenhuma pessoa encontrada.';
  }));
  $('access-save').addEventListener('click',()=>run(async()=>{
    const person=$('person').value,role=$('role').value;
    if(!person) throw new Error('Escolha uma pessoa.');
    let keyEnvelope;
    if(['editor','reader'].includes(role)) {
      const publicKey=(await api('/api/sharing/public-key?person='+person)).public_key,secret=await ownerSecret(editing);
      try {keyEnvelope=await wrapSharedKey(secret,privateKey,publicKey,editing.id,session().user.id,person);}
      finally {secret.fill(0);}
    }
    await api('/api/sharing/books/'+editing.id+'/access',{person,role,...(keyEnvelope?{keyEnvelope}:{})});
    await accessList();$('error').textContent='Lista de acesso atualizada.';
  }));
  async function profile(person) {
    const result=await api('/api/sharing/profile?person='+person);
    $('profile-heading').textContent=result.person.display_name;
    $('profile-books').replaceChildren();
    for(const row of result.books) {
      const book=await loadRoom(row),button=document.createElement('button');
      button.type='button';button.className='button';button.textContent=book.title+' · '+(row.visibility==='public'?'público':'compartilhado com você');
      button.addEventListener('click',()=>{$('profile-dialog').close();show(book);});$('profile-books').append(button);
    }
    if(!result.books.length) $('profile-books').textContent='Nenhum caderno disponível para você neste perfil.';
    $('profile-dialog').showModal();
  }
  $('profile-open').addEventListener('click',()=>profile(session().user.id).catch(error=>notify(error.message)));
  $('profile-close').addEventListener('click',()=>$('profile-dialog').close());
  async function history(book) {
    if(book.sharing.permission==='reader') throw new Error('Versões anteriores estão disponíveis somente aos editores.');
    await flush(book);
    const result=await api('/api/sharing/books/'+book.id+'/snapshot');
    $('history-list').replaceChildren();$('history-error').textContent='';
    for(const row of result.versions) {
      const button=document.createElement('button');button.className='button';button.type='button';
      button.textContent='Criar cópia de '+new Date(row.created_at).toLocaleString('pt-BR');
      let copy;
      button.addEventListener('click',async()=>{
        button.disabled=true;
        try {
          if(!copy) {
            const doc=new SharedY.Doc();
            try {
              SharedY.applyUpdate(doc,fromBase64(await open(book.key,row.payload,'collab:'+book.id)));
              const previous=readSharedModel(doc,{pages:[],preferences:book.preferences},serialize);
              copy=copyNotebook(previous,' (versão anterior)');
            } finally {doc.destroy();}
          }
          await store(copy);$('history-dialog').close();show(copy);
        } catch(error) {$('history-error').textContent=error.message;}
        finally {button.disabled=false;}
      });
      $('history-list').append(button);
    }
    if(!result.versions.length) $('history-list').textContent='Ainda não há versões anteriores confirmadas.';
    $('history-dialog').showModal();
  }
  $('history-close').addEventListener('click',()=>$('history-dialog').close());
  return {load,loadRoom,connect,changed,flush,profile,history,
    async flushAll() {for(const client of clients.values()) await flush(client.book);},
    destroy() {for(const client of clients.values())client.destroy();clients.clear();keys=null;privateKey=null;},
  };
}
