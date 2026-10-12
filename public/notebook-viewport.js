export const clampZoom = value => Math.min(8, Math.max(.1, Number.isFinite(Number(value)) ? Number(value) : 1));
export const fitZoom = (available, width) => clampZoom(Math.min(1, available / Math.max(1, width)));
export function fitNotebookHeight(papers, minimum) {
  for (const paper of papers) paper.style.height = 'auto';
  const height = Math.max(minimum, ...papers.map(paper => paper.scrollHeight));
  for (const paper of papers) paper.style.height = height + 'px';
  return height;
}
export function matchNotebookCover(spread, paper, cover) {
  if (!paper || paper.hidden) return;
  const hidden = spread.hidden;
  spread.hidden = false;
  try {
    const zoom = Number(spread.style.zoom) || 1;
    const sheet = paper.getBoundingClientRect();
    const frame = spread.getBoundingClientRect();
    cover.style.width = sheet.width / zoom + 'px';
    cover.style.height = sheet.height / zoom + 'px';
    cover.style.setProperty('--cover-left', (sheet.left - frame.left) / zoom + 'px');
  } finally { spread.hidden = hidden; }
}
export function positionNotebook(viewport, offset = 0, vertical = 0) {
  viewport.dataset.offset = String(offset);
  viewport.dataset.vertical = String(vertical);
  viewport.style.setProperty('--book-offset', offset + 'px');
  viewport.style.setProperty('--book-vertical', vertical + 'px');
}
export function revealNotebookRect(viewport, rectangle, bounds) {
  const dx = rectangle.left < bounds.left ? bounds.left - rectangle.left : rectangle.right > bounds.right ? bounds.right - rectangle.right : 0;
  const dy = rectangle.top < bounds.top ? bounds.top - rectangle.top : rectangle.bottom > bounds.bottom ? bounds.bottom - rectangle.bottom : 0;
  if (dx || dy) positionNotebook(viewport, (Number(viewport.dataset.offset) || 0) + dx, (Number(viewport.dataset.vertical) || 0) + dy);
}

export function setupNotebookViewport(viewport, spread, interrupt, onZoom = () => {}, scene = viewport) {
  let gesture;
  let suppressMenu = false;
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault(); interrupt();
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') positionNotebook(viewport, (Number(viewport.dataset.offset) || 0) + (event.key === 'ArrowLeft' ? 80 : -80), Number(viewport.dataset.vertical) || 0);
    else positionNotebook(viewport, Number(viewport.dataset.offset) || 0, (Number(viewport.dataset.vertical) || 0) + (event.key === 'ArrowUp' ? 80 : -80));
  });
  scene.addEventListener('pointerdown', event => {
    if (viewport.closest?.('[hidden]') || event.target.closest?.('.notebook-heading, .page-navigation, .notebook-workbench, .hud-panel, .cover-tools, dialog')) return;
    const leftDrag = event.button === 0 && event.pointerType === 'mouse' && (event.ctrlKey || viewport.dataset?.pan === 'true');
    if (event.button !== 2 && !leftDrag) return;
    if (leftDrag) event.preventDefault();
    gesture = { id: event.pointerId, button: leftDrag ? 1 : 2, ctrl: Boolean(event.ctrlKey), x: event.clientX, y: event.clientY, moved: false };
  });
  scene.addEventListener('pointermove', event => {
    if (gesture?.button === 1 && (gesture.ctrl ? !event.ctrlKey : viewport.dataset?.pan !== 'true')) gesture = null;
    if (!gesture || gesture.id !== event.pointerId || !(event.buttons & gesture.button)) return;
    const dx = gesture.x - event.clientX;
    const dy = gesture.y - event.clientY;
    if (!gesture.moved && Math.hypot(dx, dy) < 4) return;
    if (!gesture.moved) { viewport.setPointerCapture(event.pointerId); interrupt(); }
    gesture.moved = true;
    positionNotebook(viewport, (Number(viewport.dataset.offset) || 0) - dx, (Number(viewport.dataset.vertical) || 0) - dy);
    gesture.x = event.clientX; gesture.y = event.clientY;
    event.preventDefault();
  });
  scene.addEventListener('pointerup', () => { suppressMenu = Boolean(gesture?.moved && gesture.button === 2); gesture = null; });
  scene.addEventListener('pointercancel', () => { gesture = null; suppressMenu = false; });
  scene.addEventListener('keydown', event => { if (event.key === 'Escape') gesture = null; });
  scene.addEventListener('contextmenu', event => {
    if ((gesture?.moved && gesture.button === 2) || suppressMenu) event.preventDefault();
    suppressMenu = false;
  });
  const setZoom = value => {
    interrupt();
    const zoom = clampZoom(value);
    spread.style.minWidth = '0';
    spread.style.width = '1680px';
    viewport.style.setProperty('--book-width', spread.style.width);
    spread.style.zoom = zoom;
    return zoom;
  };
  scene.addEventListener('wheel', event => {
    if (viewport.closest?.('[hidden]') || event.target.closest?.('.notebook-heading, .page-navigation, .notebook-workbench, .hud-panel, .cover-tools, dialog')) return;
    event.preventDefault();
    if (!event.ctrlKey) return;
    const zoom = clampZoom((Number(spread.style.zoom) || 1) * (event.deltaY > 0 ? 1 / 1.1 : 1.1));
    setZoom(zoom); onZoom(zoom);
  }, { passive: false });
  return setZoom;
}
