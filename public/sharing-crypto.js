import { seal, open, fromBase64, toBase64, importKey } from './crypto.js';

export async function createSharingKeys(root, owner, keyset) {
  const pair = await crypto.subtle.generateKey({ name:'ECDH',namedCurve:'P-256' },true,['deriveKey']);
  const publicKey = await crypto.subtle.exportKey('jwk',pair.publicKey);
  const privateKey = await crypto.subtle.exportKey('jwk',pair.privateKey);
  const privateEnvelope = await seal(root,privateKey,'sharing-key:' + owner + ':' + keyset);
  return { publicKey, privateEnvelope };
}
export async function unlockSharingKey(root, owner, keyset, envelope) {
  const value = await open(root,envelope,'sharing-key:' + owner + ':' + keyset);
  return crypto.subtle.importKey('jwk',value,{name:'ECDH',namedCurve:'P-256'},false,['deriveKey']);
}
async function exchange(privateKey,publicKey) {
  const key = await crypto.subtle.importKey('jwk',publicKey,{name:'ECDH',namedCurve:'P-256'},false,[]);
  return crypto.subtle.deriveKey({name:'ECDH',public:key},privateKey,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function wrapSharedKey(secret,privateKey,publicKey,book,owner,recipient) {
  return seal(await exchange(privateKey,publicKey),toBase64(secret),'share:' + book + ':' + owner + ':' + recipient);
}
export async function unwrapSharedKey(envelope,privateKey,publicKey,book,owner,recipient) {
  const secret = fromBase64(await open(await exchange(privateKey,publicKey),envelope,'share:' + book + ':' + owner + ':' + recipient));
  if (secret.length !== 32) throw new Error('Chave compartilhada inválida.');
  return importKey(secret);
}
