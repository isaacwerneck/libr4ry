import assert from 'node:assert/strict';
import { mkdir, copyFile, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { assets, headers } from '../server.js';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');
assert.equal(dirname(output), root, 'A saída deve ficar dentro do projeto');
await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const [url, [source]] of assets) {
  const name = url === '/' ? 'index.html' : url.slice(1);
  await copyFile(resolve(root, source), resolve(output, name));
}
const rules = ['/*'];
headers({ setHeader(name, value) { rules.push(`  ${name}: ${value}`); } }, true);
await writeFile(resolve(output, '_headers'), rules.join('\n') + '\n');
console.log('Pacote público do Netlify gerado em dist, sem arquivos privados.');
