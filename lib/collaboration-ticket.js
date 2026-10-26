import { createHmac, timingSafeEqual } from 'node:crypto';
import { requireValue, uuid } from './validation.js';

export function ticketSecret(value) {
  requireValue(typeof value === 'string' && Buffer.byteLength(value) >= 32, 'Configure COLLABORATION_SECRET com pelo menos 32 bytes aleatórios no site e no servidor de colaboração.', 503);
  return value;
}
export function signTicket(user,book,session,secret,now=Date.now()) {
  uuid(user); uuid(book);
  const payload = Buffer.from(JSON.stringify({ user,book,session,expires:now+60000 })).toString('base64url');
  return payload + '.' + createHmac('sha256',ticketSecret(secret)).update(payload).digest('base64url');
}
export function verifyTicket(token,secret,now=Date.now()) {
  requireValue(typeof token === 'string' && token.length <= 2048, 'Credencial de colaboração inválida.',401);
  const parts=token.split('.');
  requireValue(parts.length===2, 'Credencial de colaboração inválida.',401);
  const expected=createHmac('sha256',ticketSecret(secret)).update(parts[0]).digest();
  const actual=Buffer.from(parts[1],'base64url');
  requireValue(actual.length===expected.length && timingSafeEqual(actual,expected),'Credencial de colaboração inválida.',401);
  let value;
  try { value=JSON.parse(Buffer.from(parts[0],'base64url').toString()); } catch { throw new Error('Credencial de colaboração danificada.'); }
  uuid(value.user); uuid(value.book);
  requireValue(Number.isSafeInteger(value.expires) && value.expires>now && value.expires<=now+60000
    && typeof value.session==='string' && /^[0-9a-f]{64}$/.test(value.session),'Credencial de colaboração expirada ou inválida.',401);
  return value;
}
