const stylePattern = /\{\{(sans|serif|mono|hand|book|humanist|typewriter);(ink|rust|blue|plum|#[a-fA-F0-9]{6});(14|16|18|20|24)\|([^\n{}]+)\}\}/g;
const visualStylePattern = /\{\{l4;(sans|serif|mono|hand|book|humanist|typewriter);(ink|rust|blue|plum|#[a-fA-F0-9]{6});(14|16|18|20|24)\}\}([\s\S]*?)\{\{\/l4\}\}/g;
const styleStart = new RegExp('^' + stylePattern.source);
const styleWhole = new RegExp('^' + stylePattern.source + '$');

export const INKS = { ink: '#38291f', rust: '#823d25', blue: '#294f73', plum: '#674061' };
export const validInk = value => Object.hasOwn(INKS, value) || /^#[a-fA-F0-9]{6}$/.test(value);

export function applyStudyColors(root) {
  for (const element of root.querySelectorAll('[data-study-ink]')) {
    const ink = element.getAttribute('data-study-ink');
    if (ink?.startsWith('#') && validInk(ink) && element.style.getPropertyValue('--study-ink') !== ink) element.style.setProperty('--study-ink', ink);
  }
}

export function rgbInk(red, green, blue) {
  const values = [red, green, blue];
  if (!values.every(value => /^\d{1,3}$/.test(String(value)) && Number(value) <= 255)) throw new Error('Use valores RGB inteiros entre 0 e 255.');
  return '#' + values.map(value => Number(value).toString(16).padStart(2, '0')).join('');
}

export function writingShortcut(event, selected = false) {
  if (event.isComposing || event.repeat || event.getModifierState?.('AltGraph')) return null;
  const key = event.key.toLowerCase();
  const modifier = event.ctrlKey || event.metaKey;
  if (!modifier && !event.altKey && event.shiftKey && key === 'c' && selected) return 'colors';
  if (event.altKey && !modifier && !event.shiftKey) return /^[123]$/.test(key) ? 'h' + key : key === 'l' ? 'list' : null;
  if (!modifier) return null;
  if (event.altKey) return !event.shiftKey && /^[123]$/.test(key) ? 'h' + key : null;
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo';
  if (key === 'y' && !event.shiftKey) return 'redo';
  if (event.shiftKey) return key === '*' || key === '8' ? 'list' : null;
  return { b: 'bold', i: 'italic' }[key] || null;
}

export function readStudyStyle(source) {
  const rich = new RegExp('^' + visualStylePattern.source).exec(source);
  const match = rich || styleStart.exec(source);
  if (!match) return null;
  return { raw: match[0], font: match[1], ink: match[2], size: match[3],
    content: match[4], rich: Boolean(rich) };
}

export function installStudyStyles(markdown) {
  markdown.inline.ruler.before('emphasis', 'study_style', (state, silent) => {
    if (!state.src.startsWith('{{', state.pos)) return false;
    const match = readStudyStyle(state.src.slice(state.pos, state.posMax));
    if (!match) return false;
    if (!silent) {
      const token = state.push('study_style', 'span', 0);
      token.content = match.content;
      token.meta = match;
    }
    state.pos += match.raw.length;
    return true;
  });
  markdown.renderer.rules.study_style = (tokens, index, options, env) => {
    const token = tokens[index];
    const depth = env.studyDepth || 0;
    const content = token.meta.rich && depth < 8 ? markdown.renderInline(token.content, { ...env, studyDepth: depth + 1 }) : markdown.utils.escapeHtml(token.content);
    const ink = token.meta.ink;
    const color = ink.startsWith('#') ? ` data-study-ink="${ink}"` : '';
    return `<span class="study-font-${token.meta.font} study-ink-${ink.startsWith('#') ? 'custom' : ink} study-size-${token.meta.size}"${color}>${content}</span>`;
  };
  return markdown;
}

export function styledSelection(text, start, end, font, ink, size, remove = false) {
  let selected = text.slice(start, end);
  const match = styleWhole.exec(selected);
  if (match) selected = match[4];
  if (!selected.trim() || /[\n{}]/.test(selected)) throw new Error('Selecione um trecho de uma linha, sem chaves, para personalizar.');
  const formatted = remove ? selected : `{{${font};${ink};${size}|${selected}}}`;
  if (!remove && !styleWhole.test(formatted)) throw new Error('Estilo de escrita inválido.');
  return { start, end, text: formatted, selection: [start, start + formatted.length] };
}

export function styleRanges(text) {
  return [stylePattern, visualStylePattern].flatMap(pattern => [...text.matchAll(new RegExp(pattern.source, 'g'))]
    .map(match => [match.index, match.index + match[0].length])).sort((a, b) => a[0] - b[0]);
}

export function plainStudyText(text) {
  return text.replace(new RegExp(visualStylePattern.source, 'g'), source => readStudyStyle(source)?.content || source)
    .replace(new RegExp(stylePattern.source, 'g'), '$4');
}

export function continueLine(text, start, end) {
  if (start !== end) return null;
  const from = text.lastIndexOf('\n', start - 1) + 1;
  const line = text.slice(from, start);
  if (start < text.length && text[start] !== '\n') return null;
  let fence;
  for (const source of text.slice(0, from).split('\n')) {
    const candidate = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(source);
    if (!candidate) continue;
    if (!fence && !(candidate[1][0] === '`' && candidate[2].includes('`'))) fence = candidate[1];
    else if (fence && candidate[1][0] === fence[0] && candidate[1].length >= fence.length && !candidate[2].trim()) fence = null;
  }
  if (fence) {
    const indent = line.match(/^\s*/)[0];
    return { start, end, text: '\n' + indent, selection: [start + 1 + indent.length, start + 1 + indent.length] };
  }
  const marker = /^(\s*)(?:([-+*]) (?:\[([ xX])\] )?|(\d{1,6})([.)]) |(>) )(.*)$/.exec(line);
  if (!marker) return null;
  if (!marker[7].trim()) return { start: from, end: start, text: '', selection: [from, from] };
  const prefix = marker[1] + (marker[2] ? marker[2] + ' ' + (marker[3] !== undefined ? '[ ] ' : '')
    : marker[4] ? (Number(marker[4]) + 1) + marker[5] + ' ' : '> ');
  return { start, end, text: '\n' + prefix, selection: [start + 1 + prefix.length, start + 1 + prefix.length] };
}

export function findNotebookPages(pages, query = '') {
  const needle = query.trim().toLocaleLowerCase('pt-BR');
  return pages.filter(page => !needle || (page.title + '\n' + plainStudyText(page.content)).toLocaleLowerCase('pt-BR').includes(needle));
}
