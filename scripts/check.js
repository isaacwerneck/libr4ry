import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const folders = ['public', 'lib', 'scripts', 'tests', 'netlify/functions'];
const files = ['server.js'];
for (const folder of folders) {
  for (const entry of readdirSync(join(root, folder), { withFileTypes: true })) {
    if (entry.isFile() && /\.m?js$/.test(entry.name)) files.push(join(folder, entry.name));
  }
}
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', join(root, file)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Sintaxe verificada em ${files.length} arquivos JavaScript.`);
