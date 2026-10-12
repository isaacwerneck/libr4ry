import { plainStudyText } from './notebook-writing.js';

export const PAGE_SIZES = Object.freeze({ small: 24, medium: 36, large: 48 });
export const FONT_SIZES = Object.freeze([14, 16, 18, 20, 24]);

export function visiblePages(pages, selected, spread) {
  const index = pages.indexOf(selected);
  if (index < 0) return [];
  return spread ? bookOpening(pages, selected).filter(Boolean) : [selected];
}

// A primeira frente fica à direita; o verso seguinte fica à esquerda.
export function bookOpening(pages, selected) {
  const index = pages.indexOf(selected);
  if (index < 0) return [null, null];
  const left = index % 2 ? index : index - 1;
  return [pages[left] || null, pages[left + 1] || null];
}

export function adjacentOpening(pages, selected, direction) {
  const index = pages.indexOf(selected);
  if (index < 0) return null;
  const left = index % 2 ? index : index - 1;
  const next = left + direction * 2;
  return next < -1 || next >= pages.length ? null : pages[Math.max(0, next)];
}

export function pageCapacity(size, fontSize) {
  if (!Object.hasOwn(PAGE_SIZES, size) || !FONT_SIZES.includes(fontSize)) {
    throw new Error('Tamanho de página ou de letra inválido.');
  }
  return {
    lines: Math.floor(PAGE_SIZES[size] * 16 / fontSize),
    columns: Math.max(20, Math.floor(64 * 16 / fontSize)),
  };
}

// ponytail: layout de referência monoespaçado; medir blocos renderizados ao incluir mídia.
export function splitPages(text, size = 'medium', fontSize = 16) {
  const { lines: limit, columns } = pageCapacity(size, fontSize);
  const result = [];
  let chunk = '';
  let line = 1;
  let column = 0;
  for (const character of text) {
    if ((character !== '\n' && column >= columns) || line > limit) {
      if (line >= limit) {
        result.push(chunk);
        chunk = '';
        line = 1;
      } else {
        line += 1;
      }
      column = 0;
    }
    chunk += character;
    if (character === '\n') {
      line += 1;
      column = 0;
    } else {
      column += character === '\t' ? 2 : 1;
    }
  }
  if (line > limit) {
    result.push(chunk);
    chunk = '';
  }
  result.push(chunk);
  return result;
}

export function countLines(text, size, fontSize) {
  const { columns } = pageCapacity(size, fontSize);
  if (!text) return 0;
  return text.split('\n').reduce((total, line) =>
    total + Math.max(1, Math.ceil(Array.from(line.replaceAll('\t', '  ')).length / columns)), 0);
}

export function protectedBlocks(text, tokens) {
  const offsets = [0];
  for (const line of text.match(/[^\n]*\n|[^\n]+$/g) || []) offsets.push(offsets.at(-1) + line.length);
  return tokens.filter(token => token.level === 0 && token.map
    && ['fence', 'code_block', 'bullet_list_open', 'ordered_list_open', 'blockquote_open', 'table_open'].includes(token.type))
    .map(token => [offsets[token.map[0]], offsets[token.map[1]] ?? text.length]);
}

export function planPageEdit(text, size, fontSize, totalPages, ranges = []) {
  const boundaries = splitPages(text, size, fontSize);
  const chunks = [];
  let start = 0;
  let offset = 0;
  for (const chunk of boundaries) {
    offset += chunk.length;
    let end = offset;
    const block = ranges.find(([from, to]) => end > from && end < to);
    if (block) end = block[0] > start ? block[0] : block[1];
    if (end > start) { chunks.push(text.slice(start, end)); start = end; }
  }
  if (start < text.length) chunks.push(text.slice(start));
  if (!chunks.length) chunks.push('');
  const limited = totalPages + chunks.length - 1 > 500;
  return { chunks: limited ? [text] : chunks, limited };
}

export function countWords(text) {
  return (plainStudyText(text).match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length;
}
