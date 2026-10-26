import test from 'node:test';
import assert from 'node:assert/strict';
import markdownit from 'markdown-it';
import { protectedBlocks, planPageEdit } from '../public/pagination.js';
import { preferences, recentPosition } from '../public/notebook-preferences.js';
import { rememberEdit, restoreEdit, formatSelection } from '../public/edit-history.js';
import { protectBook, readDrafts, recoverDraft, clearDraft } from '../public/drafts.js';
import { importKey, makeSecret, open } from '../public/crypto.js';
import { context, saveBook } from '../public/storage.js';
import { clampZoom, setupNotebookViewport, positionNotebook, centerNotebookRect, fitNotebookHeight, matchNotebookCover, revealNotebookRect } from '../public/notebook-viewport.js';

function book() {
  return { id: crypto.randomUUID(), ownerId: crypto.randomUUID(), title: 'Título privado', subject: '', tags: [],
    revision: 1, generation: 1, confirmed: 0, preferences: preferences(), tasks: [],
    pages: [{ id: crypto.randomUUID(), title: '', content: 'Anotação privada', size: 'medium', font: 16, revision: 1 }] };
}

test('paginação mantém listas, código e citações íntegros, inclusive blocos maiores que a folha', () => {
  const markdown = markdownit();
  for (const block of ['```js\n' + 'const valor = 1;\n'.repeat(45) + '```\n', '- item\n'.repeat(45), '> citação\n'.repeat(45)]) {
    const text = 'introdução\n'.repeat(20) + '\n' + block + '\nconclusão';
    const ranges = protectedBlocks(text, markdown.parse(text, {}));
    const chunks = planPageEdit(text, 'small', 16, 1, ranges).chunks;
    assert.equal(chunks.join(''), text);
    assert.ok(chunks.some(chunk => chunk.includes(block)));
    assert.ok(chunks.every(chunk => !chunk.includes('```') || (chunk.match(/```/g) || []).length === 2));
  }
});

test('undo e redo restauram texto após divisão sem apagar identidades ou revisões salvas', () => {
  const value = book();
  const page = value.pages[0];
  rememberEdit(value, page.id, 4, false, 1000);
  page.content = 'Primeira parte';
  value.pages.push({ ...page, id: crypto.randomUUID(), content: 'Continuação' });
  page.revision = 2;
  restoreEdit(value, page.id, 5);
  assert.equal(page.content, 'Anotação privada');
  assert.equal(page.revision, 2);
  assert.equal(value.pages.length, 2);
  assert.equal(value.pages[1].content, '');
  restoreEdit(value, page.id, 4, true);
  assert.equal(value.pages[1].content, 'Continuação');
  const change = formatSelection('Olá mundo', 4, 9, 'bold');
  assert.equal('Olá mundo'.slice(0, change.start) + change.text + 'Olá mundo'.slice(change.end), 'Olá **mundo**');
  assert.deepEqual(change.selection, [6, 11]);
  assert.equal(formatSelection('## Título', 3, 9, 'h1').text, '# Título');
});

test('preferências validam opções e retomada respeita 24 horas e página existente', () => {
  assert.equal(preferences({ paper: '<script>', zoom: 100 }).paper, 'cream');
  assert.equal(preferences({ zoom: 100 }).zoom, 8);
  assert.equal(preferences({ zoom: .1 }).zoom, .1);
  assert.equal(clampZoom(.01), .1);
  assert.equal(clampZoom(4), 4);
  assert.equal(clampZoom(Infinity), 1);
  const value = book();
  value.position = { pageId: value.pages[0].id, at: 1000, caret: 999, fraction: 2 };
  assert.equal(recentPosition(value, 1001).caret, value.pages[0].content.length);
  assert.equal(recentPosition(value, 1001).fraction, 1);
  assert.equal(recentPosition(value, 86401001), null);
  value.position.pageId = 'inexistente';
  assert.equal(recentPosition(value, 1001), null);
});

test('altura comum diminui após reduzir a folha e conserva espaço para conteúdo maior', () => {
  const papers = [1200, 200].map(natural => ({
    natural, style: { height: '1800px' },
    get scrollHeight() { return Math.max(this.natural, parseFloat(this.style.height) || 0); }
  }));
  assert.equal(fitNotebookHeight(papers, 1576), 1576);
  assert.equal(fitNotebookHeight(papers, 1240), 1240);
  papers[0].natural = 850;
  assert.equal(fitNotebookHeight(papers, 904), 904);
  assert.ok(papers.every(paper => paper.style.height === '904px'));
  papers[0].natural = 1400;
  assert.equal(fitNotebookHeight(papers, 904), 1400);
  assert.ok(papers.every(paper => paper.style.height === '1400px'));
});

test('capa acompanha folha em zoom/deslocamento e restaura visibilidade após medir', () => {
  const properties = {};
  const cover = { style: { setProperty(name, value) { properties[name] = value; } } };
  const spread = { hidden: true, style: { zoom: 2 }, getBoundingClientRect: () => ({ left: -100 }) };
  const paper = { getBoundingClientRect() {
    assert.equal(spread.hidden, false);
    return { left: 1220, width: 1320, height: 2508 };
  } };
  matchNotebookCover(spread, paper, cover);
  assert.equal(cover.style.width, '660px');
  assert.equal(cover.style.height, '1254px');
  assert.equal(properties['--cover-left'], '660px');
  assert.equal(spread.hidden, true);
  spread.hidden = false; spread.style.zoom = .1;
  paper.getBoundingClientRect = () => ({ left: -100, width: 84, height: 125.4 });
  matchNotebookCover(spread, paper, cover);
  assert.equal(cover.style.width, '840px');
  assert.equal(cover.style.height, '1254px');
  assert.equal(properties['--cover-left'], '0px');
  assert.equal(spread.hidden, false);
  spread.hidden = true;
  paper.getBoundingClientRect = () => { throw new Error('Medida indisponível'); };
  assert.throws(() => matchNotebookCover(spread, paper, cover), /Medida indisponível/);
  assert.equal(spread.hidden, true);
});

test('reenquadramento centraliza capa e preserva o início do texto no celular sem acumular deslocamento', () => {
  const viewport = { dataset: {}, style: { setProperty() {} } };
  const bounds = { left: 24, right: 366, top: 150 };
  centerNotebookRect(viewport, { left: 420, top: 90, width: 300 }, bounds);
  assert.equal(Number(viewport.dataset.offset), -375);
  assert.equal(Number(viewport.dataset.vertical), 60);
  centerNotebookRect(viewport, { left: 45, top: 150, width: 300 }, bounds);
  assert.equal(Number(viewport.dataset.offset), -375);
  centerNotebookRect(viewport, { left: 45, top: 150, width: 714 }, bounds, 54.4);
  assert.equal(Number(viewport.dataset.offset), -450.4);
  assert.ok(Math.abs(45 - 75.4 + 54.4 - bounds.left) < 1e-9);
});

test('cursor permanece visível movendo apenas o caderno quando ultrapassa os limites', () => {
  const viewport = { dataset: {}, style: { setProperty() {} } };
  const bounds = { left: 200, right: 900, top: 100, bottom: 600 };
  revealNotebookRect(viewport, { left: 100, right: 101, top: 700, bottom: 720 }, bounds);
  assert.equal(viewport.dataset.offset, '100');
  assert.equal(viewport.dataset.vertical, '-120');
  revealNotebookRect(viewport, { left: 300, right: 301, top: 200, bottom: 220 }, bounds);
  assert.equal(viewport.dataset.vertical, '-120');
  revealNotebookRect(viewport, { left: 950, right: 951, top: 50, bottom: 70 }, bounds);
  assert.equal(viewport.dataset.offset, '49');
  assert.equal(viewport.dataset.vertical, '-70');
});

test('arraste move enquadramento sem bloquear clique direito simples ou zoom fora dos limites', () => {
  const viewport = new EventTarget();
  viewport.scrollLeft = 0; viewport.clientWidth = 100;
  viewport.dataset = { offset: '0' }; viewport.style = { setProperty() {} };
  viewport.setPointerCapture = () => {};
  const scrolls = [];
  globalThis.window = { scrollBy: (x, y) => scrolls.push([x, y]) };
  let interrupted = 0;
  const zoom = setupNotebookViewport(viewport, { style: {} }, () => interrupted++);
  const dispatch = (type, properties = {}) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, properties); viewport.dispatchEvent(event); return event;
  };
  dispatch('pointerdown', { button: 2, pointerId: 1, clientX: 100, clientY: 100 });
  dispatch('pointerup');
  assert.equal(dispatch('contextmenu').defaultPrevented, false);
  dispatch('pointerdown', { button: 2, pointerId: 1, clientX: 100, clientY: 100 });
  dispatch('pointermove', { buttons: 2, pointerId: 1, clientX: 80, clientY: 70 });
  dispatch('pointerup');
  assert.equal(Number(viewport.dataset.offset), -20);
  assert.equal(viewport.scrollLeft, 0);
  assert.equal(Number(viewport.dataset.vertical), -30);
  assert.deepEqual(scrolls, []);
  assert.equal(dispatch('contextmenu').defaultPrevented, true);
  assert.equal(dispatch('contextmenu').defaultPrevented, false);
  assert.equal(zoom(9), 8);
  assert.equal(interrupted, 2);
  dispatch('keydown', { key: 'ArrowDown' });
  assert.deepEqual(scrolls, []);
  assert.equal(Number(viewport.dataset.vertical), -110);
  assert.equal(interrupted, 3);
  viewport.dataset.pan = 'true';
  const beforeLeftDrag = Number(viewport.dataset.offset);
  assert.equal(dispatch('pointerdown', { button: 0, pointerType: 'mouse', pointerId: 2, clientX: 100, clientY: 100 }).defaultPrevented, true);
  dispatch('pointermove', { buttons: 1, pointerId: 2, clientX: 70, clientY: 90 });
  dispatch('pointerup');
  assert.equal(Number(viewport.dataset.offset), beforeLeftDrag - 30);
  assert.equal(Number(viewport.dataset.vertical), -120);
  assert.equal(dispatch('contextmenu').defaultPrevented, false);
  dispatch('pointerdown', { button: 0, pointerType: 'mouse', pointerId: 3, clientX: 100, clientY: 100 });
  viewport.dataset.pan = 'false';
  const beforeCancelledDrag = Number(viewport.dataset.offset);
  dispatch('pointermove', { buttons: 1, pointerId: 3, clientX: 50, clientY: 50 });
  assert.equal(Number(viewport.dataset.offset), beforeCancelledDrag);
  positionNotebook(viewport); assert.equal(Number(viewport.dataset.offset), 0);
  assert.equal(Number(viewport.dataset.vertical), 0);
  assert.equal(dispatch('pointerdown', { button: 0, pointerType: 'touch' }).defaultPrevented, false);
  viewport.dataset.pan = 'true';
  dispatch('pointerdown', { button: 0, pointerType: 'touch', pointerId: 4, clientX: 100, clientY: 100 });
  dispatch('pointermove', { buttons: 1, pointerId: 4, clientX: 80, clientY: 60 });
  dispatch('pointerup');
  assert.equal(Number(viewport.dataset.offset), -20);
  assert.equal(Number(viewport.dataset.vertical), -40);
  delete globalThis.window;
});

test('Ctrl controla zoom/arraste, a roda normal não rola a cena e soltar o modificador preserva escrita', () => {
  const viewport = new EventTarget(); viewport.dataset = { pan: 'false' }; viewport.scrollLeft = 0; viewport.clientWidth = 100;
  viewport.style = { setProperty() {} };
  viewport.setPointerCapture = () => {};
  globalThis.window = { scrollBy() {} };
  const spread = { style: {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1680, height: 1200 }) }; let selected;
  const scene = new EventTarget();
  setupNotebookViewport(viewport, spread, () => {}, value => { selected = value; }, scene);
  const dispatch = (type, properties) => {
    const event = new Event(type, { cancelable: true }); Object.assign(event, properties); scene.dispatchEvent(event); return event;
  };
  try {
    assert.equal(dispatch('wheel', { deltaY: -100, ctrlKey: false }).defaultPrevented, true);
    assert.equal(dispatch('wheel', { deltaY: -100, ctrlKey: true }).defaultPrevented, true);
    assert.equal(selected, 1.1);
    dispatch('pointerdown', { button: 0, pointerType: 'mouse', ctrlKey: true, pointerId: 1, clientX: 100, clientY: 100 });
    const before = Number(viewport.dataset.offset) || 0;
    dispatch('pointermove', { buttons: 1, ctrlKey: true, pointerId: 1, clientX: 70, clientY: 100 });
    assert.equal(Number(viewport.dataset.offset), before - 30);
    dispatch('pointermove', { buttons: 1, ctrlKey: false, pointerId: 1, clientX: 40, clientY: 100 });
    assert.equal(Number(viewport.dataset.offset), before - 30);
    dispatch('wheel', { deltaY: -100, ctrlKey: true });
    assert.equal(Number(viewport.dataset.offset), before - 30);
    assert.equal(dispatch('pointerdown', { button: 0, pointerType: 'mouse', ctrlKey: false }).defaultPrevented, false);
    dispatch('pointerdown', { button: 0, pointerType: 'mouse', ctrlKey: true, pointerId: 2, clientX: 100, clientY: 100 });
    dispatch('pointermove', { buttons: 1, ctrlKey: true, pointerId: 2, clientX: 120, clientY: 130 });
    assert.equal(Number(viewport.dataset.vertical), 30);
    const stoppedAt = Number(viewport.dataset.offset);
    dispatch('keydown', { key: 'Escape' });
    dispatch('pointermove', { buttons: 1, ctrlKey: true, pointerId: 2, clientX: 160, clientY: 170 });
    assert.equal(Number(viewport.dataset.offset), stoppedAt);
    viewport.closest = () => ({});
    assert.equal(dispatch('wheel', { deltaY: -100, ctrlKey: true }).defaultPrevented, false);
    assert.equal(dispatch('pointerdown', { button: 0, pointerType: 'mouse', ctrlKey: true }).defaultPrevented, false);
  } finally { delete globalThis.window; }
});

test('rascunho só confirma proteção após gravação, exige chave/contexto e preserva conflito', async () => {
  const value = book();
  value.key = await importKey(makeSecret());
  const records = new Map();
  let release;
  const store = async (operation, record) => {
    if (operation === 'put') { await new Promise(resolve => { release = resolve; }); records.set(record.id, record); }
    if (operation === 'list') return [...records.values()];
    if (operation === 'remove' && records.get(record.id)?.stamp === record.stamp) records.delete(record.id);
  };
  const protecting = protectBook(value, store);
  while (!release) await new Promise(resolve => setTimeout(resolve, 1));
  assert.equal(value.protectedGeneration, undefined);
  value.pages[0].content = 'Edição durante gravação'; value.generation++;
  release(); await protecting;
  assert.equal(value.protectedGeneration, 1);
  assert.equal(JSON.stringify([...records.values()]).includes('Anotação privada'), false);
  const drafts = await readDrafts(value, store);
  assert.equal(drafts[0].value.pages[0].content, 'Anotação privada');
  await assert.rejects(readDrafts({ ...value, key: await importKey(makeSecret()) }, store));
  await assert.rejects(open(value.key, drafts[0].record.envelope, 'outro contexto'));
  const remote = { ...value, revision: 3 };
  recoverDraft(remote, drafts[0]);
  assert.equal(remote.conflict, true);
  assert.equal(remote.pages[0].content, 'Anotação privada');
  await clearDraft(remote, store);
  assert.equal(records.size, 1);
  remote.confirmed = remote.generation;
  await clearDraft(remote, store);
  assert.equal(records.size, 0);
  await assert.rejects(protectBook(value, async () => { throw new Error('Quota cheia'); }));
  assert.equal(value.localError.message, 'Quota cheia');
});

test('limpeza de rascunho salvo preserva a referência de uma edição protegida durante a remoção', async () => {
  const value = book(); value.key = await importKey(makeSecret());
  const records = new Map();
  let releaseRemoval;
  let started;
  const removalStarted = new Promise(resolve => { started = resolve; });
  const removalPending = new Promise(resolve => { releaseRemoval = resolve; });
  let delayRemoval = true;
  const store = async (operation, record) => {
    if (operation === 'put') records.set(record.id, record);
    if (operation === 'list') return [...records.values()];
    if (operation === 'remove') {
      if (delayRemoval) { delayRemoval = false; started(); await removalPending; }
      if (records.get(record.id)?.stamp === record.stamp) records.delete(record.id);
    }
  };
  await protectBook(value, store);
  value.confirmed = value.generation;
  const clearing = clearDraft(value, store);
  await removalStarted;
  value.pages[0].content = 'Nova edição enquanto o rascunho anterior é limpo';
  value.generation++;
  await protectBook(value, store);
  const latest = value.localDraft;
  releaseRemoval();
  await clearing;
  assert.equal(value.localDraft, latest, 'Limpeza anterior não pode perder a referência do novo rascunho');
  assert.equal(records.size, 1);
  assert.equal((await readDrafts(value, store))[0].value.pages[0].content, value.pages[0].content);
  value.confirmed = value.generation;
  await clearDraft(value, store);
  assert.equal(records.size, 0, 'Após confirmar a edição nova, sua proteção local também deve ser limpa');
  assert.equal(value.localDraft, null);
});

test('rascunho recupera lote idempotente após timeout com edição posterior', async () => {
  const value = book(); value.key = await importKey(makeSecret());
  await assert.rejects(saveBook(value, async () => {
    value.pages[0].content = 'Digitado depois'; value.generation++;
    throw new Error('Timeout');
  }));
  let record;
  await protectBook(value, async (operation, entry) => { if (operation === 'put') record = entry; });
  const drafts = await readDrafts(value, async () => [record]);
  const recovered = { ...book(), id: value.id, ownerId: value.ownerId, key: value.key, revision: 2 };
  recoverDraft(recovered, drafts[0]);
  assert.equal(recovered.conflict, false);
  await saveBook(recovered, async (path, body) => {
    assert.equal(body.mutationId, value.batch.body.mutationId);
    assert.equal((await open(value.key, body.pages[0].envelope, context(value, 'page', value.pages[0].id, 2))).content, 'Anotação privada');
    return { revision: 2, pages: [{ id: value.pages[0].id, revision: 2 }], tasks: [] };
  });
  assert.equal(recovered.pages[0].content, 'Digitado depois');
  assert.equal(recovered.confirmed, 1);
  assert.equal(recovered.generation, 2);
});

test('um rascunho corrompido não impede recuperar os válidos nem remove registros', async () => {
  const value = book(); value.key = await importKey(makeSecret());
  value.organization = { shelves: ['Design'], favorite: true };
  let record;
  await protectBook(value, async (operation, entry) => { if (operation === 'put') record = entry; });
  const invalid = { ...record, id: record.id + ':invalid', envelope: { ...record.envelope, iv: 'invalid' } };
  const records = [invalid, record];
  const warnings = [];
  const drafts = await readDrafts(value, async () => records, error => warnings.push(error));
  assert.equal(warnings.length, 1);
  assert.match(warnings[0].message, /preservado/);
  assert.equal(drafts.length, 1);
  assert.deepEqual(drafts[0].value.organization, value.organization);
  assert.equal(records.length, 2);
});
