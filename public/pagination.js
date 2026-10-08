export const PAGE_SIZES = Object.freeze({ small: 24, medium: 36, large: 48 });
export const FONT_SIZES = Object.freeze([14, 16, 18, 20, 24]);

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

export function countWords(text) {
  return (text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length;
}
