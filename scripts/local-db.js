import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const directory = join(root, 'tmp', 'postgres');
const binaries = process.env.PG_BIN || 'C:/Users/isazky/pgsql-setup/tar-extract/pgsql/bin';
const port = 5547;

function run(command, args, allowFailure = false) {
  const result = spawnSync(join(binaries, `${command}.exe`), args, {
    windowsHide: true, encoding: 'utf8', cwd: root,
    stdio: command === 'pg_ctl' ? 'ignore' : 'pipe',
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`${command}: ${result.stderr || result.stdout || `falhou com código ${result.status}; consulte tmp/postgres.log`}`);
  }
  return result.status;
}

try {
  mkdirSync(join(root, 'tmp'), { recursive: true });
  if (!existsSync(join(directory, 'PG_VERSION'))) {
    if (existsSync(join(root, '.env'))) {
      throw new Error('O .env já existe. Configure o banco manualmente para preservar suas credenciais.');
    }
    const password = randomBytes(24).toString('base64url');
    const passwordFile = join(root, 'tmp', 'postgres-password');
    writeFileSync(passwordFile, password, { mode: 0o600 });
    try {
      run('initdb', ['-D', directory, '-U', 'library4', '--auth=scram-sha-256',
        '--pwfile', passwordFile, '--encoding=UTF8', '--locale=C']);
    } finally {
      unlinkSync(passwordFile);
    }
    writeFileSync(join(root, '.env'),
      `DATABASE_URL=postgresql://library4:${password}@127.0.0.1:${port}/postgres\nPORT=8000\n`,
      { mode: 0o600 });
  }
  if (!existsSync(join(root, '.env')) || !readFileSync(join(root, '.env'), 'utf8').includes('DATABASE_URL=')) {
    throw new Error('Configure DATABASE_URL no .env antes de iniciar a aplicação.');
  }
  if (run('pg_ctl', ['status', '-D', directory], true) !== 0) {
    run('pg_ctl', ['start', '-D', directory, '-l', join(root, 'tmp', 'postgres.log'),
      '-o', `-p ${port} -h 127.0.0.1`, '-w']);
  }
  console.log(`PostgreSQL local disponível em 127.0.0.1:${port}. Credenciais no .env, ignorado pelo Git.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
