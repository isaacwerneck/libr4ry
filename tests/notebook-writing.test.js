import test from 'node:test';
import assert from 'node:assert/strict';
import markdownit from 'markdown-it';
import { installStudyStyles, styledSelection, styleRanges, plainStudyText, continueLine, findNotebookPages, validInk, rgbInk, writingShortcut, applyStudyColors } from '../public/notebook-writing.js';
import { planPageEdit, countWords, protectedBlocks } from '../public/pagination.js';
import { preferences } from '../public/notebook-preferences.js';
import { createStudyReminder } from '../public/notebook-reminder.js';

test('estilo de trecho é reversível, escapa HTML e não aceita CSS arbitrário', () => {
  const md = installStudyStyles(markdownit({ html: false }));
  const change = styledSelection('Uma ideia', 4, 9, 'serif', 'rust', '20');
  assert.equal(change.text, '{{serif;rust;20|ideia}}');
  assert.equal(md.renderInline(change.text), '<span class="study-font-serif study-ink-rust study-size-20">ideia</span>');
  assert.equal(styledSelection(change.text, 0, change.text.length, 'hand', 'blue', '24').text, '{{hand;blue;24|ideia}}');
  assert.equal(styledSelection(change.text, 0, change.text.length, '', '', '', true).text, 'ideia');
  assert.equal(plainStudyText(change.text), 'ideia');
  assert.equal(countWords(change.text), 1);
  assert.throws(() => styledSelection('texto', 0, 5, 'url(evil)', 'blue', '24'), /inválido/);
  assert.throws(() => styledSelection('a\nb', 0, 3, 'serif', 'blue', '24'), /linha/);
  assert.throws(() => styledSelection('', 0, 0, 'serif', 'blue', '24'), /Selecione/);
  const hostile = '{{sans;ink;16|<img src=x onerror=alert(1)>}}';
  assert.ok(md.renderInline(hostile).includes('&lt;img'));
  assert.equal(md.renderInline(hostile).includes('<img'), false);
  assert.equal(md.renderInline('{{sans;red;999|texto}}').includes('<span'), false);
  assert.ok(md.renderInline('`' + change.text + '`').includes('<code>'));
  assert.equal(md.renderInline('`' + change.text + '`').includes('study-font'), false);
  assert.ok(md.renderInline('**' + change.text + '**').includes('<strong><span'));
});

test('RGB valida limites e cores personalizadas preservam conteúdo sem permitir CSS livre', () => {
  assert.equal(rgbInk('0', '128', '255'), '#0080ff');
  for (const invalid of [-1, 256, 1.5, '', 'url(evil)']) assert.throws(() => rgbInk(invalid, 0, 0), /RGB/);
  assert.equal(validInk('#aB12cd'), true);
  assert.equal(validInk('#fff'), false);
  assert.equal(validInk('#ffffff;background:url(evil)'), false);
  const md = installStudyStyles(markdownit({ html: false }));
  const source = '{{l4;serif;#0080ff;20}}**ideia**{{/l4}}';
  assert.match(md.renderInline(source), /data-study-ink="#0080ff".*<strong>ideia<\/strong>/);
  assert.equal(plainStudyText(source), '**ideia**');
  assert.deepEqual(styleRanges(source), [[0, source.length]]);
  assert.equal(styledSelection('ideia', 0, 5, 'sans', '#0080ff', 16).text, '{{sans;#0080ff;16|ideia}}');
  assert.equal(md.renderInline('{{l4;sans;#fff;16}}texto{{/l4}}').includes('<span'), false);
  assert.equal(md.renderInline('{{l4;sans;#123456;background:red;16}}texto{{/l4}}').includes('style='), false);
});

test('tinta personalizada usa variável validada sem CSS inline e sem mutações repetidas no editor', () => {
  const values = ['#9a3424', '#ffffff;background:url(evil)', '#fff', null];
  let writes = 0;
  const elements = values.map(value => {
    const properties = new Map();
    return { getAttribute: () => value, style: {
      getPropertyValue: name => properties.get(name) || '',
      setProperty(name, color) { writes++; properties.set(name, color); },
    } };
  });
  const root = { querySelectorAll: () => elements };
  applyStudyColors(root);
  assert.equal(elements[0].style.getPropertyValue('--study-ink'), '#9a3424');
  assert.equal(writes, 1);
  applyStudyColors(root);
  assert.equal(writes, 1);
  assert.equal(installStudyStyles(markdownit()).render('{{sans;#9a3424;16|cor}}').includes('style='), false);
});

test('atalhos respeitam seleção, composição, AltGraph e combinações reservadas', () => {
  const key = (value, modifiers = {}, selected = false) => writingShortcut({ key: value, ...modifiers }, selected);
  assert.equal(key('b', { ctrlKey: true }), 'bold');
  assert.equal(key('i', { metaKey: true }), 'italic');
  assert.equal(key('z', { ctrlKey: true, shiftKey: true }), 'redo');
  assert.equal(key('2', { ctrlKey: true, altKey: true }), 'h2');
  assert.equal(key('2', { altKey: true }), 'h2');
  assert.equal(key('l', { altKey: true }), 'list');
  assert.equal(key('1', { ctrlKey: true }), null);
  assert.equal(key('*', { ctrlKey: true, shiftKey: true }), 'list');
  assert.equal(key('C', { shiftKey: true }, true), 'colors');
  assert.equal(key('C', { shiftKey: true }), null);
  assert.equal(key('c', { ctrlKey: true }), null);
  assert.equal(key('I', { ctrlKey: true, shiftKey: true }), null);
  assert.equal(key('b', { ctrlKey: true, isComposing: true }), null);
  assert.equal(key('b', { ctrlKey: true, repeat: true }), null);
  assert.equal(key('1', { ctrlKey: true, altKey: true, getModifierState: () => true }), null);
});

