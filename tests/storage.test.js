import test from 'node:test';
import assert from 'node:assert/strict';
import { importKey, makeSecret, open } from '../public/crypto.js';
import { api, createBook, saveBook, context } from '../public/storage.js';

test('API traduz falhas de transporte e resposta sem repetir o envio ou perder status HTTP', async t => {
  const request = { password: 'somente-fixture-local' };
  for (const cause of [new TypeError('Failed to fetch'), new DOMException('Signal timed out', 'TimeoutError')]) {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async (path, options) => {
      calls++;
      assert.equal(path, '/api/login');
      assert.equal(options.method, 'POST');
      assert.equal(options.credentials, 'same-origin');
      assert.deepEqual(JSON.parse(options.body), request);
      throw cause;
    });
    await assert.rejects(api('/api/login', request), error => {
      assert.equal(error.cause, cause);
      assert.match(error.message, cause.name === 'TimeoutError' ? /Não foi possível confirmar/ : /Verifique sua conexão/);
      assert.equal(error.message.includes(request.password), false);
      return true;
    });
    assert.equal(calls, 1);
    t.mock.restoreAll();
  }
  for (const status of [401, 502]) {
    t.mock.method(globalThis, 'fetch', async () => new Response('<html>Proxy error</html>', { status }));
    await assert.rejects(api('/api/me'), error => error.status === status && /resposta inválida/.test(error.message));
    t.mock.restoreAll();
  }
  for (const body of ['<html>Rate limited</html>', '', '{}', 'null', '[]']) {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response(body, { status: 429 }); });
    await assert.rejects(api('/api/login', request), error => error.status === 429 && /Muitas tentativas.*Aguarde/.test(error.message));
    assert.equal(calls, 1);
    t.mock.restoreAll();
  }
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Limite de publicações atingido.' }, { status: 429 }));
  await assert.rejects(api('/api/social/posts', {}), error => error.status === 429 && error.message === 'Limite de publicações atingido.');
  t.mock.restoreAll();
  for (const [status, bodies] of [[200, ['null', '[]', '"unexpected"']], [409, ['{"error":{"internal":"details"}}']]]) {
    for (const body of bodies) {
      t.mock.method(globalThis, 'fetch', async () => new Response(body, { status }));
      await assert.rejects(api('/api/notebooks'), error => error.status === status && /resposta inválida/.test(error.message));
      t.mock.restoreAll();
    }
  }
  t.mock.method(AbortSignal, 'timeout', () => AbortSignal.abort(new DOMException('Timed out', 'TimeoutError')));
  t.mock.method(globalThis, 'fetch', async () => ({
    status: 200, ok: true, json() { throw new DOMException('Aborted while reading', 'AbortError'); },
  }));
  await assert.rejects(api('/api/me'), error => error.status === 200 && /Não foi possível confirmar/.test(error.message));
  t.mock.restoreAll();
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Entre na sua conta para continuar.' }, { status: 401 }));
  await assert.rejects(api('/api/me'), error => error.status === 401 && error.message === 'Entre na sua conta para continuar.');
  t.mock.restoreAll();
  t.mock.method(globalThis, 'fetch', async () => Response.json({ status: 'ok' }));
  assert.deepEqual(await api('/api/health'), { status: 'ok' });
});

test('criação repete o mesmo envelope após resposta perdida e preserva edições posteriores', async () => {
  const user = { id: crypto.randomUUID() };
  const keyset = { id: crypto.randomUUID() };
  const rootKey = await importKey(makeSecret());
  const page = { id: crypto.randomUUID(), title: '', content: 'Original', size: 'medium', font: 16 };
  const book = { id: crypto.randomUUID(), title: 'Original', subject: '', tags: [], pages: [page], tasks: [] };
  let sent;
  await assert.rejects(createBook(book, user, keyset, rootKey, async (path, body) => {
    sent = JSON.stringify(body);
    throw new Error('Resposta perdida após persistir');
  }));
  const key = book.key;
  book.title = 'Revisado';
  page.content = 'Texto posterior';
  await createBook(book, user, keyset, rootKey, async (path, body) => {
    assert.equal(JSON.stringify(body), sent);
    assert.equal(book.key, key);
    assert.equal((await open(book.key, body.page.envelope, context(book, 'page', page.id, 1))).content, 'Original');
    return { revision: 1 };
  });
  assert.equal(book.creation, undefined);
  assert.equal(book.generation, 1);
  assert.equal(JSON.parse(page.saved).content, 'Original');
  await saveBook(book, async (path, body) => {
    assert.equal((await open(book.key, body.metadata, context(book, 'metadata', book.id, 2))).title, 'Revisado');
    assert.equal((await open(book.key, body.pages[0].envelope, context(book, 'page', page.id, 2))).content, 'Texto posterior');
    return { revision: 2, pages: [{ id: page.id, revision: 2 }], tasks: [] };
  });
  await createBook(book, user, keyset, rootKey, () => assert.fail('Não recriar caderno confirmado'));
  assert.equal(book.revision, 2);
});

test('autosave confirma apenas o texto enviado e repete o mesmo lote após timeout', async () => {
  const page = { id: crypto.randomUUID(), revision: 1, title: '', content: 'Texto enviado', size: 'medium', font: 16,
    saved: JSON.stringify({ title: '', content: '', size: 'medium', font: 16 }) };
  const book = { id: crypto.randomUUID(), ownerId: crypto.randomUUID(), key: await importKey(makeSecret()),
    revision: 1, generation: 1, confirmed: 0, title: 'Teste', subject: '', tags: [], pages: [page], tasks: [] };
  let sent;
  await assert.rejects(saveBook(book, async (path, body) => {
    sent = JSON.stringify(body);
    page.content = 'Texto digitado enquanto enviava';
    book.generation += 1;
    throw new Error('Timeout simulado depois da persistência');
  }));
  assert.equal(book.confirmed, 0);
  await saveBook(book, async (path, body) => {
    assert.equal(JSON.stringify(body), sent);
    assert.equal((await open(book.key, body.pages[0].envelope, context(book, 'page', page.id, 2))).content, 'Texto enviado');
    return { revision: 2, pages: [{ id: page.id, revision: 2 }], tasks: [] };
  });
  assert.equal(book.confirmed, 1);
  assert.equal(book.generation, 2);
  assert.equal(page.content, 'Texto digitado enquanto enviava');
  await saveBook(book, async (path, body) => {
    assert.notEqual(body.mutationId, JSON.parse(sent).mutationId);
    assert.equal(body.revision, 2);
    assert.equal((await open(book.key, body.pages[0].envelope, context(book, 'page', page.id, 3))).content, page.content);
    return { revision: 3, pages: [{ id: page.id, revision: 3 }], tasks: [] };
  });
  assert.equal(book.confirmed, book.generation);
});
