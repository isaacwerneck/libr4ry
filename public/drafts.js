import { seal, open } from './crypto.js';
import { context, metadata } from './storage.js';
import { pageCapacity } from './pagination.js';
import { organization } from './collection.js';
import { coverDesigns } from './cover-design.js';

let connection;
const tabId = crypto.randomUUID();

function database() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('Armazenamento local indisponível neste navegador.'));
  connection ||= new Promise((resolve, reject) => {
    const request = indexedDB.open('library4-protected', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'id' });
    request.onerror = () => { connection = null; reject(request.error); };
    request.onblocked = () => { connection = null; reject(new Error('Feche a outra aba para atualizar o armazenamento local.')); };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); connection = null; };
      resolve(db);
    };
  });
  return connection;
}

export async function draftStore(operation, value) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', operation === 'list' ? 'readonly' : 'readwrite');
    const store = transaction.objectStore('drafts');
    let result;
    if (operation === 'put') store.put(value);
    else if (operation === 'remove') {
      const request = store.get(value.id);
      request.onsuccess = () => { if (request.result?.stamp === value.stamp) store.delete(value.id); };
    } else {
      const request = store.getAll();
      request.onsuccess = () => { result = request.result; };
    }
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error || new Error('Não foi possível gravar o rascunho local.'));
    transaction.onabort = () => reject(transaction.error || new Error('Gravação local interrompida.'));
  });
}

export function draftSnapshot(book) {
  return structuredClone({ v: 1, ...metadata(book), revision: book.revision,
    generation: book.generation, confirmed: book.confirmed, pages: book.pages, tasks: book.tasks,
    batch: book.batch || null, at: Date.now() });
}

export function protectBook(book, store = draftStore) {
  if (book.draftRunning) return book.draftRunning;
  const snapshot = draftSnapshot(book);
  book.draftRunning = (async () => {
    const record = { id: `${book.ownerId}:${book.id}:${tabId}`, ownerId: book.ownerId,
      bookId: book.id, stamp: crypto.randomUUID(), envelope: await seal(book.key, snapshot, context(book, 'draft')) };
    await store('put', record);
    book.localDraft = record;
    book.protectedGeneration = snapshot.generation;
    book.localError = null;
  })().catch(error => { book.localError = error; throw error; }).finally(() => { book.draftRunning = null; });
  return book.draftRunning;
}

export async function readDrafts(book, store = draftStore, onInvalid) {
  const records = (await store('list')).filter(record => record.ownerId === book.ownerId && record.bookId === book.id);
  const drafts = [];
  for (const record of records) {
    try {
      const value = await open(book.key, record.envelope, context(book, 'draft'));
      validateDraft(value);
      if (value.generation !== value.confirmed || value.batch) drafts.push({ record, value });
    } catch (error) {
      if (!onInvalid) throw error;
      onInvalid(new Error('Um rascunho local não pôde ser aberto e foi preservado. Os demais continuam disponíveis.', { cause: error }));
    }
  }
  return drafts.sort((a, b) => b.value.at - a.value.at);
}

function validateDraft(value) {
  if (value?.v !== 1 || !Number.isInteger(value.revision) || value.revision < 1
    || !Number.isInteger(value.generation) || !Number.isInteger(value.confirmed)
    || typeof value.title !== 'string' || typeof value.subject !== 'string' || !Array.isArray(value.tags)
    || !Array.isArray(value.pages) || !value.pages.length || value.pages.length > 500
    || !Array.isArray(value.tasks) || value.tasks.length > 100) throw new Error('Rascunho local inválido; o original foi preservado.');
  organization(value.organization);
  coverDesigns(value.covers);
  for (const page of value.pages) {
    if (typeof page.id !== 'string' || typeof page.content !== 'string' || typeof page.title !== 'string') throw new Error('Página do rascunho inválida.');
    pageCapacity(page.size, page.font);
  }
}

export function recoverDraft(book, draft) {
  validateDraft(draft.value);
  const remoteRevision = book.revision;
  Object.assign(book, structuredClone(draft.value));
  book.recoveredDraft = draft.record;
  book.protectedGeneration = -1;
  book.conflict = remoteRevision !== book.revision && !book.batch;
  book.error = book.conflict ? new Error('O servidor mudou desde este rascunho. Preserve suas notas em outro caderno.') : null;
  return book;
}

export async function clearDraft(book, store = draftStore) {
  if (book.draftRunning) await book.draftRunning;
  if (book.generation !== book.confirmed || book.batch) return;
  for (const record of [book.localDraft, book.recoveredDraft]) if (record) await store('remove', record);
  book.localDraft = null;
  book.recoveredDraft = null;
}
