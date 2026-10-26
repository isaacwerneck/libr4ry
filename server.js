import http from 'node:http';
import { isIP } from 'node:net';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { database, transaction, closeDatabase } from './lib/db.js';
import { social } from './lib/social.js';
import { sharing } from './lib/sharing.js';
import { moderation, moderatorIds } from './lib/moderation.js';
import { recoveryMailer } from './lib/recovery-email.js';
import { requestPasswordReset, resetPassword } from './lib/password-reset.js';
import { hashPassword, verifyPassword, currentUser, createSession, setSession, sessionCookie, tokenHash } from './lib/auth.js';
import { HttpError, requireValue, credentials, uuid, rootEnvelope } from './lib/validation.js';
import { listNotebooks, readNotebook, createNotebook, saveNotebook, pageVersions } from './lib/notebooks.js';

const root = fileURLToPath(new URL('.', import.meta.url));
export const assets = new Map([
  ['/', ['public/index.html', 'text/html']],
  ['/index.html', ['public/index.html', 'text/html']],
  ['/privacy.html', ['public/privacy.html', 'text/html']],
  ...['styles.css', 'library.css', 'notebook.css', 'notebook-motion.js', 'notebook-controls.js', 'notebook-preferences.js', 'drafts.js', 'notebook-viewport.js', 'edit-history.js', 'collection.js', 'social.js', 'password-reset.js', 'form-focus.js', 'notebook-files.js', 'notebook-markdown.js', 'sharing.js', 'sharing-crypto.js', 'app.js', 'crypto.js', 'pagination.js', 'storage.js'].map(file =>
    [`/${file}`, [`public/${file}`, file.endsWith('.css') ? 'text/css' : 'text/javascript']]),
  ...['wood-grain.svg', 'material-grain.svg', 'retro-arrow.svg', 'retro-hand.svg', 'favicon.svg', 'social-preview.svg'].map(file =>
    [`/${file}`, [`public/${file}`, 'image/svg+xml']]),
  ['/social-preview.jpg', ['public/social-preview.jpg', 'image/jpeg']],
  ['/notebook-writing.js', ['public/notebook-writing.js', 'text/javascript']],
  ['/notebook-reminder.js', ['public/notebook-reminder.js', 'text/javascript']],
  ['/cover-design.js', ['public/cover-design.js', 'text/javascript']],
  ['/cover-editor.js', ['public/cover-editor.js', 'text/javascript']],
  ['/visual-editor.js', ['public/vendor/visual-editor.js', 'text/javascript']],
  ['/markdown-it.mjs', ['node_modules/markdown-it/dist/browser/markdown-it.esm.min.mjs', 'text/javascript']],
]);

