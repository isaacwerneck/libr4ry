export function setupNotebookDisclosure(details, hover = true) {
  const summary = details.querySelector('summary');
  let automatic = false;
  let hovering = false;

  function close() {
    automatic = false;
    hovering = false;
    if (details.contains(details.ownerDocument.activeElement)) summary.focus();
    details.open = false;
    delete details.dataset.pinned;
  }

  function closeWhenIdle() {
    if (automatic && !hovering && !details.contains(details.ownerDocument.activeElement)) close();
  }

  details.addEventListener('pointerenter', event => {
    if (!hover || event.pointerType !== 'mouse') return;
    hovering = true;
    if (!details.open) { automatic = true; details.open = true; }
  });
  details.addEventListener('pointerleave', () => { hovering = false; closeWhenIdle(); });
  details.addEventListener('focusout', () => queueMicrotask(closeWhenIdle));
  summary.addEventListener('click', event => {
    event.preventDefault();
    if (automatic || !details.open) {
      automatic = false;
      details.open = true;
      details.dataset.pinned = 'true';
    } else close();
  });
  details.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !details.open) return;
    event.preventDefault();
    close();
  });
  return close;
}
