import { MARKDOWN_BYTES, exportNotebookMarkdown, parseNotebookMarkdown, planNotebookImport, copyNotebook } from './notebook-markdown.js';
import { pauseForm } from './form-focus.js';

export function setupNotebookFiles({ books, current, split, settle, store, changed, show, notify, preview, applyPages = (book,pages) => { book.pages=pages; } }) {
  const $ = id => document.getElementById('markdown-' + id);
  let incoming, selection, attempt, busy = false;
  const targetBook = () => books().find(book => book.id === $('target').value);
  function review() {
    $('error').textContent = ''; $('submit').disabled = !incoming;
    selection = null;
    if (!incoming) { $('summary').textContent = ''; return; }
    const book = targetBook();
    if (!book) { $('summary').textContent = 'Criar “' + incoming.title + '” com ' + incoming.pages.length + ' página(s).'; return; }
    try {
      const plan = planNotebookImport(incoming,book);
      selection = { book, generation:book.generation, revision:book.revision, plan };
      $('summary').textContent = 'Atualizar “' + book.title + '”: ' + plan.changed + ' página(s) com mudanças; ' + plan.retained
        + ' página(s) ausente(s) no arquivo serão mantidas. Uma cópia completa será criada antes da atualização.'
        + (plan.stale ? ' Atenção: este arquivo veio de outra revisão. Confira o texto antes de confirmar.' : '')
        + (!incoming.identified ? ' Sem IDs: as páginas serão associadas pela ordem.' : '');
    } catch (error) { $('error').textContent = error.message; $('submit').disabled = true; }
  }
  function openImport() {
    if (busy) return;
    incoming = null; attempt = null; $('form').reset();
    $('target').replaceChildren(new Option('Criar novo caderno',''), ...books().map(book => new Option(book.title,book.id)));
    review(); $('dialog').showModal();
  }
  $('open').addEventListener('click',openImport);
  $('target').addEventListener('change', () => { attempt = null; review(); });
  $('file').addEventListener('change', async () => {
    const file = $('file').files[0]; incoming = null; attempt = null; review();
    if (!file) return;
    $('submit').disabled = true;
    try {
      if (!/\.(md|markdown)$/i.test(file.name) || file.size > MARKDOWN_BYTES) throw new Error('Escolha um arquivo .md ou .markdown de até 512 KB.');
      const text = await file.text();
      if ($('file').files[0] !== file || !$('dialog').open) return;
      incoming = parseNotebookMarkdown(text,file.name,split);
      $('target').value = books().some(book => book.id === incoming.id) ? incoming.id : '';
      review();
    } catch (error) { if ($('file').files[0] === file && $('dialog').open) $('error').textContent = error.message; }
  });
  $('cancel').addEventListener('click', () => { if (!busy) $('dialog').close(); });
  $('dialog').addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  $('form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !incoming) return;
    const book = targetBook();
    if (!attempt && book && (selection?.book !== book || selection.generation !== book.generation || selection.revision !== book.revision)) {
      review(); $('error').textContent = 'O caderno mudou desde a revisão. Confira o resumo e confirme novamente.'; return;
    }
    busy = true;
    const resume = pauseForm($('form')); let failed = false;
    document.getElementById('workspace').inert = true;
    $('dialog').setAttribute('aria-busy','true'); $('submit').disabled = true;
    try {
      attempt ||= { book, incoming };
      if (book) {
        if (book.sharing?.permission === 'reader') throw new Error('Você tem apenas permissão de leitura neste caderno. Importe como novo caderno.');
        if (book.visualError || book.conflict) throw new Error('Resolva a edição ou o conflito do caderno antes de importar.');
        if (!attempt.applied) {
          await settle(book);
          attempt.backup ||= copyNotebook(book,' (antes da importação)');
          const generation=book.generation;
          await store(attempt.backup);
          if (book.generation !== generation) {attempt.backup=null;throw new Error('O caderno mudou durante a cópia de proteção. Confira e tente novamente.');}
          const plan = planNotebookImport(incoming,book);
          applyPages(book,plan.pages);
          Object.assign(book,{ title:incoming.title, ...(incoming.identified ? { subject:incoming.subject, tags:[...incoming.tags] } : {}) });
          changed(book); attempt.applied = true;
        }
        await settle(book);
      } else {
        attempt.created ||= { id:crypto.randomUUID(), title:incoming.title, subject:incoming.subject, tags:[...incoming.tags], tasks:[],
          pages:incoming.pages.map(page => ({ ...page,id:crypto.randomUUID() })) };
        await store(attempt.created);
      }
      $('dialog').close(); show(book || attempt.created);
      notify(preview ? 'Importado apenas na memória da prévia.' : 'Markdown importado. O caderno foi salvo.');
      incoming = null; attempt = null;
    } catch (error) {
      failed = true; $('error').textContent = error.message + (attempt?.applied ? ' A edição importada está preservada; tente confirmar o salvamento novamente.' : '');
    } finally {
      busy = false; document.getElementById('workspace').inert = false;
      $('dialog').setAttribute('aria-busy','false'); $('submit').disabled = false; resume(failed);
    }
  });
  $('export').addEventListener('click', async () => {
    const book = current(); if (!book || busy) return;
    if (book.visualError) { notify('Resolva a edição visual pendente antes de exportar.'); return; }
    if (!window.confirm('Baixar as páginas em Markdown legível, sem criptografia? O arquivo inclui título, matéria, tags, datas e IDs. Capas, personalizações e metas permanecem no caderno. Compartilhe somente com quem você autorizar.')) return;
    busy = true; $('export').disabled = true; document.getElementById('workspace').inert = true;
    try {
      await settle(book);
      const blob = new Blob([exportNotebookMarkdown(book)],{type:'text/markdown;charset=utf-8'});
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = (book.title.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').slice(0,100) || 'caderno') + '.md';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url),60000);
      notify('Download solicitado. Seu caderno continua na biblioteca.');
    } catch (error) { notify(error.message); }
    finally { busy = false; $('export').disabled = false; document.getElementById('workspace').inert = false; }
  });
}