export function headers(res, secure, collaborationUrl = process.env.COLLABORATION_URL || '') {
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self' " + (collaborationUrl ? new URL(collaborationUrl).origin : '') + "; img-src 'self' data: blob:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
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

function rateLimit(req, attempts, trustedProxy) {
  const now = Date.now();
  for (const [key, record] of attempts) if (record.until < now) attempts.delete(key);
  const remote = req.socket.remoteAddress?.replace(/^::ffff:/, '');
  let key = remote;
  if (trustedProxy && remote === trustedProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    requireValue(typeof forwarded === 'string' && isIP(forwarded), 'O proxy deve informar um único IP de cliente válido.');
    key = forwarded;
  }
  const record = attempts.get(key) || { count: 0, until: now + 60000 };
  record.count += 1;
  attempts.set(key, record);
  requireValue(record.count <= 15, 'Muitas tentativas. Aguarde um minuto e tente novamente.', 429);
}

async function register(req, res, body, secure) {
  requireValue(body.adultConfirmed === true, 'O cadastro no Libr4ry é permitido apenas para pessoas com 18 anos ou mais.');
  const { email, password } = credentials(body);
  uuid(body.id);
  uuid(body.keysetId);
  const protectedRoot = rootEnvelope(body.rootEnvelope);
  const name = String(body.name || '').trim();
  requireValue(name.length >= 1 && name.length <= 60, 'Informe seu nome (até 60 caracteres).');
  const passwordHash = await hashPassword(password);
  let token;
  try {
    token = await transaction(async client => {
      await client.query('INSERT INTO users (id, email, display_name, password_hash) VALUES ($1, $2, $3, $4)',
        [body.id, email, name, passwordHash]);
      await client.query('INSERT INTO user_keysets (id, owner_id, root_envelope) VALUES ($1, $2, $3)',
        [body.keysetId, body.id, protectedRoot]);
      return createSession(body.id, client);
    });
  } catch (error) {
    if (error.code === '23505') throw new HttpError(409, 'Não foi possível criar essa conta. Verifique os dados ou entre na sua conta existente.');
    throw error;
  }
  setSession(res, token, secure);
  json(res, 201, { user: { id: body.id, email, display_name: name } });
}

async function login(req, res, body, secure) {
  const { email, password } = credentials(body);
  const result = await database().query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  // Executa o mesmo trabalho criptográfico quando o e-mail não existe.
  const dummy = 'scrypt$32768$00000000000000000000000000000000$' + '0'.repeat(128);
  const valid = await verifyPassword(password, user?.password_hash || dummy);
  requireValue(user && valid, 'E-mail ou senha incorretos.', 401);
  const token = await transaction(async client => {
    const current = (await client.query('SELECT password_hash FROM users WHERE id = $1 FOR UPDATE', [user.id])).rows[0];
    requireValue(current?.password_hash === user.password_hash, 'E-mail ou senha incorretos.', 401);
    return createSession(user.id, client);
  });
  setSession(res, token, secure);
  json(res, 200, { user: { id: user.id, email: user.email, display_name: user.display_name } });
}

async function api(req, res, pathname, publicOrigin, secure, limitAuthentication, sendResetEmail, moderators, collaboration) {
  const mutating = !['GET', 'HEAD'].includes(req.method);
  if (mutating) {
    const origin = publicOrigin || `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}`;
    requireValue(req.headers.origin === origin, 'Origem da requisição não autorizada.', 403);
  }
  if (pathname === '/api/health' && req.method === 'GET') {
    await database().query('SELECT 1');
    return json(res, 200, { status: 'ok' });
  }
  if (pathname === '/api/auth-options' && req.method === 'GET') return json(res, 200, { recovery: Boolean(sendResetEmail), ...(collaboration.url ? { collaboration: collaboration.url } : {}) });
  if (req.method === 'POST' && ['/api/register', '/api/login', '/api/password-reset/request', '/api/password-reset/complete'].includes(pathname)) limitAuthentication(req);
  const body = mutating ? await readBody(req) : null;
  if (pathname === '/api/register' && req.method === 'POST') return register(req, res, body, secure);
  if (pathname === '/api/login' && req.method === 'POST') return login(req, res, body, secure);
  if (pathname === '/api/password-reset/request' && req.method === 'POST') return json(res, 200, await requestPasswordReset(body, sendResetEmail, req.waitUntil));
  if (pathname === '/api/password-reset/complete' && req.method === 'POST') {
    const result = await resetPassword(body);
    setSession(res, '', secure);
    return json(res, 200, result);
  }
  const user = await currentUser(req);
  requireValue(user, 'Entre na sua conta para continuar.', 401);
  if (pathname.startsWith('/api/sharing/')) return json(res, 200, await sharing(user, req.method, new URL(req.url, 'http://127.0.0.1'), body, tokenHash(sessionCookie(req)), collaboration.secret));
  if (pathname === '/api/social/reports' || pathname.startsWith('/api/moderation/')) return json(res, 200, await moderation(user, req.method, new URL(req.url, 'http://127.0.0.1'), body, moderators));
  if (pathname.startsWith('/api/social/')) return json(res, 200, await social(user, req.method, new URL(req.url, 'http://127.0.0.1'), body));
  if (pathname === '/api/me' && req.method === 'GET') {
    const result = await database().query('SELECT id, root_envelope FROM user_keysets WHERE owner_id = $1', [user.id]);
    return json(res, 200, { user: { ...user, moderator: moderators.has(user.id) }, keyset: result.rows[0] });
  }
  if (pathname === '/api/logout' && req.method === 'POST') {
    await database().query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(sessionCookie(req))]);
    setSession(res, '', secure);
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

export function createRequestHandler({ publicOrigin = process.env.PUBLIC_ORIGIN || '', production = process.env.NODE_ENV === 'production', trustedProxy = process.env.TRUSTED_PROXY || '', sendResetEmail, moderatorUserIds = process.env.MODERATOR_USER_IDS || '', collaborationUrl = process.env.COLLABORATION_URL || '', collaborationSecret = process.env.COLLABORATION_SECRET || '' } = {}) {
  if (publicOrigin) {
    const url = new URL(publicOrigin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== publicOrigin) {
      throw new Error('PUBLIC_ORIGIN deve conter somente a origem, sem caminho, barra final ou credenciais.');
    }
  }
  if (production && !publicOrigin.startsWith('https://')) throw new Error('Produção exige PUBLIC_ORIGIN com HTTPS.');
  if (trustedProxy && !isIP(trustedProxy)) throw new Error('TRUSTED_PROXY deve ser um único endereço IP do proxy confiável.');
  const sendRecovery = sendResetEmail === undefined ? recoveryMailer({ publicOrigin }) : sendResetEmail;
  const moderators = moderatorIds(moderatorUserIds);
  if (collaborationUrl) {
    const url = new URL(collaborationUrl);
    if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || (production && url.protocol !== 'wss:')) throw new Error('COLLABORATION_URL deve ser uma URL WebSocket válida e usar WSS em produção.');
  }
  const collaboration = { url: collaborationSecret ? collaborationUrl : '', secret: collaborationSecret };
  const attempts = new Map();
  const limitAuthentication = req => rateLimit(req, attempts, trustedProxy);
  const secure = publicOrigin.startsWith('https://');
  return async (req, res) => {
    headers(res, secure, collaboration.url);
    try {
      const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
      if (pathname.startsWith('/api/')) return await api(req, res, pathname, publicOrigin, secure, limitAuthentication, sendRecovery, moderators, collaboration);
      requireValue(req.method === 'GET' || req.method === 'HEAD', 'Método não permitido.', 405);
      const asset = assets.get(pathname);
      requireValue(asset, 'Arquivo não encontrado.', 404);
      const content = await readFile(resolve(root, asset[0]));
      res.writeHead(200, { 'Content-Type': asset[1].startsWith('image/') ? asset[1] : `${asset[1]}; charset=utf-8` });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (!(error instanceof HttpError)) console.error(`Falha ao processar requisição: ${error.code || error.name}`);
      if (!res.headersSent) json(res, error.status || 500, {
        error: error instanceof HttpError ? error.message : 'Não foi possível concluir a operação. Tente novamente em instantes.',
      });
    }
  };
}

export function createServer(options) {
  const server = http.createServer(createRequestHandler(options));
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  server.maxRequestsPerSocket = 100;
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const port = Number(process.env.PORT || 8000);
  const host = process.env.HOST || '127.0.0.1';
  const server = createServer();
  server.on('error', error => {
    console.error('Não foi possível iniciar o servidor: ' + (error.code || error.name));
    process.exitCode = 1;
  });
  server.listen(port, host, () => console.log(`Library4: ${process.env.PUBLIC_ORIGIN || `http://${host}:${port}`}`));
  let stopping = false;
  function shutdown() {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => server.closeAllConnections(), 20000);
    deadline.unref();
    server.close(async () => {
      clearTimeout(deadline);
      try { await closeDatabase(); }
      catch (error) { console.error('Falha ao encerrar conexões: ' + (error.code || error.name)); process.exitCode = 1; }
    });
  }
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
