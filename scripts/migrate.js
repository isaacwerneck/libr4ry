import { readFile } from 'node:fs/promises';
import { transaction, closeDatabase } from '../lib/db.js';

try {
  const sql = await readFile(new URL('../db/001-foundation.sql', import.meta.url), 'utf8');
  await transaction(async client => {
    await client.query('SELECT pg_advisory_xact_lock(410041)');
    await client.query('CREATE TABLE IF NOT EXISTS public.library4_migrations (version INTEGER PRIMARY KEY)');
    const installed = await client.query('SELECT version FROM public.library4_migrations WHERE version = 1');
    if (!installed.rowCount) {
      await client.query(sql);
      await client.query('INSERT INTO public.library4_migrations (version) VALUES (1)');
    }
  });
  console.log('Migração 001 aplicada/verificada.');
} catch (error) {
  console.error(`Não foi possível aplicar a migração: ${error.code || error.message}`);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
