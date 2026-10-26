import { pageData, pageDate, metadata } from './storage.js';
import { pageCapacity } from './pagination.js';

export const MARKDOWN_BYTES = 512 * 1024;
const encoder = new TextEncoder();
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
function check(ok, message) { if (!ok) throw new Error(message); }
function json(value) { return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e'); }
function page(value) {
  check(value && typeof value.title === 'string' && value.title.length <= 120 && typeof value.content === 'string', 'Página Markdown inválida.');
  pageCapacity(value.size, value.font); pageDate(value.date || '');
  check(encoder.encode(JSON.stringify(pageData(value))).length <= 60000, 'Uma página excede o limite de importação. Divida seu texto em mais páginas.');
  return { title: value.title, content: value.content, size: value.size, font: value.font, date: value.date || '' };
}
export function exportNotebookMarkdown(book) {
  const token = crypto.randomUUID();
  const header = { version: 1, id: book.id, revision: book.revision || 0, token, title: book.title, subject: book.subject, tags: book.tags };
  const text = '<!-- libr4ry: ' + json(header) + ' -->\n' + book.pages.map(item =>
    '<!-- libr4ry-page:' + token + ' ' + json({ id: item.id, ...pageData(item), content: undefined }) + ' -->\n' + item.content + '\n').join('');
  check(encoder.encode(text).length <= MARKDOWN_BYTES, 'O Markdown excede 512 KB. Divida o caderno antes de exportar neste formato.');
  return text;
}
export function parseNotebookMarkdown(text, filename, split = value => [value]) {
  check(typeof text === 'string' && encoder.encode(text).length <= MARKDOWN_BYTES, 'Escolha um Markdown de até 512 KB.');
  check(!text.includes('\0'), 'O arquivo contém dados binários.');
  text = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const first = /^<!-- libr4ry: (.+) -->\n/.exec(text);
  if (!first) {
    const title = (/^#\s+(.+)$/m.exec(text)?.[1] || filename.replace(/\.(md|markdown)$/i, '') || 'Caderno importado').trim().slice(0,120);
    const pages = split(text).map(content => page({ title: '', content, size: 'medium', font: 16 }));
    check(pages.length > 0 && pages.length <= 500, 'A importação precisa ter entre 1 e 500 páginas.');
    return { title, subject: '', tags: [], pages, identified: false };
  }
  let header;
  try { header = JSON.parse(first[1]); } catch { throw new Error('A identificação Libr4ry está danificada. Corrija o cabeçalho antes de importar.'); }
  check(header?.version === 1 && uuid(header.id) && uuid(header.token) && Number.isSafeInteger(header.revision) && header.revision >= 0, 'Identificação ou versão Markdown não suportada.');
  check(typeof header.title === 'string' && header.title.trim() && header.title.length <= 120 && typeof header.subject === 'string' && header.subject.length <= 120
    && Array.isArray(header.tags) && header.tags.length <= 30 && header.tags.every(tag => typeof tag === 'string' && tag.length <= 60), 'Metadados Markdown inválidos.');
  const body = text.slice(first[0].length);
  const marker = new RegExp('^<!-- libr4ry-page:' + header.token + ' (.+) -->\\n', 'gm');
  const matches = [...body.matchAll(marker)];
  check(matches.length > 0 && matches.length <= 500 && matches[0].index === 0, 'As divisões de páginas estão ausentes ou danificadas.');
  const used = new Set();
  const pages = matches.map((match, index) => {
    let value;
    try { value = JSON.parse(match[1]); } catch { throw new Error('Identificação de página danificada.'); }
    check(uuid(value?.id) && !used.has(value.id.toLowerCase()), 'Identificação de página inválida ou repetida.');
    used.add(value.id.toLowerCase());
    const end = matches[index + 1]?.index ?? body.length;
    const content = body.slice(match.index + match[0].length, end);
    check(content.endsWith('\n'), 'A divisão final de uma página está danificada.');
    return { ...page({ ...value, content: content.slice(0,-1) }), id: value.id.toLowerCase() };
  });
  return { id: header.id.toLowerCase(), revision: header.revision, title: header.title, subject: header.subject, tags: [...header.tags], pages, identified: true };
}
export function planNotebookImport(incoming, book) {
  const same = incoming.identified && incoming.id === book.id;
  const byId = new Map(book.pages.map(item => [item.id, item]));
  const pages = incoming.pages.map((item, index) => {
    const existing = same ? byId.get(item.id) : book.pages[index];
    return { ...existing, ...page(item), id: existing?.id || crypto.randomUUID() };
  });
  const used = new Set(pages.map(item => item.id));
  const retained = book.pages.filter(item => !used.has(item.id));
  pages.push(...retained);
  check(pages.length <= 500, 'A atualização ultrapassaria 500 páginas. Importe como um novo caderno.');
  const changed = pages.filter(item => {
    const previous = byId.get(item.id);
    return !previous || JSON.stringify(pageData(previous)) !== JSON.stringify(pageData(item));
  }).length;
  return { pages, changed, retained: retained.length, stale: same && incoming.revision !== (book.revision || 0) };
}
export function copyNotebook(book, suffix) {
  return { ...structuredClone({ ...metadata(book), title: (book.title + suffix).slice(0,120) }), id: crypto.randomUUID(),
    pages: book.pages.map(item => ({ id: crypto.randomUUID(), ...pageData(item) })),
    tasks: book.tasks.map(task => ({ id: crypto.randomUUID(), title: task.title, done: task.done })) };
}
