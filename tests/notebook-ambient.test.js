import test from 'node:test';
import assert from 'node:assert/strict';
import { ambientSize, ambientEnabled, createAmbientLight } from '../public/notebook-ambient.js';
import { preferences } from '../public/notebook-preferences.js';
import { fitZoom } from '../public/notebook-viewport.js';

test('efeito ambiental respeita preferência, visibilidade, movimento e orçamento de resolução', () => {
  const value = preferences({ ambient: true });
  assert.equal(preferences().ambient, false);
  assert.equal(preferences({ ambient: 'true' }).ambient, false);
  assert.equal(ambientEnabled(value, true, false), true);
  for (const motion of ['light', 'off']) assert.equal(ambientEnabled({ ...value, motion }, true, false), false);
  assert.equal(ambientEnabled(value, false, false), false);
  assert.equal(ambientEnabled(value, true, true), false);
  for (const [width, height] of [[3840, 2160], [320, 900], [0, 0]]) {
    const [w, h] = ambientSize(width, height);
    assert.ok(w >= 1 && w <= 960 && h >= 1 && h <= 640);
  }
  assert.equal(fitZoom(800, 1000), .8);
  assert.equal(fitZoom(1200, 800), 1);
});

test('ausência/perda de WebGL mantém iluminação estática sem loop ou contexto no modo desligado', () => {
  const events = {};
  let requests = 0; let contexts = 0; const messages = [];
  const canvas = {
    ownerDocument: { hidden: false, addEventListener() {}, defaultView: {
      innerWidth: 1200, innerHeight: 800,
      matchMedia: () => ({ matches: false, addEventListener() {} }),
      addEventListener() {}, requestAnimationFrame() { requests++; return requests; }, cancelAnimationFrame() {},
    } },
    getContext() { contexts++; return null; },
    addEventListener(name, handler) { events[name] = handler; },
  };
  const update = createAmbientLight(canvas, message => messages.push(message));
  update(preferences(), true);
  assert.equal(contexts, 0); assert.equal(requests, 0);
  update(preferences({ ambient: true }), true);
  assert.equal(contexts, 1); assert.equal(requests, 0); assert.equal(canvas.hidden, true);
  assert.match(messages.at(-1), /estática/);
  update(preferences({ ambient: true }), true);
  assert.equal(contexts, 1);
  let prevented = false;
  events.webglcontextlost({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(canvas.hidden, true);
  events.webglcontextrestored();
  assert.equal(contexts, 2); assert.equal(requests, 0);
});

test('luz ativa limita desenhos, pausa por visibilidade e recompõe recursos após perda do contexto', () => {
  const events = {}; const callbacks = new Map(); const messages = [];
  let serial = 0; let draws = 0; let programs = 0;
  const gl = {
    createShader: () => ({}), shaderSource() {}, compileShader() {}, getShaderParameter: () => true,
    createProgram() { programs++; return {}; }, createBuffer: () => ({}), attachShader() {},
    bindAttribLocation() {}, linkProgram() {}, getProgramParameter: () => true, useProgram() {},
    bindBuffer() {}, bufferData() {}, enableVertexAttribArray() {}, vertexAttribPointer() {},
    getUniformLocation: () => ({}), viewport() {}, deleteShader() {}, deleteProgram() {}, deleteBuffer() {},
    uniform1f() {}, uniform3fv() {}, drawArrays() { draws++; },
  };
  const reduced = { matches: false, addEventListener(name, handler) { events.reduced = handler; } };
  const doc = { hidden: false, addEventListener(name, handler) { events[name] = handler; }, defaultView: {
    innerWidth: 1200, innerHeight: 800, matchMedia: () => reduced, addEventListener() {},
    requestAnimationFrame(handler) { callbacks.set(++serial, handler); return serial; },
    cancelAnimationFrame(id) { callbacks.delete(id); },
  } };
  const canvas = { ownerDocument: doc, getContext: () => gl,
    addEventListener(name, handler) { events[name] = handler; } };
  const update = createAmbientLight(canvas, message => messages.push(message));
  const tick = time => {
    const [id, handler] = callbacks.entries().next().value;
    callbacks.delete(id); handler(time);
  };
  update(preferences({ ambient: true }), true);
  assert.equal(canvas.hidden, false); assert.equal(programs, 1);
  tick(0); tick(16); tick(34);
  assert.equal(draws, 2); assert.equal(callbacks.size, 1);
  doc.hidden = true; events.visibilitychange();
  assert.equal(callbacks.size, 0); assert.equal(canvas.hidden, true);
  doc.hidden = false; events.visibilitychange();
  assert.equal(callbacks.size, 1); assert.equal(messages.at(-1), 'Luz viva ativa.');
  reduced.matches = true; events.reduced();
  assert.equal(callbacks.size, 0); assert.equal(canvas.hidden, true);
  reduced.matches = false; events.reduced();
  events.webglcontextlost({ preventDefault() {} });
  assert.equal(callbacks.size, 0); assert.equal(canvas.hidden, true);
  events.webglcontextrestored();
  assert.equal(programs, 2); assert.equal(callbacks.size, 1); assert.equal(canvas.hidden, false);
  update(preferences({ ambient: true }), false);
  assert.equal(callbacks.size, 0); assert.equal(canvas.hidden, true);
});
