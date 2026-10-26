import test from 'node:test';
import assert from 'node:assert/strict';
import { setupSocial } from '../public/social.js';

test('saída social confirma antes de descartar, preserva rascunhos ao cancelar e espera operações', async t => {
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const elements = new Map();
  const handlers = new Map();
  let accepted = false;
  let confirmations = 0;
  let requests = 0;
  let failRequest;
  let finishRequest;
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: '', listeners: new Map(), disabled: false,
      addEventListener(name, callback) { this.listeners.set(name, callback); },
      setAttribute() {},
      replaceChildren() {},
      append() {},
      reset() {
        for (const field of id === 'social-post-form' ? ['post-title', 'post-content'] : ['message']) element('social-' + field).value = '';
      },
    });
    return elements.get(id);
  }
  const emit = (id, name) => element('social-' + id).listeners.get(name)({ preventDefault() {} });
  const warned = () => {
    let prevented = false;
    handlers.get('beforeunload')({ preventDefault() { prevented = true; } });
    return prevented;
  };
  let poll;
  t.mock.method(globalThis, 'setInterval', callback => { poll = callback; return 0; });
  globalThis.document = { getElementById: element, querySelectorAll: () => [], querySelector: () => ({ hidden: false }), createElement: () => ({}) };
  globalThis.window = {
    addEventListener: (name, callback) => handlers.set(name, callback),
    confirm() { confirmations++; return accepted; },
  };
  try {
    const social = setupSocial({
      api() { requests++; return new Promise((resolve, reject) => { finishRequest = resolve; failRequest = reject; }); },
      user: () => ({ id: 'owner' }), books: () => [], plainText: value => value,
    });
    assert.equal(social.prepareLogout(), true);
    assert.equal(confirmations, 0);
    social.cancelLogout();

    element('social-post-title').value = 'Texto ainda privado';
    element('social-post-content').value = 'Rascunho';
    assert.equal(social.prepareLogout(), false);
    assert.equal(requests, 0);
    assert.equal(warned(), true);
    assert.equal(element('social-post-content').value, 'Rascunho');

    accepted = true;
    assert.equal(social.prepareLogout(), true);
    emit('search-form', 'submit');
    assert.equal(requests, 0);
    social.cancelLogout();
    assert.equal(warned(), true);
    assert.equal(element('social-post-title').value, 'Texto ainda privado');

    emit('search-form', 'submit');
    assert.equal(requests, 1);
    assert.equal(element('social-status').textContent, 'Aguarde…');
    assert.throws(() => social.prepareLogout(), /Aguarde a operação/);
    failRequest(new Error('Sem conexão'));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(element('social-status').textContent, 'Sem conexão');
    assert.equal(element('social-recipient').disabled, false);
    emit('search-form', 'submit');
    assert.equal(element('social-status').textContent, 'Aguarde…');
    finishRequest({ people: [] });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(element('social-status').textContent, '');

    element('social-recipient').value = 'friend';
    emit('recipient', 'change');
    finishRequest({ messages: [], more: false });
    await new Promise(resolve => setImmediate(resolve));
    const beforePoll = requests;
    document.activeElement = element('social-recipient');
    poll();
    assert.equal(requests, beforePoll, 'Consulta automática não deve interromper a escolha da amizade');
    assert.equal(element('social-recipient').disabled, false);
    document.activeElement = element('social-message');
    poll();
    assert.equal(requests, beforePoll + 1, 'Consulta deve voltar após sair do seletor');
    finishRequest({ messages: [], more: false });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(element('social-status').textContent, '');

    assert.equal(social.prepareLogout(), true);
    social.completeLogout();
    assert.equal(warned(), false);
    assert.equal(element('social-post-title').value, '');
    assert.equal(element('social-post-content').value, '');
    social.cancelLogout();

    element('social-message').value = 'Mensagem não enviada';
    emit('message', 'input');
    assert.equal(warned(), true);
    assert.equal(social.prepareLogout(), true);
    social.completeLogout();
    assert.equal(warned(), false);
    assert.equal(element('social-message').value, '');
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
