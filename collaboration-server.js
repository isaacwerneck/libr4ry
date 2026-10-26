import { Server } from '@hocuspocus/server';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collaborationIdentity, appendSharedUpdate, sharedState } from './lib/sharing.js';
import { transaction, closeDatabase } from './lib/db.js';
import { verifyTicket, ticketSecret } from './lib/collaboration-ticket.js';
import { envelope, HttpError, requireValue } from './lib/validation.js';

export function createCollaborationServer({ port=Number(process.env.PORT || 8001), address=process.env.HOST || '127.0.0.1',
  publicOrigin=process.env.PUBLIC_ORIGIN || '', secret=process.env.COLLABORATION_SECRET || '', production=process.env.NODE_ENV==='production' }={}) {
  ticketSecret(secret);
  const origin=new URL(publicOrigin);
  requireValue(origin.origin===publicOrigin && ['http:','https:'].includes(origin.protocol) && (!production || origin.protocol==='https:'),'Configure PUBLIC_ORIGIN para a origem exata do site.');
  async function allowed(connection,book) {
    const context=connection.context;
    return collaborationIdentity(context.user,context.session,book);
  }
  async function deliver(document,book,message) {
    await Promise.all(document.getConnections().map(async connection=>{
      try { await allowed(connection,book); connection.sendStateless(JSON.stringify(message)); }
      catch(error) {
        if(error instanceof HttpError && [401,404].includes(error.status)) connection.close({code:4403,reason:'Acesso encerrado.'});
        else throw error;
      }
    }));
  }
  return new Server({
    port,address,quiet:true,stopOnSignals:false,timeout:45000,
    websocketOptions:{maxPayload:2*1024*1024},
    maxUnauthenticatedQueueSize:65536,maxUnauthenticatedQueueMessages:20,maxPendingDocuments:1,
    async onConnect({requestHeaders}) {
      requireValue(requestHeaders.get('origin')===publicOrigin || (!production && !requestHeaders.get('origin')),'Origem WebSocket não autorizada.',403);
    },
    async onAuthenticate({token,documentName,connectionConfig}) {
      const context=verifyTicket(token,secret);
      requireValue(context.book===documentName,'Credencial de outro caderno.',403);
      await collaborationIdentity(context.user,context.session,documentName);
      // O documento externo fica vazio; notas e presença trafegam somente em mensagens cifradas.
      connectionConfig.readOnly=true;
      return {user:context.user,session:context.session,window:Date.now(),messages:0};
    },
    async beforeBroadcastStateless() { throw new HttpError(403,'Broadcast direto não permitido.'); },
    async beforeHandleAwareness({states,removedClients}) { states.clear(); removedClients.clear(); },
    async onStateless({connection,documentName,document,payload}) {
      try {
        const context=connection.context, now=Date.now();
        if(now-context.window>1000) {context.window=now;context.messages=0;}
        requireValue(++context.messages<=30 && Buffer.byteLength(payload)<=1900000,'Limite de mensagens de colaboração excedido.',429);
        await allowed(connection,documentName);
        let message;
        try {message=JSON.parse(payload);} catch {throw new HttpError(400,'Mensagem de colaboração inválida.');}
        if(message?.type==='sync') {
          const state=await transaction(client=>sharedState(client,context.user,documentName));
          connection.sendStateless(JSON.stringify({type:'state',snapshot:state.snapshot,through:state.snapshot_seq,updates:state.updates}));
        } else if(message?.type==='update') {
          const update=await appendSharedUpdate(context.user,documentName,message);
          await deliver(document,documentName,{type:'update',...update});
        } else if(message?.type==='presence') {
          const encrypted=envelope(message.payload,16000);
          await deliver(document,documentName,{type:'presence',payload:encrypted});
        } else throw new HttpError(400,'Tipo de mensagem de colaboração inválido.');
      } catch(error) {
        connection.sendStateless(JSON.stringify({type:'error',status:error.status || 500,message:error instanceof HttpError ? error.message : 'Não foi possível sincronizar. Suas alterações continuam neste dispositivo.'}));
        if(!(error instanceof HttpError)) console.error('Falha de colaboração: '+(error.code || error.name));
        if([401,404].includes(error.status)) connection.close({code:4403,reason:'Acesso encerrado.'});
      }
    },
    async onRequest({request,response}) {
      response.writeHead(request.url==='/health'?200:404,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'});
      response.end(request.url==='/health'?'ok':'Não encontrado.');
      // A rejeição vazia encerra o handler padrão, conforme o contrato do Hocuspocus.
      throw null;
    },
  });
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const server=createCollaborationServer();
    await server.listen();
    console.log('Servidor de colaboração iniciado.');
    let stopping=false;
    const stop=async()=>{
      if(stopping) return; stopping=true;
      try {await server.destroy();await closeDatabase();}
      catch(error) {console.error('Falha ao encerrar colaboração: '+(error.code || error.name));process.exitCode=1;}
    };
    process.once('SIGTERM',stop);process.once('SIGINT',stop);
  } catch(error) {console.error('Não foi possível iniciar a colaboração: '+(error.code || error.message));process.exitCode=1;}
}
