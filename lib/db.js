import pg from 'pg';

let pool;
export function database() {
  const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
  if (!connectionString) throw new Error('Configure DATABASE_URL ou habilite o Netlify Database (NETLIFY_DB_URL).');
  pool ??= new pg.Pool({
    connectionString,
    options: '-c search_path=library4,public -c statement_timeout=15000 -c idle_in_transaction_session_timeout=15000',
    max: 5,
    connectionTimeoutMillis: 5000,
  });
  return pool;
}

export async function transaction(callback) {
  const client = await database().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error(`Falha no rollback: ${rollbackError.code || 'conexão indisponível'}`);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDatabase() {
  if (pool) await pool.end();
  pool = undefined;
}
