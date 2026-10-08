import test from 'node:test';
import assert from 'node:assert/strict';
import { importKey, makeSecret, open } from '../public/crypto.js';
import { saveBook, context } from '../public/storage.js';

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
