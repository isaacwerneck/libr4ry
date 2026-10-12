import test from 'node:test';
import assert from 'node:assert/strict';
import { coverDesigns, coverText, imageBounds, resizeImage } from '../public/cover-design.js';
import { metadata } from '../public/storage.js';
import { importKey, makeSecret, seal, open } from '../public/crypto.js';
import { envelope } from '../lib/validation.js';
import { protectBook, readDrafts, recoverDraft } from '../public/drafts.js';

const data = 'data:image/webp;base64,UklGRg==';
test('capas antigas mantêm textos e lados personalizados são independentes', () => {
  const book = { title: 'Programação', subject: 'JavaScript', tags: [], covers: { back: { title: 'Até amanhã', color: '#aa7722' } } };
  assert.deepEqual(coverDesigns(), { front: {}, back: {} });
  assert.equal(coverText(book, 'front').title, 'Programação');
  assert.equal(coverText(book, 'back').title, 'Até amanhã');
  assert.equal(coverDesigns({ front: { color: 'url(bad)', material: 'invalid' } }).front.color, undefined);
});
test('imagens ficam dentro da capa e redimensionamento preserva proporção', () => {
  assert.deepEqual(imageBounds({ x: 3, y: -1, width: .5, height: .2 }), { x: .5, y: 0, width: .5, height: .2 });
  assert.throws(() => imageBounds({ x: NaN }), /inválida/);
  const start = { x: .2, y: .3, width: .4, height: .2 };
  for (const corner of ['nw', 'ne', 'sw', 'se']) {
    const result = resizeImage(start, .1, .05, corner);
    assert.ok(Math.abs(result.width / result.height - 2) < .00001);
    assert.ok(result.x >= 0 && result.x + result.width <= 1);
    assert.ok(result.y >= 0 && result.y + result.height <= 1);
  }
  assert.throws(() => coverDesigns({ front: { image: { ...start, data: 'data:image/svg+xml;base64,AA==' } } }), /inválida/);
  assert.throws(() => coverDesigns({ front: { image: { ...start, data: data + 'A'.repeat(160001) } } }), /grande/);
});
test('metadados e imagem passam pelo mesmo envelope privado sem expor conteúdo', async () => {
  const book = { title: 'Segredo', subject: '', tags: [], covers: {
    front: { image: { data, x: .2, y: .3, width: .4, height: .2 }, material: 'cloth' },
    back: { color: '#aabbcc', title: 'Fim' } } };
  const key = await importKey(makeSecret());
  const value = metadata(book);
  const encrypted = await seal(key, value, 'cover-test');
  assert.ok(!JSON.stringify(encrypted).includes(data));
  assert.deepEqual((await open(key, encrypted, 'cover-test')).covers, value.covers);
  const large = { v: 1, iv: 'A'.repeat(16), data: 'A'.repeat(100004) };
  assert.throws(() => envelope(large), /grande/);
  assert.equal(envelope(large, 600000).data.length, 100004);
  assert.throws(() => envelope({ ...large, data: 'A'.repeat(600004) }, 600000), /grande/);
});

test('rascunho recupera as duas capas e imagens sem guardar arquivo em claro', async () => {
  const book = { id: crypto.randomUUID(), ownerId: crypto.randomUUID(), key: await importKey(makeSecret()),
    title: 'Ideias', subject: '', tags: [], revision: 1, generation: 1, confirmed: 0, tasks: [],
    pages: [{ id: crypto.randomUUID(), title: '', content: 'Nota', size: 'medium', font: 16 }],
    covers: { front: { image: { data, x: .2, y: .3, width: .4, height: .2 } }, back: { title: 'Amanhã', material: 'smooth' } } };
  let record;
  await protectBook(book, async (_operation, value) => { record = value; });
  assert.ok(!JSON.stringify(record).includes('data:image'));
  const drafts = await readDrafts(book, async () => [record]);
  const restored = { ...book, covers: undefined };
  recoverDraft(restored, drafts[0]);
  assert.deepEqual(restored.covers, book.covers);
});
