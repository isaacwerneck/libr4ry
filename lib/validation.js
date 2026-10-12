export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function requireValue(condition, message, status = 400) {
  if (!condition) throw new HttpError(status, message);
}

export function uuid(value) {
  requireValue(typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
    'Identificador inválido.');
  return value;
}

export function envelope(value, limit = 100000) {
  requireValue(value && value.v === 1 && typeof value.iv === 'string' && typeof value.data === 'string',
    'Envelope criptográfico inválido.');
  requireValue(/^[A-Za-z0-9+/]{16}$/.test(value.iv) && Buffer.from(value.iv, 'base64').length === 12,
    'Nonce criptográfico inválido.');
  requireValue(value.data.length <= limit && /^[A-Za-z0-9+/]+={0,2}$/.test(value.data)
    && value.data.length % 4 === 0 && Buffer.from(value.data, 'base64').length >= 16,
    'Conteúdo criptografado inválido ou muito grande.');
  return { v: 1, iv: value.iv, data: value.data };
}

export function credentials(body) {
  requireValue(typeof body.email === 'string' && typeof body.password === 'string', 'Informe e-mail e senha.');
  const email = body.email.trim().toLowerCase();
  requireValue(email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Informe um e-mail válido.');
  requireValue(body.password.length >= 12 && body.password.length <= 128, 'Use uma senha entre 12 e 128 caracteres.');
  return { email, password: body.password };
}

export function rootEnvelope(value) {
  const protectedKey = envelope(value);
  const kdf = value.kdf;
  requireValue(kdf?.name === 'PBKDF2' && kdf.hash === 'SHA-256' && kdf.iterations === 600000
    && typeof kdf.salt === 'string' && /^[A-Za-z0-9+/]{22}==$/.test(kdf.salt)
    && Buffer.from(kdf.salt, 'base64').length === 16, 'Parâmetros de proteção da conta inválidos.');
  return { ...protectedKey, kdf: { name: kdf.name, hash: kdf.hash, iterations: kdf.iterations, salt: kdf.salt } };
}

export function revision(value) {
  requireValue(Number.isSafeInteger(value) && value >= 0, 'Revisão inválida.');
  return value;
}
