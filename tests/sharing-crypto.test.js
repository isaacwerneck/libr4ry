import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSecret,importKey,seal,open } from '../public/crypto.js';
import {createSharingKeys,unlockSharingKey,wrapSharedKey,unwrapSharedKey} from '../public/sharing-crypto.js';
import {signTicket,verifyTicket} from '../lib/collaboration-ticket.js';

test('chaves individuais abrem o caderno sem compartilhar a senha e recusam outro contexto',async()=>{
  const a=crypto.randomUUID(),b=crypto.randomUUID(),ka=crypto.randomUUID(),kb=crypto.randomUUID(),book=crypto.randomUUID();
  const rootA=await importKey(makeSecret()),rootB=await importKey(makeSecret());
  const pairA=await createSharingKeys(rootA,a,ka),pairB=await createSharingKeys(rootB,b,kb);
  const privateA=await unlockSharingKey(rootA,a,ka,pairA.privateEnvelope),privateB=await unlockSharingKey(rootB,b,kb,pairB.privateEnvelope);
  const secret=makeSecret(),original=await importKey(secret);
  const wrapped=await wrapSharedKey(secret,privateA,pairB.publicKey,book,a,b);
  const shared=await unwrapSharedKey(wrapped,privateB,pairA.publicKey,book,a,b);
  const content=await seal(original,{text:'privado'},'teste');
  assert.deepEqual(await open(shared,content,'teste'),{text:'privado'});
  await assert.rejects(unwrapSharedKey(wrapped,privateB,pairA.publicKey,crypto.randomUUID(),a,b),/desbloquear/);
  await assert.rejects(unlockSharingKey(rootB,a,ka,pairA.privateEnvelope),/desbloquear/);
  assert.equal('d' in pairA.publicKey,false);
});
test('ticket é vinculado ao usuário, caderno e sessão, expira e não aceita adulteração',()=>{
  const secret='fixture-secret-'.repeat(4),user=crypto.randomUUID(),book=crypto.randomUUID(),session='a'.repeat(64),now=Date.now();
  const ticket=signTicket(user,book,session,secret,now);
  assert.equal(verifyTicket(ticket,secret,now).book,book);
  assert.equal(verifyTicket(ticket,secret,now).session,session);
  assert.throws(()=>verifyTicket(ticket,secret,now+60001),/expirada/);
  assert.throws(()=>verifyTicket(ticket+'x',secret,now),/inválida/);
  assert.throws(()=>verifyTicket(ticket,'wrong-secret-'.repeat(4),now),/inválida/);
  assert.throws(()=>signTicket(user,book,session,'short',now),/32 bytes/);
});
