import pg from 'pg';

let pool;
export function database() {
  if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL no arquivo .env.');
  pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    options: '-c search_path=library4,public',
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
