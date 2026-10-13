import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from '../server.js';

test('texturas e cursores próprios são servidos com MIME SVG e sem liberar outros arquivos', async () => {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const asset of ['wood-grain.svg', 'material-grain.svg', 'retro-arrow.svg', 'retro-hand.svg']) {
      const response = await fetch(`${base}/${asset}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /^image\/svg\+xml/);
      assert.match(await response.text(), /^<svg\s/);
    }
    assert.equal((await fetch(`${base}/public/wood-grain.svg`)).status, 404);
    assert.equal((await fetch(`${base}/server.js`)).status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
