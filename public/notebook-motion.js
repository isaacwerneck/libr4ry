const activeTurns = new WeakMap();

export function stopPaperMotion(paper) {
  const turn = activeTurns.get(paper);
  if (turn) {
    for (const animation of turn.animations) animation.cancel();
    turn.cleanup();
  }
  for (const animation of paper.getAnimations?.() || []) animation.cancel();
}

export function capturePaper(paper, mode, reducedMotion) {
  if (reducedMotion || mode === 'off' || typeof paper.animate !== 'function') return null;
  const sheet = paper.ownerDocument.createElement('div');
  sheet.className = 'turning-sheet';
  sheet.inert = true;
  sheet.setAttribute('aria-hidden', 'true');
  for (const [name, value] of Object.entries({
    width: paper.offsetWidth, height: paper.offsetHeight, top: paper.offsetTop, left: paper.offsetLeft,
  })) sheet.style[name] = value + 'px';
  const front = paper.cloneNode(true);
  front.classList.add('sheet-front');
  front.style.boxShadow = 'none';
  for (const element of [front, ...front.querySelectorAll('[id]')]) element.removeAttribute('id');
  const originalFields = paper.querySelectorAll('input, textarea');
  front.querySelectorAll('input, textarea').forEach((field, index) => { field.value = originalFields[index].value; });
  const back = paper.ownerDocument.createElement('div');
  back.className = 'paper sheet-back';
  back.style.boxShadow = 'none';
  const cover = paper.classList.contains?.('book-face');
  if (cover) {
    back.classList.add('cover-inside', 'inside-guard'); back.dataset.face = paper.dataset.face;
    back.dataset.side = paper.dataset.face === 'front' ? 'left' : 'right';
  }
  sheet.append(front, back);
  const shade = paper.ownerDocument.createElement('div');
  shade.className = 'turn-crease'; sheet.append(shade);
  return sheet;
}

export function turnPaper(paper, direction, mode, reducedMotion, outgoing, progress = 0, onFinish = () => {}) {
  stopPaperMotion(paper);
  if (!outgoing || reducedMotion || mode === 'off') { outgoing?.remove(); onFinish(); return; }
  outgoing.style.transformOrigin = direction < 0 ? 'right center' : 'left center';
  outgoing.style.left = paper.offsetLeft + 'px';
  outgoing.style.top = paper.offsetTop + 'px';
  paper.parentElement.append(outgoing);
  const turn = {
    animations: [],
    cleanup() {
      if (turn.cleaned) return;
      turn.cleaned = true;
      outgoing.remove();
      onFinish(); onFinish = () => {};
      if (activeTurns.get(paper) === turn) activeTurns.delete(paper);
    },
  };
  activeTurns.set(paper, turn);
  const duration = Math.max(120, (mode === 'light' ? 260 : 720) * (1 - progress));
  const easing = progress ? 'cubic-bezier(.2,.6,.25,1)' : 'cubic-bezier(.4,0,.2,1)';
  // shortcut: superfície plana inteira; curvatura contínua exige outro modelo de folha.
  const animation = outgoing.animate([
    { transform: `rotateY(${-direction * 180 * progress}deg)` },
    { transform: `rotateY(${-direction * 180}deg)` },
  ], { duration, easing, fill: 'forwards' });
  turn.animations.push(animation);
  const shade = outgoing.querySelector?.('.turn-crease');
  if (shade) turn.animations.push(shade.animate(Array.from({ length: 9 }, (_, index) => ({
    opacity: Math.sin((progress + (1 - progress) * index / 8) * Math.PI) * .55,
    offset: index / 8,
  })), { duration, fill: 'forwards', easing }));
  animation.onfinish = turn.cleanup;
  animation.oncancel = turn.cleanup;
}

export const cornerProgress = (delta, width, direction) => Math.min(1, Math.max(0, -delta * direction / Math.max(1, width)));

export function setupPageCorner(button, paper, options, onTurn) {
  let gesture;
  let settling;
  let skipClick = false;
  function restoreFrame(value) {
    if (Number.isFinite(value.scrollY)) window.scrollTo({ left: value.scrollX, top: value.scrollY, behavior: 'instant' });
  }
  function cancel() {
    const canceled = gesture; gesture = null;
    if (canceled) {
      skipClick = true; canceled.copy?.remove(); canceled.clearPreview?.();
      if (button.hasPointerCapture?.(canceled.id)) button.releasePointerCapture(canceled.id);
    }
    settling?.animation.cancel();
  }
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.ctrlKey || options().pan) return;
    cancel(); skipClick = false;
    event.preventDefault();
    const value = options();
    gesture = { id: event.pointerId, x: event.clientX, progress: 0, direction: Number(button.dataset.direction),
      width: paper.getBoundingClientRect().width, value, copy: null, scrollX: window.scrollX, scrollY: window.scrollY };
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    if (event.ctrlKey) { cancel(); return; }
    restoreFrame(gesture);
    if (gesture.value.freeDirection && !gesture.copy) gesture.direction = event.clientX < gesture.x ? 1 : -1;
    if (gesture.value.allowedDirection && gesture.direction !== gesture.value.allowedDirection) return;
    gesture.progress = cornerProgress(event.clientX - gesture.x, gesture.width, gesture.direction);
    if (gesture.progress < .01 && !gesture.copy) return;
    if (!gesture.copy) {
      gesture.copy = capturePaper(paper, gesture.value.mode, gesture.value.reduced);
      if (gesture.copy) {
        paper.parentElement.append(gesture.copy);
        gesture.clearPreview = gesture.value.preview?.(gesture.direction, gesture.copy);
      }
    }
    if (gesture.copy) {
      gesture.copy.style.transformOrigin = gesture.direction < 0 ? 'right center' : 'left center';
      gesture.copy.style.transform = `rotateY(${-gesture.direction * 180 * gesture.progress}deg)`;
      const shade = gesture.copy.querySelector('.turn-crease');
      if (shade) shade.style.opacity = Math.sin(gesture.progress * Math.PI) * .55;
    }
  });
  button.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const value = gesture; gesture = null;
    restoreFrame(value);
    skipClick = value.progress > .01;
    if (value.progress >= .25) { value.clearPreview?.(); onTurn(value.direction, { outgoing: value.copy, progress: value.progress }); restoreFrame(value); }
    else if (value.copy) {
      const animation = value.copy.animate([{ transform: value.copy.style.transform }, { transform: 'rotateY(0deg)' }], { duration: 220, easing: 'cubic-bezier(.2,.6,.25,1)' });
      settling = { copy: value.copy, animation };
      const shade = value.copy.querySelector('.turn-crease');
      if (shade) shade.animate([{ opacity: shade.style.opacity }, { opacity: 0 }], { duration: 220, easing: 'cubic-bezier(.2,.6,.25,1)', fill: 'forwards' });
      animation.onfinish = () => { value.copy.remove(); value.clearPreview?.(); if (settling?.copy === value.copy) settling = null; }; animation.oncancel = animation.onfinish;
    }
  });
  button.addEventListener('click', event => {
    if (event.ctrlKey || options().pan) return;
    if (skipClick) { skipClick = false; if (event.detail !== 0) return; }
    if (options().dragOnly && event.detail !== 0) return;
    onTurn(Number(button.dataset.direction));
  });
  button.addEventListener('pointercancel', cancel);
  button.addEventListener('lostpointercapture', () => { if (gesture) cancel(); });
  window.addEventListener('keydown', event => { if (event.key === 'Escape') cancel(); });
  window.addEventListener('blur', cancel);
  window.addEventListener('resize', cancel);
  return cancel;
}
