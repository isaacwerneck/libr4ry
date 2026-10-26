import { planPageEdit, protectedBlocks, pageCapacity, countLines, countWords, visiblePages, bookOpening, adjacentOpening } from './pagination.js';
import markdownit from '/markdown-it.mjs';
import { createRoot, unlockRoot } from './crypto.js';
import { api, createBook, loadBook, saveBook, versions, pageData, pageDate, metadata } from './storage.js';
import { capturePaper, turnPaper, stopPaperMotion, setupPageCorner } from './notebook-motion.js';
import { preferences, recentPosition, COVER_COLORS } from './notebook-preferences.js';
import { protectBook, readDrafts, recoverDraft, clearDraft, draftStore } from './drafts.js';
import { seal, open } from './crypto.js';
import { setupNotebookViewport, fitZoom, fitNotebookHeight, positionNotebook, centerNotebookRect, matchNotebookCover, revealNotebookRect, animateNotebookCamera, stopNotebookCamera } from './notebook-viewport.js';
import { rememberEdit, restoreEdit, formatSelection } from './edit-history.js';
import { organization, collectionShelves, collectionBooks } from './collection.js';
import { setupSocial } from './social.js';
import { setupPasswordReset } from './password-reset.js';
import { pauseForm } from './form-focus.js';
import { setupNotebookFiles } from './notebook-files.js';
import { setupSharing } from './sharing.js';
import { installStudyStyles, styledSelection, styleRanges, plainStudyText, continueLine, findNotebookPages, INKS, validInk, rgbInk, writingShortcut, applyStudyColors } from './notebook-writing.js';
import { createStudyReminder } from './notebook-reminder.js';
import { createVisualEditor, createAmbientLight } from '/visual-editor.js';
import { coverDesigns } from './cover-design.js';
import { createCoverEditor, decorateCover } from './cover-editor.js';

const markdown = installStudyStyles(markdownit({ html: false, linkify: false, typographer: false }).disable('image'));
const $ = id => document.getElementById(id);
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  ($('workspace').hidden ? $('auth-main') : $('main')).focus();
});
function renderStudyPreview(element, content) {
  element.innerHTML = markdown.render(content);
  applyStudyColors(element);
}
const books = [];
let currentBook;
let currentPage;
let signingUp = false;
let session;
let rootKey;
const social = setupSocial({ api, user: () => session?.user, books: () => books, plainText: plainStudyText, profile: id => sharing.profile(id) });
let editingBook;
// shortcut: tentativa pendente só nesta aba; persistir cifrada se for preciso retomar após recarregar.
let creatingBook;
let historySelection;
let styleSelection;
let colorSelection;
let personalDefaults = { preferences: preferences(), size: 'medium', font: 16 };
const preview = new URLSearchParams(location.search).get('preview') === '1';
const studyReminder = createStudyReminder();
const sceneLight = document.createElement('div'); sceneLight.className = 'scene-light'; sceneLight.setAttribute('aria-hidden', 'true');
const ambientCanvas = document.createElement('canvas'); ambientCanvas.className = 'ambient-light'; ambientCanvas.setAttribute('aria-hidden', 'true');
document.body.append(ambientCanvas, sceneLight);
const updateAmbient = createAmbientLight(ambientCanvas, message => { $('ambient-status').textContent = message; });
function syncAmbient() { updateAmbient(currentBook?.preferences || {}, document.body.classList.contains('studying')); }
const heading = document.querySelector('.notebook-heading');
const writingPanel = $('writing-tools').querySelector('.hud-panel');
heading.insertBefore(document.querySelector('.mode-control'), $('writing-tools'));
for (const selector of ['.editor-toolbar', '#active-sheet', '.format-tools', '#style-text']) writingPanel.append(document.querySelector(selector));
writingPanel.prepend(document.querySelector('.format-tools'));
writingPanel.append($('source-mode'));
const pageOptions = document.createElement('section'); pageOptions.className = 'page-options';
const pageOptionsLabel = document.createElement('h3'); pageOptionsLabel.textContent = 'Folha e texto base';
pageOptions.append(pageOptionsLabel, document.querySelector('.editor-toolbar'), $('active-sheet'));
writingPanel.append(pageOptions);
$('hud-actions').prepend($('history-button'));
const viewPanel = $('view-tools').querySelector('.hud-panel');
const bookPanel = $('notebook-hud').querySelector('.hud-panel');
const indexPanel = $('index-tools').querySelector('.hud-panel');
indexPanel.append(pageOptions, $('history-button'), $('draft-button'));
bookPanel.prepend(...viewPanel.children);
viewPanel.append(document.querySelectorAll('.notebook-customization')[1]);
bookPanel.append($('motion-mode').closest('label'));
$('sheet-layout').closest('label').hidden = true;
$('spread-note').hidden = true;
for (const details of document.querySelectorAll('.notebook-customization')) {
  const section = document.createElement('section'); section.className = 'tool-section';
  const title = document.createElement('h3'); title.textContent = details.querySelector('summary').textContent;
  details.querySelector('summary').remove(); section.append(title, ...details.children); details.replaceWith(section);
}
bookPanel.querySelector('.tool-section').append($('paper-ruling').closest('label'));
viewPanel.querySelector('h3').textContent = 'Seu ambiente';
const workbench = document.createElement('aside'); workbench.className = 'notebook-workbench';
workbench.setAttribute('aria-label', 'Ferramentas do caderno');
$('notebook-view').append(workbench);
const toolNames = [['writing-tools', 'Texto'], ['index-tools', 'Páginas'], ['notebook-hud', 'Caderno'], ['view-tools', 'Mesa']];
const toolTabs = document.createElement('div'); toolTabs.className = 'tool-tabs'; toolTabs.setAttribute('role', 'group'); toolTabs.setAttribute('aria-label', 'Seções de ferramentas'); workbench.append(toolTabs);
toolNames.forEach(([id, name]) => {
  const details = $(id); details.open = false;
  details.querySelector('summary').textContent = name;
  const tab = document.createElement('button'); tab.type = 'button'; tab.id = id + '-tab'; tab.textContent = name;
  tab.setAttribute('aria-controls', id); tab.setAttribute('aria-expanded', 'false');
  tab.addEventListener('click', () => { const open = !details.open; closeNotebookHud(); details.open = open; });
  toolTabs.append(tab);
  workbench.append(details);
});
const notebookTools = ['index-tools', 'writing-tools', 'view-tools', 'notebook-hud'].map($);
const closeTools = notebookTools.map(details => () => {
  if (details.contains(document.activeElement)) $(details.id + '-tab').focus({ preventScroll: true });
  details.open = false;
});
const closeNotebookHud = () => closeTools.forEach(close => close());
for (const details of notebookTools) details.addEventListener('toggle', () => {
  $(details.id + '-tab').setAttribute('aria-expanded', String(details.open));
  if (details.open) {
    notebookTools.forEach((other, index) => { if (other !== details && other.open) closeTools[index](); });
    if (currentPage && notebookFrameMode === 'page' && window.innerWidth > 720) frameNotebook();
  }
});
let reading = false;
let sourceMode = false;
let bookFace = null;
let notebookFrameMode = 'page';
let blankVerso = false;
let composingSheet;
const companion = $('paper').cloneNode(true);
for (const element of [companion, ...companion.querySelectorAll('[id]')]) element.id += '-right';
for (const label of companion.querySelectorAll('label[for]')) label.htmlFor += '-right';
const companionStage = document.createElement('div');
companionStage.className = 'paper-stage';
companionStage.hidden = true;
companionStage.append(companion);
const spread = document.createElement('div');
spread.className = 'notebook-spread';
const mainStage = $('paper').parentElement;
mainStage.before(spread);
spread.append(mainStage, companionStage);
const sheets = ['', '-right'].map(suffix => ({ suffix, paper: $('paper' + suffix), page: null }));
const field = (sheet, id) => $(id + sheet.suffix);
for (const sheet of sheets) sheet.visual = createVisualEditor(field(sheet, 'page-visual'), value => markdown.render(value), (value, caret, typing) => {
  if (!sheet.page) return;
  stopNotebookMotion();
  currentBook.visualError = null;
  const source = field(sheet, 'page-content');
  source.value = value; source.setSelectionRange(caret, caret);
  if (currentBook.collaboration) { sheet.page.content=value; changed();fitWritingHeight([sheet]);renderPageControls();return; }
  if (composingSheet === sheet) {
    rememberEdit(currentBook, sheet.page.id, Math.min(caret, sheet.page.content.length), true);
    sheet.page.content = value; changed(); fitWritingHeight([sheet]); return;
  }
  updateContent(sheet, true, typing);
}, (activate = true) => {
  if (!sheet.page) return;
  if (activate) currentPage = sheet.page;
  if (currentPage !== sheet.page) return;
  requestAnimationFrame(() => {
    if (sheet.visual.editor.isFocused && !bookFace && !sourceMode) {
      revealNotebookRect(viewport, sheet.visual.editor.view.coordsAtPos(sheet.visual.editor.state.selection.head), writingBounds());
    }
  });
  renderPageControls();
  const attrs = sheet.visual.editor.getAttributes('studyStyle');
  $('direct-font').value = attrs.font || currentBook.preferences.font;
  $('direct-size').value = attrs.size || String(currentPage.font);
  for (const button of document.querySelectorAll('[data-format]')) {
    const format = button.dataset.format;
    const active = /^h[123]$/.test(format) ? sheet.visual.editor.isActive('heading', { level: Number(format[1]) })
      : sheet.visual.editor.isActive(format === 'list' ? 'bulletList' : format);
    button.setAttribute('aria-pressed', String(active));
  }
  for (const button of document.querySelectorAll('[data-ink]')) button.setAttribute('aria-pressed', String(button.dataset.ink === (attrs.ink || 'ink')));
}, message => { if (currentBook) { currentBook.visualError = message; renderPageControls(); renderSaveState(); } notify(message); });
function focusContent(sheet = activeSheet(), caret) {
  if (!sourceMode) {
    sheet.visual.focus(caret);
  } else {
    const content = field(sheet, 'page-content'); content.focus({ preventScroll: true });
    if (caret !== undefined) content.setSelectionRange(caret, caret);
  }
}
const activeSheet = () => sheets.find(sheet => sheet.page === currentPage) || sheets[0];
const stopNotebookMotion = () => {
  stopNotebookCamera(viewport);
  sheets.forEach(sheet => { sheet.cancelCorners?.forEach(cancel => cancel()); stopPaperMotion(sheet.paper); });
  stopPaperMotion(coverFace);
  coverGestures.forEach(cancel => cancel());
  coverEditor.cancel();
};
const viewport = document.createElement('div');
viewport.className = 'notebook-viewport';
viewport.tabIndex = 0;
viewport.setAttribute('role', 'region');
viewport.setAttribute('aria-label', 'Enquadramento do caderno, use as setas para mover');
spread.before(viewport);
viewport.append(spread);
for (const event of ['pointerdown', 'keydown', 'beforeinput']) viewport.addEventListener(event, () => stopNotebookCamera(viewport), { capture: true });
function writingBounds() {
  const heading = document.querySelector('.notebook-heading').getBoundingClientRect();
  const tools = workbench.getBoundingClientRect();
  return { top: Math.max(heading.bottom, window.innerWidth <= 720 ? tools.top + toolTabs.offsetHeight : heading.bottom) + 18, bottom: window.innerHeight - 92,
    left: 24, right: window.innerWidth > 600 && notebookTools.some(tool => tool.open) ? tools.left - 24 : window.innerWidth - 24 };
}
function frameNotebookTop(paper) {
  const top = paper.getBoundingClientRect().top;
  positionNotebook(viewport, Number(viewport.dataset.offset) || 0, (Number(viewport.dataset.vertical) || 0) + writingBounds().top - top);
}
const coverStage = document.createElement('div');
coverStage.className = 'paper-stage book-cover-stage';
coverStage.hidden = true;
const coverFace = document.createElement('article');
coverFace.className = 'paper book-face';
const coverLabel = document.createElement('span'); coverLabel.className = 'cover-label';
const coverTitle = document.createElement('h2');
const coverSubject = document.createElement('p');
const coverLight = document.createElement('div'); coverLight.className = 'cover-light'; coverLight.setAttribute('aria-hidden', 'true');
coverFace.append(coverLabel, coverTitle, coverSubject, coverLight);
coverStage.append(coverFace); viewport.prepend(coverStage);
const coverGestures = [];
const coverEditor = createCoverEditor({ face: coverFace, title: coverTitle, subject: coverSubject,
  getState: () => ({ book: currentBook, side: bookFace, reading }),
  changed: () => { $('notebook-title').textContent = currentBook.title; changed(); }, notify });
