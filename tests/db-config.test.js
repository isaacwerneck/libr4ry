import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { database, closeDatabase } from '../lib/db.js';

test('conexão aceita Netlify Database sem substituir DATABASE_URL explícita', async t => {
  const previous = { DATABASE_URL: process.env.DATABASE_URL, NETLIFY_DB_URL: process.env.NETLIFY_DB_URL };
  t.after(async () => {
    await closeDatabase();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const connections = [];
  t.mock.method(pg, 'Pool', function (options) {
    connections.push(options);
    return { end: async () => {} };
  });
  process.env.NETLIFY_DB_URL = 'postgresql://fixture@netlify.example.test/library';
  process.env.DATABASE_URL = 'postgresql://fixture@explicit.example.test/library';
  database();
  assert.equal(connections[0].connectionString, process.env.DATABASE_URL);
  assert.equal(database(), database());
  await closeDatabase();
  delete process.env.DATABASE_URL;
  database();
  assert.equal(connections[1].connectionString, process.env.NETLIFY_DB_URL);
  assert.equal(connections[1].max, 5);
  assert.match(connections[1].options, /search_path=library4,public/);
  await closeDatabase();
  delete process.env.NETLIFY_DB_URL;
  assert.throws(database, /Configure DATABASE_URL/);
  assert.equal(connections.length, 2);
});
