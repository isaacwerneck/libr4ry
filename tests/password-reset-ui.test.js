import test from 'node:test';
import assert from 'node:assert/strict';
import { setupPasswordReset } from '../public/password-reset.js';

test('recuperação permite pedir outro link, bloqueia troca durante envio e limpa senhas ao fechar', async t => {
  const elements = new Map();
  const el = id => {
    if (!elements.has(id)) elements.set(id, {
      value: '', hidden: false, disabled: false, open: false, listeners: new Map(),
      addEventListener(name, handler) { this.listeners.set(name, handler); },
      focus() { focused = id; document.activeElement = this; },
      contains(target) { return ['email', 'password', 'confirmation', 'submit'].some(name => target === el(name)); },
      querySelector() { return el('submit'); },
      closest() { return el('dialog'); },
      reset() { for (const name of ['email', 'password', 'confirmation']) el(name).value = ''; },
      showModal() { assert.equal(this.open, false); this.open = true; },
      close() { this.open = false; this.listeners.get('close')?.(); },
    });
    return elements.get(id);
  };
  let focused;
  let resolveRequest;
  let rejectRequest;
  const requests = [];
  const token = 'a'.repeat(64);
  const originalGlobals = ['document', 'location', 'history'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  t.after(() => {
    for (const [name, descriptor] of originalGlobals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  Object.defineProperty(globalThis, 'document', { value: { body: {}, activeElement: null, getElementById: id => el(id.replace('recovery-', '')) }, configurable: true });
  Object.defineProperty(globalThis, 'location', { value: { hash: '#reset=' + token, pathname: '/', search: '', replace() {} }, configurable: true });
  let cleanedUrl;
  Object.defineProperty(globalThis, 'history', { value: { replaceState(state, unused, url) { cleanedUrl = url; } }, configurable: true });
  const emit = (id, event = 'click') => el(id).listeners.get(event)({ preventDefault() {} });
  const api = (path, body) => {
    if (path === '/api/auth-options') return Promise.resolve({ recovery: true });
    requests.push({ path, body });
    return new Promise((resolve, reject) => { resolveRequest = resolve; rejectRequest = reject; });
  };
  assert.equal(setupPasswordReset({ api }), true);
  assert.equal(cleanedUrl, '/');
  assert.equal(focused, 'password');
  assert.equal(el('retry').hidden, false);
  el('password').value = 'test-password';
  el('confirmation').value = 'different';
  await emit('form', 'submit');
  assert.equal(requests.length, 0);
  assert.equal(focused, 'confirmation');

  el('confirmation').value = 'test-password';
  const failed = emit('form', 'submit');
  assert.equal(el('retry').disabled, true);
  emit('retry');
  assert.equal(el('email-field').hidden, true);
  let prevented = false;
  el('dialog').listeners.get('cancel')({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(requests[0], { path: '/api/password-reset/complete', body: { token, password: 'test-password' } });
  document.activeElement = document.body;
  focused = null;
  rejectRequest(new Error('Link inválido ou expirado. Solicite outro.'));
  await failed;
  assert.match(el('status').textContent, /expirado/);
  assert.equal(el('retry').disabled, false);
  assert.equal(focused, 'confirmation');
  assert.equal(el('form').inert, false);

  emit('retry');
  assert.equal(el('dialog').open, true);
  assert.equal(el('password').value, '');
  assert.equal(el('confirmation').value, '');
  assert.equal(el('password-fields').disabled, true);
  assert.equal(el('email').disabled, false);
  assert.equal(focused, 'email');
  el('email').value = 'person@example.test';
  const requested = emit('form', 'submit');
  assert.deepEqual(requests[1], { path: '/api/password-reset/request', body: { email: 'person@example.test' } });
  resolveRequest({ message: 'Se houver uma conta, você receberá um link.' });
  await requested;
  assert.match(el('status').textContent, /Se houver/);
  emit('close');
  assert.equal(el('email').value, '');

  setupPasswordReset({ api });
  el('password').value = 'another-test-password';
  el('confirmation').value = 'another-test-password';
  const completed = emit('form', 'submit');
  resolveRequest({ message: 'Senha alterada.' });
  await completed;
  assert.equal(el('form').hidden, true);
  assert.equal(el('retry').hidden, true);
  assert.equal(el('password').value, '');
  assert.equal(el('close').textContent, 'Entrar');
});