bookPanel.prepend($('cover-tools'));
function fitCover(face = bookFace) {
  const page = face === 'front' ? currentBook.pages[0] : face === 'back' ? currentBook.pages.at(-1) : currentPage;
  const sheet = sheets.find(value => value.page === page) || activeSheet();
  matchNotebookCover(spread, sheet.paper, coverFace);
  coverFace.style.setProperty('--cover-left', face === 'back' ? '0px' : '840px');
}
function showBookFace(face, revealTools = true) {
  const entering = face && face !== bookFace;
  if (face) fitCover(face);
  bookFace = face;
  spread.hidden = Boolean(face); coverStage.hidden = !face;
  document.body.classList.toggle('book-closed', Boolean(face));
  $('writing-tools').inert = Boolean(face);
  $('writing-tools-tab').disabled = Boolean(face);
  coverEditor.render();
  if (entering && !reading && revealTools && window.innerWidth > 720) { closeNotebookHud(); $('notebook-hud').open = true; }
  if (!face) return;
  coverFace.dataset.face = face;
  $('page-total').textContent = face === 'front' ? 'Capa' : 'Contracapa';
  $('previous-page').disabled = face === 'front'; $('next-page').disabled = face === 'back';
}
const setViewportZoom = setupNotebookViewport(viewport, spread, stopNotebookMotion, (zoom, before) => {
  notebookFrameMode = null;
  currentBook.preferences.zoom = zoom; $('notebook-zoom').value = Math.round(zoom * 100);
  $('zoom-value').textContent = Math.round(zoom * 100) + '%';
  document.body.style.setProperty('--book-zoom', zoom); fitWritingHeight(); changed();
  animateNotebookCamera(viewport, before, spread.getBoundingClientRect(), currentBook.preferences.motion, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}, document.body);
const setZoom = value => {
  const zoom = setViewportZoom(value);
  if (currentPage) fitCover();
  return zoom;
};
function frameNotebook(mode = notebookFrameMode || 'page', smooth = false) {
  if (!currentPage || !document.body.classList.contains('studying')) return;
  notebookFrameMode = mode;
  const target = bookFace ? coverFace : mode === 'whole' ? spread : activeSheet().paper;
  const before = target.getBoundingClientRect();
  stopNotebookCamera(viewport);
  const bounds = writingBounds();
  const rectangle = target.getBoundingClientRect();
  const scale = currentBook.preferences.zoom;
  const width = rectangle.width / scale;
  const height = rectangle.height / scale;
  const available = Math.max(1, bounds.right - bounds.left);
  const zoom = mode === 'whole' || bookFace
    ? fitZoom(Math.min(available / width, Math.max(1, bounds.bottom - bounds.top) / height), 1)
    : Math.max(window.innerWidth <= 720 ? .85 : .8, fitZoom(available - 24, width));
  currentBook.preferences.zoom = setZoom(zoom);
  document.body.style.setProperty('--book-zoom', currentBook.preferences.zoom);
  fitWritingHeight();
  $('notebook-zoom').value = Math.round(zoom * 100);
  $('zoom-value').textContent = Math.round(zoom * 100) + '%';
  centerNotebook();
  if (smooth) animateNotebookCamera(viewport, before, target.getBoundingClientRect(), currentBook.preferences.motion, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
function centerNotebook(smooth = false) {
  const target = bookFace ? coverFace : notebookFrameMode === 'whole' ? spread : activeSheet().paper;
  const before = target.getBoundingClientRect();
  stopNotebookCamera(viewport);
  const inset = !bookFace && notebookFrameMode !== 'whole' && window.innerWidth <= 720 ? 64 * currentBook.preferences.zoom : 0;
  centerNotebookRect(viewport, target.getBoundingClientRect(), writingBounds(), inset);
  if (smooth) animateNotebookCamera(viewport, before, target.getBoundingClientRect(), currentBook.preferences.motion, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
function setNotebookPan(enabled) {
  viewport.dataset.pan = String(enabled);
  $('pan-notebook').setAttribute('aria-pressed', String(enabled));
}
$('pan-notebook').addEventListener('click', () => {
  setNotebookPan(viewport.dataset.pan !== 'true'); closeNotebookHud();
  viewport.focus({ preventScroll: true });
});
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') { setNotebookPan(false); closeNotebookHud(); }
});
$('edit-mode').addEventListener('click', () => setNotebookPan(false));
document.querySelector('.page-navigation').append($('add-page'));
$('add-page').className = 'text-button add-page';

function applyAppearance() {
  setNotebookPan(false);
  const value = preferences(currentBook.preferences);
  value.layout = 'spread';
  const lightChanged = document.body.dataset.light !== value.light;
  currentBook.preferences = value;
  for (const name of ['paper', 'cover', 'font', 'ruling', 'desk', 'light', 'binding', 'finish']) document.body.dataset[name] = value[name];
  document.body.style.removeProperty('--cover'); document.body.style.removeProperty('--cover-edge');
  if (value.coverColor) {
    document.body.style.setProperty('--cover', value.coverColor);
    document.body.style.setProperty('--cover-edge', `color-mix(in srgb, ${value.coverColor}, #fff4dd 30%)`);
  }
  $('cover-color').value = value.coverColor || COVER_COLORS[value.cover];
  $('cover-finish').value = value.finish;
  document.body.style.setProperty('--book-zoom', value.zoom);
  for (const [id, name] of [['paper-style', 'paper'], ['cover-style', 'cover'], ['writing-font', 'font'],
    ['sheet-layout', 'layout'], ['motion-mode', 'motion'], ['paper-ruling', 'ruling'], ['desk-style', 'desk'], ['light-style', 'light'], ['book-binding', 'binding']]) $(id).value = value[name];
  $('reminder-enabled').checked = value.reminder;
  $('ambient-enabled').checked = value.ambient;
  syncAmbient();
  if (lightChanged && value.motion !== 'off' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const animation of sceneLight.getAnimations()) animation.cancel();
    sceneLight.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });
  }
  $('notebook-zoom').value = Math.round(setZoom(value.zoom) * 100);
  $('zoom-value').textContent = $('notebook-zoom').value + '%';
  if (bookFace) coverEditor.render();
}

function rememberPosition(force = false) {
  if (bookFace) return;
  if (!currentPage || !document.body.classList.contains('studying')) return;
  const at = currentBook.interactedAt;
  if (!at || (!force && at - (currentBook.position?.at || 0) < 10000)) return;
  const sheet = activeSheet();
  const rectangle = sheet.paper.getBoundingClientRect();
  currentBook.position = { pageId: currentPage.id, caret: field(sheet, 'page-content').selectionStart,
    fraction: Math.max(0, Math.min(1, (writingBounds().top - rectangle.top) / rectangle.height)), at };
  changed();
  currentBook.interactedAt = at;
  currentBook.position.at = at;
}

async function protectDraft(book) {
  try {
    if (book.draftRunning) await book.draftRunning;
    await protectBook(book);
  } catch (error) { book.localError = error; }
  renderSaveState();
}

let notificationTimer;
function notify(message) {
  clearTimeout(notificationTimer);
  $('notification').textContent = message;
  $('notification').hidden = false;
  notificationTimer = setTimeout(() => { $('notification').hidden = true; }, 5000);
}

function showView(view, record = true) {
  const names = { home: 'Início', library: 'Estantes', profile: 'Perfil', social: 'Social', progress: 'Meu progresso', notebook: 'Caderno' };
  if (!Object.hasOwn(names, view) || (view === 'notebook' && !currentBook)) view = 'home';
  if (currentBook?.visualError && view !== 'notebook') { notify('A edição visual está pendente. Copie o texto ou desfaça antes de sair da folha.'); return; }
  if (view !== 'notebook') rememberPosition(true);
  stopNotebookMotion();
  closeNotebookHud();
  if (view !== 'notebook') setNotebookFocus(false);
  document.body.classList.toggle('studying', view === 'notebook');
  syncAmbient();
  for (const name of Object.keys(names)) $(name + '-view').hidden = name !== view;
  for (const control of document.querySelectorAll('.library-header [data-view]')) {
    const active = control.dataset.view === view || (view === 'progress' && control.dataset.view === 'profile');
    control.classList.toggle('active', active);
    if (active) control.setAttribute('aria-current', 'page'); else control.removeAttribute('aria-current');
  }
  $('view-name').textContent = names[view];
  $('new-notebook').hidden = view !== 'library';
  if (view !== 'notebook') { renderPortal(); window.scrollTo(0, 0); }
  if (record && location.hash !== '#' + view) history.pushState({ view }, '', '#' + view);
  updateStudyReminder();
  if (view === 'social') social.refresh();
}

function renderPortal() {
  const user = session?.user || { display_name: 'Prévia local', email: 'Interface de demonstração · sem conta real' };
  $('profile-display-name').textContent = user.display_name;
  $('profile-email').textContent = user.email;
  $('profile-avatar').textContent = user.display_name.slice(0, 2).toUpperCase();
  $('profile-books-count').textContent = books.length;
  $('profile-shelves-count').textContent = collectionShelves(books).length;
  const resumed = books.filter(book => recentPosition(book)).sort((a, b) => b.position.at - a.position.at)[0];
  $('continue-notebook').hidden = !resumed;
  $('continue-notebook').textContent = resumed ? `Continuar de onde parei · ${resumed.title}` : '';
  $('continue-notebook').onclick = resumed ? () => openBook(resumed) : null;
  renderProgress();
}

for (const control of document.querySelectorAll('[data-view]')) control.addEventListener('click', () => {
  if (control.dataset.view === 'library') renderCollection();
  showView(control.dataset.view);
});
window.addEventListener('popstate', () => {
  if ($('workspace').hidden) return;
  if (currentBook?.visualError) { history.pushState({ view: 'notebook' }, '', '#notebook'); notify('Resolva a edição visual pendente antes de sair da folha.'); return; }
  showView(location.hash.slice(1), false);
});

function button(text, className, action) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = text;
  element.addEventListener('click', action);
  return element;
}

function stats(book) {
  return {
    pages: book.pages.filter(page => page.content.trim()).length,
    words: book.pages.reduce((total, page) => total + countWords(page.content), 0),
    tasks: book.tasks.filter(task => task.done).length,
  };
}

function renderCollection() {
  const filter = $('collection-filter');
  const previousFilter = filter.value;
  for (const option of [...filter.options]) if (option.value.startsWith('shelf:')) option.remove();
  for (const shelf of collectionShelves(books)) {
    const option = document.createElement('option');
    option.value = 'shelf:' + shelf.key;
    option.textContent = `${shelf.name} · ${shelf.count}`;
    filter.append(option);
  }
  filter.value = [...filter.options].some(option => option.value === previousFilter) ? previousFilter : 'all';
  $('shelf-list').replaceChildren();
  for (const shelf of [{ key: 'all', name: 'Todos', count: books.length }, ...collectionShelves(books)]) {
    const value = shelf.key === 'all' ? 'all' : 'shelf:' + shelf.key;
    const tab = button(`${shelf.name} · ${shelf.count}`, 'shelf-button', () => {
      filter.value = value;
      renderCollection();
      $('shelf-list').querySelector('[aria-pressed="true"]').focus();
    });
    tab.setAttribute('aria-pressed', String(filter.value === value));
    $('shelf-list').append(tab);
  }
  const selected = collectionBooks(books, filter.value, $('collection-search').value);
  $('notebook-grid').replaceChildren();
  $('empty-library').hidden = books.length > 0;
  $('empty-collection').hidden = !books.length || selected.length > 0;
  $('notebook-count').textContent = books.length;
  selected.forEach(book => {
    const index = books.indexOf(book);
    const entry = document.createElement('article');
    entry.className = 'collection-entry';
    const card = button('', 'notebook-card', () => openBook(book));
    card.setAttribute('aria-label', 'Abrir caderno: ' + book.title);
    const cover = document.createElement('div');
    cover.className = 'book-cover';
    const appearance = preferences(book.preferences);
    const front = coverDesigns(book.covers).front;
    cover.dataset.cover = appearance.cover; cover.dataset.finish = front.material || appearance.finish;
    if (front.color || appearance.coverColor) cover.style.backgroundColor = front.color || appearance.coverColor;
    if (front.image) {
      const image = document.createElement('img'); image.className = 'collection-cover-image'; image.alt = ''; image.src = front.image.data;
      for (const [key, name] of [['left', 'x'], ['top', 'y'], ['width', 'width'], ['height', 'height']]) image.style[key] = front.image[name] * 100 + '%';
      cover.append(image);
    }
    const number = document.createElement('span');
    number.className = 'cover-number';
    number.textContent = 'CADERNO / ' + String(index + 1).padStart(2, '0');
    const title = document.createElement('h3');
    title.textContent = book.title;
    const subject = document.createElement('span');
    subject.className = 'cover-subject';
    subject.textContent = book.subject || '';
    const bottom = document.createElement('div');
    bottom.className = 'cover-bottom';
    const pageCount = document.createElement('span');
    pageCount.textContent = `${book.pages.length} páginas`;
    bottom.append(pageCount);
    const heading = document.createElement('div');
    heading.className = 'collection-cover-heading';
    heading.append(title, subject);
    cover.append(number, heading, bottom);
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const others=book.sharing ? [{user_id:book.sharing.owner_id,display_name:book.sharing.owner_name},...(book.sharing.participants || [])].filter(person=>person.user_id!==session?.user.id).map(person=>person.display_name) : [];
    meta.textContent = `${stats(book).words} palavras · ${preview ? 'caderno de prévia' : book.sharing ? (book.sharing.visibility === 'public' ? 'público' : 'privado') + (others.length ? ' · compartilhado com ' + others.join(', ') : '') : 'privado'}`;
    card.append(cover);
    const actions = document.createElement('div');
    actions.className = 'collection-actions';
    const favorite = button(organization(book.organization).favorite ? '★' : '☆', 'collection-favorite', async () => {
      const value = organization(book.organization);
      book.organization = { ...value, favorite: !value.favorite };
      changed(book);
      renderCollection();
      const next = document.getElementById('favorite-' + book.id);
      (next || filter).focus({ preventScroll: true });
      if (!preview) await persist(book);
    });
    favorite.id = 'favorite-' + book.id;
    favorite.setAttribute('aria-label', 'Favoritar caderno: ' + book.title);
    favorite.setAttribute('aria-pressed', String(organization(book.organization).favorite));
    actions.append(favorite, button('Organizar', 'text-button', () => notebookDialog(book)));
    const shelves = document.createElement('p');
    shelves.className = 'collection-shelves';
    shelves.textContent = organization(book.organization).shelves.join(' · ') || 'Sem estante';
    const info = document.createElement('div');
    info.className = 'collection-info';
    info.append(meta, actions, shelves);
    entry.append(card, info);
    $('notebook-grid').append(entry);
  });
  renderCollectionSaveState();
}

