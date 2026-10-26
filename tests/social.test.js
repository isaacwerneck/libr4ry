import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from '../server.js';
import { database, closeDatabase } from '../lib/db.js';
import { createSession } from '../lib/auth.js';

test('social SQL/API: publicação explícita, convites, mensagens, isolamento, repetição e bloqueio', {
  skip: !process.env.DATABASE_URL,
}, async () => {
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  const [a,b,c] = ids;
  const server = createServer({ publicOrigin: '', production: false });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  const cookies = new Map();
  async function request(owner, path, body) {
    const response = await fetch(base + '/api/social/' + path, {
      method: body ? 'POST' : 'GET',
      headers: { Origin: base, 'Content-Type': 'application/json', ...(owner ? { Cookie: cookies.get(owner) } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, data: await response.json() };
  }
  const friend = (owner, id, action) => request(owner, 'friends', { id, action });
  try {
    for (const id of ids) {
      await database().query('INSERT INTO users (id,email,display_name,password_hash) VALUES ($1,$2,$3,$4)',
        [id, id + '@social.test', 'Social ' + id, 'not-a-login-hash']);
      cookies.set(id, 'l4_session=' + await createSession(id));
    }
    assert.equal((await request(a, 'friends')).status, 200);
    assert.equal((await request(null, 'posts')).status, 401);
    const people = await request(a, 'people?q=' + encodeURIComponent('Social ' + b));
    assert.equal(people.status, 200);
    assert.deepEqual(Object.keys(people.data.people[0]).sort(), ['accepted', 'display_name', 'id', 'requester_id']);
    assert.equal((await request(a, 'people?q=%25')).status, 400);
    assert.equal((await request(a, 'messages?person=' + b)).status, 403);
    assert.equal((await friend(a, a, 'invite')).status, 400);
    assert.equal((await friend(a, b, 'invite')).status, 200);
    assert.equal((await friend(a, b, 'accept')).status, 404);
    assert.equal((await request(a, 'messages', { id: randomUUID(), person: b, content: 'Antes de aceitar' })).status, 403);
    assert.equal((await friend(b, a, 'accept')).status, 200);
    const message = { id: randomUUID(), person: b, content: '<script>mensagem literal</script>' };
    assert.equal((await request(a, 'messages', message)).status, 200);
    assert.equal((await request(a, 'messages', message)).status, 200);
    assert.equal((await request(a, 'messages', { ...message, content: 'alterado' })).status, 409);
    const received = await request(b, 'messages?person=' + a);
    assert.equal(received.data.messages.length, 1);
    assert.equal(received.data.messages[0].content, message.content);
    assert.equal((await request(c, 'messages?person=' + a)).status, 403);
    assert.equal((await request(a, 'messages', { id: randomUUID(), person: b, content: 'x'.repeat(4001) })).status, 400);
    for (let index = 0; index < 29; index++) await database().query(
      'INSERT INTO social_messages (id,sender_id,recipient_id,content) VALUES ($1,$2,$3,$4)', [randomUUID(),a,b,'Ensaio de limite']);
    assert.equal((await request(a, 'messages', message)).status, 200);
    assert.equal((await request(a, 'messages', { ...message, id: randomUUID() })).status, 429);
    for (let index = 0; index < 25; index++) await database().query(
      'INSERT INTO social_messages (id,sender_id,recipient_id,content) VALUES ($1,$2,$3,$4)', [randomUUID(),b,a,'Histórico anterior']);
    const latest = await request(a, 'messages?person=' + b);
    assert.equal(latest.data.messages.length, 50);
    assert.equal(latest.data.more, true);
    const previous = await request(a, 'messages?person=' + b + '&before=' + latest.data.messages[0].id);
    assert.equal(previous.data.messages.length, 5);
    assert.equal(previous.data.more, false);
    assert.equal(new Set([...previous.data.messages,...latest.data.messages].map(item => item.id)).size, 55);
    const post = { id: randomUUID(), title: 'Cópia revisada', content: '<img src=x onerror=alert(1)>' };
    assert.equal((await request(a, 'posts')).data.posts.some(item => item.owner_id === a), false);
    assert.equal((await request(a, 'posts', post)).status, 200);
    assert.equal((await request(a, 'posts', post)).status, 200);
    for (let index = 0; index < 4; index++) await database().query(
      'INSERT INTO social_posts (id,owner_id,title,content) VALUES ($1,$2,$3,$4)', [randomUUID(),a,'Limite','Ensaio de limite']);
    assert.equal((await request(a, 'posts', post)).status, 200);
    assert.equal((await request(a, 'posts', { ...post, id: randomUUID() })).status, 429);
    const feed = await request(c, 'posts');
    assert.equal(feed.data.posts.filter(item => item.id === post.id).length, 1);
    assert.equal(feed.data.posts.find(item => item.id === post.id).content, post.content);
    assert.equal((await request(c, 'posts/remove', { id: post.id })).status, 404);
    assert.equal((await friend(b, a, 'block')).status, 200);
    assert.equal((await request(a, 'messages?person=' + b)).status, 403);
    assert.equal((await request(a, 'messages', { id: randomUUID(), person: b, content: 'Bloqueado' })).status, 403);
    assert.equal((await friend(a, b, 'invite')).status, 403);
    assert.equal((await request(b, 'posts')).data.posts.some(item => item.id === post.id), false);
    assert.equal((await request(a, 'people?q=' + encodeURIComponent('Social ' + b))).data.people.length, 0);
    assert.equal((await friend(b, a, 'unblock')).status, 200);
    assert.equal((await request(a, 'messages?person=' + b)).status, 403);
    assert.equal((await request(a, 'posts/remove', { id: post.id })).status, 200);
    assert.equal((await request(c, 'posts')).data.posts.some(item => item.id === post.id), false);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    try {
      await database().query('DELETE FROM social_messages WHERE sender_id = ANY($1::uuid[]) OR recipient_id = ANY($1::uuid[])', [ids]);
      await database().query('DELETE FROM friendships WHERE first_id = ANY($1::uuid[]) OR second_id = ANY($1::uuid[])', [ids]);
      await database().query('DELETE FROM social_blocks WHERE owner_id = ANY($1::uuid[]) OR blocked_id = ANY($1::uuid[])', [ids]);
      await database().query('DELETE FROM social_posts WHERE owner_id = ANY($1::uuid[])', [ids]);
      await database().query('DELETE FROM sessions WHERE owner_id = ANY($1::uuid[])', [ids]);
      await database().query('DELETE FROM users WHERE id = ANY($1::uuid[])', [ids]);
    } finally {
      await closeDatabase();
    }
  }
});
