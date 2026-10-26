import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import apiHandler, { createNetlifyHandler, config } from '../netlify/functions/api.mjs';
import authHandler, { config as authConfig } from '../netlify/functions/auth.mjs';
import { database, closeDatabase } from '../lib/db.js';
import { createRoot } from '../public/crypto.js';

const origin = 'https://libr4ry.netlify.app';
const context = ip => ({ ip, waitUntil() {} });
const request = (path, body, headers = {}) => new Request(origin + path, {
  method: body === undefined ? 'GET' : 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
  body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
});

test('rotas de autenticação usam uma regra de borda e não passam pela Function geral', () => {
  const paths = ['/api/login', '/api/register', '/api/password-reset/request', '/api/password-reset/complete'];
  assert.deepEqual(authConfig.path, paths);
  assert.deepEqual(config.excludedPath, paths);
  assert.deepEqual(authConfig.rateLimit, { action: 'rate_limit', windowLimit: 15, windowSize: 60, aggregateBy: ['ip', 'domain'] });
  assert.equal(config.rateLimit, undefined, 'Autosave e navegação não devem compartilhar a cota de autenticação');
  assert.equal(authHandler, apiHandler);
});

test('Function mantém origem, limites, IP confiável, respostas e arquivos privados protegidos', async () => {
  assert.equal(config.path, '/api/*');
  assert.throws(() => createNetlifyHandler({ publicOrigin: 'http://localhost', sendResetEmail: null }), /HTTPS/);
  const handle = createNetlifyHandler({ publicOrigin: origin, sendResetEmail: null });
  assert.equal((await handle(request('/api/me'), context('192.0.2.1'))).status, 401);
  assert.equal((await handle(request('/api/auth-options'), {})).status, 503);
  for (const path of ['/.env', '/server.js', '/index.html']) {
    assert.equal((await handle(request(path), context('192.0.2.1'))).status, 404);
  }
  const options = await handle(request('/api/auth-options'), context('192.0.2.1'));
  assert.deepEqual(await options.json(), { recovery: false });
  assert.equal(options.headers.get('cache-control'), 'no-store');
  assert.equal(options.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.match(options.headers.get('content-security-policy'), /default-src 'none'/);
  assert.equal((await handle(request('/api/login', {}, { Origin: 'https://forged.example' }), context('192.0.2.1'))).status, 403);
  assert.equal((await handle(request('/api/login', '{'), context('192.0.2.1'))).status, 400);
  assert.equal((await handle(request('/api/login', 'x'.repeat(2 * 1024 * 1024 + 1)), context('192.0.2.2'))).status, 413);
  for (let count = 0; count < 15; count++) {
    assert.equal((await handle(request('/api/login', {}, { 'X-Forwarded-For': '198.51.100.' + count }), context('192.0.2.3'))).status, 400);
  }
  assert.equal((await handle(request('/api/login', {}), context('192.0.2.3'))).status, 429);
  assert.equal((await handle(request('/api/login', {}), context('192.0.2.4'))).status, 400);
});

test('Function SQL conserva sessão segura e estende envio de recuperação sem esperar o provedor', { skip: !process.env.DATABASE_URL }, async () => {
  const owner = randomUUID();
  const keyset = randomUUID();
  const email = owner + '@function.test';
  const root = await createRoot('private-fixture-password', owner, keyset);
  let finishDelivery;
  let delivery;
  const background = [];
  const handle = createNetlifyHandler({ publicOrigin: origin, sendResetEmail: value => {
    delivery = value;
    return new Promise(resolve => { finishDelivery = resolve; });
  } });
  const invocation = { ip: '192.0.2.20', waitUntil(promise) { background.push(promise); } };
  try {
    const created = await handle(request('/api/register', {
      id: owner, keysetId: keyset, email, name: 'Ensaio de Function', adultConfirmed: true, password: 'account-fixture-password', rootEnvelope: root.envelope,
    }), invocation);
    assert.equal(created.status, 201);
    const cookie = created.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly; SameSite=Strict; Path=\/; Max-Age=604800; Secure/);
    const identity = await handle(request('/api/me', undefined, { Cookie: cookie.split(';')[0] }), invocation);
    assert.equal((await identity.json()).user.id, owner);
    const recovery = await handle(request('/api/password-reset/request', { email }), invocation);
    assert.equal(recovery.status, 200);
    assert.match((await recovery.json()).message, /Se houver/);
    assert.equal(background.length, 1);
    assert.equal(delivery.email, email);
    assert.match(delivery.token, /^[a-f0-9]{64}$/);
    let delivered = false;
    background[0].then(() => { delivered = true; });
    await Promise.resolve();
    assert.equal(delivered, false);
    finishDelivery();
    await background[0];
    assert.equal(delivered, true);
    const unknown = await handle(request('/api/password-reset/request', { email: randomUUID() + '@function.test' }), invocation);
    assert.equal(unknown.status, 200);
    assert.equal(background.length, 1);
    const logout = await handle(request('/api/logout', {}, { Cookie: cookie.split(';')[0] }), invocation);
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie'), /Max-Age=0; Secure/);
    assert.equal((await handle(request('/api/me', undefined, { Cookie: cookie.split(';')[0] }), invocation)).status, 401);
  } finally {
    finishDelivery?.();
    await Promise.all(background);
    try {
      await database().query('DELETE FROM sessions WHERE owner_id=$1', [owner]);
      await database().query('DELETE FROM user_keysets WHERE owner_id=$1', [owner]);
      await database().query('DELETE FROM users WHERE id=$1', [owner]);
    } finally { await closeDatabase(); }
  }
});
