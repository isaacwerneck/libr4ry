import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const handlerStart = source.indexOf("$('history-button').addEventListener('click', async () => {");
const helperStart = source.indexOf('function viewingHistoryPage(');
const start = helperStart < 0 ? handlerStart : helperStart;
const end = source.indexOf("$('retry-save').addEventListener", handlerStart);
assert.ok(start >= 0 && end > start);
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture() {
  const elements = new Map();
  const el = id => {
    if (!elements.has(id)) elements.set(id, {
      hidden: false, disabled: false, children: [], handlers: new Map(), opens: 0,
      addEventListener(type, run) { this.handlers.set(type, run); },
      replaceChildren(...children) { this.children = children; },
      showModal() { this.opens++; this.open = true; },
      close() { this.open = false; },
    });
    return elements.get(id);
  };
  const page = { id: 'page', title: '', content: 'Nota inicial' };
  const book = { pages: [page], generation: 0, confirmed: 0 };
  const saved = [], queries = [], notices = [];
  const context = {
    $: el, currentBook: book, currentPage: page, bookFace: null, blankVerso: false,
    historySelection: null, api() {}, protectDraft() {}, renderSaveState() {},
    button: (label, style, run) => ({ label, run }), notify: text => notices.push(text),
    saveBook: async value => { const generation = value.generation; const request = deferred(); saved.push({ value, request }); await request.promise; value.confirmed = generation; },
    versions: () => { const request = deferred(); queries.push(request); return request.promise; },
    changed: value => { value.generation++; }, openBook() {}, selectPage() {}, updateContent() {},
  };
  vm.runInNewContext(source.slice(start, end), context);
  const click = id => el(id).handlers.get('click')();
  return { el, context, page, book, saved, queries, notices, click };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const rows = [{ revision: 1, createdAt: '2026-10-22T12:00:00Z', value: { title: '', content: 'Versão anterior' } }];

for (const during of ['save', 'versions']) for (const destination of ['page', 'book', 'portal', 'cover', 'blank', 'visual-error']) {
  test(`histórico não abre em contexto antigo: ${destination} durante ${during}`, async () => {
    const f = fixture();
    const loading = f.click('history-button');
    if (during === 'versions') { f.saved[0].request.resolve(); await settle(); }
    if (destination === 'page') f.context.currentPage = { id: 'another-page' };
    if (destination === 'book') f.context.currentBook = { id: 'another-book' };
    if (destination === 'portal') f.el('notebook-view').hidden = true;
    if (destination === 'cover') f.context.bookFace = 'front';
    if (destination === 'blank') f.context.blankVerso = true;
    if (destination === 'visual-error') f.book.visualError = 'Edição pendente';
    if (during === 'save') f.saved[0].request.resolve();
    else f.queries[0].resolve(rows);
    await settle();
    if (f.queries[0] && during === 'save') f.queries[0].resolve(rows);
    await loading;
    assert.equal(f.el('history-dialog').opens, 0);
    assert.equal(f.el('history-button').disabled, false);
    if (during === 'save') assert.equal(f.queries.length, 0, 'Não consulta versões após sair da folha');
  });
}

for (const during of ['save', 'versions', 'autosave']) test(`histórico confirma edição durante ${during} antes de permitir restauração`, async () => {
  const f = fixture();
  const loading = f.click('history-button');
  assert.equal(f.el('history-button').textContent, 'Carregando…');
  if (during !== 'save') { f.saved[0].request.resolve(); await settle(); }
  f.page.content = 'Escrito durante consulta'; f.book.generation++;
  if (during === 'autosave') f.book.confirmed = f.book.generation;
  if (during === 'save') { f.saved[0].request.resolve(); await settle(); }
  f.queries[0].resolve(rows); await settle();
  assert.equal(f.el('history-dialog').opens, 0);
  assert.equal(f.saved.length, 2);
  assert.equal(f.saved[1].value.pages[0].content, 'Escrito durante consulta');
  f.saved[1].request.resolve(); await settle();
  f.queries[1].resolve(rows); await loading;
  assert.equal(f.book.confirmed, f.book.generation);
  assert.equal(f.el('history-dialog').opens, 1);
  assert.equal(f.el('history-heading').textContent, 'Versões da página 1');
  assert.equal(f.el('history-button').textContent, 'Versões');
  f.el('history-list').children[0].run();
  assert.equal(f.el('restore-version').disabled, false);
  f.click('restore-version');
  assert.equal(f.page.content, 'Versão anterior');
  assert.equal(f.book.generation, f.book.confirmed + 1);
});

for (const during of ['save', 'versions']) test(`falha durante ${during} libera o botão e preserva a escrita`, async () => {
  const f = fixture();
  const loading = f.click('history-button');
  if (during === 'versions') { f.saved[0].request.resolve(); await settle(); f.queries[0].reject(new Error('Sem conexão')); }
  else f.saved[0].request.reject(new Error('Sem conexão'));
  await loading;
  assert.deepEqual(f.notices, ['Sem conexão']);
  assert.equal(f.el('history-button').disabled, false);
  assert.equal(f.el('history-button').textContent, 'Versões');
  assert.equal(f.page.content, 'Nota inicial');
});

test('restauração de diálogo antigo não modifica página após navegação', async () => {
  const f = fixture();
  const loading = f.click('history-button');
  f.saved[0].request.resolve(); await settle();
  f.queries[0].resolve(rows); await loading;
  f.el('history-list').children[0].run();
  f.context.currentPage = { id: 'another-page' };
  f.click('restore-version');
  assert.equal(f.page.content, 'Nota inicial');
  assert.equal(f.el('history-dialog').open, false);
  assert.equal(f.notices.length, 1);
});
