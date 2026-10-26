export function setupSocial({ api, user, books, plainText, profile }) {
  const $ = id => document.getElementById('social-' + id);
  let busy = false;
  let leaving = false;
  let posts = [];
  let friends = [];
  let recipient = '';
  let messages = new Map();
  let postAttempt;
  const drafts = new Map();
  const status = message => { $('status').textContent = message; };
  const node = (tag, text, className = '') => {
    const element = document.createElement(tag);
    element.textContent = text;
    element.className = className;
    return element;
  };
  function action(label, run) {
    const button = node('button', label, 'text-button');
    button.type = 'button';
    button.addEventListener('click', () => perform(run));
    return button;
  }
  async function perform(run, quiet = false) {
    if (leaving) return;
    if (busy) { if (!quiet) status('Aguarde a operação atual e tente novamente.'); return; }
    if (!user()) { status('Entre na sua conta para usar o social. A prévia não publica nem envia mensagens.'); return; }
    busy = true;
    $('recipient').disabled = true;
    $('view').setAttribute('aria-busy', 'true');
    try { if (!quiet) status('Aguarde…'); await run(); }
    catch (error) { status(error.message); }
    finally {
      busy = false; $('recipient').disabled = false; $('view').setAttribute('aria-busy', 'false');
      if (!quiet && $('status').textContent === 'Aguarde…') status('');
    }
  }
  function options(select, values, placeholder) {
    const selected = select.value;
    select.replaceChildren(new Option(placeholder, ''), ...values.map(item => new Option(item.label, item.id)));
    select.value = values.some(item => item.id === selected) ? selected : '';
  }
  function bookOptions() {
    options($('book'), books().map(book => ({ id: book.id, label: book.title })), 'Escolher caderno');
    pageOptions();
  }
  function pageOptions() {
    const book = books().find(book => book.id === $('book').value);
    options($('page'), (book?.pages || []).map((page, index) => ({ id: page.id, label: (index + 1) + ' · ' + (page.title || 'Sem título') })), 'Escolher página');
    $('copy-page').disabled = !book;
  }
  function renderPosts() {
    $('posts').replaceChildren();
    if (!posts.length) $('posts').append(node('p', 'Nenhuma publicação.'));
    for (const post of posts) {
      const card = node('article', '', 'social-post');
      card.append(node('h2', post.title), node('p', post.display_name + ' · ' + new Date(post.created_at).toLocaleString('pt-BR'), 'social-meta'),
        node('p', post.content, 'social-body'));
      if (post.owner_id === user()?.id) card.append(action('Remover publicação', async () => {
        await api('/api/social/posts/remove', { id: post.id });
        posts = posts.filter(item => item.id !== post.id); renderPosts(); status('Publicação removida.');
      }));
      else card.append(reportForm(post), action('Bloquear pessoa', () => contact(post.owner_id, 'block')));
      $('posts').append(card);
    }
  }
  const reasons = { abuse: 'Abuso ou assédio', spam: 'Spam', privacy: 'Exposição de dados pessoais', other: 'Outro motivo' };
  function reportForm(post) {
    const details = node('details', '', 'social-report');
    details.append(node('summary', 'Denunciar'));
    const form = node('form', '');
    const reason = node('select', '');
    reason.append(...Object.entries(reasons).map(([value, label]) => new Option(label, value)));
    const note = node('textarea', '');
    note.maxLength = 2000; note.rows = 2;
    const reasonLabel = node('label', 'Motivo'); reasonLabel.append(reason);
    const noteLabel = node('label', 'Detalhes (opcional)'); noteLabel.append(note);
    const result = node('p', 'A publicação e os detalhes serão enviados ao administrador.');
    result.setAttribute('role', 'status');
    const send = node('button', 'Enviar denúncia', 'button dark compact'); send.type = 'submit';
    form.append(reasonLabel, noteLabel, result, send); details.append(form);
    const id = crypto.randomUUID();
    form.addEventListener('submit', event => {
      event.preventDefault();
      perform(async () => {
        send.disabled = true;
        try {
          await api('/api/social/reports', { id, post: post.id, reason: reason.value, details: note.value });
          result.textContent = 'Denúncia recebida para revisão manual.';
          reason.disabled = true; note.disabled = true;
        } catch (error) { send.disabled = false; result.textContent = error.message; throw error; }
      });
    });
    return details;
  }
  async function loadReports() {
    if (!user()?.moderator) return;
    const { reports } = await api('/api/moderation/reports');
    $('reports').replaceChildren();
    if (!reports.length) $('reports').append(node('p', 'Nenhuma denúncia pendente.'));
    for (const report of reports) {
      const card = node('article', '', 'social-post');
      card.append(node('h3', report.post_title), node('p', report.post_content, 'social-body'),
        node('p', reasons[report.reason]), node('p', report.details, 'social-body'),
        node('small', new Date(report.created_at).toLocaleString('pt-BR')));
      const controls = node('div', '', 'social-actions');
      for (const [value, label] of [['dismiss', 'Encerrar sem remoção'], ['remove', 'Remover publicação']]) {
        controls.append(action(label, async () => {
          if (value === 'remove' && !window.confirm('Remover esta publicação do social? O caderno original continuará privado e intacto.')) return;
          await api('/api/moderation/reports/resolve', { id: report.id, action: value });
          await loadReports(); await loadPosts(); status('Denúncia resolvida.');
        }));
      }
      card.append(controls);
      $('reports').append(card);
    }
  }
  async function loadPosts(older = false) {
    const last = older ? posts.at(-1)?.id : '';
    const result = await api('/api/social/posts' + (last ? '?before=' + last : ''));
    posts = older ? [...posts, ...result.posts] : result.posts;
    $('more-posts').hidden = !result.more;
    renderPosts();
  }
  async function contact(id, type) {
    await api('/api/social/friends', { id, action: type });
    $('results').replaceChildren();
    await loadFriends();
    if (type === 'block') await loadPosts();
    status(({ invite: 'Convite enviado.', accept: 'Amizade aceita.', remove: 'Contato removido.', block: 'Pessoa bloqueada.', unblock: 'Pessoa desbloqueada.' })[type]);
  }
  function personRow(person) {
    const row = node('div', '', 'social-person');
    row.append(node('strong', person.display_name));
    if (profile) row.append(action('Ver perfil de '+person.display_name,()=>profile(person.id)));
    const controls = node('div', '', 'social-actions');
    if (person.accepted) controls.append(action('Conversar', async () => {
      selectSection('chat'); $('recipient').value = person.id; await chooseRecipient();
    }), action('Remover amizade', () => contact(person.id, 'remove')));
    else if (person.requester_id === user()?.id) controls.append(node('span', 'Convite enviado'), action('Cancelar convite', () => contact(person.id, 'remove')));
    else if (person.requester_id) controls.append(action('Aceitar', () => contact(person.id, 'accept')), action('Recusar', () => contact(person.id, 'remove')));
    else controls.append(action('Adicionar', () => contact(person.id, 'invite')));
    controls.append(action('Bloquear', () => contact(person.id, 'block')));
    row.append(controls);
    return row;
  }
  async function loadFriends() {
    const result = await api('/api/social/friends');
    friends = result.friends;
    $('friends').replaceChildren(...friends.map(personRow));
    if (!friends.length) $('friends').append(node('p', 'Nenhuma amizade ou convite.'));
    $('blocks').replaceChildren(...result.blocks.map(person => {
      const row = node('div', '', 'social-person');
      row.append(node('strong', person.display_name), action('Desbloquear', () => contact(person.id, 'unblock')));
      return row;
    }));
    if (!result.blocks.length) $('blocks').append(node('p', 'Nenhuma pessoa bloqueada.'));
    options($('recipient'), friends.filter(person => person.accepted).map(person => ({ id: person.id, label: person.display_name })), 'Escolher amizade');
    if (recipient && !friends.some(person => person.id === recipient && person.accepted)) {
      recipient = ''; messages.clear(); renderMessages(); $('message').disabled = true; $('send').disabled = true;
    }
  }
  function renderMessages(older = false) {
    const panel = $('messages');
    const bottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 40;
    const previousHeight = panel.scrollHeight;
    const previousTop = panel.scrollTop;
    panel.replaceChildren(...[...messages.values()].sort((a,b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)).map(message => {
      const row = node('article', '', 'social-message' + (message.sender_id === user()?.id ? ' own' : ''));
      row.append(node('p', message.content, 'social-body'), node('small', new Date(message.created_at).toLocaleString('pt-BR')));
      return row;
    }));
    if (!messages.size) panel.append(node('p', recipient ? 'Nenhuma mensagem.' : 'Escolha uma amizade para conversar.'));
    panel.scrollTop = older ? previousTop + Math.max(0, panel.scrollHeight - previousHeight) : bottom ? panel.scrollHeight : previousTop;
  }
  async function loadMessages(older = false) {
    if (!recipient) return;
    const person = recipient;
    const earliest = [...messages.values()].sort((a,b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))[0];
    const result = await api('/api/social/messages?person=' + person + (older && earliest ? '&before=' + earliest.id : ''));
    if (person !== recipient) return;
    const reset = !older && messages.size && result.more && !result.messages.some(message => messages.has(message.id));
    if (reset) messages.clear();
    const changed = result.messages.some(message => !messages.has(message.id));
    for (const message of result.messages) messages.set(message.id, message);
    if (older || !earliest || reset) $('older-messages').hidden = !result.more;
    if (changed || !messages.size) renderMessages(older);
  }
  async function chooseRecipient() {
    recipient = $('recipient').value;
    messages = new Map();
    $('older-messages').hidden = true;
    $('message').value = drafts.get(recipient)?.content || '';
    $('message').disabled = !recipient; $('send').disabled = !recipient;
    renderMessages();
    await loadMessages();
  }
  function selectSection(section) {
    for (const control of document.querySelectorAll('[data-social]')) control.setAttribute('aria-pressed', String(control.dataset.social === section));
    for (const panel of document.querySelectorAll('[data-social-panel]')) panel.hidden = panel.dataset.socialPanel !== section;
  }
  for (const control of document.querySelectorAll('[data-social]')) control.addEventListener('click', () => {
    selectSection(control.dataset.social);
    perform(async () => { await loadFriends(); if (control.dataset.social === 'chat') await loadMessages(); if (control.dataset.social === 'moderation') await loadReports(); });
  });
  $('refresh').addEventListener('click', () => refresh());
  $('book').addEventListener('change', pageOptions);
  $('copy-page').addEventListener('click', () => {
    const book = books().find(book => book.id === $('book').value);
    const page = book?.pages.find(page => page.id === $('page').value);
    if (!page) { status('Escolha uma página para revisar.'); return; }
    if ($('post-title').value || $('post-content').value) { status('Limpe o texto atual antes de copiar outra página.'); return; }
    $('post-title').value = page.title || book.title;
    $('post-content').value = plainText(page.content);
    $('publish-consent').checked = false;
    status('Revise o texto antes de publicar. Capas, tarefas, histórico e demais páginas não serão enviados.');
  });
  $('more-posts').addEventListener('click', () => perform(() => loadPosts(true)));
  $('older-messages').addEventListener('click', () => perform(() => loadMessages(true)));
  $('search-form').addEventListener('submit', event => {
    event.preventDefault();
    perform(async () => {
      const result = await api('/api/social/people?q=' + encodeURIComponent($('search').value.trim()));
      $('results').replaceChildren(...result.people.map(personRow));
      if (!result.people.length) $('results').append(node('p', 'Nenhuma pessoa encontrada.'));
    });
  });
  $('post-form').addEventListener('input', () => { postAttempt = null; $('publish-consent').checked = false; });
  // O checkbox deve continuar marcável sem invalidar o próprio consentimento.
  $('publish-consent').addEventListener('input', event => event.stopPropagation());
  $('post-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!$('publish-consent').checked) return;
    perform(async () => {
      const attempt = postAttempt ||= { id: crypto.randomUUID(), title: $('post-title').value, content: $('post-content').value };
      await api('/api/social/posts', attempt);
      if (postAttempt === attempt) { $('post-form').reset(); postAttempt = null; pageOptions(); }
      await loadPosts(); status('Publicado.');
    });
  });
  $('recipient').addEventListener('change', () => perform(chooseRecipient));
  $('message').addEventListener('input', () => drafts.set(recipient, { id: crypto.randomUUID(), content: $('message').value }));
  $('message-form').addEventListener('submit', event => {
    event.preventDefault();
    perform(async () => {
      const person = recipient;
      const attempt = drafts.get(person) || { id: crypto.randomUUID(), content: $('message').value };
      drafts.set(person, attempt);
      await api('/api/social/messages', { ...attempt, person });
      if (drafts.get(person) === attempt) { drafts.delete(person); $('message').value = ''; }
      await loadMessages(); status('Mensagem enviada.');
    });
  });
  function hasDrafts() {
    return Boolean($('post-title').value || $('post-content').value || [...drafts.values()].some(draft => draft.content));
  }
  function prepareLogout() {
    if (busy) throw new Error('Aguarde a operação do social terminar antes de sair.');
    if (hasDrafts() && !window.confirm('Há textos sociais que ainda não foram enviados. Sair e descartar esses rascunhos?')) return false;
    leaving = true;
    return true;
  }
  function completeLogout() {
    $('post-form').reset(); $('message-form').reset();
    drafts.clear(); postAttempt = null;
  }
  window.addEventListener('beforeunload', event => {
    if (hasDrafts()) {
      event.preventDefault(); event.returnValue = '';
    }
  });
  let chatPollErrors = 0;
  setInterval(() => {
    if (document.activeElement === $('recipient')) return;
    if (!$('view').hidden && !document.hidden && recipient && !document.querySelector('[data-social-panel="chat"]').hidden) {
      perform(async () => { await loadMessages(); chatPollErrors = 0; }, true).catch(() => { chatPollErrors++; });
    }
  }, Math.min(30000, 10000 + chatPollErrors * 5000));
  function refresh() {
    bookOptions();
    $('moderation-nav').hidden = !user()?.moderator;
    return perform(async () => { await loadPosts(); await loadFriends(); await loadMessages(); if (!document.querySelector('[data-social-panel="moderation"]').hidden) await loadReports(); });
  }
  return { refresh, prepareLogout, completeLogout, cancelLogout() { leaving = false; } };
}
