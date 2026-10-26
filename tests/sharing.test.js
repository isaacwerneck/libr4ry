import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from '../server.js';
import { database,closeDatabase } from '../lib/db.js';
import {createSession,tokenHash} from '../lib/auth.js';
import {seal,importKey,makeSecret,toBase64} from '../public/crypto.js';
import {createSharingKeys} from '../public/sharing-crypto.js';
import {appendSharedUpdate,collaborationIdentity} from '../lib/sharing.js';
import {verifyTicket} from '../lib/collaboration-ticket.js';

test('compartilhamento SQL/API preserva original, autorização, perfis, bloqueios, histórico e sincronização', {skip:!process.env.DATABASE_URL},async()=>{
  const ids=[randomUUID(),randomUUID(),randomUUID()], [owner,friend,visitor]=ids;
  const book=randomUUID(),keyset=randomUUID(),secret='fixture-collaboration-'.repeat(3),key=await importKey(makeSecret());
  const payload=await seal(key,'AQID','fixture');
  const server=createServer({publicOrigin:'',production:false,collaborationSecret:secret,collaborationUrl:'ws://127.0.0.1:8001'});
  const cookies=new Map(),tokens=new Map();
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const base='http://127.0.0.1:'+server.address().port;
  async function request(user,path,body) {
    const response=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{Origin:base,'Content-Type':'application/json',...(user?{Cookie:cookies.get(user)}:{})},body:body?JSON.stringify(body):undefined});
    return {status:response.status,data:await response.json()};
  }
  const path='sharing/books/'+book;
  try {
    for(const id of ids) {
      await database().query('INSERT INTO users (id,email,display_name,password_hash) VALUES ($1,$2,$3,$4)',[id,id+'@sharing.test','Pessoa '+id,'not-a-login-hash']);
      const token=await createSession(id);tokens.set(id,token);cookies.set(id,'l4_session='+token);
    }
    await database().query('INSERT INTO user_keysets (id,owner_id,root_envelope) VALUES ($1,$2,$3)',[keyset,owner,payload]);
    await database().query('INSERT INTO notebooks (id,owner_id,keyset_id,encrypted_metadata,wrapped_key,revision) VALUES ($1,$2,$3,$4,$4,1)',[book,owner,keyset,payload]);
    assert.equal((await request(null,'sharing/books')).status,401);
    assert.equal((await request(friend,path+'/enable',{revision:1,snapshot:payload})).status,403);
    assert.equal((await request(owner,path+'/enable',{revision:9,snapshot:payload})).status,409);
    assert.equal((await request(owner,path+'/enable',{revision:1,snapshot:payload})).status,200);
    assert.equal((await request(owner,path+'/enable',{revision:1,snapshot:payload})).status,200);
    assert.equal((await request(friend,path)).status,404);
    assert.equal((await request(owner,path+'/access',{person:friend,role:'editor',keyEnvelope:payload})).status,403);
    const pair=[owner,friend].sort();
    await database().query('INSERT INTO friendships(first_id,second_id,requester_id,accepted) VALUES ($1,$2,$3,true)',[...pair,owner]);
    const sharing=await createSharingKeys(key,owner,keyset);
    assert.equal((await request(owner,'sharing/keys',{...sharing,publicKey:{...sharing.publicKey,d:'private'}})).status,400);
    assert.equal((await request(owner,'sharing/keys',sharing)).status,200);
    const again=await request(owner,'sharing/keys',await createSharingKeys(key,owner,keyset));
    assert.deepEqual(again.data.key.public_key.x,sharing.publicKey.x);
    assert.equal('private_envelope' in (await request(friend,'sharing/public-key?person='+owner)).data,false);
    assert.equal((await request(owner,path+'/access',{person:friend,role:'editor',keyEnvelope:payload})).status,200);
    assert.equal((await request(friend,path)).data.permission,'editor');
    assert.equal((await request(friend,'sharing/books')).data.books.some(item=>item.notebook_id===book),true);
    assert.equal((await request(visitor,'sharing/profile?person='+friend)).data.books.length,0);
    assert.equal((await request(owner,'sharing/profile?person='+friend)).data.books.length,0);
    assert.equal((await request(owner,'sharing/profile?person='+owner)).data.books.length,1);
    assert.equal((await request(friend,'sharing/profile?person='+friend)).data.books.length,0);
    assert.equal((await request(friend,path+'/access',{person:visitor,role:'editor',keyEnvelope:payload})).status,403);
    const update={id:randomUUID(),payload};
    const sent=await appendSharedUpdate(friend,book,update);
    assert.equal((await appendSharedUpdate(friend,book,update)).seq,sent.seq);
    await assert.rejects(appendSharedUpdate(visitor,book,update),error=>error.status===404);
    const ticket=(await request(friend,path+'/ticket',{})).data.token;
    assert.equal(verifyTicket(ticket,secret).session,tokenHash(tokens.get(friend)));
    assert.equal((await collaborationIdentity(friend,tokenHash(tokens.get(friend)),book)).permission,'editor');
    assert.equal((await request(owner,path+'/snapshot',{through:Number(sent.seq),snapshot:payload})).status,200);
    const state=await request(friend,path);
    assert.equal(state.data.updates.length,0);assert.equal(Number(state.data.snapshot_seq),Number(sent.seq));
    assert.equal((await database().query('SELECT count(*)::int AS n FROM collaboration_snapshots WHERE notebook_id=$1',[book])).rows[0].n,1);
    assert.equal((await request(owner,path+'/visibility',{visibility:'public',key:toBase64(makeSecret()),title:'Público'})).status,200);
    assert.equal((await request(visitor,path)).data.permission,'reader');
    assert.equal((await request(visitor,'sharing/profile?person='+owner)).data.books.length,1);
    assert.equal((await request(owner,'sharing/profile?person='+friend)).data.books.length,1);
    assert.equal((await request(friend,'sharing/profile?person='+friend)).data.books.length,1);
    await assert.rejects(appendSharedUpdate(visitor,book,{id:randomUUID(),payload}),error=>error.status===403);
    assert.equal((await request(owner,path+'/access',{person:visitor,role:'blocked'})).status,200);
    assert.equal((await request(visitor,path)).status,404);
    assert.equal((await request(visitor,'sharing/profile?person='+owner)).data.books.length,0);
    assert.equal((await request(owner,path+'/visibility',{visibility:'private'})).status,200);
    assert.equal((await request(owner,path)).data.public_key,null);
    assert.equal((await request(owner,path+'/access',{person:friend,role:'remove'})).status,200);
    assert.equal((await request(friend,path)).status,404);
    await assert.rejects(collaborationIdentity(friend,tokenHash(tokens.get(friend)),book),error=>error.status===404);
    assert.equal((await database().query('SELECT revision FROM notebooks WHERE id=$1',[book])).rows[0].revision,'1');
  } finally {
    await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
    try {
      for(const table of ['collaboration_updates','collaboration_snapshots','notebook_access','shared_notebooks']) await database().query('DELETE FROM '+table+' WHERE notebook_id=$1',[book]);
      await database().query('DELETE FROM notebooks WHERE id=$1',[book]);
      await database().query('DELETE FROM user_keysets WHERE owner_id=$1',[owner]);
      await database().query('DELETE FROM sharing_keys WHERE owner_id=ANY($1::uuid[])',[ids]);
      await database().query('DELETE FROM friendships WHERE first_id=ANY($1::uuid[]) OR second_id=ANY($1::uuid[])',[ids]);
      await database().query('DELETE FROM sessions WHERE owner_id=ANY($1::uuid[])',[ids]);
      await database().query('DELETE FROM users WHERE id=ANY($1::uuid[])',[ids]);
    } finally {await closeDatabase();}
  }
});
