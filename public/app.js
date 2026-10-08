import { splitPages, pageCapacity, countLines, countWords } from './pagination.js';
import markdownit from '/markdown-it.mjs';
import { createRoot, unlockRoot } from './crypto.js';
import { api, createBook, loadBook, saveBook, versions, pageData } from './storage.js';

const markdown = markdownit({ html: false, linkify: false, typographer: false }).disable('image');
const $ = id => document.getElementById(id);
const books = [];
let currentBook;
let currentPage;
let signingUp = false;
let session;
let rootKey;
let editingBook;
let historySelection;
const preview = new URLSearchParams(location.search).get('preview') === '1';

function notify(message) {
  $('notification').textContent = message;
  $('notification').hidden = false;
  setTimeout(() => { $('notification').hidden = true; }, 5000);
}

function showView(view) {
  for (const name of ['library', 'progress', 'notebook']) $(name + '-view').hidden = name !== view;
  $('library-nav').classList.toggle('active', view !== 'progress');
  $('progress-nav').classList.toggle('active', view === 'progress');
  $('view-name').textContent = view === 'progress' ? 'Progresso' : view === 'notebook' ? 'Caderno' : 'Cadernos';
}

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
  $('notebook-grid').replaceChildren();
  $('empty-library').hidden = books.length > 0;
  $('notebook-count').textContent = books.length;
  $('collection-count').textContent = '/ ' + String(books.length).padStart(2, '0');
  books.forEach((book, index) => {
    const card = button('', 'notebook-card', () => openBook(book));
    const cover = document.createElement('div');
    cover.className = 'book-cover';
    cover.dataset.color = index % 4;
    const number = document.createElement('span');
    number.className = 'cover-number';
    number.textContent = 'CADERNO / ' + String(index + 1).padStart(2, '0');
    const title = document.createElement('h3');
    title.textContent = book.title;
    const subject = document.createElement('span');
    subject.className = 'cover-subject';
    subject.textContent = book.subject || 'Ideias e descobertas';
    const bottom = document.createElement('div');
    bottom.className = 'cover-bottom';
    const pageCount = document.createElement('span');
    pageCount.textContent = `${book.pages.length} páginas`;
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    bottom.append(pageCount, arrow);
    cover.append(number, title, subject, bottom);
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    meta.textContent = `${stats(book).words} palavras · ${preview ? 'caderno de prévia' : 'privado'}`;
    card.append(cover, meta);
    $('notebook-grid').append(card);
  });
}

function renderProgress() {
  const totals = books.reduce((total, book) => {
    const value = stats(book);
    for (const key of ['pages', 'words', 'tasks']) total[key] += value[key];
    return total;
  }, { pages: 0, words: 0, tasks: 0 });
  $('progress-metrics').replaceChildren();
  for (const [label, count] of [['Cadernos', books.length], ['Páginas escritas', totals.pages], ['Palavras atuais', totals.words], ['Metas concluídas', totals.tasks]]) {
    const element = document.createElement('div');
    element.className = 'metric';
    const value = document.createElement('strong');
    value.textContent = count.toLocaleString('pt-BR');
    const caption = document.createElement('span');
    caption.textContent = label;
    element.append(value, caption);
    $('progress-metrics').append(element);
  }
}

