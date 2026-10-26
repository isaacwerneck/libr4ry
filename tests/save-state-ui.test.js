import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('estado de salvamento atualiza mensagens somente quando o texto muda', async () => {
  const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  const start = source.indexOf('function renderSaveState() {');
  const end = source.indexOf('\nasync function persist(', start);
  assert.ok(start >= 0 && end > start);
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) {
      let text = '';
      elements.set(id, { writes: 0, dataset: {}, hidden: false,
        get textContent() { return text; },
        set textContent(value) { text = value; this.writes++; },
        querySelector: () => element(id + '-message'),
      });
    }
    return elements.get(id);
  };
  const book = { generation: 1, confirmed: 0 };
  const context = { currentBook: book, preview: false, $: element };
  vm.runInNewContext(source.slice(start, end), context);
  const texts = ['save-state', 'save-error-message', 'local-save-state'];
  const repeated = () => {
    for (const id of texts) element(id).writes = 0;
    context.renderSaveState();
    for (const id of texts) assert.equal(element(id).writes, 0, id + ' não mudou');
  };
  context.renderSaveState();
  assert.equal(element('save-state').textContent, 'Alterações pendentes');
  repeated();
  book.generation++;
  repeated();
  book.error = new Error('Envio indisponível');
  book.localError = new Error('Armazenamento indisponível');
  context.renderSaveState();
  assert.equal(element('save-state').textContent, 'Erro · alterações pendentes');
  assert.equal(element('save-error').hidden, false);
  assert.equal(element('save-error-message').textContent, book.error.message);
  assert.match(element('local-save-state').textContent, /Armazenamento indisponível/);
  repeated();
  book.error = null; book.localError = null; book.confirmed = book.generation;
  context.renderSaveState();
  assert.equal(element('save-state').textContent, 'Salvo');
  assert.equal(element('save-error').hidden, true);
  assert.equal(element('local-save-state').hidden, true);
  repeated();
});
