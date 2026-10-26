import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { createServer } from '../server.js';
import { database, closeDatabase } from '../lib/db.js';
import { hashPassword, createSession, tokenHash } from '../lib/auth.js';
import { requestPasswordReset } from '../lib/password-reset.js';
import { recoveryMailer } from '../lib/recovery-email.js';
import { createRoot, unlockRoot, seal, open } from '../public/crypto.js';

test('Resend usa remetente/origem configurados, link em fragmento e falhas sem expor resposta do provedor', async () => {
  assert.equal(recoveryMailer({ publicOrigin: '', key: '', from: '' }), null);
  for (const publicOrigin of ['https://site.test/extra', 'http://site.test', 'ftp://localhost', 'https://evil@site.test']) {
    assert.throws(() => recoveryMailer({ publicOrigin, key: 'test-only', from: 'Conta <conta@site.test>' }));
  }
  assert.throws(() => recoveryMailer({ publicOrigin: 'https://site.test', key: 'test-only', from: 'conta@site.test\r\nInjected: yes' }));
  let sent;
  const mailer = recoveryMailer({
    publicOrigin: 'https://site.test', key: 'test-only', from: 'Conta <conta@site.test>',
    send: async (url, options) => { sent = { url, options }; return { ok: true }; },
  });
  await mailer({ email: 'person@example.test', token: 'a'.repeat(64) });
  assert.equal(sent.url, 'https://api.resend.com/emails');
  assert.equal(sent.options.headers.Authorization, 'Bearer test-only');
  const body = JSON.parse(sent.options.body);
  assert.deepEqual(body.to, ['person@example.test']);
  assert.match(body.text, /https:\/\/site\.test\/#reset=a{64}/);
  assert.match(body.text, /senha de conteúdo.*mesma/);
  const failing = recoveryMailer({ publicOrigin: 'https://site.test', key: 'test-only', from: 'conta@site.test', send: async () => ({ ok: false }) });
  await assert.rejects(failing({ email: 'person@example.test', token: 'a'.repeat(64) }), /EMAIL_DELIVERY_FAILED/);
});

test('recuperação desativada informa indisponibilidade e mantém limite por IP', async () => {
  const server = createServer({ publicOrigin: '', production: false, sendResetEmail: null });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    assert.deepEqual(await (await fetch(base + '/api/auth-options')).json(), { recovery: false });
    const request = body => fetch(base + '/api/password-reset/request', {
      method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    assert.equal((await request({ email: 'invalid' })).status, 400);
    assert.equal((await request({ email: 'unknown@example.test' })).status, 503);
    for (let attempt = 0; attempt < 13; attempt++) assert.equal((await request({ email: 'invalid' })).status, 400);
    assert.equal((await request({ email: 'invalid' })).status, 429);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('recuperação SQL/API é de uso único, expira, limita solicitações e preserva as chaves privadas', { skip: !process.env.DATABASE_URL }, async () => {
  const owner = randomUUID();
  const keyset = randomUUID();
  const email = owner + '@reset.test';
  const deliveries = [];
  const sendResetEmail = async delivery => { deliveries.push(delivery); };
  const server = createServer({ publicOrigin: '', production: false, sendResetEmail });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(path, body, cookie, origin = base) {
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  try {
    const root = await createRoot('private-test-password', owner, keyset);
    const payload = await seal(root.key, 'Anotação privada intacta', 'test-note');
    await database().query('INSERT INTO users (id,email,display_name,password_hash) VALUES ($1,$2,$3,$4)', [owner, email, 'Ensaio de recuperação', await hashPassword('Old-test-password')]);
    await database().query('INSERT INTO user_keysets (id,owner_id,root_envelope) VALUES ($1,$2,$3)', [keyset, owner, root.envelope]);
    const session = await createSession(owner);
    const secondSession = await createSession(owner);
    assert.equal((await request('/api/auth-options')).body.recovery, true);
    assert.equal((await request('/api/password-reset/request', { email }, null, 'https://other.test')).status, 403);
    const unknown = await request('/api/password-reset/request', { email: randomUUID() + '@unknown.test' });
    const known = await request('/api/password-reset/request', { email: email.toUpperCase() });
    assert.equal(known.status, 200);
    assert.deepEqual(known.body, unknown.body);
    assert.equal(deliveries.length, 1);
    const token = deliveries[0].token;
    assert.match(token, /^[a-f0-9]{64}$/);
    const stored = await database().query('SELECT * FROM password_resets WHERE owner_id=$1', [owner]);
    assert.equal(stored.rows[0].token_hash, tokenHash(token));
    assert.equal(JSON.stringify(stored.rows).includes(token), false);
    assert.equal((await request('/api/password-reset/complete', { token, password: 'short' })).status, 400);
    const done = await request('/api/password-reset/complete', { token, password: 'New-test-password' });
    assert.equal(done.status, 200);
    assert.match(done.cookie, /Max-Age=0/);
    assert.equal((await request('/api/me', undefined, 'l4_session=' + session)).status, 401);
    assert.equal((await request('/api/me', undefined, 'l4_session=' + secondSession)).status, 401);
    assert.equal((await request('/api/login', { email, password: 'Old-test-password' })).status, 401);
    assert.equal((await request('/api/login', { email, password: 'New-test-password' })).status, 200);
    assert.equal((await request('/api/password-reset/complete', { token, password: 'Repeated-test-password' })).status, 400);
    const envelope = (await database().query('SELECT root_envelope FROM user_keysets WHERE owner_id=$1', [owner])).rows[0].root_envelope;
    assert.deepEqual(envelope, root.envelope);
    assert.equal(await open(await unlockRoot('private-test-password', envelope, owner, keyset), payload, 'test-note'), 'Anotação privada intacta');

    await requestPasswordReset({ email }, sendResetEmail);
    await new Promise(resolve => setImmediate(resolve));
    const older = deliveries.at(-1).token;
    await requestPasswordReset({ email }, sendResetEmail);
    await new Promise(resolve => setImmediate(resolve));
    const latest = deliveries.at(-1).token;
    assert.notEqual(older, latest);
    await requestPasswordReset({ email }, sendResetEmail);
    assert.equal(deliveries.length, 3);
    assert.equal((await request('/api/password-reset/complete', { token: older, password: 'Another-test-password' })).status, 400);
    const concurrent = await Promise.all([1, 2].map(() => request('/api/password-reset/complete', { token: latest, password: 'Concurrent-test-password' })));
    assert.deepEqual(concurrent.map(result => result.status).sort(), [200, 400]);
    await database().query('UPDATE password_resets SET consumed_at=NULL, expires_at=now()-interval \'1 minute\' WHERE token_hash=$1', [tokenHash(latest)]);
    assert.equal((await request('/api/password-reset/complete', { token: latest, password: 'Expired-test-password' })).status, 400);
    assert.equal((await request('/api/password-reset/complete', { token: 'bad', password: 'Invalid-test-password' })).status, 400);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    try {
      await database().query('DELETE FROM sessions WHERE owner_id=$1', [owner]);
      await database().query('DELETE FROM user_keysets WHERE owner_id=$1', [owner]);
      await database().query('DELETE FROM users WHERE id=$1', [owner]);
    } finally {
      await closeDatabase();
    }
  }
});
