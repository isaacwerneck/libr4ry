import test from 'node:test';
import assert from 'node:assert/strict';
import { pauseForm } from '../public/form-focus.js';

test('formulário recupera foco após erro sem interromper navegação ou sucesso', t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  t.after(() => original ? Object.defineProperty(globalThis, 'document', original) : delete globalThis.document);
  const body = {}, dialog = {}, outside = {};
  let focused;
  const field = { focus(options) { assert.equal(form.inert, false); assert.deepEqual(options, { preventScroll: true }); focused = this; } };
  const submit = { focus: field.focus };
  const form = { inert: false, contains: target => target === field || target === submit,
    querySelector: () => submit, closest: () => dialog };
  Object.defineProperty(globalThis, 'document', { value: { body, activeElement: field }, configurable: true });
  for (const idle of [body, dialog]) {
    document.activeElement = field;
    const resume = pauseForm(form);
    assert.equal(form.inert, true);
    document.activeElement = idle;
    resume(true);
    assert.equal(focused, field);
  }
  focused = null;
  document.activeElement = field;
  let resume = pauseForm(form);
  document.activeElement = outside;
  resume(true);
  assert.equal(focused, null, 'Não rouba foco movido pelo usuário');
  document.activeElement = field;
  resume = pauseForm(form);
  document.activeElement = body;
  resume(false);
  assert.equal(focused, null, 'Sucesso mantém o foco do próximo fluxo');
  resume = pauseForm(form);
  resume(true);
  assert.equal(focused, submit, 'Submissão sem campo focado usa o botão');
});
