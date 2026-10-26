import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from '../server.js';
import { database, closeDatabase } from '../lib/db.js';
import { createSession } from '../lib/auth.js';
import { moderatorIds, purgeResolvedReports } from '../lib/moderation.js';
import { config } from '../netlify/functions/report-retention.mjs';

test('moderação exige IDs válidos e agenda diária exclusiva', () => {
  const id = randomUUID();
  assert.deepEqual([...moderatorIds(id.toUpperCase())], [id]);
  assert.equal(moderatorIds('').size, 0);
  assert.throws(() => moderatorIds('admin@example.test'), /Identificador/);
  assert.equal(config.schedule, '0 3 * * *');
  assert.equal(config.path, undefined);
});

test('denúncias: isolamento, cópia pública, revisão manual, remoção e retenção de 90 dias', { skip: !process.env.DATABASE_URL }, async () => {
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  const [author, reporter, admin] = ids;
  const post = randomUUID(), report = randomUUID();
  const server = createServer({ publicOrigin: '', production: false, moderatorUserIds: admin });
  const cookies = new Map();
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(owner, path, body) {
    const response = await fetch(base + '/api/' + path, {
      method: body ? 'POST' : 'GET',
      headers: { Origin: base, 'Content-Type': 'application/json', ...(owner ? { Cookie: cookies.get(owner) } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, data: await response.json() };
  }
  try {
    for (const id of ids) {
      await database().query('INSERT INTO users (id,email,display_name,password_hash) VALUES ($1,$2,$3,$4)', [id,id+'@moderation.test','Ensaio','not-a-login-hash']);
      cookies.set(id, 'l4_session=' + await createSession(id));
    }
    await database().query('INSERT INTO social_posts (id,owner_id,title,content) VALUES ($1,$2,$3,$4)', [post,author,'Texto público','<script>literal</script>']);
    const body = { id: report, post, reason: 'abuse', details: 'Revisar este conteúdo' };
    assert.equal((await request(null, 'social/reports', body)).status, 401);
    assert.equal((await request(author, 'social/reports', body)).status, 404);
    assert.equal((await request(reporter, 'social/reports', { ...body, reason: 'invalid' })).status, 400);
    assert.equal((await request(reporter, 'social/reports', { ...body, details: 'x'.repeat(2001) })).status, 400);
    await database().query('INSERT INTO social_blocks (owner_id,blocked_id) VALUES ($1,$2)', [author,reporter]);
    assert.equal((await request(reporter, 'social/reports', body)).status, 404);
    await database().query('DELETE FROM social_blocks WHERE owner_id=$1', [author]);
    assert.equal((await request(reporter, 'social/reports', body)).status, 200);
    assert.equal((await request(reporter, 'social/reports', body)).status, 200);
    assert.equal((await request(reporter, 'social/reports', { ...body, id: randomUUID() })).status, 200);
    assert.equal((await request(reporter, 'moderation/reports')).status, 403);
    assert.equal((await request(author, 'moderation/reports/resolve', { id: report, action: 'remove' })).status, 403);
    assert.equal((await request(reporter, 'me')).data.user.moderator, false);
    assert.equal((await request(admin, 'me')).data.user.moderator, true);
    const queue = await request(admin, 'moderation/reports');
    const found = queue.data.reports.find(item => item.id === report);
    assert.equal(found.post_content, '<script>literal</script>');
    assert.equal('reporter_id' in found, false);
    assert.equal((await request(admin, 'moderation/reports/resolve', { id: report, action: 'invalid' })).status, 400);
    assert.equal((await request(admin, 'moderation/reports/resolve', { id: report, action: 'remove' })).status, 200);
    assert.equal((await request(admin, 'moderation/reports/resolve', { id: report, action: 'remove' })).status, 200);
    assert.equal((await database().query('SELECT 1 FROM social_posts WHERE id=$1', [post])).rowCount, 0);
    assert.equal((await database().query('SELECT post_content FROM social_reports WHERE id=$1', [report])).rows[0].post_content, '<script>literal</script>');
    await database().query("UPDATE social_reports SET resolved_at=now()-interval '89 days' WHERE id=$1", [report]);
    await purgeResolvedReports();
    assert.equal((await database().query('SELECT 1 FROM social_reports WHERE id=$1', [report])).rowCount, 1);
    await database().query("UPDATE social_reports SET resolved_at=now()-interval '91 days' WHERE id=$1", [report]);
    await purgeResolvedReports();
    assert.equal((await database().query('SELECT 1 FROM social_reports WHERE id=$1', [report])).rowCount, 0);
    const secondPost = randomUUID();
    await database().query('INSERT INTO social_posts (id,owner_id,title,content) VALUES ($1,$2,$3,$4)', [secondPost,author,'Outro','Texto']);
    const secondReport = randomUUID();
    assert.equal((await request(reporter, 'social/reports', { ...body, id:secondReport, post:secondPost })).status, 200);
    assert.equal((await request(admin, 'moderation/reports/resolve', { id:secondReport, action:'dismiss' })).status, 200);
    assert.equal((await database().query('SELECT 1 FROM social_posts WHERE id=$1', [secondPost])).rowCount, 1);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    try {
      await database().query('DELETE FROM social_reports WHERE reporter_id = ANY($1::uuid[])', [ids]);
      await database().query('DELETE FROM social_blocks WHERE owner_id = ANY($1::uuid[])', [ids]);
      await database().query('DELETE FROM social_posts WHERE owner_id = ANY($1::uuid[])', [ids]);
      await database().query('DELETE FROM sessions WHERE owner_id = ANY($1::uuid[])', [ids]);
      await database().query('DELETE FROM users WHERE id = ANY($1::uuid[])', [ids]);
    } finally { await closeDatabase(); }
  }
});