function renderCollectionSaveState() {
  const pending = preview ? [] : books.filter(book => book.generation !== book.confirmed || book.batch);
  const errors = preview ? [] : books.filter(book => book.draftWarning
    || (pending.includes(book) && (book.error || book.conflict || book.localError)));
  const state = $('collection-save-state');
  state.hidden = !pending.length && !errors.length;
  state.replaceChildren();
  state.append(document.createTextNode(errors.length ? 'Há salvamentos ou rascunhos que precisam de atenção. ' : 'Guardando alterações da coleção…'));
  for (const book of errors) state.append(button('Revisar: ' + book.title, 'text-button', () => openBook(book)));
}

function renderProgress() {
  const totals = books.reduce((total, book) => {
    const value = stats(book);
    for (const key of ['pages', 'words', 'tasks']) total[key] += value[key];
    return total;
  }, { pages: 0, words: 0, tasks: 0 });
  $('progress-metrics').replaceChildren();
  $('profile-metrics').replaceChildren();
  for (const [label, count] of [['Cadernos', books.length], ['Páginas escritas', totals.pages], ['Palavras atuais', totals.words], ['Metas concluídas', totals.tasks]]) {
    const element = document.createElement('div');
    element.className = 'metric';
    const value = document.createElement('strong');
    value.textContent = count.toLocaleString('pt-BR');
    const caption = document.createElement('span');
    caption.textContent = label;
    element.append(value, caption);
    $('progress-metrics').append(element);
    $('profile-metrics').append(element.cloneNode(true));
  }
}

function renderIndex() {
  renderPageIndex();
  const metrics = stats(currentBook);
  $('notebook-metrics').textContent = `${metrics.pages} páginas escritas · ${metrics.words} palavras · ${metrics.tasks} metas concluídas`;
  $('task-list').replaceChildren();
  for (const task of currentBook.tasks) {
    const label = document.createElement('label');
    label.className = 'task' + (task.done ? ' done' : '');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.disabled=currentBook.sharing?.permission === 'reader';
    checkbox.setAttribute('aria-label', 'Concluir meta: ' + task.title);
    checkbox.addEventListener('change', () => { task.done = checkbox.checked; changed(); renderIndex(); });
    const text = document.createElement('input');
    text.type = 'text';
    text.maxLength = 200;
    text.value = task.title;
    text.setAttribute('aria-label', 'Editar meta: ' + task.title);
    text.addEventListener('change', () => {
      if (!text.value.trim()) { text.value = task.title; notify('A meta precisa de um nome.'); return; }
      task.title = text.value.trim(); changed();
    });
    label.append(checkbox, text);
    $('task-list').append(label);
  }
}

function renderPageIndex() {
  $('page-list').replaceChildren();
  const results = findNotebookPages(currentBook.pages, $('page-search').value);
  $('page-search-result').textContent = $('page-search').value ? `${results.length} páginas encontradas neste caderno` : '';
  results.forEach(page => {
    const index = currentBook.pages.indexOf(page);
    const entry = button('', 'page-link' + (page === currentPage ? ' active' : ''), () => {
      selectPage(page, true, true);
      if (!reading) focusContent();
    });
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const title = document.createElement('span');
    if (page.title) title.textContent = page.title;
    else {
      renderStudyPreview(title, plainStudyText(page.content).trim().split('\n', 1)[0]);
      title.textContent = title.textContent.trim() || 'Sem título';
    }
    entry.append(number, title);
    $('page-list').append(entry);
  });
}

function renderPage() {
  if (currentBook.visualError) return;
  document.body.dataset.editor = sourceMode ? 'source' : 'visual';
  $('style-text').hidden = !sourceMode;
  const pages = blankVerso ? [null, null] : bookOpening(currentBook.pages, currentPage);
  document.body.classList.add('spread-mode');
  $('spread-note').hidden = true;
  sheets.forEach((sheet, index) => {
    sheet.page = pages[index] || null;
    sheet.paper.parentElement.hidden = false;
    sheet.paper.parentElement.dataset.empty = String(!sheet.page);
    sheet.paper.hidden = false;
    sheet.paper.dataset.side = index === 0 ? 'left' : 'right';
    sheet.paper.classList.toggle('inside-guard', !sheet.page && !(blankVerso && index === 0));
    for (const id of ['page-title', 'page-content', 'page-preview', 'page-visual', 'page-bottom']) {
      const element = field(sheet, id); if (element) element.hidden = !sheet.page;
    }
    sheet.paper.querySelector('.paper-bottom').hidden = !sheet.page;
    sheet.paper.querySelector('.paper-top').hidden = !sheet.page;
    sheet.visual.connect(sheet.page && currentBook.collaboration ? currentBook.collaboration.doc.getXmlFragment('text:'+sheet.page.id) : null, currentBook.collaboration?.awareness, session?.user);
    if (!sheet.page) return;
    const page = sheet.page;
    const position = currentBook.pages.indexOf(page);
    for (const [id, value] of [['page-title', page.title], ['page-content', page.content], ['page-date', page.date || '']]) {
      if (field(sheet, id).value !== value) field(sheet, id).value = value;
    }
    field(sheet, 'page-date').toggleAttribute('data-empty', !page.date);
    field(sheet, 'page-date').readOnly = reading;
    field(sheet, 'page-date').setAttribute('aria-label', `Data da página ${position + 1}`);
    field(sheet, 'page-title').setAttribute('aria-label', `Título da página ${position + 1}`);
    field(sheet, 'page-content').setAttribute('aria-label', `Conteúdo Markdown da página ${position + 1}`);
    field(sheet, 'page-visual').setAttribute('data-page-label', `Anotações da página ${position + 1}`);
    sheet.paper.style.setProperty('--font-size', page.font + 'px');
    sheet.paper.style.setProperty('--line-height', page.font * 1.75 + 'px');
    field(sheet, 'page-content').hidden = reading || !sourceMode;
    field(sheet, 'page-title').hidden = reading && !page.title;
    field(sheet, 'page-preview').hidden = !reading || !sourceMode;
    field(sheet, 'page-visual').hidden = sourceMode;
    if (!sourceMode) sheet.visual.load(page.content, !reading && currentBook.sharing?.permission !== 'reader');
    if (reading && sourceMode) renderStudyPreview(field(sheet, 'page-preview'), page.content);
    field(sheet, 'page-number').textContent = 'PÁGINA ' + String(position + 1).padStart(2, '0');
    field(sheet, 'page-position').textContent = String(position + 1).padStart(2, '0');
    field(sheet, 'line-count').textContent = `${countLines(page.content, page.size, page.font)} / ${pageCapacity(page.size, page.font).lines} linhas de referência`;
    field(sheet, 'word-count').textContent = `${countWords(page.content)} palavras`;
  });
  setZoom(currentBook.preferences.zoom);
  fitWritingHeight();
  renderPageControls();
}

function renderPageControls() {
  $('writing-tools').inert = Boolean(bookFace || blankVerso);
  $('writing-tools-tab').disabled = Boolean(bookFace || blankVerso);
  pageOptions.inert = Boolean(bookFace || blankVerso);
  const pages = visiblePages(currentBook.pages, currentPage, true);
  const start = currentBook.pages.indexOf(pages[0]);
  $('page-size').value = currentPage.size;
  $('font-size').value = currentPage.font;
  $('active-sheet').textContent = 'Folha ' + (currentBook.pages.indexOf(currentPage) + 1) + ' · linhas de referência';
  $('page-total').textContent = `${start + 1}${pages.length > 1 ? '–' + (start + pages.length) : ''} de ${currentBook.pages.length}`;
  if (blankVerso) $('page-total').textContent = 'Verso em branco';
  $('previous-page').disabled = false;
  $('next-page').disabled = false;
  for (const sheet of sheets) sheet.paper.dataset.active = String(sheet.page === currentPage);
  const reader=currentBook.sharing?.permission === 'reader';
  $('edit-mode').disabled=reader;
  $('task-form').inert=reader;
  $('history-button').disabled=reader || preview;
  $('add-page').disabled = reader || currentBook.pages.length >= 500;
  $('sharing-open').disabled=Boolean(currentBook.sharing && currentBook.sharing.permission !== 'owner');
  if ($('edit-notebook')) $('edit-notebook').disabled=reader;
  if (currentBook.collaboration) {
    $('undo-edit').disabled=reader || !activeSheet().visual.editor.can().undo();
    $('redo-edit').disabled=reader || !activeSheet().visual.editor.can().redo();
  }
  if (!currentBook.collaboration) $('undo-edit').disabled = !currentBook.visualError && !currentBook.editHistory?.undo.length;
  if (!currentBook.collaboration) $('redo-edit').disabled = !currentBook.editHistory?.redo.length;
  $('draft-button').hidden = preview || !currentBook.draftChoices?.length;
  if (bookFace) showBookFace(bookFace);
}

function fitWritingHeight(visible = sheets) {
  for (const sheet of sheets) if (!sheet.page) sheet.paper.style.setProperty('--writing-height', '0px');
  for (const sheet of visible) {
    if (!sheet.page) continue;
    const page = sheet.page;
    const height = pageCapacity(page.size, page.font).lines * page.font * 1.75;
    sheet.paper.style.setProperty('--writing-height', height + 'px');
    const content = field(sheet, 'page-content');
    content.style.height = 'auto';
    content.style.height = Math.max(height, content.scrollHeight) + 'px';
    sheet.paper.style.setProperty('--ruling-offset', (sourceMode ? (reading ? field(sheet, 'page-preview') : content) : field(sheet, 'page-visual')).offsetTop + 'px');
  }
  const reference = Math.max(...currentBook.pages.map(page => pageCapacity(page.size, page.font).lines * page.font * 1.75)) + 232;
  currentBook.paperHeight = fitNotebookHeight(sheets.map(sheet => sheet.paper), reference);
  fitCover();
}

