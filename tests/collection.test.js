import test from 'node:test';
import assert from 'node:assert/strict';
import { organization, collectionBooks, collectionShelves } from '../public/collection.js';
import { metadata } from '../public/storage.js';

test('estantes são únicas por nome e filtros/busca não alteram os cadernos', () => {
  const first = { title: 'Interfaces', subject: 'Design', tags: ['ux'],
    organization: organization({ shelves: [' Estudos ', 'estudos', 'Leituras'], favorite: true }), position: { at: 10 } };
  const second = { title: 'Código', subject: 'Programação', tags: ['js'],
    organization: { shelves: ['ESTUDOS'], favorite: false }, position: { at: 20 } };
  const legacy = { title: 'Antigo', subject: '', tags: [] };
  const books = [first, second, legacy];
  assert.deepEqual(first.organization.shelves, ['Estudos', 'Leituras']);
  assert.deepEqual(collectionShelves(books), [
    { name: 'Estudos', key: 'estudos', count: 2 }, { name: 'Leituras', key: 'leituras', count: 1 },
  ]);
  assert.deepEqual(collectionBooks(books, 'favorites'), [first]);
  assert.deepEqual(collectionBooks(books, 'shelf:estudos', 'JS'), [second]);
  assert.deepEqual(collectionBooks(books, 'all', 'leituras'), [first]);
  assert.deepEqual(collectionBooks(books, 'recent'), [second, first, legacy]);
  assert.deepEqual(books, [first, second, legacy]);
  assert.deepEqual(collectionBooks(books, 'all', 'inexistente'), []);
  assert.deepEqual(metadata(legacy).organization, { shelves: [], favorite: false });
  assert.throws(() => organization({ shelves: ['x'.repeat(61)] }), /60/);
  assert.throws(() => organization({ shelves: ['Uma, outra'] }), /vírgulas/);
  assert.throws(() => organization({ shelves: Array(13).fill('Estudos') }), /12/);
  assert.throws(() => organization({ shelves: [42] }), /nome/);
});