test('paginação mantém marcação de trecho intacta e busca usa apenas conteúdo visível', () => {
  const styled = '{{serif;rust;20|' + 'conhecimento '.repeat(180) + '}}';
  const md = installStudyStyles(markdownit({ html: false }));
  const source = 'Introdução\n'.repeat(18) + styled + '\nConclusão';
  const ranges = [...styleRanges(source), ...protectedBlocks(source, md.parse(source, {}))];
  const chunks = planPageEdit(source, 'small', 16, 1, ranges).chunks;
  assert.equal(chunks.join(''), source);
  assert.ok(chunks.some(chunk => chunk.includes(styled)));
  const pages = [{ title: 'Design', content: styled }, { title: 'Código', content: 'JavaScript' }];
  assert.deepEqual(findNotebookPages(pages, 'CONHECIMENTO'), [pages[0]]);
  assert.deepEqual(findNotebookPages(pages, 'serif'), []);
  assert.deepEqual(findNotebookPages(pages, 'Código'), [pages[1]]);
});

test('estilos visuais preservam Markdown aninhado, chaves e segurança sem mudar estilos antigos', () => {
  const md = installStudyStyles(markdownit({ html: false }));
  const source = '{{l4;serif;blue;20}}**ideia** e `const x = { valor: 10 };` 100%{{/l4}}';
  const html = md.renderInline(source);
  assert.match(html, /<strong>ideia<\/strong>/);
  assert.match(html, /<code>const x = \{ valor: 10 \};<\/code>/);
  assert.match(html, /study-ink-blue/);
  assert.equal(plainStudyText(source), '**ideia** e `const x = { valor: 10 };` 100%');
  assert.deepEqual(styleRanges('a' + source), [[1, source.length + 1]]);
  assert.equal(md.renderInline('{{hand;rust;24|**literal**}}').includes('<strong>'), false);
  assert.equal(md.renderInline('{{l4;sans;ink;16}}<img src=x onerror=alert(1)>{{/l4}}').includes('<img'), false);
  assert.equal(md.renderInline('{{l4;sans;red;16}}texto{{/l4}}').includes('<span'), false);
  assert.equal(md.renderInline('`' + source + '`').includes('study-font'), false);
});

test('Enter continua listas, tarefas, números e citações; item vazio encerra e código mantém indentação', () => {
  for (const [source, expected] of [['- ideia', '\n- '], ['- [x] estudar', '\n- [ ] '], ['  * item', '\n  * '],
    ['9. item', '\n10. '], ['2) item', '\n3) '], ['> trecho', '\n> ']]) {
    assert.equal(continueLine(source, source.length, source.length).text, expected);
  }
  assert.deepEqual(continueLine('uma lista\n- ', 12, 12), { start: 10, end: 12, text: '', selection: [10, 10] });
  assert.equal(continueLine('- ideia', 2, 2), null);
  assert.equal(continueLine('- ideia', 2, 4), null);
  const code = '```js\n  - não é lista';
  assert.equal(continueLine(code, code.length, code.length).text, '\n  ');
  const closed = '```js\n~~~\n```\n- uma lista';
  assert.equal(continueLine(closed, closed.length, closed.length).text, '\n- ');
});

test('papel e ambiente têm defaults compatíveis e opções restritas', () => {
  assert.equal(preferences().ruling, 'lined');
  assert.equal(preferences({ desk: '<script>', light: 'other', ruling: 'texture' }).desk, 'wood');
  assert.equal(preferences({ light: 'night', ruling: 'dotted', desk: 'linen' }).light, 'night');
  assert.equal(preferences({ ruling: 'grid' }).ruling, 'grid');
  assert.equal(preferences({ binding: 'spiral', reminder: true, font: 'hand' }).binding, 'spiral');
  assert.equal(preferences().reminder, false);
  assert.equal(preferences({ coverColor: '#aB12cd', finish: 'cloth' }).coverColor, '#aB12cd');
  assert.equal(preferences({ coverColor: 'url(evil)', finish: 'other' }).coverColor, '');
  assert.equal(preferences({ finish: 'other' }).finish, 'leather');
});

test('lembrete conta leitura visível, pausa fora do caderno e permanece até dispensar', () => {
  let now = 0;
  const reminder = createStudyReminder(() => now, 45000);
  assert.equal(reminder.update(true, true), false);
  now = 30000; assert.equal(reminder.update(false, true), false);
  now = 90000; assert.equal(reminder.update(true, true), false);
  now = 105000; assert.equal(reminder.update(true, true), true);
  now = 115000; assert.equal(reminder.update(true, true), true);
  reminder.dismiss(); assert.equal(reminder.update(true, true), false);
  now = 165000; assert.equal(reminder.update(false, true), false);
  assert.equal(reminder.update(true, true), true);
  assert.equal(reminder.update(true, false), false);
  assert.equal(reminder.update(true, true), false);
});
