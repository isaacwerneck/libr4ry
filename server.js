import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { database, transaction } from './lib/db.js';
import { hashPassword, verifyPassword, currentUser, createSession, setSession, sessionCookie, tokenHash } from './lib/auth.js';
import { HttpError, requireValue, credentials, uuid, rootEnvelope } from './lib/validation.js';
import { listNotebooks, readNotebook, createNotebook, saveNotebook, pageVersions } from './lib/notebooks.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const assets = new Map([
  ['/', ['public/index.html', 'text/html']],
  ['/index.html', ['public/index.html', 'text/html']],
  ...['styles.css', 'library.css', 'notebook.css', 'notebook-motion.js', 'notebook-controls.js', 'notebook-preferences.js', 'drafts.js', 'notebook-viewport.js', 'edit-history.js', 'collection.js', 'app.js', 'crypto.js', 'pagination.js', 'storage.js'].map(file =>
    [`/${file}`, [`public/${file}`, file.endsWith('.css') ? 'text/css' : 'text/javascript']]),
  ...['wood-grain.svg', 'material-grain.svg', 'retro-arrow.svg', 'retro-hand.svg'].map(file =>
    [`/${file}`, [`public/${file}`, 'image/svg+xml']]),
  ['/notebook-writing.js', ['public/notebook-writing.js', 'text/javascript']],
  ['/notebook-reminder.js', ['public/notebook-reminder.js', 'text/javascript']],
  ['/cover-design.js', ['public/cover-design.js', 'text/javascript']],
  ['/cover-editor.js', ['public/cover-editor.js', 'text/javascript']],
  ['/visual-editor.js', ['public/vendor/visual-editor.js', 'text/javascript']],
  ['/markdown-it.mjs', ['node_modules/markdown-it/dist/browser/markdown-it.esm.min.mjs', 'text/javascript']],
]);
const attempts = new Map();

function headers(res) {
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data: blob:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
}

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    requireValue(size <= 2 * 1024 * 1024, 'A operação excedeu o limite de 2 MB. Divida o conteúdo em partes menores.', 413);
    chunks.push(chunk);
  }
  requireValue(req.headers['content-type']?.startsWith('application/json'), 'Envie conteúdo JSON.', 415);
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    requireValue(value && typeof value === 'object' && !Array.isArray(value), 'Corpo da requisição inválido.');
    return value;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'JSON inválido.');
  }
}

function rateLimit(req) {
  const now = Date.now();
  for (const [key, record] of attempts) if (record.until < now) attempts.delete(key);
  const key = req.socket.remoteAddress;
  const record = attempts.get(key) || { count: 0, until: now + 60000 };
  record.count += 1;
  attempts.set(key, record);
  requireValue(record.count <= 15, 'Muitas tentativas. Aguarde um minuto e tente novamente.', 429);
}

async function register(req, res, body) {
  rateLimit(req);
  const { email, password } = credentials(body);
  uuid(body.id);
  uuid(body.keysetId);
  const protectedRoot = rootEnvelope(body.rootEnvelope);
  const name = String(body.name || '').trim();
  requireValue(name.length >= 1 && name.length <= 60, 'Informe seu nome (até 60 caracteres).');
  const passwordHash = await hashPassword(password);
  try {
    await transaction(async client => {
      await client.query('INSERT INTO users (id, email, display_name, password_hash) VALUES ($1, $2, $3, $4)',
        [body.id, email, name, passwordHash]);
      await client.query('INSERT INTO user_keysets (id, owner_id, root_envelope) VALUES ($1, $2, $3)',
        [body.keysetId, body.id, protectedRoot]);
    });
  } catch (error) {
    if (error.code === '23505') throw new HttpError(409, 'Não foi possível criar essa conta. Verifique os dados ou entre na sua conta existente.');
    throw error;
  }
  setSession(res, await createSession(body.id));
  json(res, 201, { user: { id: body.id, email, display_name: name } });
}

async function login(req, res, body) {
  rateLimit(req);
  const { email, password } = credentials(body);
  const result = await database().query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  // Executa o mesmo trabalho criptográfico quando o e-mail não existe.
  const dummy = 'scrypt$32768$00000000000000000000000000000000$' + '0'.repeat(128);
  const valid = await verifyPassword(password, user?.password_hash || dummy);
  requireValue(user && valid, 'E-mail ou senha incorretos.', 401);
  setSession(res, await createSession(user.id));
  json(res, 200, { user: { id: user.id, email: user.email, display_name: user.display_name } });
}

async function api(req, res, pathname) {
  const mutating = !['GET', 'HEAD'].includes(req.method);
  if (mutating) {
    const origin = `http://${req.headers.host}`;
    requireValue(req.headers.origin === origin, 'Origem da requisição não autorizada.', 403);
  }
  if (pathname === '/api/health' && req.method === 'GET') {
    await database().query('SELECT 1');
    return json(res, 200, { status: 'ok' });
  }
  const body = mutating ? await readBody(req) : null;
  if (pathname === '/api/register' && req.method === 'POST') return register(req, res, body);
  if (pathname === '/api/login' && req.method === 'POST') return login(req, res, body);
  const user = await currentUser(req);
  requireValue(user, 'Entre na sua conta para continuar.', 401);
  if (pathname === '/api/me' && req.method === 'GET') {
    const result = await database().query('SELECT id, root_envelope FROM user_keysets WHERE owner_id = $1', [user.id]);
    return json(res, 200, { user, keyset: result.rows[0] });
  }
  if (pathname === '/api/logout' && req.method === 'POST') {
    await database().query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(sessionCookie(req))]);
    setSession(res, '');
    return json(res, 200, { ok: true });
  }
  if (pathname === '/api/notebooks') {
    if (req.method === 'GET') return json(res, 200, { notebooks: await listNotebooks(user.id) });
    if (req.method === 'POST') return json(res, 201, await createNotebook(user.id, body));
  }
  const notebook = /^\/api\/notebooks\/([^/]+)(\/save)?$/.exec(pathname);
  if (notebook) {
    if (!notebook[2] && req.method === 'GET') return json(res, 200, await readNotebook(user.id, notebook[1]));
    if (notebook[2] && req.method === 'POST') return json(res, 200, await saveNotebook(user.id, notebook[1], body));
  }
  const history = /^\/api\/pages\/([^/]+)\/versions$/.exec(pathname);
  if (history && req.method === 'GET') return json(res, 200, { versions: await pageVersions(user.id, history[1]) });
  throw new HttpError(404, 'Operação não encontrada.');
}

export function createServer() {
  return http.createServer(async (req, res) => {
    headers(res);
    try {
      const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
      if (pathname.startsWith('/api/')) return await api(req, res, pathname);
      requireValue(req.method === 'GET' || req.method === 'HEAD', 'Método não permitido.', 405);
      const asset = assets.get(pathname);
      requireValue(asset, 'Arquivo não encontrado.', 404);
      const content = await readFile(resolve(root, asset[0]));
      res.writeHead(200, { 'Content-Type': `${asset[1]}; charset=utf-8` });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (!(error instanceof HttpError)) console.error(`Falha ao processar requisição: ${error.code || error.name}`);
      if (!res.headersSent) json(res, error.status || 500, {
        error: error instanceof HttpError ? error.message : 'Não foi possível concluir a operação. Verifique o banco local e tente novamente.',
      });
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const port = Number(process.env.PORT || 8000);
  createServer().listen(port, '127.0.0.1', () => console.log(`Library4: http://127.0.0.1:${port}`));
}
