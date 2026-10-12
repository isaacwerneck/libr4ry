import { coverDesigns, coverText, imageBounds, resizeImage, prepareCoverImage } from './cover-design.js';

export function decorateCover(face, book, side) {
  const design = coverDesigns(book.covers)[side];
  const text = coverText(book, side);
  face.dataset.face = side;
  face.dataset.material = design.material || book.preferences.finish;
  face.dataset.texture = design.texture || 'natural';
  face.style.setProperty('--cover', design.color || book.preferences.coverColor
    || { walnut: '#50392d', clay: '#7e4839', slate: '#3d4e57' }[book.preferences.cover]);
  face.querySelector('.cover-label').textContent = side === 'front' ? 'LIBR4RY / SEU CADERNO' : 'LIBR4RY';
  face.querySelector('h2').textContent = text.title;
  face.querySelector('p').textContent = text.subject;
  const image = face.querySelector('.cover-image');
  image.hidden = !design.image;
  if (design.image) {
    image.querySelector('img').src = design.image.data;
    for (const name of ['x', 'y', 'width', 'height']) image.style.setProperty('--image-' + name, design.image[name] * 100 + '%');
  } else image.querySelector('img').removeAttribute('src');
}

export function createCoverEditor({ face, title, subject, getState, changed, notify }) {
  const panel = document.createElement('aside');
  panel.id = 'cover-tools'; panel.className = 'cover-tools'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Personalização da capa');
  panel.innerHTML = `<h3>Capa</h3><label>Material<select data-cover="material"><option value="leather">Couro</option><option value="cloth">Tecido</option><option value="smooth">Liso</option></select></label>
    <label>Cor<input type="color" data-cover="color"></label><label>Textura<select data-cover="texture"><option value="natural">Natural</option><option value="fine">Suave</option><option value="none">Sem textura</option></select></label>
    <button type="button" data-image="choose">Adicionar imagem</button><input type="file" accept="image/png,image/jpeg,image/webp" hidden>
    <div class="cover-image-actions"><button type="button" data-image="center">Centralizar</button><button type="button" data-image="remove">Remover imagem</button></div>
    <p class="cover-tool-hint">Clique no título ou na matéria para editar. Solte uma imagem na capa ou cole com Ctrl + V. Arraste a imagem e seus cantos; Escape cancela.</p>`;
  document.querySelector('#notebook-view').append(panel);
  const image = document.createElement('div'); image.className = 'cover-image'; image.hidden = true; image.tabIndex = -1;
  image.setAttribute('role', 'group'); image.setAttribute('aria-label', 'Imagem da capa, setas movem, Delete remove e Escape cancela');
  const picture = document.createElement('img'); picture.alt = 'Imagem personalizada do caderno'; picture.draggable = false; image.append(picture);
  for (const corner of ['nw', 'ne', 'sw', 'se']) {
    const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'cover-image-handle'; handle.dataset.corner = corner;
    handle.setAttribute('aria-label', 'Redimensionar imagem no canto ' + corner); handle.title = 'Arraste para redimensionar; setas ajustam o tamanho'; image.append(handle);
  }
  face.append(image);
  let gesture;
  let request = 0;
  const editable = () => { const state = getState(); return state.side && !state.reading; };
  const design = () => { const { book, side } = getState(); book.covers = coverDesigns(book.covers); return book.covers[side]; };
  function render() {
    cancel();
    const { book, side, reading } = getState();
    panel.hidden = !side || reading;
    face.classList.toggle('cover-editing', Boolean(side && !reading));
    title.contentEditable = subject.contentEditable = side && !reading ? 'plaintext-only' : 'false';
    title.dataset.placeholder = side === 'back' ? 'Título da contracapa' : 'Título do caderno';
    subject.dataset.placeholder = side === 'back' ? 'Uma frase ou matéria' : 'Matéria do caderno';
    title.setAttribute('aria-label', side === 'back' ? 'Título da contracapa' : 'Título da capa');
    subject.setAttribute('aria-label', side === 'back' ? 'Matéria da contracapa' : 'Matéria da capa');
    image.tabIndex = side && !reading && design().image ? 0 : -1;
    image.classList.remove('selected');
    if (!side) return;
    for (const edge of face.querySelectorAll('.page-corner, .page-edge')) edge.dataset.direction = side === 'front' ? '1' : '-1';
    decorateCover(face, book, side);
    const value = design();
    panel.querySelector('h3').textContent = side === 'front' ? 'Sua capa' : 'Sua contracapa';
    panel.setAttribute('aria-label', 'Personalização da ' + (side === 'front' ? 'capa' : 'contracapa'));
    panel.querySelector('[data-cover="material"]').value = value.material || book.preferences.finish;
    panel.querySelector('[data-cover="texture"]').value = value.texture || 'natural';
    panel.querySelector('[data-cover="color"]').value = value.color || book.preferences.coverColor
      || { walnut: '#50392d', clay: '#7e4839', slate: '#3d4e57' }[book.preferences.cover];
    panel.querySelector('[data-image="choose"]').textContent = value.image ? 'Substituir imagem' : 'Adicionar imagem';
    panel.querySelector('.cover-image-actions').hidden = !value.image;
  }
  function drawBounds(bounds) {
    for (const name of ['x', 'y', 'width', 'height']) image.style.setProperty('--image-' + name, bounds[name] * 100 + '%');
  }
  function cancel() {
    if (!gesture) return;
    const value = gesture; gesture = null;
    drawBounds(value.start);
    if (image.hasPointerCapture(value.pointer)) image.releasePointerCapture(value.pointer);
  }
  function commitBounds(bounds) { Object.assign(design().image, bounds); drawBounds(bounds); changed(); }
  for (const [element, name, max] of [[title, 'title', 80], [subject, 'subject', 60]]) {
    let original;
    element.setAttribute('aria-label', name === 'title' ? 'Título da capa' : 'Matéria da capa');
    element.addEventListener('focus', () => { original = element.textContent; image.classList.remove('selected'); });
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); element.blur(); }
      if (event.key === 'Escape') { element.textContent = original; element.blur(); }
    });
    element.addEventListener('blur', () => {
      if (!editable()) return;
      const value = element.textContent.trim().slice(0, max);
      if (!value && name === 'title' && getState().side === 'front') { element.textContent = original; notify('O título precisa ter pelo menos uma letra.'); return; }
      element.textContent = value;
      const { book, side } = getState();
      if (side === 'front') book[name] = value;
      else design()[name] = value;
      if (value !== original) changed();
    });
  }
  panel.addEventListener('change', event => {
    const name = event.target.dataset.cover;
    if (!name || !editable()) return;
    design()[name] = event.target.value; render(); changed();
  });
  const fileInput = panel.querySelector('input[type="file"]');
  panel.querySelector('[data-image="choose"]').onclick = () => fileInput.click();
  async function importImage(file, point) {
    if (!file || !editable()) return;
    const state = getState(); const token = ++request;
    try {
      const prepared = await prepareCoverImage(file);
      if (token !== request || getState().book !== state.book || getState().side !== state.side || !editable()) {
        notify('A capa mudou durante a importação. Adicione a imagem novamente.'); return;
      }
      const rect = face.getBoundingClientRect();
      const width = Math.min(.55, .55 * rect.height * prepared.aspect / rect.width);
      const height = width * rect.width / prepared.aspect / rect.height;
      design().image = { data: prepared.data, ...imageBounds({ width, height,
        x: (point ? (point.x - rect.left) / rect.width : .5) - width / 2,
        y: (point ? (point.y - rect.top) / rect.height : .63) - height / 2 }) };
      render(); image.classList.add('selected'); image.focus({ preventScroll: true }); changed();
    } catch (error) { notify(error.message); }
  }
  fileInput.addEventListener('change', () => { importImage(fileInput.files[0]); fileInput.value = ''; });
  face.addEventListener('dragover', event => {
    if (editable() && event.dataTransfer.types.includes('Files')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; face.classList.add('cover-drop'); }
  });
  face.addEventListener('dragleave', event => { if (!face.contains(event.relatedTarget)) face.classList.remove('cover-drop'); });
  face.addEventListener('drop', event => {
    if (!editable() || !event.dataTransfer.files.length) return;
    event.preventDefault(); face.classList.remove('cover-drop');
    if (event.dataTransfer.files.length > 1) { notify('Escolha uma imagem por lado do caderno.'); return; }
    importImage(event.dataTransfer.files[0], { x: event.clientX, y: event.clientY });
  });
  window.addEventListener('dragover', event => {
    if (editable() && document.body.classList.contains('studying') && event.dataTransfer.types.includes('Files')) event.preventDefault();
  });
  window.addEventListener('drop', event => {
    if (!event.defaultPrevented && editable() && document.body.classList.contains('studying') && event.dataTransfer.files.length) {
      event.preventDefault(); notify('Solte a imagem dentro da capa ou use Adicionar imagem.');
    }
  });
  window.addEventListener('paste', event => {
    if (!editable() || !event.clipboardData.files.length || !document.body.classList.contains('studying')) return;
    event.preventDefault();
    if (event.clipboardData.files.length > 1) { notify('Cole uma imagem por vez.'); return; }
    importImage(event.clipboardData.files[0]);
  });
  panel.querySelector('[data-image="remove"]').onclick = () => { if (editable()) { delete design().image; render(); changed(); } };
  panel.querySelector('[data-image="center"]').onclick = () => {
    if (!editable() || !design().image) return;
    const value = design().image; commitBounds({ ...imageBounds(value), x: (1 - value.width) / 2, y: (1 - value.height) / 2 });
  };
  image.addEventListener('pointerdown', event => {
    if (!editable() || event.button !== 0 || event.ctrlKey) return;
    event.preventDefault(); event.stopPropagation(); cancel(); image.classList.add('selected'); image.focus({ preventScroll: true });
    gesture = { start: imageBounds(design().image), rect: face.getBoundingClientRect(), x: event.clientX, y: event.clientY,
      corner: event.target.dataset.corner, pointer: event.pointerId };
    image.setPointerCapture(event.pointerId);
  });
  image.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.pointer) return;
    const dx = (event.clientX - gesture.x) / gesture.rect.width; const dy = (event.clientY - gesture.y) / gesture.rect.height;
    gesture.next = gesture.corner ? resizeImage(gesture.start, dx, dy, gesture.corner)
      : imageBounds({ ...gesture.start, x: gesture.start.x + dx, y: gesture.start.y + dy });
    drawBounds(gesture.next);
  });
  image.addEventListener('pointerup', event => {
    if (!gesture || event.pointerId !== gesture.pointer) return;
    const value = gesture; gesture = null; image.releasePointerCapture(event.pointerId);
    if (value.next) commitBounds(value.next);
  });
  image.addEventListener('pointercancel', cancel); image.addEventListener('lostpointercapture', cancel);
  window.addEventListener('blur', cancel); window.addEventListener('resize', cancel);
  window.addEventListener('keydown', event => { if (event.key === 'Escape') { cancel(); image.classList.remove('selected'); } });
  image.addEventListener('keydown', event => {
    if (!editable() || !design().image || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); delete design().image; render(); changed(); return; }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const step = event.shiftKey ? .025 : .005; const value = imageBounds(design().image);
    const dx = event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0;
    const dy = event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0;
    commitBounds(event.target.dataset.corner ? resizeImage(value, dx, dy, event.target.dataset.corner)
      : imageBounds({ ...value, x: value.x + dx, y: value.y + dy }));
  });
  face.addEventListener('pointerdown', event => { if (!image.contains(event.target)) image.classList.remove('selected'); });
  return { render, cancel };
}
