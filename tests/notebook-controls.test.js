import test from 'node:test';
import assert from 'node:assert/strict';
import { setupNotebookDisclosure } from '../public/notebook-controls.js';

function disclosure(hover = true) {
  const details = new EventTarget();
  const summary = new EventTarget();
  const control = {};
  details.open = false;
  details.dataset = {};
  details.ownerDocument = { activeElement: null };
  details.querySelector = () => summary;
  details.contains = element => element === summary || element === control;
  summary.focus = () => { details.ownerDocument.activeElement = summary; };
  const close = setupNotebookDisclosure(details, hover);
  const emit = (target, type, properties = {}) => {
    const event = Object.assign(new Event(type, { cancelable: true }), properties);
    target.dispatchEvent(event);
    return event;
  };
  return { details, summary, control, close, emit };
}

test('HUD recolhe ao sair com mouse, preserva foco interno e permite fixar ou fechar por Escape', async () => {
  const { details, summary, control, close, emit } = disclosure();
  emit(details, 'pointerenter', { pointerType: 'touch' });
  assert.equal(details.open, false);
  emit(details, 'pointerenter', { pointerType: 'mouse' });
  assert.equal(details.open, true);
  emit(details, 'pointerleave');
  assert.equal(details.open, false);

  emit(details, 'pointerenter', { pointerType: 'mouse' });
  details.ownerDocument.activeElement = control;
  emit(details, 'pointerleave');
  assert.equal(details.open, true);
  details.ownerDocument.activeElement = null;
  emit(details, 'focusout');
  await Promise.resolve();
  assert.equal(details.open, false);

  emit(details, 'pointerenter', { pointerType: 'mouse' });
  emit(summary, 'click');
  assert.equal(details.dataset.pinned, 'true');
  emit(details, 'pointerleave');
  assert.equal(details.open, true);
  details.ownerDocument.activeElement = control;
  const escape = emit(details, 'keydown', { key: 'Escape' });
  assert.equal(escape.defaultPrevented, true);
  assert.equal(details.open, false);
  assert.equal(details.ownerDocument.activeElement, summary);
  assert.equal(details.dataset.pinned, undefined);

  emit(summary, 'click');
  assert.equal(details.open, true);
  emit(summary, 'click');
  assert.equal(details.open, false);
  emit(summary, 'click');
  close();
  assert.equal(details.open, false);
});

test('painéis por ação não abrem por passagem do mouse e mantêm clique e Escape', () => {
  const { details, summary, emit } = disclosure(false);
  emit(details, 'pointerenter', { pointerType: 'mouse' });
  assert.equal(details.open, false);
  emit(summary, 'click');
  assert.equal(details.open, true);
  emit(details, 'pointerleave');
  assert.equal(details.open, true);
  emit(details, 'keydown', { key: 'Escape' });
  assert.equal(details.open, false);
});
