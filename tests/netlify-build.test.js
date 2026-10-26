import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile, mkdtemp, rm, rmdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import { build } from 'esbuild';
import { assets } from '../server.js';

const root = fileURLToPath(new URL('../', import.meta.url));
test('pacote público contém apenas assets permitidos e remove arquivos antigos', async () => {
  await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
  await writeFile(new URL('../dist/old-fixture.txt', import.meta.url), 'Arquivo antigo de ensaio');
  for (const script of ['scripts/build-editor.js', 'scripts/build-netlify.js']) {
    const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8', timeout: 30000 });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
  }
  const expected = [...new Set([...assets.keys()].map(url => url === '/' ? 'index.html' : url.slice(1))), '_headers'].sort();
  assert.deepEqual((await readdir(new URL('../dist/', import.meta.url))).sort(), expected);
  for (const [url, [source]] of assets) {
    const name = url === '/' ? 'index.html' : url.slice(1);
    assert.deepEqual(await readFile(new URL('../dist/' + name, import.meta.url)), await readFile(new URL('../' + source, import.meta.url)));
  }
  const rules = await readFile(new URL('../dist/_headers', import.meta.url), 'utf8');
  assert.match(rules, /Content-Security-Policy: default-src 'none'/);
  assert.match(rules, /Cache-Control: no-store/);
  assert.match(rules, /Strict-Transport-Security: max-age=31536000/);
});

test('Function empacotada pelo esbuild continua executável sem abrir servidor HTTP', async () => {
  const temporary = resolve(root, 'tmp');
  await mkdir(temporary, { recursive: true });
  const directory = await mkdtemp(join(temporary, 'netlify-bundle-'));
  const outfile = join(directory, 'api.mjs');
  const authFile = join(directory, 'auth.mjs');
  assert.equal(dirname(directory), temporary);
  try {
    await build({ entryPoints: [resolve(root, 'netlify/functions/api.mjs')], outfile,
      bundle: true, platform: 'node', format: 'esm', target: 'node24', external: ['pg'] });
    const { createNetlifyHandler, config } = await import(pathToFileURL(outfile));
    assert.equal(config.path, '/api/*');
    const handle = createNetlifyHandler({ publicOrigin: 'https://libr4ry.netlify.app', sendResetEmail: null });
    const response = await handle(new Request('https://libr4ry.netlify.app/api/auth-options'), { ip: '192.0.2.1', waitUntil() {} });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { recovery: false });
    await build({ entryPoints: [resolve(root, 'netlify/functions/auth.mjs')], outfile: authFile,
      bundle: true, platform: 'node', format: 'esm', target: 'node24', external: ['pg'] });
    const auth = await import(pathToFileURL(authFile));
    assert.equal(typeof auth.default, 'function');
    assert.deepEqual(auth.config.path, config.excludedPath);
    assert.equal(auth.config.rateLimit.windowLimit, 15);
    assert.equal(auth.config.rateLimit.windowSize, 60);
  } finally {
    await rm(outfile, { force: true });
    await rm(authFile, { force: true });
    await rmdir(directory);
  }
});