function selectPage(page, animate = false, remember = animate, drag) {
  if (currentBook?.visualError) { drag?.outgoing?.remove(); notify('Resolva a edição visual pendente antes de trocar de página.'); return; }
  if (!page) return;
  showBookFace(null);
  stopNotebookMotion();
  const direction = drag?.direction || (currentBook.pages.indexOf(page) >= currentBook.pages.indexOf(currentPage) ? 1 : -1);
  const reducedMotion = document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const turningSheet = sheets[direction < 0 ? 0 : 1];
  const outgoing = drag?.outgoing || (animate ? capturePaper(turningSheet.paper, $('motion-mode').value, reducedMotion) : null);
  const stationary = animate && outgoing ? pageSurface(sheets[direction < 0 ? 1 : 0], sheets[direction < 0 ? 1 : 0].page) : null;
  if (outgoing) prepareTurn(outgoing, direction, page);
  currentPage = page;
  blankVerso = false;
  renderIndex();
  renderPage();
  if (animate) {
    closeNotebookHud();
    if (stationary) sheets[direction < 0 ? 1 : 0].paper.parentElement.append(stationary);
    turnPaper(turningSheet.paper, direction, $('motion-mode').value, reducedMotion, outgoing, drag?.progress || 0, () => { stationary?.remove(); if (notebookFrameMode === 'page') frameNotebook(); else if (!notebookFrameMode) centerNotebook(); });
  } else if (notebookFrameMode === 'page') frameNotebook();
  else if (!notebookFrameMode) centerNotebook();
  if (remember) { currentBook.interactedAt = Date.now(); rememberPosition(true); }
}

function openBook(book) {
  if (currentBook?.visualError) return;
  rememberPosition(true);
  currentBook = book;
  if (book.collaboration) sharing.connect(book).catch(error=>notify(error.message));
  studyReminder.dismiss();
  $('page-search').value = '';
  applyAppearance();
  setReading(book.preferences.reading);
  $('notebook-title').textContent = book.title;
  $('notebook-subject').textContent = book.subject || '';
  $('notebook-tags').replaceChildren(...book.tags.map(tag => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = '#' + tag;
    return span;
  }));
  $('writing-note').textContent = preview ? 'Prévia visual: o texto fica apenas nesta aba e será perdido ao recarregar.'
    : 'Salvamento automático durante a escrita. Aguarde “Salvo” antes de fechar.';
  renderSaveState();
  showView('notebook');
  const resume = recentPosition(book);
  selectPage(resume?.page || book.pages[0]);
  if (!resume) {
    showBookFace('front');
    closeNotebookHud();
    frameNotebook('whole');
  }
  if (resume) {
    frameNotebook('page');
    field(activeSheet(), 'page-content').setSelectionRange(resume.caret, resume.caret);
    requestAnimationFrame(() => {
      const paper = activeSheet().paper;
      positionNotebook(viewport, Number(viewport.dataset.offset) || 0, (Number(viewport.dataset.vertical) || 0) + writingBounds().top - paper.getBoundingClientRect().top - paper.getBoundingClientRect().height * resume.fraction);
    });
  }
}

function newPage(content = '', size = 'medium', font = 16) {
  const now = new Date();
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  return { id: crypto.randomUUID(), title: '', content, size, font, date };
}

function updateContent(sheet = activeSheet(), recordHistory = true, typing = true) {
  const page = sheet.page;
  if (!page) return;
  const content = field(sheet, 'page-content');
  const caret = content.selectionStart;
  if (currentBook.collaboration) {
    if (currentBook.sharing.permission === 'reader') {renderPage();return;}
    page.title=field(sheet,'page-title').value;page.content=content.value;
    sheet.visual.writeFragment(page.content,currentBook.collaboration.doc.getXmlFragment('text:'+page.id));
    changed();fitWritingHeight([sheet]);renderIndex();return;
  }
  if (recordHistory) rememberEdit(currentBook, page.id, Math.min(caret, page.content.length), typing);
  page.title = field(sheet, 'page-title').value;
  const ranges = [...styleRanges(content.value), ...(countLines(content.value, page.size, page.font) > pageCapacity(page.size, page.font).lines
    ? protectedBlocks(content.value, markdown.parse(content.value, {})) : [])].sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const { chunks, limited } = planPageEdit(content.value, page.size, page.font, currentBook.pages.length, ranges);
  if (limited) {
    page.content = content.value;
    changed(); renderIndex(); renderPage();
    notify('Limite de 500 páginas. O texto foi mantido nesta folha, sem divisão.');
    return;
  }
  page.content = chunks[0];
  if (chunks.length > 1) {
    const nextPages = chunks.slice(1).map(chunk => newPage(chunk, page.size, page.font));
    const index = currentBook.pages.indexOf(page);
    currentBook.pages.splice(index + 1, 0, ...nextPages);
    let offset = page.content.length;
    let selected = page;
    let localCaret = caret;
    for (const page of nextPages) {
      if (caret >= offset) { selected = page; localCaret = caret - offset; }
      offset += page.content.length;
    }
    selectPage(selected);
    const selectedContent = field(activeSheet(), 'page-content');
    selectedContent.setSelectionRange(localCaret, localCaret);
    focusContent(activeSheet(), localCaret);
    notify('A escrita continuou em uma nova página.');
  } else {
    sheet.paper.style.setProperty('--font-size', page.font + 'px');
    sheet.paper.style.setProperty('--line-height', page.font * 1.75 + 'px');
    field(sheet, 'line-count').textContent = `${countLines(page.content, page.size, page.font)} / ${pageCapacity(page.size, page.font).lines} linhas de referência`;
    field(sheet, 'word-count').textContent = `${countWords(page.content)} palavras`;
    fitWritingHeight([sheet]);
    renderPageControls();
    if (reading && sourceMode) renderStudyPreview(field(sheet, 'page-preview'), page.content);
  }
  changed();
}

function changed(book = currentBook) {
  if (preview) return;
  if (book.collaboration) { sharing.changed(book);renderSaveState();renderCollectionSaveState();return; }
  book.generation += 1;
  book.lastEdit = Date.now();
  book.interactedAt = book.lastEdit;
  if (book === currentBook && !bookFace && book.pages.includes(currentPage) && document.body.classList.contains('studying')) {
    const sheet = activeSheet();
    const rectangle = sheet.paper.getBoundingClientRect();
    book.position = { pageId: currentPage.id, caret: field(sheet, 'page-content').selectionStart,
      fraction: Math.max(0, Math.min(1, (writingBounds().top - rectangle.top) / rectangle.height)), at: book.lastEdit };
  }
  book.firstEdit ||= Date.now();
  renderSaveState();
  renderCollectionSaveState();
}

function renderSaveState() {
  if (!currentBook) return;
  const book = currentBook;
  const state = book.collaboration ? book.collaborationStatus || (book.sharing?.permission === 'reader' ? 'Somente leitura' : 'Sincronizando…') : book.visualError ? 'Edição visual pendente' : preview ? 'Prévia · sem salvamento' : book.conflict ? 'Conflito · rascunho preservado'
    : book.error ? book.protectedGeneration === book.generation ? 'Erro de envio · protegido aqui' : 'Erro · alterações pendentes' : book.running ? 'Salvando…'
      : book.generation !== book.confirmed ? book.protectedGeneration === book.generation
        ? 'Protegido aqui · envio pendente' : 'Alterações pendentes' : 'Salvo';
  if ($('save-state').textContent !== state) $('save-state').textContent = state;
  $('save-state').dataset.state = book.error || book.conflict || book.visualError ? 'error' : book.running ? 'saving' : 'saved';
  $('save-error').hidden = !(book.error || book.visualError);
  const error = book.visualError ? book.visualError + ' A edição permanece nesta folha; copie o texto ou desfaça antes de sair.' : book.error?.message || '';
  const errorMessage = $('save-error').querySelector('p');
  if (errorMessage.textContent !== error) errorMessage.textContent = error;
  $('resolve-conflict').hidden = !book.conflict;
  $('retry-save').hidden = Boolean(book.conflict || book.visualError);
  $('local-save-state').hidden = preview || !(book.localError || book.draftWarning);
  const localState = book.localError ? 'Proteção local indisponível: ' + book.localError.message + ' Aguarde a confirmação do servidor antes de fechar.' : book.draftWarning?.message || '';
  if ($('local-save-state').textContent !== localState) $('local-save-state').textContent = localState;
}

async function persist(book) {
  try { await saveBook(book, api, () => protectDraft(book)); }
  catch (error) { book.error = error; }
  if (book.generation === book.confirmed && !book.batch) {
    try { await clearDraft(book); } catch (error) { book.localError = error; }
  }
  if (book.generation === book.confirmed) book.firstEdit = 0;
  renderSaveState();
  renderCollectionSaveState();
}

async function enterWorkspace() {
  const result = await api('/api/notebooks');
  // ponytail: carregar todos no MVP local; paginação e resumo parcial explícito quando houver volume.
  const loaded = [];
  for (const record of result.notebooks) {
    const book = await loadBook(record, session.user, session.keyset, rootKey);
    try {
      const drafts = record.is_shared ? [] : await readDrafts(book, draftStore, error => { book.draftWarning = error; });
      if (drafts.length === 1) { recoverDraft(book, drafts[0]); notify('Seu rascunho protegido foi recuperado.'); }
      else if (drafts.length) book.draftChoices = drafts;
    } catch (error) { book.localError = error; }
    loaded.push(book);
  }
  try {
    const defaults = (await draftStore('list')).find(record => record.id === 'defaults:' + session.user.id);
    if (defaults) {
      const value = await open(rootKey, defaults.envelope, 'defaults:' + session.user.id);
      pageCapacity(value.size, value.font);
      personalDefaults = { ...value, preferences: preferences(value.preferences) };
    }
  } catch (error) { notify('Não foi possível carregar seu padrão local: ' + error.message); }
  books.splice(0, books.length, ...loaded);
  await sharing.load();
  $('profile-name').textContent = session.user.display_name;
  $('avatar').textContent = session.user.display_name.slice(0, 2).toUpperCase();
  $('auth-view').hidden = true;
  $('workspace').hidden = false;
  $('auth-form').reset();
  $('unlock-form').reset();
  if ($('unlock-dialog').open) $('unlock-dialog').close();
  renderCollection();
  history.replaceState({ view: 'home' }, '', '#home');
  showView('home', false);
}

async function logout() {
  if (creatingBook) throw new Error('Há um caderno com criação pendente. Abra Novo caderno e tente novamente antes de sair.');
  if (currentBook?.visualError) throw new Error('Há uma edição visual pendente; copie o texto ou desfaça antes de sair.');
  if (!social.prepareLogout()) return;
  $('workspace').inert = true;
  try {
    if (!preview) {
      await sharing.flushAll();
      for (const book of books) {
        if (book.collaboration) continue;
        while (book.generation !== book.confirmed || book.batch) await saveBook(book, api, () => protectDraft(book));
        await clearDraft(book);
      }
      await api('/api/logout', {});
    }
    social.completeLogout();
    sharing.destroy();
    rootKey = null;
    books.length = 0;
    location.href = '/';
  } catch (error) {
    social.cancelLogout();
    throw error;
  } finally { $('workspace').inert = false; }
}

