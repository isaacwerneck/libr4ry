import { readFile } from 'node:fs/promises';
import { transaction, closeDatabase } from '../lib/db.js';

try {
  for (const [version, file] of [[1, '001-foundation.sql'], [2, '002-social.sql'], [3, '003-password-reset.sql'], [4, '004-moderation.sql'], [5, '005-collaboration.sql'], [6, '006-personal-notebook-settings.sql']]) {
    const sql = await readFile(new URL('../db/' + file, import.meta.url), 'utf8');
    await transaction(async client => {
      await client.query('SELECT pg_advisory_xact_lock(410041)');
      await client.query('CREATE TABLE IF NOT EXISTS public.library4_migrations (version INTEGER PRIMARY KEY)');
      const installed = await client.query('SELECT version FROM public.library4_migrations WHERE version = $1', [version]);
      if (!installed.rowCount) {
        await client.query(sql);
        await client.query('INSERT INTO public.library4_migrations (version) VALUES ($1)', [version]);
      }
    });
    console.log('Migração ' + file + ' aplicada/verificada.');
  }
} catch (error) {
  console.error(`Não foi possível aplicar a migração: ${error.code || error.message}`);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
