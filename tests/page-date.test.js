import test from 'node:test';
import assert from 'node:assert/strict';
import { pageDate, pageData } from '../public/storage.js';
import { rememberEdit, restoreEdit } from '../public/edit-history.js';
import { importKey, makeSecret, seal, open } from '../public/crypto.js';

test('data da folha aceita vazio legado e datas reais sem depender do fuso horário', () => {
  assert.equal(pageDate(), '');
  assert.equal(pageDate('2024-02-29'), '2024-02-29');
  for (const value of ['2025-02-29', '2026-04-31', '0000-01-01', '14/10/2026', '2026-10-14T00:00:00Z', null, {}]) {
    assert.throws(() => pageDate(value), /Data da página inválida/);
  }
});

test('data é cifrada com a página e undo/redo preservam edição e remoção', async () => {
  const page = { id: crypto.randomUUID(), title: '', content: 'Notas', size: 'medium', font: 16 };
  const book = { pages: [page] };
  assert.equal(Object.hasOwn(pageData(page), 'date'), false);
  rememberEdit(book, page.id, 0);
  page.date = '2026-10-14';
  const key = await importKey(makeSecret());
  const payload = await seal(key, pageData(page), 'page:test');
  assert.equal(JSON.stringify(payload).includes('2026-10-14'), false);
  assert.equal((await open(key, payload, 'page:test')).date, '2026-10-14');
  restoreEdit(book, page.id, 0);
  assert.equal(page.date, '');
  restoreEdit(book, page.id, 0, true);
  assert.equal(page.date, '2026-10-14');
  rememberEdit(book, page.id, 0);
  page.date = '';
  assert.equal(Object.hasOwn(pageData(page), 'date'), false);
  restoreEdit(book, page.id, 0);
  assert.equal(page.date, '2026-10-14');
});
