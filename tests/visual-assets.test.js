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
    for (const asset of ['wood-grain.svg', 'material-grain.svg', 'retro-arrow.svg', 'retro-hand.svg', 'favicon.svg', 'social-preview.svg']) {
      const response = await fetch(`${base}/${asset}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /^image\/svg\+xml/);
      assert.match(await response.text(), /^<svg\s/);
    }
    const preview = await fetch(base + '/social-preview.jpg');
    assert.equal(preview.headers.get('content-type'), 'image/jpeg');
    const jpeg = Buffer.from(await preview.arrayBuffer());
    assert.equal(jpeg.subarray(0, 3).toString('hex'), 'ffd8ff');
    assert.equal(jpeg.subarray(-2).toString('hex'), 'ffd9');
    const html = await (await fetch(base)).text();
    assert.match(html, /rel="icon" href="\/favicon.svg"/);
    assert.match(html, /og:image" content="https:\/\/libr4ry.netlify.app\/social-preview.jpg"/);
    assert.match(html, /name="description"/);
    assert.equal((await fetch(`${base}/public/wood-grain.svg`)).status, 404);
    assert.equal((await fetch(`${base}/server.js`)).status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
