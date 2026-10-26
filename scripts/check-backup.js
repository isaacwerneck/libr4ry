import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, mkdir, unlink, rmdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import pg from 'pg';
import { importKey, makeSecret, seal, open } from '../public/crypto.js';

const root = resolve(import.meta.dirname, '..');
const binaries = process.env.PG_BIN || 'C:/Users/isazky/pgsql-setup/tar-extract/pgsql/bin';
const adminUrl = new URL(process.env.DATABASE_URL || 'postgresql://127.0.0.1/postgres');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(adminUrl.hostname)) throw new Error('O ensaio exige PostgreSQL local; não use o banco de produção.');
const binary = name => join(binaries, name + (process.platform === 'win32' ? '.exe' : ''));
for (const name of ['pg_dump', 'pg_restore']) {
  if (!existsSync(binary(name))) throw new Error('Configure PG_BIN com pg_dump e pg_restore instalados.');
}
const id = randomUUID().replaceAll('-', '');
const names = ['source', 'restored'].map(side => 'l4_backup_' + side + '_' + id);
const directory = join(root, 'tmp', 'backup-check-' + id);
const archive = join(directory, 'fixture.dump');
const admin = new pg.Client({ connectionString: adminUrl.href });
const connections = [];
const created = [];
let directoryCreated = false;

function run(name, database, args) {
  const result = spawnSync(binary(name), args, {
    windowsHide: true, encoding: 'utf8', timeout: 60000,
    env: { ...process.env, PGHOST: adminUrl.hostname, PGPORT: adminUrl.port || '5432',
      PGUSER: decodeURIComponent(adminUrl.username), PGPASSWORD: decodeURIComponent(adminUrl.password), PGDATABASE: database },
  });
  if (result.error || result.status !== 0) throw new Error(name + ' falhou: ' + (result.error?.code || 'código ' + result.status));
}
async function snapshot(client) {
  const tables = await client.query("SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('library4', 'public') ORDER BY schemaname, tablename");
  const result = {};
  for (const { schemaname, tablename } of tables.rows) {
    assert.match(schemaname + '.' + tablename, /^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*$/);
    result[schemaname + '.' + tablename] = (await client.query('SELECT to_jsonb(t) AS row FROM ' + schemaname + '.' + tablename + ' t ORDER BY to_jsonb(t)::text')).rows;
  }
  return result;
}

try {
  await admin.connect();
  await mkdir(directory, { recursive: true }); directoryCreated = true;
  for (const name of names) {
    assert.match(name, /^l4_backup_(source|restored)_[a-f0-9]{32}$/);
    await admin.query('CREATE DATABASE ' + name);
    created.push(name);
    const url = new URL(adminUrl); url.pathname = '/' + name;
    const client = new pg.Client({ connectionString: url.href });
    connections.push(client); await client.connect();
  }
  const [source, restored] = connections;
  await source.query('BEGIN');
  await source.query('CREATE TABLE public.library4_migrations (version INTEGER PRIMARY KEY)');
  for (const [version, file] of [[1, '001-foundation.sql'], [2, '002-social.sql'], [3, '003-password-reset.sql'], [4, '004-moderation.sql'], [5, '005-collaboration.sql'], [6, '006-personal-notebook-settings.sql']]) {
    await source.query(await readFile(join(root, 'db', file), 'utf8'));
    await source.query('INSERT INTO public.library4_migrations VALUES ($1)', [version]);
  }
  const [owner, other, keyset, book, page] = Array.from({ length: 5 }, () => randomUUID());
  const key = await importKey(makeSecret());
  const note = { title: 'Ensaio de restauração', content: 'Conteúdo privado fictício', date: '2026-10-15' };
  const envelope = await seal(key, note, 'backup-check');
  for (const user of [owner, other]) await source.query('INSERT INTO library4.users (id,email,display_name,password_hash) VALUES ($1,$2,$3,$4)', [user, user + '@backup.test', 'Ensaio local', 'fixture']);
  await source.query('INSERT INTO library4.user_keysets (id,owner_id,root_envelope) VALUES ($1,$2,$3)', [keyset, owner, envelope]);
  await source.query('INSERT INTO library4.notebooks (id,owner_id,keyset_id,wrapped_key,encrypted_metadata,revision) VALUES ($1,$2,$3,$4,$4,1)', [book, owner, keyset, envelope]);
  await source.query('INSERT INTO library4.pages (id,notebook_id,position,current_revision) VALUES ($1,$2,0,1)', [page, book]);
  await source.query('INSERT INTO library4.page_versions (page_id,revision,encrypted_payload) VALUES ($1,1,$2)', [page, envelope]);
  await source.query('INSERT INTO library4.social_posts (id,owner_id,title,content) VALUES ($1,$2,$3,$4)', [randomUUID(), owner, 'Publicação de teste', 'Cópia pública fictícia']);
  await source.query('INSERT INTO library4.social_messages (id,sender_id,recipient_id,content) VALUES ($1,$2,$3,$4)', [randomUUID(), owner, other, 'Mensagem fictícia']);
  await source.query('COMMIT');
  const expected = await snapshot(source);
  run('pg_dump', names[0], ['--format=custom', '--no-owner', '--no-acl', '--file', archive]);
  run('pg_restore', names[1], ['--exit-on-error', '--single-transaction', '--no-owner', '--no-acl', '--dbname', names[1], archive]);
  assert.deepEqual(await snapshot(restored), expected);
  const payload = await restored.query('SELECT encrypted_payload FROM library4.page_versions WHERE page_id = $1', [page]);
  assert.deepEqual(await open(key, payload.rows[0].encrypted_payload, 'backup-check'), note);
  console.log('Backup/restauração local aprovados: tabelas, dados sociais e conteúdo cifrado preservados; bancos reais não foram alterados.');
} catch (error) {
  console.error('Ensaio de backup falhou: ' + (error.code || error.message));
  process.exitCode = 1;
} finally {
  for (const client of connections) await client.end();
  for (const name of created) {
    assert.ok(names.includes(name) && /^l4_backup_(source|restored)_[a-f0-9]{32}$/.test(name));
    await admin.query('DROP DATABASE ' + name);
  }
  await admin.end();
  if (existsSync(archive)) await unlink(archive);
  if (directoryCreated) await rmdir(directory);
}
