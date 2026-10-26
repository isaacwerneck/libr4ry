import { pageData } from './storage.js';

function snapshot(book, pageId, caret) {
  return { pages: book.pages.map(page => ({ id: page.id, ...pageData(page) })), pageId, caret };
}

export function rememberEdit(book, pageId, caret, typing = false, now = Date.now()) {
  book.editHistory ||= { undo: [], redo: [], at: 0 };
  const history = book.editHistory;
  if (!typing || history.pageId !== pageId || now - history.at > 700) {
    history.undo.push(snapshot(book, pageId, caret));
    if (history.undo.length > 30) history.undo.shift();
  }
  history.redo = [];
  history.at = typing ? now : 0;
  history.pageId = pageId;
}

export function restoreEdit(book, pageId, caret, redo = false) {
  const history = book.editHistory;
  const source = redo ? history?.redo : history?.undo;
  if (!source?.length) return null;
  history[redo ? 'undo' : 'redo'].push(snapshot(book, pageId, caret));
  const state = source.pop();
  const values = new Map(state.pages.map(page => [page.id, page]));
  for (const page of book.pages) {
    const value = values.get(page.id);
    if (value) Object.assign(page, value, { date: value.date || '' });
    // shortcut: undo mantém folhas criadas vazias; exclusão exige modelo e API próprios.
    else { page.title = ''; page.content = ''; }
  }
  history.at = 0;
  return { page: book.pages.find(page => page.id === state.pageId) || book.pages[0], caret: state.caret };
}

export function formatSelection(text, start, end, format) {
  const selected = text.slice(start, end);
  const markers = { bold: '**', italic: '*', code: '`' };
  if (markers[format]) {
    const marker = markers[format];
    return { start, end, text: marker + selected + marker, selection: [start + marker.length, end + marker.length] };
  }
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const prefix = { h1: '# ', h2: '## ', h3: '### ', list: '- ' }[format];
  if (!prefix) throw new Error('Formato desconhecido.');
  const content = text.slice(lineStart, end).replace(/^#{1,6} /, '');
  return { start: lineStart, end, text: prefix + content, selection: [lineStart, lineStart + prefix.length + content.length] };
}
