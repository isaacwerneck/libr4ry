import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {once} from 'node:events';
import * as Y from 'yjs';
import {createCollaborationServer} from '../collaboration-server.js';
import {createServer} from '../server.js';
import {database,closeDatabase} from '../lib/db.js';
import {createSession} from '../lib/auth.js';
import {seal,makeSecret,importKey,toBase64} from '../public/crypto.js';
import {CollaborationClient} from '../public/collaboration-client.js';

const waitFor=async(check,message)=>{
  const end=Date.now()+12000;
  while(Date.now()<end) {if(check()) return;await new Promise(resolve=>setTimeout(resolve,25));}
  throw new Error(message);
};
test('WebSocket real: escritas concorrentes cifradas, confirmação persistente, leitura e revogação', {skip:!process.env.DATABASE_URL,timeout:45000},async()=>{
  const ids=[randomUUID(),randomUUID(),randomUUID()], [owner,friend,reader]=ids,book=randomUUID(),keyset=randomUUID();
  const rawKey=makeSecret(),key=await importKey(rawKey),secret=randomBytes(32).toString('hex');
  const initial=new Y.Doc();initial.getText('text').insert(0,'Original');
  const payload=await seal(key,toBase64(Y.encodeStateAsUpdate(initial)),'collab:'+book);
  const server=createServer({publicOrigin:'',production:false,collaborationSecret:secret});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const base='http://127.0.0.1:'+server.address().port;
  let socket;const clients=[],cookies=new Map(),records=[];
  async function request(id,path,body) {
    const response=await fetch(base+path,{method:body?'POST':'GET',headers:{Origin:base,'Content-Type':'application/json',Cookie:cookies.get(id)},body:body?JSON.stringify(body):undefined});
    const value=await response.json();if(!response.ok) throw Object.assign(new Error(value.error),{status:response.status});return value;
  }
  try {
    for(const id of ids) {
      await database().query('INSERT INTO users(id,email,display_name,password_hash) VALUES ($1,$2,$3,$4)',[id,id+'@collaboration.test','Ensaio','not-a-login-hash']);
      cookies.set(id,'l4_session='+await createSession(id));
    }
    await database().query('INSERT INTO user_keysets(id,owner_id,root_envelope) VALUES ($1,$2,$3)',[keyset,owner,payload]);
    await database().query('INSERT INTO notebooks(id,owner_id,keyset_id,encrypted_metadata,wrapped_key,revision) VALUES ($1,$2,$3,$4,$4,1)',[book,owner,keyset,payload]);
    await database().query("INSERT INTO shared_notebooks(notebook_id,snapshot,visibility,public_key,public_title) VALUES ($1,$2,'public',$3,'Ensaio')",[book,payload,toBase64(rawKey)]);
    await database().query("INSERT INTO notebook_access(notebook_id,user_id,role,key_envelope) VALUES ($1,$2,'editor',$3)",[book,friend,payload]);
    socket=createCollaborationServer({port:0,address:'127.0.0.1',publicOrigin:base,secret,production:false});await socket.listen(0);
    const url='ws://127.0.0.1:'+socket.address.port;
    for(const id of ids) {
      const client=new CollaborationClient({doc:new Y.Doc(),key,book:{id:book},user:{id},url,api:(path,body)=>request(id,path,body),
        onChange(){},onStatus(){},store:async(op,record)=>{if(op==='list')return [];records.push(record);},
      });
      clients.push(client);await client.start(await request(id,'/api/sharing/books/'+book));
    }
    await waitFor(()=>clients.every(client=>client.ready),'As três sessões não sincronizaram.');
    clients[0].doc.getText('text').insert(0,'A ');clients[1].doc.getText('text').insert(0,'B ');
    await Promise.all(clients.slice(0,2).map(client=>client.flush()));
    await waitFor(()=>clients[0].doc.getText('text').toString()===clients[1].doc.getText('text').toString() && clients[2].doc.getText('text').toString().includes('B '),'As escritas não convergiram.');
    assert.match(clients[0].doc.getText('text').toString(),/A /);
    assert.match(clients[0].doc.getText('text').toString(),/B /);
    const stored=await database().query('SELECT payload FROM collaboration_updates WHERE notebook_id=$1',[book]);
    assert.ok(stored.rowCount>=2);assert.equal(JSON.stringify(stored.rows).includes('Original'),false);
    assert.equal(JSON.stringify(records).includes('Original'),false);
    clients[2].doc.getText('text').insert(0,'PROIBIDO ');
    await clients[2].send();await waitFor(()=>clients[2].denied,'Leitor não foi bloqueado ao enviar edição.');
    assert.equal(clients[0].doc.getText('text').toString().includes('PROIBIDO'),false);
    await request(owner,'/api/sharing/books/'+book+'/access',{person:friend,role:'blocked'});
    clients[0].doc.getText('text').insert(0,'APOS_REVOGACAO ');
    await clients[0].flush();
    assert.equal(clients[1].doc.getText('text').toString().includes('APOS_REVOGACAO'),false);
    await clients[0].checkpoint();
    assert.equal((await database().query('SELECT 1 FROM collaboration_updates WHERE notebook_id=$1',[book])).rowCount,0);
    assert.ok((await database().query('SELECT 1 FROM collaboration_snapshots WHERE notebook_id=$1',[book])).rowCount>0);
  } finally {
    for(const client of clients)client.destroy();initial.destroy();
    if(socket) await socket.destroy();
    await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
    try {
      for(const table of ['notebook_personal','collaboration_updates','collaboration_snapshots','notebook_access','shared_notebooks'])await database().query('DELETE FROM '+table+' WHERE notebook_id=$1',[book]);
      await database().query('DELETE FROM notebooks WHERE id=$1',[book]);await database().query('DELETE FROM user_keysets WHERE id=$1',[keyset]);
      await database().query('DELETE FROM sessions WHERE owner_id=ANY($1::uuid[])',[ids]);await database().query('DELETE FROM users WHERE id=ANY($1::uuid[])',[ids]);
    } finally {await closeDatabase();}
  }
});