$('today').textContent = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(new Date());
$('auth-toggle').addEventListener('click', () => {
  signingUp = !signingUp;
  $('name-field').hidden = !signingUp;
  $('name-field').querySelector('input').required = signingUp;
  $('age-attestation').hidden = !signingUp;
  $('age-attestation').disabled = !signingUp;
  $('content-password-fields').hidden = !signingUp;
  $('content-password-fields').disabled = !signingUp;
  $('auth-form').elements.password.autocomplete = signingUp ? 'new-password' : 'current-password';
  $('auth-heading').textContent = signingUp ? 'Criar conta' : 'Entrar';
  $('auth-error').textContent = '';
  $('auth-submit').textContent = signingUp ? 'Criar minha conta' : 'Entrar';
  $('auth-toggle').textContent = signingUp ? 'Já tenho conta. Entrar' : 'Primeira vez? Crie sua conta';
});
$('auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (event.target.inert) return;
  const resumeForm = pauseForm(event.target);
  let failed = false;
  $('auth-error').textContent = '';
  $('auth-submit').disabled = true;
  $('auth-toggle').disabled = true;
  $('recovery-open').disabled = true;
  $('auth-form').setAttribute('aria-busy', 'true');
  $('auth-submit').textContent = signingUp ? 'Criando sua biblioteca…' : 'Entrando…';
  try {
    const data = new FormData(event.target);
    const body = { email: data.get('email'), password: data.get('password') };
    if (signingUp) body.adultConfirmed = data.get('adult-confirmed') === 'on';
    if (signingUp) {
      const password = $('signup-content-password').value;
      if (password !== $('signup-content-confirmation').value) throw new Error('A confirmação da senha de conteúdo não confere.');
      if (password === body.password) throw new Error('Use uma senha de conteúdo diferente da senha da conta.');
      const id = crypto.randomUUID();
      const keysetId = crypto.randomUUID();
      const root = await createRoot(password, id, keysetId);
      await api('/api/register', { ...body, id, keysetId, name: data.get('name'), rootEnvelope: root.envelope });
      rootKey = root.key;
      session = await api('/api/me');
      event.target.reset();
      await enterWorkspace();
    } else {
      await api('/api/login', body);
      session = await api('/api/me');
      event.target.reset();
      $('unlock-dialog').showModal();
    }
  } catch (error) { failed = true; $('auth-error').textContent = error.message; }
  finally {
    $('auth-submit').disabled = false; $('auth-toggle').disabled = false;
    $('recovery-open').disabled = false;
    $('auth-form').setAttribute('aria-busy', 'false');
    $('auth-submit').textContent = signingUp ? 'Criar minha conta' : 'Entrar';
    resumeForm(failed);
  }
});
function notebookDialog(book) {
  if ($('notebook-form').inert) return;
  editingBook = book;
  const form = $('notebook-form');
  form.reset();
  $('notebook-form-error').textContent = !book && creatingBook
    ? 'Uma criação anterior aguarda confirmação. Envie novamente para retomar o mesmo caderno.' : '';
  const values = book || creatingBook;
  $('notebook-dialog').querySelector('h2').textContent = book ? 'Editar caderno' : 'Novo caderno';
  form.querySelector('[type=submit]').textContent = book ? 'Guardar alterações' : 'Criar caderno';
  if (values) for (const field of ['title', 'subject', 'tags']) {
    form.elements[field].value = field === 'tags' ? values.tags.join(', ') : values[field];
  }
  form.elements.shelves.value = values ? organization(values.organization).shelves.join(', ')
    : collectionShelves(books).find(shelf => 'shelf:' + shelf.key === $('collection-filter').value)?.name || '';
  form.elements.favorite.checked = organization(values?.organization).favorite;
  $('initial-size-field').hidden = Boolean(book);
  form.elements.size.value = creatingBook && !book ? creatingBook.pages[0].size : personalDefaults.size;
  $('notebook-dialog').showModal();
}
for (const id of ['new-notebook', 'first-notebook']) $(id).addEventListener('click', () => notebookDialog(null));
for (const element of document.querySelectorAll('[data-close]')) element.addEventListener('click', () => $(element.dataset.close).close());
$('notebook-dialog').addEventListener('cancel', event => {
  if ($('notebook-form').inert) event.preventDefault();
});
$('notebook-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (event.target.inert) return;
  const data = new FormData(event.target);
  const meta = {
    title: data.get('title').trim(), subject: data.get('subject').trim(),
    tags: data.get('tags').split(',').map(tag => tag.trim()).filter(Boolean),
  };
  if (!meta.title) { $('notebook-form-error').textContent = 'Informe o nome do caderno.'; return; }
  const resumeForm = pauseForm(event.target);
  let failed = false;
  $('notebook-form-error').textContent = '';
  const submit = event.target.querySelector('[type=submit]');
  submit.disabled = true;
  submit.textContent = editingBook ? 'Guardando alterações…' : 'Criando caderno…';
  $('notebook-dialog').setAttribute('aria-busy', 'true');
  try {
    meta.organization = organization({ shelves: data.get('shelves').split(',').map(name => name.trim()).filter(Boolean),
      favorite: data.get('favorite') === 'on' });
    const size = data.get('size');
    if (!editingBook) pageCapacity(size, personalDefaults.font);
    const book = editingBook || (creatingBook ||= { id: crypto.randomUUID(), preferences: { ...personalDefaults.preferences },
      pages: [newPage('', size, personalDefaults.font)], tasks: [] });
    Object.assign(book, meta);
    if (!editingBook) book.pages[0].size = size;
    if (editingBook) changed(book);
    else {
      if (!preview) await createBook(book, session.user, session.keyset, rootKey);
      books.push(book);
      creatingBook = null;
    }
    $('notebook-dialog').close();
    event.target.reset();
    renderCollection();
    openBook(book);
  } catch (error) { failed = true; $('notebook-form-error').textContent = error.message; }
  finally {
    $('notebook-dialog').setAttribute('aria-busy', 'false');
    submit.disabled = false;
    submit.textContent = editingBook ? 'Guardar alterações' : 'Criar caderno';
    resumeForm(failed);
  }
});
$('back-library').addEventListener('click', () => { renderCollection(); showView('library'); });
$('collection-search').addEventListener('input', renderCollection);
$('collection-filter').addEventListener('change', renderCollection);
$('clear-collection').addEventListener('click', () => {
  $('collection-search').value = ''; $('collection-filter').value = 'all'; renderCollection(); $('collection-search').focus();
});
$('add-page').addEventListener('click', () => {
  if (currentBook.visualError) { notify('Resolva a edição visual pendente antes de criar outra folha.'); return; }
  if (currentBook.sharing?.permission === 'reader') return;
  if (currentBook.pages.length >= 500) { notify('Limite local: 500 páginas por caderno. Abra outro caderno.'); return; }
  const page = newPage('', currentPage.size, currentPage.font);
  rememberEdit(currentBook, currentPage.id, field(activeSheet(), 'page-content').selectionStart);
  currentBook.preferences.reading = false;
  currentBook.pages.push(page); selectPage(page); setReading(false); changed();
  closeNotebookHud(); focusContent();
});
for (const sheet of sheets) {
  const activate = () => {
    if (!sheet.page || sheet.page === currentPage) return;
    stopNotebookMotion();
    currentPage = sheet.page;
    renderPageControls();
    renderIndex();
  };
  sheet.paper.addEventListener('focusin', activate);
  sheet.paper.addEventListener('pointerdown', activate);
  field(sheet, 'page-content').addEventListener('input', event => {
    stopNotebookMotion();
    if (!event.isComposing) updateContent(sheet);
  });
  field(sheet, 'page-content').addEventListener('compositionstart', () => { composingSheet = sheet; });
  field(sheet, 'page-content').addEventListener('compositionend', () => {
    composingSheet = null; updateContent(sheet); renderLayout();
  });
  field(sheet, 'page-visual').addEventListener('compositionstart', () => { composingSheet = sheet; });
  field(sheet, 'page-visual').addEventListener('compositionend', () => {
    composingSheet = null; queueMicrotask(() => { updateContent(sheet); renderLayout(); });
  });
  field(sheet, 'page-date').addEventListener('input', event => {
    event.currentTarget.toggleAttribute('data-empty', !event.currentTarget.value);
  });
  field(sheet, 'page-date').addEventListener('change', () => {
    if (reading || !sheet.page) return;
    try {
      const date = pageDate(field(sheet, 'page-date').value);
      rememberEdit(currentBook, sheet.page.id, field(sheet, 'page-content').selectionStart);
      sheet.page.date = date;
      changed(); renderPageControls();
    } catch (error) { field(sheet, 'page-date').value = sheet.page.date || ''; notify(error.message); }
  });
  field(sheet, 'page-title').addEventListener('input', () => {
    stopNotebookMotion();
    rememberEdit(currentBook, sheet.page.id, field(sheet, 'page-title').selectionStart, true);
    sheet.page.title = field(sheet, 'page-title').value;
    changed(); renderIndex(); renderPageControls();
  });
  for (const id of ['page-content', 'page-title', 'page-visual']) field(sheet, id).addEventListener('keydown', stopNotebookMotion);
}
function renderLayout() {
  stopNotebookMotion();
  if (!currentPage || composingSheet) return;
  const previous = activeSheet();
  const visualSelection = previous.visual.editor.isFocused && !sourceMode ? previous.visual.editor.state.selection.toJSON() : null;
  const focused = ['page-title', 'page-content', 'page-preview'].find(id => field(previous, id) === document.activeElement);
  const content = focused && field(previous, focused);
  const selection = content && [content.selectionStart, content.selectionEnd, content.selectionDirection];
  renderPage();
  if (visualSelection) {
    const editor = activeSheet().visual.editor;
    editor.commands.setTextSelection({ from: Math.min(visualSelection.anchor, editor.state.doc.content.size), to: Math.min(visualSelection.head, editor.state.doc.content.size) });
    editor.commands.focus();
  }
  if (focused) {
    const target = field(activeSheet(), focused);
    target.focus({ preventScroll: true });
    if (typeof selection[0] === 'number') target.setSelectionRange(...selection);
  }
}
$('sheet-layout').addEventListener('change', () => {
  currentBook.preferences.layout = $('sheet-layout').value; changed(); renderLayout();
});
for (const id of ['page-size', 'font-size']) $(id).addEventListener('change', () => {
  stopNotebookMotion();
  rememberEdit(currentBook, currentPage.id, field(activeSheet(), 'page-content').selectionStart);
  currentPage.size = $('page-size').value;
  currentPage.font = Number($('font-size').value);
  updateContent(activeSheet(), false);
});
function navigateBook(direction, drag) {
  if (currentBook.visualError) { drag?.outgoing?.remove(); notify('Resolva a edição visual pendente antes de virar a folha.'); return; }
  if (bookFace) {
    const face = bookFace;
    if ((face === 'front' && direction < 0) || (face === 'back' && direction > 0)) { drag?.outgoing?.remove(); return; }
    const outgoing = drag?.outgoing || capturePaper(coverFace, $('motion-mode').value, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    selectPage(face === 'front' ? currentBook.pages[0] : currentBook.pages.at(-1));
    if (face === 'back' && currentBook.pages.length % 2) { blankVerso = true; renderPage(); }
    closeNotebookHud();
    turnPaper(sheets[direction < 0 ? 0 : 1].paper, direction, $('motion-mode').value, window.matchMedia('(prefers-reduced-motion: reduce)').matches, outgoing, drag?.progress || 0, () => frameNotebook('page', true));
    return;
  }
  if (blankVerso && direction < 0) { selectPage(currentBook.pages.at(-1), true, true, { ...drag, direction: -1 }); return; }
  const target = blankVerso ? null : adjacentOpening(currentBook.pages, currentPage, direction);
  if (!target && !blankVerso && direction > 0 && currentBook.pages.length % 2) {
    stopNotebookMotion();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const outgoing = drag?.outgoing || capturePaper(sheets[1].paper, $('motion-mode').value, reduced);
    const stationary = outgoing ? pageSurface(sheets[0], sheets[0].page) : null;
    blankVerso = true; renderPage(); closeNotebookHud();
    if (outgoing) {
      const back = pageSurface(sheets[0], null, true); back.classList.remove('drag-preview'); back.classList.add('sheet-back');
      back.style.left = '0px'; back.style.top = '0px'; outgoing.querySelector('.sheet-back').replaceWith(back);
      sheets[0].paper.parentElement.append(stationary);
    }
    turnPaper(sheets[1].paper, 1, $('motion-mode').value, reduced, outgoing, drag?.progress || 0, () => stationary?.remove());
    return;
  }
    if (target) selectPage(target, true, true, drag);
    else {
      stopNotebookMotion();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
       const source = sheets[direction < 0 ? 0 : 1].paper;
       const outgoing = drag?.outgoing || capturePaper(source, $('motion-mode').value, reduced);
       prepareTurn(outgoing, direction, null);
      const page = direction < 0 ? currentBook.pages[0] : currentBook.pages.at(-1);
      if (currentPage !== page) selectPage(page);
      showBookFace(direction < 0 ? 'front' : 'back', !outgoing);
       if (outgoing) { closeNotebookHud(); spread.hidden = false; spread.classList.add('closing-book'); coverStage.style.visibility = 'hidden'; source.style.visibility = 'hidden'; }
       turnPaper(source, direction, $('motion-mode').value, reduced, outgoing, drag?.progress || 0, () => {
         spread.hidden = Boolean(bookFace); spread.classList.remove('closing-book'); coverStage.style.visibility = ''; source.style.visibility = '';
          if (bookFace) frameNotebook('whole', true);
         if (bookFace && !reading && window.innerWidth > 720) { closeNotebookHud(); $('notebook-hud').open = true; }
       });
    }
}
for (const [id, direction] of [['previous-page', -1], ['next-page', 1]]) $(id).addEventListener('click', () => navigateBook(direction));
function pageSurface(sheet, page, blank = false) {
    const copy = sheet.paper.cloneNode(true);
    copy.classList.add('drag-preview'); copy.classList.toggle('inside-guard', !page && !blank);
    copy.hidden = false; copy.inert = true; copy.setAttribute('aria-hidden', 'true');
    copy.style.boxShadow = 'none';
    const surface = sheet.paper;
    copy.style.left = surface.offsetLeft + 'px';
    copy.style.top = surface.offsetTop + 'px';
    copy.style.width = surface.offsetWidth + 'px';
    copy.style.height = surface.offsetHeight + 'px';
    for (const element of copy.querySelectorAll('.paper-top, .paper-bottom, .page-title, textarea, .visual-host, .markdown')) element.hidden = !page;
    if (page) {
      const part = id => copy.querySelector('[id="' + id + sheet.suffix + '"]');
      const position = currentBook.pages.indexOf(page) + 1;
      part('page-date').value = page.date || '';
      part('page-date').toggleAttribute('data-empty', !page.date);
      part('page-title').value = page.title;
      part('page-title').hidden = reading && !page.title;
      part('page-content').value = page.content;
      const visual = part('page-visual');
      if (page !== sheet.page) visual.replaceChildren(sheet.visual.surface(page.content));
      visual.hidden = sourceMode; part('page-content').hidden = reading || !sourceMode; part('page-preview').hidden = !reading || !sourceMode;
      renderStudyPreview(part('page-preview'), page.content);
      part('page-number').textContent = 'PÁGINA ' + String(position).padStart(2, '0');
      part('page-position').textContent = String(position).padStart(2, '0');
      part('line-count').textContent = `${countLines(page.content, page.size, page.font)} / ${pageCapacity(page.size, page.font).lines} linhas de referência`;
      part('word-count').textContent = `${countWords(page.content)} palavras`;
      copy.style.setProperty('--font-size', page.font + 'px');
      copy.style.setProperty('--line-height', page.font * 1.75 + 'px');
    }
    for (const element of [copy, ...copy.querySelectorAll('[id]')]) element.removeAttribute('id');
    return copy;
}
function prepareTurn(copy, direction, target = adjacentOpening(currentBook.pages, currentPage, direction)) {
  if (!copy || bookFace) return;
  const landing = sheets[direction < 0 ? 1 : 0];
  let back;
  if (target) back = pageSurface(landing, bookOpening(currentBook.pages, target)[direction < 0 ? 1 : 0]);
  else if (!blankVerso && direction > 0 && currentBook.pages.length % 2) back = pageSurface(landing, null, true);
  else {
    back = coverFace.cloneNode(true); decorateCover(back, currentBook, direction < 0 ? 'front' : 'back');
    for (const element of [back, ...back.querySelectorAll('[id]')]) element.removeAttribute('id');
  }
  back.classList.remove('drag-preview'); back.classList.add('sheet-back');
  back.style.left = '0px'; back.style.top = '0px';
  copy.querySelector('.sheet-back').replaceWith(back);
}
function previewPageTurn(direction, outgoing) {
  if (currentBook.visualError) return;
  const target = bookFace ? (bookFace === 'front' ? currentBook.pages[0] : currentBook.pages.at(-1))
    : blankVerso ? (direction < 0 ? currentBook.pages.at(-1) : null) : adjacentOpening(currentBook.pages, currentPage, direction);
  prepareTurn(outgoing, direction, target);
  if (!target) {
    if (!bookFace && !blankVerso && direction > 0 && currentBook.pages.length % 2) {
      const copy = pageSurface(sheets[1], null); sheets[1].paper.parentElement.append(copy);
      return () => copy.remove();
    }
    const paper = sheets[direction < 0 ? 0 : 1].paper;
    paper.style.visibility = 'hidden';
    return () => { paper.style.visibility = ''; };
  }
  const sheet = sheets[direction < 0 ? 0 : 1];
  const backOpening = bookFace === 'back' && currentBook.pages.length % 2;
  const copy = pageSurface(sheet, bookFace || backOpening ? null : bookOpening(currentBook.pages, target)[direction < 0 ? 0 : 1], backOpening);
  if (bookFace) { copy.style.left = coverFace.offsetLeft + 'px'; coverStage.append(copy); }
  else sheet.paper.parentElement.append(copy);
  return () => copy.remove();
}
for (const [name, className] of [['direita', 'page-corner'], ['esquerda', 'page-corner previous-corner'],
  ['superior', 'page-edge'], ['inferior', 'page-edge page-edge-bottom']]) {
  const edge = document.createElement('button'); edge.type = 'button'; edge.className = className;
  edge.dataset.direction = '1';
  edge.tabIndex = -1; edge.setAttribute('aria-label', 'Arrastar borda ' + name + ' da capa');
  coverFace.append(edge);
  coverGestures.push(setupPageCorner(edge, coverFace,
    () => ({ mode: $('motion-mode').value, reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      freeDirection: true, allowedDirection: bookFace === 'front' ? 1 : -1, dragOnly: true,
      pan: viewport.dataset.pan === 'true', preview: previewPageTurn }), (direction, drag) => navigateBook(direction, drag)));
}
for (const sheet of sheets) {
  const next = sheet.paper.querySelector('.page-corner'); next.dataset.direction = '1'; next.textContent = '';
  const previous = next.cloneNode(true); previous.dataset.direction = '-1'; previous.classList.add('previous-corner');
  previous.setAttribute('aria-label', 'Arrastar ou clicar para voltar uma folha'); previous.textContent = ''; sheet.paper.append(previous);
  const edges = ['superior', 'inferior'].map((name, index) => {
    const edge = document.createElement('button'); edge.type = 'button'; edge.className = 'page-edge' + (index ? ' page-edge-bottom' : '');
    edge.dataset.direction = '1'; edge.tabIndex = -1; edge.setAttribute('aria-label', `Arrastar borda ${name} para virar a folha`); sheet.paper.append(edge); return edge;
  });
  for (const edge of [next, previous, ...edges]) edge.title = 'Arraste a borda para a esquerda ou direita';
  sheet.cancelCorners = [next, previous, ...edges].map(corner => setupPageCorner(corner, sheet.paper,
    () => ({ mode: $('motion-mode').value, reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      allowedDirection: sheet === sheets[0] ? -1 : 1, freeDirection: true,
      pan: viewport.dataset.pan === 'true', dragOnly: corner.classList.contains('page-edge'), preview: previewPageTurn }),
    (direction, drag) => navigateBook(direction, drag ? { ...drag, sheet } : undefined)));
}
$('page-top').addEventListener('click', () => {
  closeNotebookHud();
  stopNotebookMotion();
  if (bookFace) { frameNotebookTop(coverFace); coverFace.tabIndex = -1; coverFace.focus({ preventScroll: true }); return; }
  if (blankVerso) selectPage(currentPage);
  const sheet = activeSheet();
    frameNotebookTop(sheet.paper);
  if (reading) {
    const target = field(sheet, sourceMode ? 'page-preview' : 'page-visual');
    target.tabIndex = -1; target.focus({ preventScroll: true });
  }
  else field(sheet, 'page-title').focus({ preventScroll: true });
});
function setReading(nextReading) {
  stopNotebookMotion();
  reading = nextReading || currentBook?.sharing?.permission === 'reader';
  coverEditor.render();
  if (bookFace && !reading && window.innerWidth > 720) { closeNotebookHud(); $('notebook-hud').open = true; }
  if (currentBook?.preferences) currentBook.preferences.reading = reading;
  if (currentPage && currentBook.pages.includes(currentPage)) renderPage();
  for (const [buttonId, selected] of [['edit-mode', !reading], ['preview-mode', reading]]) {
    $(buttonId).classList.toggle('selected', selected);
    $(buttonId).setAttribute('aria-pressed', String(selected));
  }
}
for (const [id, nextReading] of [['edit-mode', false], ['preview-mode', true]]) $(id).addEventListener('click', () => {
  currentBook.preferences.reading = nextReading; changed(); setReading(nextReading);
});
$('motion-mode').addEventListener('change', () => {
  stopNotebookMotion();
  currentBook.preferences.motion = $('motion-mode').value; changed();
  syncAmbient();
});
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
  stopNotebookMotion();
  sceneLight.getAnimations().forEach(animation => animation.cancel());
});
window.addEventListener('resize', () => {
  stopNotebookMotion();
  if (currentPage && !composingSheet && document.body.classList.contains('studying')) {
    fitWritingHeight();
    if (window.innerWidth <= 720) closeNotebookHud();
    if (notebookFrameMode) frameNotebook(bookFace ? 'whole' : notebookFrameMode);
    else centerNotebook();
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopNotebookMotion(); });
for (const [id, name] of [['paper-style', 'paper'], ['cover-style', 'cover'], ['writing-font', 'font'],
  ['paper-ruling', 'ruling'], ['desk-style', 'desk'], ['light-style', 'light'], ['book-binding', 'binding'], ['cover-color', 'coverColor'], ['cover-finish', 'finish']]) {
  $(id).addEventListener('change', () => {
    currentBook.preferences[name] = $(id).value;
    applyAppearance(); changed(); fitWritingHeight();
  });
}
$('reset-cover-color').addEventListener('click', () => { currentBook.preferences.coverColor = ''; applyAppearance(); changed(); });
$('ambient-enabled').addEventListener('change', () => { currentBook.preferences.ambient = $('ambient-enabled').checked; syncAmbient(); changed(); });
function updateStudyReminder() {
  $('study-reminder').hidden = !studyReminder.update(!document.hidden && document.body.classList.contains('studying'), currentBook?.preferences?.reminder === true);
}
$('reminder-enabled').addEventListener('change', () => {
  currentBook.preferences.reminder = $('reminder-enabled').checked; changed(); updateStudyReminder();
});
$('dismiss-reminder').addEventListener('click', () => { studyReminder.dismiss(); updateStudyReminder(); });
document.addEventListener('visibilitychange', updateStudyReminder);
setInterval(updateStudyReminder, 1000);
$('save-defaults').addEventListener('click', async () => {
  personalDefaults = { preferences: { ...currentBook.preferences }, size: currentPage.size, font: currentPage.font };
  try {
    if (!preview) await draftStore('put', { id: 'defaults:' + session.user.id,
      envelope: await seal(rootKey, personalDefaults, 'defaults:' + session.user.id) });
    notify(preview ? 'Padrão aplicado nesta prévia; recarregar descarta.' : 'Seu padrão foi protegido neste dispositivo.');
  } catch (error) { notify('Padrão aplicado nesta aba, mas não foi gravado: ' + error.message); }
});
$('notebook-zoom').addEventListener('input', () => {
  const target = bookFace ? coverFace : spread;
  const before = target.getBoundingClientRect();
  notebookFrameMode = null;
  currentBook.preferences.zoom = setZoom(Number($('notebook-zoom').value) / 100);
  document.body.style.setProperty('--book-zoom', currentBook.preferences.zoom);
  fitWritingHeight();
  $('zoom-value').textContent = $('notebook-zoom').value + '%'; changed();
  animateNotebookCamera(viewport, before, target.getBoundingClientRect(), currentBook.preferences.motion, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
});
$('center-notebook').addEventListener('click', () => {
  closeNotebookHud(); centerNotebook(true);
});
const fitNotebook = button('Ajustar largura', 'text-button', () => {
  closeNotebookHud(); frameNotebook('page', true); changed();
});
$('center-notebook').after(fitNotebook);
fitNotebook.after(button('Ver inteiro', 'text-button', () => {
  closeNotebookHud(); frameNotebook('whole', true); changed();
}));
$('focus-writing').addEventListener('click', () => {
  setNotebookPan(false);
  if (bookFace || blankVerso) selectPage(currentPage);
  setReading(false); closeNotebookHud();
  frameNotebook('page');
  if (!sourceMode) {
    const editor = activeSheet().visual.editor;
    editor.commands.focus();
    const position = editor.view.coordsAtPos(editor.state.selection.head);
    revealNotebookRect(viewport, position, writingBounds());
    positionNotebook(viewport, Number(viewport.dataset.offset) || 0, (Number(viewport.dataset.vertical) || 0) + window.innerHeight * .4 - position.top);
    return;
  }
  const content = field(activeSheet(), 'page-content');
  content.focus({ preventScroll: true });
  const top = sourceCaretTop(activeSheet());
  positionNotebook(viewport, Number(viewport.dataset.offset) || 0, (Number(viewport.dataset.vertical) || 0) + window.innerHeight * .4 - top);
});
function sourceCaretTop(sheet) {
  const content = field(sheet, 'page-content');
  const measure = document.createElement('div');
  const style = getComputedStyle(content);
  for (const name of ['fontFamily', 'fontSize', 'lineHeight', 'whiteSpace', 'overflowWrap']) measure.style[name] = style[name];
  measure.style.width = content.clientWidth + 'px';
  measure.className = 'caret-measure';
  measure.textContent = content.value.slice(0, content.selectionStart) + '\u200b';
  sheet.paper.append(measure);
  const top = content.getBoundingClientRect().top + measure.offsetHeight * currentBook.preferences.zoom;
  measure.remove();
  return top;
}
for (const sheet of sheets) for (const name of ['input', 'keyup', 'select']) field(sheet, 'page-content').addEventListener(name, () => {
  requestAnimationFrame(() => {
    if (!sourceMode || bookFace || composingSheet || document.activeElement !== field(sheet, 'page-content')) return;
    const bounds = writingBounds();
    const top = sourceCaretTop(sheet);
    revealNotebookRect(viewport, { left: bounds.left, right: bounds.left, top: top - sheet.page.font * currentBook.preferences.zoom * 1.75, bottom: top }, bounds);
  });
});
function undoEdit(redo = false) {
  if (currentBook.collaboration) {if(currentBook.sharing.permission !== 'reader') activeSheet().visual.editor.commands[redo?'redo':'undo']();return;}
  if (currentBook.visualError) {
    currentBook.visualError = null; activeSheet().visual.reload(); renderPage(); renderSaveState(); focusContent(); return;
  }
  const state = restoreEdit(currentBook, currentPage.id, field(activeSheet(), 'page-content').selectionStart, redo);
  if (!state) return;
  selectPage(state.page); setReading(false);
  const content = field(activeSheet(), 'page-content');
  content.setSelectionRange(state.caret, state.caret); focusContent(activeSheet(), state.caret); changed();
}
$('undo-edit').addEventListener('click', () => undoEdit());
$('redo-edit').addEventListener('click', () => undoEdit(true));
function formatText(format) {
  setReading(false);
  if (!sourceMode) { activeSheet().visual.format(format); return; }
  const content = field(activeSheet(), 'page-content');
  const change = formatSelection(content.value, content.selectionStart, content.selectionEnd, format);
  applyTextChange(change);
}

function applyTextChange(change, sheet = activeSheet()) {
  if (composingSheet) { notify('Conclua a composição do texto antes de formatar.'); return; }
  const content = field(sheet, 'page-content');
  rememberEdit(currentBook, currentPage.id, content.selectionStart);
  content.setRangeText(change.text, change.start, change.end, 'select');
  content.focus({ preventScroll: true }); content.setSelectionRange(...change.selection);
  updateContent(sheet, false);
}
for (const [selector, label, path] of [
  ['[data-format="list"]', 'Lista', 'M8 6h12M8 12h12M8 18h12M3 6h1M3 12h1M3 18h1'],
  ['[data-format="code"]', 'Código', 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16'],
  ['#undo-edit', 'Desfazer edição', 'M8 4L3 9l5 5M3 9h10a7 7 0 0 1 0 14'],
  ['#redo-edit', 'Refazer edição', 'M16 4l5 5-5 5M21 9H11a7 7 0 0 0 0 14'],
]) {
  const control = document.querySelector(selector);
  control.setAttribute('aria-label', label);
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [name, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) icon.setAttribute(name, value);
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path'); line.setAttribute('d', path); icon.append(line);
  control.replaceChildren(icon);
}
for (const button of document.querySelectorAll('[data-format]')) button.addEventListener('click', () => formatText(button.dataset.format));
function handleWritingShortcut(event, sheet, selected) {
  if (reading || composingSheet) return;
  const action = writingShortcut(event, selected);
  if (!action) return;
  event.preventDefault(); event.stopPropagation();
  currentPage = sheet.page;
  if (action === 'colors') openColors(sheet);
  else if (action === 'undo' || action === 'redo') undoEdit(action === 'redo');
  else formatText(action);
}
for (const sheet of sheets) field(sheet, 'page-visual').addEventListener('keydown', event => {
  handleWritingShortcut(event, sheet, !sheet.visual.editor.state.selection.empty);
}, true);
for (const [format, shortcut] of Object.entries({ bold: 'Ctrl+B', italic: 'Ctrl+I', h1: 'Alt+1', h2: 'Alt+2', h3: 'Alt+3', list: 'Alt+L' })) {
  const control = document.querySelector(`[data-format="${format}"]`);
  control.title = `${control.getAttribute('aria-label') || control.textContent} (${shortcut})`;
  control.setAttribute('aria-keyshortcuts', shortcut);
}
$('source-mode').addEventListener('click', () => {
  if (currentBook.visualError) { notify('Copie o texto ou desfaça a edição pendente antes de mudar o editor.'); return; }
  sourceMode = !sourceMode; $('source-mode').setAttribute('aria-pressed', String(sourceMode));
  renderPage(); focusContent();
});
function directStyle(ink = activeSheet().visual.editor.getAttributes('studyStyle').ink || 'ink', remove = false) {
  if (sourceMode) { notify('Volte ao editor visual para personalizar a seleção diretamente.'); return; }
  if (reading) setReading(false);
  activeSheet().visual.style($('direct-font').value, ink, $('direct-size').value, remove);
}
for (const id of ['direct-font', 'direct-size']) $(id).addEventListener('change', () => directStyle());
for (const button of document.querySelectorAll('[data-ink]')) button.addEventListener('click', () => directStyle(button.dataset.ink));
$('clear-text-style').addEventListener('click', () => directStyle('ink', true));
const colorsButton = document.createElement('button');
colorsButton.type = 'button'; colorsButton.id = 'text-colors'; colorsButton.className = 'text-button'; colorsButton.textContent = 'Mais cores';
colorsButton.setAttribute('aria-label', 'Mais cores'); colorsButton.title = 'Paleta e RGB (Shift+C com seleção)';
colorsButton.setAttribute('aria-keyshortcuts', 'Shift+C');
colorsButton.addEventListener('click', () => openColors(activeSheet()));
document.querySelector('.direct-style .ink-tools').after(colorsButton);

function updateColorFields(ink) {
  const hex = INKS[ink] || ink;
  if (!/^#[a-fA-F0-9]{6}$/.test(hex)) return;
  $('color-picker').value = hex; $('color-hex').value = hex;
  ['r', 'g', 'b'].forEach((channel, index) => { $('color-' + channel).value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16); });
  $('color-error').textContent = '';
}
function openColors(sheet) {
  if (reading || composingSheet || currentBook.visualError) { notify('Volte à escrita e conclua a edição pendente antes de escolher a tinta.'); return; }
  const content = field(sheet, 'page-content');
  const selection = sourceMode ? { from: content.selectionStart, to: content.selectionEnd } : sheet.visual.editor.state.selection;
  if (selection.from === selection.to) { notify('Selecione um trecho para escolher sua tinta.'); return; }
  const attrs = sourceMode ? {} : sheet.visual.editor.getAttributes('studyStyle');
  colorSelection = { sheet, book: currentBook, page: sheet.page, source: sheet.page.content,
    from: selection.from, to: selection.to, font: attrs.font || currentBook.preferences.font,
    size: attrs.size || String(sheet.page.font), sourceMode };
  updateColorFields(attrs.ink || 'ink');
  $('color-dialog').showModal(); $('color-hex').focus();
}
function applyColor(ink) {
  try {
    const target = colorSelection;
    if (!validInk(ink)) throw new Error('Escolha uma cor HEX com seis dígitos.');
    if (!target || target.book !== currentBook || target.page !== target.sheet.page || target.source !== target.page.content) throw new Error('O texto mudou. Feche a paleta e selecione novamente.');
    currentPage = target.page;
    if (target.sourceMode) applyTextChange(styledSelection(target.source, target.from, target.to, target.font, ink, target.size), target.sheet);
    else {
      target.sheet.visual.editor.commands.setTextSelection({ from: target.from, to: target.to });
      target.sheet.visual.style(target.font, ink, target.size);
    }
    $('color-dialog').close();
  } catch (error) { $('color-error').textContent = error.message; }
}
$('color-form').addEventListener('submit', event => { event.preventDefault(); applyColor($('color-hex').value); });
for (const control of document.querySelectorAll('[data-color]')) control.addEventListener('click', () => applyColor(control.dataset.color));
$('color-picker').addEventListener('input', () => updateColorFields($('color-picker').value));
$('color-hex').addEventListener('input', () => {
  if (/^#[a-fA-F0-9]{6}$/.test($('color-hex').value)) updateColorFields($('color-hex').value);
});
for (const channel of ['r', 'g', 'b']) $('color-' + channel).addEventListener('input', () => {
  try { updateColorFields(rgbInk($('color-r').value, $('color-g').value, $('color-b').value)); }
  catch (error) { $('color-error').textContent = error.message; $('color-hex').value = ''; }
});
$('color-dialog').addEventListener('close', () => {
  const target = colorSelection; colorSelection = null;
  if (!target || target.book !== currentBook || target.sheet.page !== target.page) return;
  if (target.sourceMode) {
    const content = field(target.sheet, 'page-content'); content.focus({ preventScroll: true });
    if (target.source === target.page.content) content.setSelectionRange(target.from, target.to);
  } else target.sheet.visual.focus();
});
for (const sheet of sheets) field(sheet, 'page-content').addEventListener('keydown', event => {
  if (event.isComposing) return;
  if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    const content = field(sheet, 'page-content');
    const change = continueLine(content.value, content.selectionStart, content.selectionEnd);
    if (change) { event.preventDefault(); applyTextChange(change, sheet); }
    return;
  }
  const content = field(sheet, 'page-content');
  handleWritingShortcut(event, sheet, content.selectionStart !== content.selectionEnd);
});
$('page-search').addEventListener('input', renderPageIndex);
$('notebook-hud').addEventListener('toggle', () => { if ($('notebook-hud').open && currentBook) renderIndex(); });
document.querySelector('.notebook-index').addEventListener('toggle', event => { if (event.target.open && currentBook) renderIndex(); });
$('page-total').addEventListener('click', () => {
  closeNotebookHud();
  $('jump-page').max = currentBook.pages.length;
  $('jump-page').value = currentBook.pages.indexOf(currentPage) + 1;
  $('jump-error').textContent = '';
  $('jump-dialog').showModal(); $('jump-page').select();
});
$('jump-form').addEventListener('submit', event => {
  event.preventDefault();
  const position = Number($('jump-page').value);
  if (!Number.isInteger(position) || position < 1 || position > currentBook.pages.length) {
    $('jump-error').textContent = 'Escolha uma página existente no caderno.'; return;
  }
  $('jump-dialog').close(); selectPage(currentBook.pages[position - 1], true, true);
  if (!reading) focusContent();
});
$('style-text').addEventListener('click', () => {
  const content = field(activeSheet(), 'page-content');
  if (reading || content.selectionStart === content.selectionEnd || composingSheet) {
    notify('No modo Escrever, selecione um trecho antes de personalizar.'); return;
  }
  styleSelection = { book: currentBook, page: currentPage, start: content.selectionStart,
    end: content.selectionEnd, source: content.value };
  $('style-sample').textContent = plainStudyText(content.value.slice(content.selectionStart, content.selectionEnd));
  $('selection-font').value = currentBook.preferences.font;
  $('selection-size').value = String(currentPage.font);
  $('selection-ink').value = 'ink';
  previewSelectionStyle();
  $('style-error').textContent = '';
  closeNotebookHud(); $('style-dialog').showModal();
});
$('style-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    if (!styleSelection || styleSelection.book !== currentBook || styleSelection.page !== currentPage
      || styleSelection.source !== currentPage.content) throw new Error('O texto mudou. Selecione o trecho novamente.');
    const { source, start, end } = styleSelection;
    const change = styledSelection(source, start, end, $('selection-font').value, $('selection-ink').value,
      $('selection-size').value, event.submitter?.id === 'remove-style');
    $('style-dialog').close(); applyTextChange(change); styleSelection = null;
  } catch (error) { $('style-error').textContent = error.message; }
});
function previewSelectionStyle() {
  $('style-sample').className = `style-sample study-font-${$('selection-font').value} study-ink-${$('selection-ink').value} study-size-${$('selection-size').value}`;
}
for (const id of ['selection-font', 'selection-ink', 'selection-size']) $(id).addEventListener('change', previewSelectionStyle);
$('style-dialog').addEventListener('close', () => {
  if (styleSelection?.page === currentPage && styleSelection.book === currentBook) {
    const content = field(activeSheet(), 'page-content');
    content.focus({ preventScroll: true }); content.setSelectionRange(styleSelection.start, styleSelection.end);
  }
  styleSelection = null;
});
for (const name of ['pointerdown', 'keydown', 'input']) $('notebook-view').addEventListener(name, () => {
  if (currentBook) currentBook.interactedAt = Date.now();
});
window.addEventListener('scroll', () => { if (document.body.classList.contains('studying')) currentBook.interactedAt = Date.now(); }, { passive: true });
setInterval(() => { if (currentBook) rememberPosition(); }, 10000);
window.addEventListener('online', () => { for (const book of books) book.retryAt = 0; });
$('draft-button').addEventListener('click', () => {
  const book = currentBook;
  $('draft-list').replaceChildren(...book.draftChoices.map(draft => button(
    `${new Date(draft.value.at).toLocaleString('pt-BR')} · ${draft.value.pages.length} páginas`, 'text-button', async () => {
      if (book.generation !== book.confirmed) { notify('Salve ou preserve as alterações atuais antes de recuperar outro rascunho.'); return; }
      recoverDraft(book, draft);
      book.draftChoices = book.draftChoices.filter(item => item !== draft);
      $('draft-dialog').close(); openBook(book); await protectDraft(book);
    })));
  $('draft-dialog').showModal();
});
$('task-form').addEventListener('submit', event => {
  event.preventDefault();
  const title = $('task-input').value.trim();
  if (!title) return;
  if (currentBook.tasks.length >= 100) { notify('Limite local: 100 metas por caderno.'); return; }
  currentBook.tasks.push({ id: crypto.randomUUID(), title, done: false });
  changed();
  $('task-input').value = '';
  renderIndex();
});
$('history-button').disabled = preview;
function viewingHistoryPage(book, page) {
  return currentBook === book && currentPage === page && !bookFace && !blankVerso
    && !$('notebook-view').hidden && !book.visualError;
}
$('history-button').addEventListener('click', async () => {
  const book = currentBook;
  const page = currentPage;
  if (book.collaboration) {try {await sharing.history(book);} catch(error) {notify(error.message);}return;}
  if (!viewingHistoryPage(book, page)) return;
  $('history-button').disabled = true;
  $('history-button').textContent = 'Carregando…';
  try {
    let rows, generation;
    do {
      await saveBook(book, api, () => protectDraft(book));
      if (!viewingHistoryPage(book, page)) return;
      generation = book.generation;
      rows = await versions(book, page);
      if (!viewingHistoryPage(book, page)) return;
    } while (book.generation !== generation || book.generation !== book.confirmed || book.batch);
    historySelection = null;
    $('history-heading').textContent = 'Versões da página ' + (book.pages.indexOf(page) + 1);
    $('history-preview').hidden = true;
    $('restore-version').disabled = true;
    $('history-list').replaceChildren(...rows.map(row => button(
      `Versão ${row.revision} · ${new Date(row.createdAt).toLocaleString('pt-BR')}`, 'text-button', () => {
        historySelection = { book, page, value: row.value };
        $('history-preview').textContent = row.value.title + '\n\n' + row.value.content;
        $('history-preview').hidden = false;
        $('restore-version').disabled = false;
      })));
    $('history-dialog').showModal();
  } catch (error) { notify(error.message); }
  finally { $('history-button').disabled = false; $('history-button').textContent = 'Versões'; renderSaveState(); }
});
$('restore-version').addEventListener('click', () => {
  if (!historySelection) return;
  const { book, page, value } = historySelection;
  if (!viewingHistoryPage(book, page)) {
    $('history-dialog').close();
    notify('A página mudou. Abra suas versões novamente.');
    return;
  }
  Object.assign(page, value, { date: value.date || '' });
  changed(book);
  $('history-dialog').close();
  openBook(book);
  selectPage(page);
  updateContent();
  notify('Versão recuperada. O salvamento criará uma nova revisão.');
});
$('retry-save').addEventListener('click', () => { currentBook.retryAt = 0; persist(currentBook); });
$('resolve-conflict').textContent = 'Preservar meu rascunho em outro caderno';
$('resolve-conflict').addEventListener('click', async () => {
  const original = currentBook;
  const copy = original.conflictCopy ||= { id: crypto.randomUUID(), pages: [], tasks: [] };
  Object.assign(copy, metadata(original), { title: original.title.slice(0, 63) + ' (rascunho)' });
  copy.pages = original.pages.map((page, index) => ({
    id: crypto.randomUUID(), ...copy.pages[index], ...pageData(page),
  }));
  copy.tasks = original.tasks.map((task, index) => ({
    id: crypto.randomUUID(), ...copy.tasks[index], title: task.title, done: task.done,
  }));
  if (copy.revision) copy.generation++;
  $('resolve-conflict').disabled = true;
  $('notebook-view').inert = true;
  try {
    await createBook(copy, session.user, session.keyset, rootKey);
    while (copy.generation !== copy.confirmed || copy.batch) await saveBook(copy);
    const latest = await loadBook({ id: original.id, wrapped_key: (await api('/api/notebooks')).notebooks.find(book => book.id === original.id).wrapped_key }, session.user, session.keyset, rootKey);
    latest.draftChoices = original.draftChoices;
    latest.draftWarning = original.draftWarning;
    original.confirmed = original.generation; original.batch = null;
    await clearDraft(original);
    books.splice(books.indexOf(original), 1, latest, copy);
    delete original.conflictCopy;
    renderCollection();
    openBook(copy);
    notify('Rascunho salvo em um novo caderno. A versão da outra sessão foi preservada.');
  } catch (error) { notify('Não foi possível concluir a cópia. Seu rascunho continua nesta aba. ' + error.message); }
  finally { $('resolve-conflict').disabled = false; $('notebook-view').inert = false; }
});
const editBook = button('Editar caderno', 'text-button', () => notebookDialog(currentBook));
editBook.id='edit-notebook';
$('hud-actions').append(editBook);
const focusBook = button('Modo foco', 'text-button focus-button', () => {
  setNotebookFocus(!document.body.classList.contains('notebook-focus'));
});
focusBook.id = 'notebook-focus';
focusBook.setAttribute('aria-pressed', 'false');
$('hud-actions').append(focusBook);
function setNotebookFocus(focused) {
  document.body.classList.toggle('notebook-focus', focused);
  if (!$('notebook-focus')) return;
  $('notebook-focus').textContent = focused ? 'Sair do foco' : 'Modo foco';
  $('notebook-focus').setAttribute('aria-pressed', String(focused));
  if (focused) {
    closeNotebookHud();
    const index = document.querySelector('.notebook-index');
    index.open = false;
    $('notebook-hud-tab').focus({ preventScroll: true });
  }
}
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !event.defaultPrevented && document.body.classList.contains('notebook-focus')
      && !document.querySelector('dialog[open]')) setNotebookFocus(false);
});
$('unlock-dialog').addEventListener('cancel', event => event.preventDefault());
$('unlock-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (event.target.inert) return;
  const submit = event.target.querySelector('[type=submit]');
  const resumeForm = pauseForm(event.target);
  let failed = false;
  $('unlock-dialog').setAttribute('aria-busy', 'true');
  $('unlock-logout').disabled = true;
  submit.disabled = true;
  submit.textContent = 'Desbloqueando…';
  $('unlock-error').textContent = '';
  try {
    const password = new FormData(event.target).get('contentPassword');
    rootKey = await unlockRoot(password, session.keyset.root_envelope, session.user.id, session.keyset.id);
    event.target.reset();
    await enterWorkspace();
  } catch (error) { failed = true; rootKey = null; $('unlock-error').textContent = error.message; }
  finally {
    $('unlock-dialog').setAttribute('aria-busy', 'false');
    $('unlock-logout').disabled = false;
    submit.disabled = false;
    submit.textContent = 'Desbloquear';
    resumeForm(failed);
  }
});
for (const id of ['logout', 'unlock-logout']) $(id).addEventListener('click', async () => {
  $(id).disabled = true;
  try { await logout(); } catch (error) { notify('Não saímos da conta para preservar suas alterações. ' + error.message); }
  finally { $(id).disabled = false; }
});
window.addEventListener('beforeunload', event => {
  if (creatingBook || books.some(book => book.visualError) || (!preview && books.some(book => book.generation !== book.confirmed || book.batch || book.running))) {
    event.preventDefault(); event.returnValue = '';
  }
});
setInterval(() => {
  if (preview) return;
  const now = Date.now();
  for (const book of books) {
    if (!book.collaboration && book.generation !== book.confirmed && book.protectedGeneration !== book.generation && !book.draftRunning) protectDraft(book);
    if (book.collaboration || book.running || book.conflict || now < (book.retryAt || 0)) continue;
    if ((book.generation !== book.confirmed || book.batch)
      && (now - (book.lastEdit || 0) >= 900 || now - (book.firstEdit || 0) >= 5000)) persist(book);
  }
}, 500);
const previewLink = document.createElement('a');
previewLink.href = '/?preview=1';
previewLink.className = 'text-button preview-link';
previewLink.textContent = 'Conhecer o caderno sem criar conta';
$('auth-form').after(previewLink);
async function settleBook(book) {
  if (preview) return;
  if (book.collaboration) { await sharing.flush(book);return; }
  while (book.generation !== book.confirmed || book.batch) await saveBook(book, api, () => protectDraft(book));
}
async function storeNewBook(book) {
  if (!preview) await createBook(book,session.user,session.keyset,rootKey);
  if (!books.includes(book)) books.push(book);
  await settleBook(book);renderCollection();
}
const sharing = setupSharing({
  books:()=>books,session:()=>session,rootKey:()=>rootKey,current:()=>currentBook,
  initialize:(page,fragment)=>sheets[0].visual.writeFragment(page.content,fragment),
  serialize:fragment=>sheets[0].visual.serializeFragment(fragment),
  onModel(book,content=true) {
    if (book !== currentBook) { if (!$('library-view').hidden) renderCollection();return; }
    renderSaveState();
    if (!content || $('notebook-view').hidden) return;
    cancelAnimationFrame(book.sharedFrame);
    book.sharedFrame=requestAnimationFrame(()=>{
      if (book!==currentBook) return;
      currentPage=book.pages.find(page=>page.id===currentPage?.id) || book.pages[0];
      $('notebook-title').textContent=book.title;
      renderPage();renderIndex();coverEditor.render();
    });
  },
  show:book=>{renderCollection();openBook(book);},refresh:renderCollection,notify,settle:settleBook,store:storeNewBook,
});
setupNotebookFiles({
  books: () => books, current: () => currentBook, preview, changed, notify,
  split: text => {
    const plan = planPageEdit(text, 'medium', 16, 1, protectedBlocks(text, markdown.parse(text, {})));
    if (plan.limited) throw new Error('O arquivo ultrapassa o limite de 500 páginas.');
    return plan.chunks;
  },
  settle:settleBook,
  applyPages(book,pages) {
    if (book.collaboration) book.collaboration.doc.transact(()=>{for(const page of pages) sheets[0].visual.writeFragment(page.content,book.collaboration.doc.getXmlFragment('text:'+page.id));});
    book.pages=pages;
  },
  store:storeNewBook,
  show(book) { renderCollection(); openBook(book); },
});
const resettingPassword = setupPasswordReset({ api });
if (preview && !resettingPassword) {
  const previewLabel = document.createElement('div');
  previewLabel.className = 'preview-label';
  previewLabel.textContent = 'PRÉVIA VISUAL · SEM SALVAMENTO';
  document.body.prepend(previewLabel);
  $('auth-view').hidden = true;
  $('workspace').hidden = false;
  $('profile-name').textContent = 'Prévia local';
  $('avatar').textContent = 'L4';
  books.push({ id: crypto.randomUUID(), title: 'Meu caderno de estudo', subject: 'Design', tags: [], tasks: [],
    pages: [newPage('# A ideia que ficou\n\nUm sábado tranquilo, um livro aberto e algumas coisas que quero guardar.\n\n{{hand;rust;24|Entender é fazer conexões.}}\n\n## O que aprendi hoje\n\n- Uma boa ideia fica mais clara quando consigo explicá-la.\n- Exemplos aproximam o que leio do que já conheço.\n- Posso voltar a estas notas, no meu tempo.\n\n> Não preciso terminar tudo hoje. Só deixar uma ideia mais nítida.\n\n## Para experimentar\n\nSelecionar um trecho e escolher sua tinta. Mudar o papel. Virar a folha e continuar.'),
      newPage('# Entre uma ideia e outra\n\nConhecimento também é perceber o que mudou no meu jeito de pensar.\n\n{{serif;blue;20|Uma página de cada vez.}}\n\n## Minha próxima pergunta\n\nComo posso usar o que aprendi em algo pequeno, hoje?\n\n- Anotar uma conexão.\n- Testar um exemplo.\n- Guardar uma dúvida para amanhã.\n\n## Um espaço para continuar\n\nEste caderno acompanha o meu ritmo. A folha segue abaixo da tela; há lugar para o que ainda vou descobrir.')] });
  renderCollection();
  openBook(books[0]);
} else if (!resettingPassword) {
  api('/api/me').then(value => {
    session = value;
    $('unlock-dialog').showModal();
  }).catch(error => {
    if (error.status !== 401) $('auth-error').textContent = error.message;
  });
}
