import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from '../server.js';
import { hashPassword, setSession } from '../lib/auth.js';

test('produção exige origem HTTPS canônica e cookies seguros também ao sair', () => {
  for (const publicOrigin of ['', 'http://library.example', 'https://library.example/', 'https://user:pass@library.example']) {
    assert.throws(() => createServer({ publicOrigin, production: true }));
  }
  for (const token of ['a'.repeat(64), '']) {
    let cookie;
    setSession({ setHeader(name, value) { assert.equal(name, 'Set-Cookie'); cookie = value; } }, token, true);
    assert.match(cookie, /; Secure$/);
    assert.match(cookie, /HttpOnly; SameSite=Strict/);
    assert.match(cookie, token ? /Max-Age=604800/ : /Max-Age=0/);
  }
});

test('origem configurada aceita HTTPS e rejeita origem ausente, forjada e host manipulado', async () => {
  const server = createServer({ publicOrigin: 'https://library.example', production: true });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const page = await fetch(base);
    assert.equal(page.headers.get('strict-transport-security'), 'max-age=31536000');
    assert.equal(page.headers.get('x-frame-options'), 'DENY');
    assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal(server.requestTimeout, 15000);
    assert.equal(server.headersTimeout, 10000);
    const post = origin => fetch(base + '/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
      body: '{}',
    });
    assert.equal((await post('https://library.example')).status, 400);
    assert.equal((await post()).status, 403);
    assert.equal((await post(base)).status, 403);
    assert.equal((await post('https://evil.example')).status, 403);
    assert.equal((await fetch(base + '/api/login', {
      method: 'POST', headers: { Origin: 'https://evil.example', Host: 'evil.example', 'Content-Type': 'application/json' }, body: '{}',
    })).status, 403);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('IP encaminhado só vale pelo proxy explícito e clientes têm cotas independentes', async () => {
  assert.throws(() => createServer({ trustedProxy: '*' }));
  for (const trustedProxy of ['127.0.0.1', '192.0.2.1']) {
    const server = createServer({ publicOrigin: '', production: false, trustedProxy });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = 'http://127.0.0.1:' + server.address().port;
    const request = ip => fetch(base + '/api/login', {
      method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: '{}',
    });
    try {
      for (let index = 0; index < 15; index++) assert.equal((await request('203.0.113.10')).status, 400);
      assert.equal((await request('203.0.113.10')).status, 429);
      assert.equal((await request('203.0.113.11')).status, trustedProxy === '127.0.0.1' ? 400 : 429);
      if (trustedProxy === '127.0.0.1') assert.equal((await request('203.0.113.10, 203.0.113.11')).status, 400);
    } finally { await new Promise(resolve => server.close(resolve)); }
  }
});

test('trabalho de senha tem concorrência limitada e libera vagas após terminar', async () => {
  const pending = Array.from({ length: 4 }, () => hashPassword('senha de teste segura'));
  await assert.rejects(hashPassword('outra senha de teste'), error => error.status === 503);
  await Promise.all(pending);
  assert.match(await hashPassword('senha após liberar vagas'), /^scrypt\$/);
});
