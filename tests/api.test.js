import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from '../server.js';
import { database, closeDatabase, transaction } from '../lib/db.js';
import { importKey, makeSecret, seal, createRoot, unlockRoot } from '../public/crypto.js';
import { createBook, loadBook, saveBook, versions } from '../public/storage.js';

test('SQL/API: propriedade, histórico, idempotência, conflito e dados privados', {
  skip: !process.env.DATABASE_URL,
}, async () => {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const owner = randomUUID();
  const other = randomUUID();
  const keysetId = randomUUID();
  const notebookId = randomUUID();
  const pageId = randomUUID();
  const key = await importKey(makeSecret());
  const protectedPayload = await seal(key, { text: 'MARCADOR_PRIVADO_DE_TESTE' }, 'test-only');
  const roots = new Map();
  const accounts = new Map();

  async function request(path, cookie, body, origin = base) {
    const response = await fetch(base + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    return { status: response.status, data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }

  async function register(id, ownKeyset) {
    const contentPassword = randomBytes(3).toString('base64url');
    const password = randomBytes(6).toString('base64url');
    const root = await createRoot(contentPassword, id, ownKeyset);
    roots.set(id, root.key);
    accounts.set(id, { password, contentPassword });
    return request('/api/register', null, {
      id, keysetId: ownKeyset, email: `${id}@library4.test`, name: 'Teste local',
      password, rootEnvelope: root.envelope,
    });
  }

  try {
    const a = await register(owner, keysetId);
    const b = await register(other, randomUUID());
    assert.equal(a.status, 201);
    assert.equal(b.status, 201);
    assert.equal((await request('/api/health')).data.status, 'ok');
    assert.equal((await request('/api/login', null, { email: `${owner}@library4.test`, password: 'senha-incorreta-de-teste' })).status, 401);
    assert.equal((await request('/api/notebooks', null)).status, 401);
    assert.equal((await request('/api/logout', a.cookie, {}, 'https://other.example')).status, 403);
    for (const path of ['/.env', '/server.js', '/tmp/library4-before-rebuild.tar']) {
      assert.equal((await request(path)).status, 404);
    }

    const creation = {
      id: notebookId, keysetId, wrappedKey: protectedPayload, metadata: protectedPayload,
      page: { id: pageId, envelope: protectedPayload },
    };
    assert.equal((await request('/api/notebooks', a.cookie, creation)).status, 201);
    assert.equal((await request(`/api/notebooks/${notebookId}`, b.cookie)).status, 404);
    assert.equal((await request(`/api/pages/${pageId}/versions`, b.cookie)).status, 404);
    assert.deepEqual((await request('/api/notebooks', b.cookie)).data.notebooks, []);

    const save = {
      mutationId: randomUUID(), revision: 1, metadata: protectedPayload,
      pages: [{ id: pageId, revision: 1, envelope: protectedPayload }], tasks: [],
    };
    const accepted = await request(`/api/notebooks/${notebookId}/save`, a.cookie, save);
    assert.equal(accepted.status, 200);
    assert.equal(accepted.data.revision, 2);
    const repeated = await request(`/api/notebooks/${notebookId}/save`, a.cookie, save);
    assert.deepEqual(repeated.data, accepted.data);
    const stale = await request(`/api/notebooks/${notebookId}/save`, a.cookie, { ...save, mutationId: randomUUID() });
    assert.equal(stale.status, 409);
    assert.equal((await request(`/api/notebooks/${notebookId}/save`, b.cookie, save)).status, 404);

    const changedRetry = { ...save, metadata: await seal(key, { text: 'OUTRO_TEXTO' }, 'test-only') };
    assert.equal((await request(`/api/notebooks/${notebookId}/save`, a.cookie, changedRetry)).status, 409);
    const history = await request(`/api/pages/${pageId}/versions`, a.cookie);
    assert.equal(history.data.versions.length, 2);
    assert.equal(history.data.versions[0].revision, '2');
    const detail = await request(`/api/notebooks/${notebookId}`, a.cookie);
    assert.equal(detail.data.pages[0].revision, '2');
    assert.equal(JSON.stringify(detail.data).includes('MARCADOR_PRIVADO_DE_TESTE'), false);
    const stored = await database().query('SELECT encrypted_metadata, wrapped_key FROM notebooks WHERE id = $1', [notebookId]);
    assert.equal(JSON.stringify(stored.rows).includes('MARCADOR_PRIVADO_DE_TESTE'), false);
    const impossibleKeyset = { ...creation, id: randomUUID(), page: { id: randomUUID(), envelope: protectedPayload } };
    assert.equal((await request('/api/notebooks', b.cookie, impossibleKeyset)).status, 404);

    const call = async (path, body) => {
      const response = await request(path, a.cookie, body);
      if (response.status >= 400) { const error = new Error(response.data.error); error.status = response.status; throw error; }
      return response.data;
    };
    const live = { id: randomUUID(), title: 'MARCADOR_PRIVADO_DE_TESTE', subject: 'Design', tags: ['ux'],
      pages: [{ id: randomUUID(), title: 'Ideias', content: 'Primeira nota', size: 'medium', font: 16 }], tasks: [] };
    await createBook(live, { id: owner }, { id: keysetId }, roots.get(owner), call);
    live.pages[0].content = 'Segunda nota persistida';
    live.pages.push({ id: randomUUID(), title: 'Continuação', content: 'Outro texto', size: 'small', font: 18 });
    live.tasks.push({ id: randomUUID(), title: 'Estudar', done: true });
    live.generation += 1;
    live.preferences = { paper: 'sand', cover: 'slate', font: 'serif', layout: 'spread', zoom: 1.2, motion: 'light', ruling: 'dotted', desk: 'dark', light: 'night' };
    live.position = { pageId: live.pages[1].id, caret: 3, fraction: .4, at: Date.now() };
    live.organization = { shelves: ['ESTANTE_PRIVADA_DE_TESTE', 'Design'], favorite: true };
    live.covers = { front: { material: 'cloth', image: { data: 'data:image/webp;base64,UklGR' + 'A'.repeat(150000),
      x: .2, y: .3, width: .4, height: .2 } }, back: { title: 'CONTRACAPA_PRIVADA', color: '#aabbcc' } };
    await saveBook(live, call);
    const record = (await call('/api/notebooks')).notebooks.find(book => book.id === live.id);
    const reopened = await loadBook(record, { id: owner }, { id: keysetId }, roots.get(owner), call);
    assert.equal(reopened.pages[0].content, 'Segunda nota persistida');
    assert.equal(reopened.pages[1].content, 'Outro texto');
    assert.equal(reopened.tasks[0].done, true);
    assert.equal(reopened.title, live.title);
    assert.equal(reopened.preferences.paper, 'sand');
    assert.equal(reopened.preferences.zoom, 1.2);
    assert.equal(reopened.preferences.ruling, 'dotted');
    assert.equal(reopened.preferences.desk, 'dark');
    assert.equal(reopened.preferences.light, 'night');
    assert.deepEqual(reopened.position, live.position);
    assert.deepEqual(reopened.organization, live.organization);
    assert.deepEqual(reopened.covers, live.covers);
    const organized = await call(`/api/notebooks/${live.id}`);
    assert.equal(JSON.stringify(organized).includes('ESTANTE_PRIVADA_DE_TESTE'), false);
    const privateMetadata = await database().query('SELECT encrypted_metadata FROM notebooks WHERE id = $1', [live.id]);
    assert.equal(JSON.stringify(privateMetadata.rows).includes('ESTANTE_PRIVADA_DE_TESTE'), false);
    assert.equal(JSON.stringify(privateMetadata.rows).includes('CONTRACAPA_PRIVADA'), false);
    assert.equal(JSON.stringify(privateMetadata.rows).includes('data:image'), false);
    const previous = await versions(reopened, reopened.pages[0], call);
    assert.equal(previous[1].value.content, 'Primeira nota');
    Object.assign(reopened.pages[0], previous[1].value);
    reopened.generation += 1;
    await saveBook(reopened, call);
    const restored = await versions(reopened, reopened.pages[0], call);
    assert.equal(restored[0].value.content, 'Primeira nota');
    assert.equal(restored[1].value.content, 'Segunda nota persistida');
    assert.equal(JSON.stringify(record).includes(live.title), false);
    assert.equal((await request('/api/logout', a.cookie, {})).status, 200);
    assert.equal((await request('/api/me', a.cookie)).status, 401);
    const login = await request('/api/login', null, { email: `${owner}@library4.test`, password: accounts.get(owner).password });
    assert.equal(login.status, 200);
    const identity = (await request('/api/me', login.cookie)).data;
    assert.equal(identity.user.display_name, 'Teste local');
    await assert.rejects(unlockRoot('senha-incorreta-de-conteudo', identity.keyset.root_envelope, owner, keysetId));
    const unlocked = await unlockRoot(accounts.get(owner).contentPassword, identity.keyset.root_envelope, owner, keysetId);
    const afterLogin = async (path, body) => {
      const response = await request(path, login.cookie, body);
      assert.ok(response.status < 400, response.data.error);
      return response.data;
    };
    const savedRecord = (await afterLogin('/api/notebooks')).notebooks.find(book => book.id === live.id);
    const afterReentry = await loadBook(savedRecord, identity.user, identity.keyset, unlocked, afterLogin);
    assert.equal(afterReentry.pages[0].content, 'Primeira nota');
    assert.deepEqual(afterReentry.organization, live.organization);
    assert.deepEqual(afterReentry.covers, live.covers);
  } finally {
    const fixtureBooks = await database().query('SELECT id FROM notebooks WHERE owner_id = ANY($1::uuid[])', [[owner, other]]);
    const fixtureIds = fixtureBooks.rows.map(book => book.id);
    await database().query('DELETE FROM notebook_mutations WHERE notebook_id = ANY($1::uuid[])', [fixtureIds]);
    await database().query('DELETE FROM tasks WHERE notebook_id = ANY($1::uuid[])', [fixtureIds]);
    await transaction(async client => {
      await client.query('DELETE FROM page_versions WHERE page_id IN (SELECT id FROM pages WHERE notebook_id = ANY($1::uuid[]))', [fixtureIds]);
      await client.query('DELETE FROM pages WHERE notebook_id = ANY($1::uuid[])', [fixtureIds]);
    });
    await database().query('DELETE FROM notebooks WHERE id = ANY($1::uuid[])', [fixtureIds]);
    await database().query('DELETE FROM sessions WHERE owner_id = ANY($1::uuid[])', [[owner, other]]);
    await database().query('DELETE FROM user_keysets WHERE owner_id = ANY($1::uuid[])', [[owner, other]]);
    await database().query('DELETE FROM users WHERE id = ANY($1::uuid[])', [[owner, other]]);
    server.close();
    await once(server, 'close');
    await closeDatabase();
  }
});
