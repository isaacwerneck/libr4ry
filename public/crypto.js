const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function toBase64(bytes) {
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
}

export function fromBase64(value) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

export function makeSecret() {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function importKey(secret) {
  return crypto.subtle.importKey('raw', secret, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function passwordKey(password, kdf) {
  if (typeof password !== 'string' || password.length < 4 || password.length > 128) {
    throw new Error('Use uma senha de conteúdo entre 4 e 128 caracteres.');
  }
  if (kdf?.name !== 'PBKDF2' || kdf.hash !== 'SHA-256' || kdf.iterations !== 600000
    || typeof kdf.salt !== 'string' || fromBase64(kdf.salt).length !== 16) {
    throw new Error('Parâmetros de desbloqueio inválidos.');
  }
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({
    name: 'PBKDF2', hash: kdf.hash, iterations: kdf.iterations, salt: fromBase64(kdf.salt),
  }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function createRoot(password, ownerId, keysetId) {
  const kdf = { name: 'PBKDF2', hash: 'SHA-256', iterations: 600000,
    salt: toBase64(crypto.getRandomValues(new Uint8Array(16))) };
  const secret = makeSecret();
  const protectedKey = await seal(await passwordKey(password, kdf), toBase64(secret), `root:${ownerId}:${keysetId}`);
  const key = await importKey(secret);
  secret.fill(0);
  return { key, envelope: { ...protectedKey, kdf } };
}

export async function unlockRoot(password, envelope, ownerId, keysetId) {
  const value = await open(await passwordKey(password, envelope.kdf), envelope, `root:${ownerId}:${keysetId}`);
  const secret = fromBase64(value);
  if (secret.length !== 32) throw new Error('Chave da conta inválida.');
  const key = await importKey(secret);
  secret.fill(0);
  return key;
}

export async function seal(key, value, context) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({
    name: 'AES-GCM', iv, additionalData: encoder.encode(context), tagLength: 128,
  }, key, encoder.encode(JSON.stringify(value)));
  return { v: 1, iv: toBase64(iv), data: toBase64(new Uint8Array(ciphertext)) };
}

export async function open(key, envelope, context) {
  if (envelope?.v !== 1) throw new Error('Formato criptográfico não suportado.');
  try {
    const plaintext = await crypto.subtle.decrypt({
      name: 'AES-GCM', iv: fromBase64(envelope.iv),
      additionalData: encoder.encode(context), tagLength: 128,
    }, key, fromBase64(envelope.data));
    return JSON.parse(decoder.decode(plaintext));
  } catch {
    throw new Error('Não foi possível desbloquear o conteúdo. Verifique sua chave; os dados podem estar corrompidos.');
  }
}
