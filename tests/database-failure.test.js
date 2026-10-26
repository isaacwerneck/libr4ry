import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

for (const file of ['api.test.js', 'social.test.js', 'password-reset.test.js']) {
  test(`integração ${file} encerra com erro se o banco estiver indisponível`, () => {
    const env = { ...process.env, DATABASE_URL: 'postgresql://fixture:fixture@127.0.0.1:1/unavailable' };
    // O subprocesso precisa iniciar seu próprio runner, sem herdar o protocolo do teste pai.
    delete env.NODE_TEST_CONTEXT;
    const result = spawnSync(process.execPath, ['--test', 'tests/' + file], {
      cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8', timeout: 15000,
      env,
    });
    assert.equal(result.error, undefined, 'O teste deve encerrar sem precisar ser terminado por timeout');
    assert.equal(result.status, 1, 'Banco indisponível deve causar falha explícita');
    assert.match(result.stdout + result.stderr, /ECONNREFUSED/);
  });
}