function renderIndex() {
  $('page-list').replaceChildren();
  currentBook.pages.forEach((page, index) => {
    const entry = button('', 'page-link' + (page === currentPage ? ' active' : ''), () => selectPage(page));
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const title = document.createElement('span');
    title.textContent = page.title || 'Uma nova ideia';
    entry.append(number, title);
    $('page-list').append(entry);
  });
  const metrics = stats(currentBook);
  $('notebook-metrics').textContent = `${metrics.pages} páginas escritas · ${metrics.words} palavras · ${metrics.tasks} metas concluídas`;
  $('task-list').replaceChildren();
  for (const task of currentBook.tasks) {
    const label = document.createElement('label');
    label.className = 'task' + (task.done ? ' done' : '');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
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

function renderPage() {
  const position = currentBook.pages.indexOf(currentPage);
  $('page-title').value = currentPage.title;
  $('page-content').value = currentPage.content;
  $('page-size').value = currentPage.size;
  $('font-size').value = currentPage.font;
  $('paper').style.setProperty('--font-size', currentPage.font + 'px');
  $('paper').style.setProperty('--line-height', currentPage.font * 1.75 + 'px');
  $('page-preview').innerHTML = markdown.render(currentPage.content);
  $('page-number').textContent = 'PÁGINA ' + String(position + 1).padStart(2, '0');
  $('page-position').textContent = String(position + 1).padStart(2, '0');
  $('page-total').textContent = `${position + 1} de ${currentBook.pages.length}`;
  $('previous-page').disabled = position === 0;
  $('next-page').disabled = position === currentBook.pages.length - 1;
  const lines = countLines(currentPage.content, currentPage.size, currentPage.font);
  $('line-count').textContent = `${lines} / ${pageCapacity(currentPage.size, currentPage.font).lines} linhas de referência`;
  $('word-count').textContent = `${countWords(currentPage.content)} palavras`;
}

function selectPage(page) {
  currentPage = page;
  renderIndex();
  renderPage();
}

function openBook(book) {
  currentBook = book;
  $('notebook-title').textContent = book.title;
  $('notebook-subject').textContent = book.subject || 'IDEIAS EM CONSTRUÇÃO';
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
  selectPage(book.pages[0]);
}

function newPage(content = '', size = 'medium', font = 16) {
  return { id: crypto.randomUUID(), title: '', content, size, font };
}

function updateContent() {
  const caret = $('page-content').selectionStart;
  currentPage.title = $('page-title').value;
  const chunks = splitPages($('page-content').value, currentPage.size, currentPage.font);
  currentPage.content = chunks[0];
  if (chunks.length > 1) {
    const nextPages = chunks.slice(1).map(chunk => newPage(chunk, currentPage.size, currentPage.font));
    const index = currentBook.pages.indexOf(currentPage);
    currentBook.pages.splice(index + 1, 0, ...nextPages);
    let offset = currentPage.content.length;
    let selected = currentPage;
    let localCaret = caret;
    for (const page of nextPages) {
      if (caret >= offset) { selected = page; localCaret = caret - offset; }
      offset += page.content.length;
    }
    selectPage(selected);
    $('page-content').focus();
    $('page-content').setSelectionRange(localCaret, localCaret);
    notify('A escrita continuou em uma nova página.');
  } else {
    const contentFocused = document.activeElement === $('page-content');
    renderIndex();
    renderPage();
    if (contentFocused) $('page-content').setSelectionRange(caret, caret);
  }
  changed();
}

function changed(book = currentBook) {
  if (preview) return;
  book.generation += 1;
  book.lastEdit = Date.now();
  book.firstEdit ||= Date.now();
  renderSaveState();
}

function renderSaveState() {
  if (!currentBook) return;
  const book = currentBook;
  $('save-state').textContent = preview ? 'Prévia · sem salvamento' : book.conflict ? 'Conflito · rascunho preservado'
    : book.error ? 'Erro · alterações pendentes' : book.running ? 'Salvando…'
      : book.generation !== book.confirmed ? 'Alterações pendentes' : 'Salvo';
  $('save-error').hidden = !book.error;
  $('save-error').querySelector('p').textContent = book.error?.message || '';
  $('resolve-conflict').hidden = !book.conflict;
  $('retry-save').hidden = Boolean(book.conflict);
}

async function persist(book) {
  try { await saveBook(book); }
  catch (error) { book.error = error; }
  if (book.generation === book.confirmed) book.firstEdit = 0;
  renderSaveState();
}

async function enterWorkspace() {
  const result = await api('/api/notebooks');
  // ponytail: carregar todos no MVP local; paginação e resumo parcial explícito quando houver volume.
  const loaded = [];
  for (const record of result.notebooks) loaded.push(await loadBook(record, session.user, session.keyset, rootKey));
  books.splice(0, books.length, ...loaded);
  $('profile-name').textContent = session.user.display_name;
  $('avatar').textContent = session.user.display_name.slice(0, 2).toUpperCase();
  $('auth-view').hidden = true;
  $('workspace').hidden = false;
  $('auth-form').reset();
  $('unlock-form').reset();
  if ($('unlock-dialog').open) $('unlock-dialog').close();
  renderCollection();
  showView('library');
}

async function logout() {
  if (!preview) {
    for (const book of books) {
      while (book.generation !== book.confirmed || book.batch) await saveBook(book);
    }
    await api('/api/logout', {});
  }
  rootKey = null;
  books.length = 0;
  location.href = '/';
}

$('today').textContent = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(new Date());
$('auth-toggle').addEventListener('click', () => {
  signingUp = !signingUp;
  $('name-field').hidden = !signingUp;
  $('name-field').querySelector('input').required = signingUp;
  $('content-password-fields').hidden = !signingUp;
  $('content-password-fields').disabled = !signingUp;
  $('auth-form').elements.password.autocomplete = signingUp ? 'new-password' : 'current-password';
  $('auth-heading').textContent = signingUp ? 'Um lugar só seu.' : 'Bom ter você aqui.';
  $('auth-submit').textContent = signingUp ? 'Criar minha conta ↗' : 'Entrar ↗';
  $('auth-toggle').textContent = signingUp ? 'Já tenho conta. Entrar' : 'Primeira vez? Crie sua conta';
});
$('auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('auth-error').textContent = '';
  $('auth-submit').disabled = true;
  try {
    const data = new FormData(event.target);
    const body = { email: data.get('email'), password: data.get('password') };
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
  } catch (error) { $('auth-error').textContent = error.message; }
  finally { $('auth-submit').disabled = false; }
});
function notebookDialog(book) {
  editingBook = book;
  const form = $('notebook-form');
  form.reset();
  $('notebook-form-error').textContent = '';
  $('notebook-dialog').querySelector('h2').textContent = book ? 'Ajuste seu caderno.' : 'Abra um novo capítulo.';
  form.querySelector('[type=submit]').textContent = book ? 'Guardar alterações ↗' : 'Criar caderno ↗';
  if (book) for (const field of ['title', 'subject', 'tags']) {
    form.elements[field].value = field === 'tags' ? book.tags.join(', ') : book[field];
  }
  $('notebook-dialog').showModal();
}
for (const id of ['new-notebook', 'first-notebook']) $(id).addEventListener('click', () => notebookDialog(null));
for (const element of document.querySelectorAll('[data-close]')) element.addEventListener('click', () => $(element.dataset.close).close());
$('notebook-form').addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const meta = {
    title: data.get('title').trim(), subject: data.get('subject').trim(),
    tags: data.get('tags').split(',').map(tag => tag.trim()).filter(Boolean),
  };
  if (!meta.title) { $('notebook-form-error').textContent = 'Informe o nome do caderno.'; return; }
  const submit = event.target.querySelector('[type=submit]');
  submit.disabled = true;
  try {
    const book = editingBook || { id: crypto.randomUUID(), pages: [newPage()], tasks: [] };
    Object.assign(book, meta);
    if (editingBook) changed(book);
    else {
      if (!preview) await createBook(book, session.user, session.keyset, rootKey);
      books.push(book);
    }
    $('notebook-dialog').close();
    event.target.reset();
    renderCollection();
    openBook(book);
  } catch (error) { $('notebook-form-error').textContent = error.message; }
  finally { submit.disabled = false; }
});
$('library-nav').addEventListener('click', () => { renderCollection(); showView('library'); });
$('back-library').addEventListener('click', () => { renderCollection(); showView('library'); });
$('progress-nav').addEventListener('click', () => { renderProgress(); showView('progress'); });
$('add-page').addEventListener('click', () => {
  if (currentBook.pages.length >= 500) { notify('Limite local: 500 páginas por caderno. Abra outro caderno.'); return; }
  const page = newPage('', currentPage.size, currentPage.font);
  currentBook.pages.push(page); changed(); selectPage(page); $('page-content').focus();
});
$('page-content').addEventListener('input', event => { if (!event.isComposing) updateContent(); });
$('page-content').addEventListener('compositionend', updateContent);
$('page-title').addEventListener('input', () => { currentPage.title = $('page-title').value; changed(); renderIndex(); });
for (const id of ['page-size', 'font-size']) $(id).addEventListener('change', () => {
  currentPage.size = $('page-size').value;
  currentPage.font = Number($('font-size').value);
  updateContent();
});
$('previous-page').addEventListener('click', () => selectPage(currentBook.pages[currentBook.pages.indexOf(currentPage) - 1]));
$('next-page').addEventListener('click', () => selectPage(currentBook.pages[currentBook.pages.indexOf(currentPage) + 1]));
for (const [id, reading] of [['edit-mode', false], ['preview-mode', true]]) $(id).addEventListener('click', () => {
  $('page-content').hidden = reading;
  $('page-preview').hidden = !reading;
  for (const [buttonId, selected] of [['edit-mode', !reading], ['preview-mode', reading]]) {
    $(buttonId).classList.toggle('selected', selected);
    $(buttonId).setAttribute('aria-pressed', String(selected));
  }
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
$('history-button').addEventListener('click', async () => {
  const book = currentBook;
  const page = currentPage;
  $('history-button').disabled = true;
  try {
    await saveBook(book);
    const rows = await versions(book, page);
    historySelection = null;
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
  finally { $('history-button').disabled = false; renderSaveState(); }
});
$('restore-version').addEventListener('click', () => {
  if (!historySelection) return;
  const { book, page, value } = historySelection;
  Object.assign(page, value);
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
  const copy = { id: crypto.randomUUID(), title: original.title.slice(0, 63) + ' (rascunho)',
    subject: original.subject, tags: [...original.tags],
    pages: original.pages.map(page => ({ ...pageData(page), id: crypto.randomUUID() })),
    tasks: original.tasks.map(task => ({ id: crypto.randomUUID(), title: task.title, done: task.done })) };
  $('resolve-conflict').disabled = true;
  $('notebook-view').inert = true;
  try {
    await createBook(copy, session.user, session.keyset, rootKey);
    await saveBook(copy);
    const latest = await loadBook({ id: original.id, wrapped_key: (await api('/api/notebooks')).notebooks.find(book => book.id === original.id).wrapped_key }, session.user, session.keyset, rootKey);
    books.splice(books.indexOf(original), 1, latest, copy);
    renderCollection();
    openBook(copy);
    notify('Rascunho salvo em um novo caderno. A versão da outra sessão foi preservada.');
  } catch (error) { notify('Não foi possível concluir a cópia. Seu rascunho continua nesta aba. ' + error.message); }
  finally { $('resolve-conflict').disabled = false; $('notebook-view').inert = false; }
});
const editBook = button('Editar caderno', 'text-button', () => notebookDialog(currentBook));
$('back-library').after(editBook);
$('unlock-dialog').addEventListener('cancel', event => event.preventDefault());
$('unlock-form').addEventListener('submit', async event => {
  event.preventDefault();
  const submit = event.target.querySelector('[type=submit]');
  submit.disabled = true;
  $('unlock-error').textContent = '';
  try {
    const password = new FormData(event.target).get('contentPassword');
    rootKey = await unlockRoot(password, session.keyset.root_envelope, session.user.id, session.keyset.id);
    event.target.reset();
    await enterWorkspace();
  } catch (error) { rootKey = null; $('unlock-error').textContent = error.message; }
  finally { submit.disabled = false; }
});
for (const id of ['logout', 'unlock-logout']) $(id).addEventListener('click', async () => {
  $(id).disabled = true;
  try { await logout(); } catch (error) { notify('Não saímos da conta para preservar suas alterações. ' + error.message); }
  finally { $(id).disabled = false; }
});
window.addEventListener('beforeunload', event => {
  if (!preview && books.some(book => book.generation !== book.confirmed || book.batch || book.running)) {
    event.preventDefault(); event.returnValue = '';
  }
});
setInterval(() => {
  if (preview) return;
  const now = Date.now();
  for (const book of books) {
    if (book.running || book.conflict || now < (book.retryAt || 0)) continue;
    if ((book.generation !== book.confirmed || book.batch)
      && (now - (book.lastEdit || 0) >= 900 || now - (book.firstEdit || 0) >= 5000)) persist(book);
  }
}, 500);
const previewLink = document.createElement('a');
previewLink.href = '/?preview=1';
previewLink.className = 'text-button preview-link';
previewLink.textContent = 'Explorar a nova direção visual →';
$('auth-form').after(previewLink);
if (preview) {
  const previewLabel = document.createElement('div');
  previewLabel.className = 'preview-label';
  previewLabel.textContent = 'PRÉVIA VISUAL · SEM SALVAMENTO';
  document.body.prepend(previewLabel);
  $('auth-view').hidden = true;
  $('workspace').hidden = false;
  $('profile-name').textContent = 'Prévia local';
  $('avatar').textContent = 'L4';
  document.querySelector('.connection-label').textContent = 'Prévia sem persistência';
  renderCollection();
} else {
  api('/api/me').then(value => {
    session = value;
    $('unlock-dialog').showModal();
  }).catch(error => {
    if (error.status !== 401) $('auth-error').textContent = error.message;
  });
}
