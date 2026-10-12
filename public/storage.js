import { makeSecret, importKey, toBase64, fromBase64, seal, open } from './crypto.js';
import { pageCapacity } from './pagination.js';
import { preferences } from './notebook-preferences.js';
import { organization } from './collection.js';
import { coverDesigns } from './cover-design.js';

export async function api(path, body) {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || 'Não foi possível concluir a operação.');
    error.status = response.status;
    throw error;
  }
  return result;
}

export function context(book, kind, id = book.id, revision = '') {
  return `${kind}:${book.ownerId}:${book.id}:${id}:${revision}`;
}

export function pageData(page) {
  return { title: page.title, content: page.content, size: page.size, font: page.font };
}

function taskData(task) {
  return { title: task.title, done: task.done };
}

export function metadata(book) {
  return { title: book.title, subject: book.subject, tags: [...book.tags],
    preferences: preferences(book.preferences), position: book.position || null,
    organization: organization(book.organization), covers: coverDesigns(book.covers) };
}

function validatePage(page) {
  if (typeof page?.title !== 'string' || typeof page.content !== 'string' || page.title.length > 120) {
    throw new Error('Dados da página inválidos.');
  }
  pageCapacity(page.size, page.font);
  return page;
}

export async function createBook(book, user, keyset, rootKey, request = api) {
  book.ownerId = user.id;
  book.keysetId = keyset.id;
  const secret = makeSecret();
  book.key = await importKey(secret);
  const wrappedKey = await seal(rootKey, toBase64(secret), context(book, 'key', keyset.id));
  secret.fill(0);
  const first = book.pages[0];
  await request('/api/notebooks', {
    id: book.id, keysetId: keyset.id, wrappedKey,
    metadata: await seal(book.key, metadata(book), context(book, 'metadata', book.id, 1)),
    page: { id: first.id, envelope: await seal(book.key, pageData(first), context(book, 'page', first.id, 1)) },
  });
  book.revision = 1;
  book.generation = 0;
  book.confirmed = 0;
  first.revision = 1;
  first.saved = JSON.stringify(pageData(first));
  // ponytail: criação inicia uma página; cópias completas usam o mesmo salvamento atômico depois.
  if (book.pages.length > 1 || book.tasks.length) book.generation = 1;
  return book;
}

export async function loadBook(record, user, keyset, rootKey, request = api) {
  const book = { id: record.id, ownerId: user.id, keysetId: keyset.id };
  const secret = fromBase64(await open(rootKey, record.wrapped_key, context(book, 'key', keyset.id)));
  if (secret.length !== 32) throw new Error('Chave do caderno inválida.');
  book.key = await importKey(secret);
  secret.fill(0);
  const detail = await request(`/api/notebooks/${book.id}`);
  const meta = await open(book.key, detail.encrypted_metadata, context(book, 'metadata', book.id, detail.revision));
  if (typeof meta?.title !== 'string' || typeof meta.subject !== 'string' || !Array.isArray(meta.tags)
    || !meta.tags.every(tag => typeof tag === 'string')) throw new Error('Dados do caderno inválidos.');
  Object.assign(book, meta, { revision: Number(detail.revision), generation: 0, confirmed: 0, pages: [], tasks: [] });
  book.organization = organization(meta.organization);
  book.covers = coverDesigns(meta.covers);
  for (const row of detail.pages) {
    const value = validatePage(await open(book.key, row.encrypted_payload, context(book, 'page', row.id, row.revision)));
    book.pages.push({ ...value, id: row.id, revision: Number(row.revision), saved: JSON.stringify(value) });
  }
  if (!book.pages.length) throw new Error('Este caderno não tem páginas.');
  for (const row of detail.tasks) {
    const value = await open(book.key, row.encrypted_payload, context(book, 'task', row.id, row.revision));
    if (typeof value?.title !== 'string' || typeof value.done !== 'boolean') throw new Error('Meta inválida.');
    book.tasks.push({ ...value, id: row.id, revision: Number(row.revision), saved: JSON.stringify(value) });
  }
  return book;
}

async function prepareBatch(book) {
  const generation = book.generation;
  const revision = book.revision;
  const meta = metadata(book);
  const snapshots = [book.pages.map(page => ({ id: page.id, revision: page.revision || 0,
    value: pageData(page), saved: page.saved })), book.tasks.map(task => ({ id: task.id,
    revision: task.revision || 0, value: taskData(task), saved: task.saved }))];
  const body = { mutationId: crypto.randomUUID(), revision,
    metadata: await seal(book.key, meta, context(book, 'metadata', book.id, revision + 1)), pages: [], tasks: [] };
  for (const [index, kind] of ['page', 'task'].entries()) {
    for (const item of snapshots[index]) {
      item.serialized = JSON.stringify(item.value);
      const changed = item.serialized !== item.saved;
      body[index === 0 ? 'pages' : 'tasks'].push({ id: item.id, revision: item.revision,
        envelope: changed ? await seal(book.key, item.value, context(book, kind, item.id, item.revision + 1)) : null });
    }
  }
  return { body, snapshots, generation };
}

export async function saveBook(book, request = api, beforeSend) {
  if (book.running) return book.running;
  if (book.generation === book.confirmed && !book.batch) return;
  if (book.conflict) throw new Error('Preserve seu rascunho em uma cópia antes de recarregar.');
  book.running = (async () => {
    try {
      book.batch ||= await prepareBatch(book);
      if (beforeSend) await beforeSend();
      const batch = book.batch;
      const result = await request(`/api/notebooks/${book.id}/save`, batch.body);
      for (const [index, kind] of ['pages', 'tasks'].entries()) {
        for (const receipt of result[kind]) {
          const item = book[kind].find(value => value.id === receipt.id);
          const sent = batch.snapshots[index].find(value => value.id === receipt.id);
          if (item && sent) { item.revision = Number(receipt.revision); item.saved = sent.serialized; }
        }
      }
      book.revision = Number(result.revision);
      book.confirmed = batch.generation;
      book.batch = null;
      book.error = null;
      book.retryAt = 0;
    } catch (error) {
      book.conflict = error.status === 409;
      book.error = error;
      book.retryAt = Date.now() + 5000;
      throw error;
    } finally {
      book.running = null;
    }
  })();
  return book.running;
}

export async function versions(book, page, request = api) {
  const result = await request(`/api/pages/${page.id}/versions`);
  const values = [];
  for (const row of result.versions) values.push({
    revision: Number(row.revision), createdAt: row.created_at,
    value: validatePage(await open(book.key, row.encrypted_payload, context(book, 'page', page.id, row.revision))),
  });
  return values;
}
