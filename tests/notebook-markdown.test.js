import test from 'node:test';
import assert from 'node:assert/strict';
import { exportNotebookMarkdown, parseNotebookMarkdown, planNotebookImport, copyNotebook, MARKDOWN_BYTES } from '../public/notebook-markdown.js';
const makeBook = () => ({ id:crypto.randomUUID(), revision:3, title:'Estudos', subject:'Teste', tags:['ideias'], tasks:[{id:crypto.randomUUID(),title:'Ler',done:false}],
  pages:[{id:crypto.randomUUID(),title:'',content:'# Texto\n\n<!-- comentário -->\n\n~~~js\nconsole.log(1)\n~~~\n',size:'medium',font:16,date:'2026-10-22',revision:2,saved:'anterior'},
    {id:crypto.randomUUID(),title:'Outra',content:'Fim sem quebra',size:'small',font:18}], covers:{front:{color:'#000000'}} });
test('Markdown exporta sem mutar, preserva páginas, datas e texto exato na volta', () => {
  const book = makeBook(), before = structuredClone(book);
  const text = exportNotebookMarkdown(book), restored = parseNotebookMarkdown(text,'arquivo.md');
  assert.deepEqual(book,before);
  assert.equal(restored.id,book.id); assert.equal(restored.revision,3);
  for (let i=0;i<book.pages.length;i++) { assert.equal(restored.pages[i].content,book.pages[i].content); assert.equal(restored.pages[i].id,book.pages[i].id); }
  assert.equal(restored.pages[0].date,'2026-10-22');
  assert.equal(text.includes('saved'),false); assert.equal(text.includes('covers'),false);
  assert.equal(planNotebookImport(restored,book).changed,0);
});
test('Markdown genérico cria páginas e atualização manual conserva identidades e páginas ausentes', () => {
  const book=makeBook();
  const incoming=parseNotebookMarkdown('# Novo\r\n\r\nRevisado','notas.md');
  assert.equal(incoming.identified,false); assert.equal(incoming.title,'Novo');
  const plan=planNotebookImport(incoming,book);
  assert.equal(plan.pages[0].id,book.pages[0].id); assert.equal(plan.pages[0].revision,2);
  assert.equal(plan.pages[1],book.pages[1]); assert.equal(plan.retained,1); assert.equal(plan.changed,1);
  assert.equal(book.pages[0].content.startsWith('# Texto'),true);
  const copy=copyNotebook(book,' (antes da importação)');
  assert.notEqual(copy.id,book.id); assert.notEqual(copy.pages[0].id,book.pages[0].id);
  assert.deepEqual(copy.covers.front,book.covers.front); assert.notEqual(copy.covers,book.covers);
  assert.equal(copy.tasks[0].title,'Ler'); assert.notEqual(copy.tasks[0].id,book.tasks[0].id);
});
test('Markdown recusa cabeçalhos, páginas, datas, limites e versões inválidas', () => {
  const book=makeBook(), text=exportNotebookMarkdown(book);
  assert.throws(()=>parseNotebookMarkdown('x'.repeat(MARKDOWN_BYTES+1),'x.md'),/512 KB/);
  assert.throws(()=>parseNotebookMarkdown('bin\0','x.md'),/binários/);
  assert.throws(()=>parseNotebookMarkdown(text.replace('"version":1','"version":2'),'x.md'),/não suportada/);
  assert.throws(()=>parseNotebookMarkdown(text.replace('2026-10-22','2026-02-30'),'x.md'),/Data/);
  assert.throws(()=>parseNotebookMarkdown(text.replace(book.pages[1].id,book.pages[0].id),'x.md'),/repetida/);
  assert.throws(()=>parseNotebookMarkdown(text.replace('<!-- libr4ry: {','<!-- libr4ry: !{'),'x.md'),/danificada/);
  const incoming=parseNotebookMarkdown(text,'x.md');
  book.revision++;
  assert.equal(planNotebookImport(incoming,book).stale,true);
  assert.throws(()=>parseNotebookMarkdown('😀'.repeat(20000),'x.md'),/página excede/);
});
