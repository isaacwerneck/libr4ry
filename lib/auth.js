import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { database } from './db.js';
import { requireValue } from './validation.js';

const scrypt = promisify(scryptCallback);
let passwordJobs = 0;
async function passwordHash(password, salt) {
  requireValue(passwordJobs < 4, 'Autenticação ocupada. Tente novamente em instantes.', 503);
  passwordJobs++;
  try {
    return await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  } finally { passwordJobs--; }
}
export const tokenHash = token => createHash('sha256').update(token).digest('hex');

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await passwordHash(password, salt);
  return `scrypt$32768$${salt}$${hash.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [algorithm, cost, salt, encoded] = stored.split('$');
  if (algorithm !== 'scrypt' || cost !== '32768' || !salt || encoded?.length !== 128) {
    throw new Error('Credencial armazenada inválida.');
  }
  const hash = await passwordHash(password, salt);
  return timingSafeEqual(hash, Buffer.from(encoded, 'hex'));
}

export function sessionCookie(req) {
  const token = (req.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith('l4_session='))?.slice(11);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export async function currentUser(req) {
  const token = sessionCookie(req);
  if (!token) return null;
  const result = await database().query(
    `SELECT u.id, u.email, u.display_name FROM sessions s JOIN users u ON u.id = s.owner_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`, [tokenHash(token)]);
  return result.rows[0] || null;
}

export async function purgeExpiredSessions() {
  const result = await database().query('DELETE FROM sessions WHERE expires_at <= now()');
  return result.rowCount;
}

export async function createSession(ownerId, client = database()) {
  const token = randomBytes(32).toString('hex');
  await client.query('DELETE FROM sessions WHERE expires_at <= now()');
  await client.query(
    `INSERT INTO sessions (token_hash, owner_id, expires_at) VALUES ($1, $2, now() + interval '7 days')`,
    [tokenHash(token), ownerId]);
  return token;
}

export function setSession(res, token, secure = false) {
  res.setHeader('Set-Cookie', `l4_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? 604800 : 0}${secure ? '; Secure' : ''}`);
}
