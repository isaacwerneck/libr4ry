import test from 'node:test';
import assert from 'node:assert/strict';
import { capturePaper, stopPaperMotion, turnPaper, cornerProgress, setupPageCorner } from '../public/notebook-motion.js';

function fixture() {
  const calls = [];
  function node() {
    return {
      children: [], style: {}, attributes: { id: 'original' },
      querySelector: () => null,
      cloneNode() { const copy = node(); copy.querySelectorAll = () => []; return copy; },
      classList: { add() {} },
      setAttribute(name, value) { this.attributes[name] = value; },
      removeAttribute(name) { delete this.attributes[name]; },
      append(...children) { for (const child of children) { this.children.push(child); child.parent = this; } },
      remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); },
      animate(frames, options) {
        const animation = { cancel() { this.canceled = true; this.oncancel?.(); } };
        calls.push({ node: this, frames, options, animation });
        return animation;
      },
    };
  }
  const parent = node();
  const fields = [{ value: 'Título editado' }, { value: 'Texto ainda no editor' }];
  const paper = Object.assign(node(), {
    ownerDocument: { createElement: node }, parentElement: parent,
    offsetWidth: 840, offsetHeight: 1254, offsetTop: 8, offsetLeft: 0,
    getAnimations: () => [], querySelectorAll: () => fields,
    cloneNode() {
      const front = node();
      const clonedFields = fields.map(() => Object.assign(node(), { value: '' }));
      front.querySelectorAll = () => clonedFields;
      return front;
    },
  });
  return { paper, parent, calls, fields };
}

test('virada leva a folha antiga ao outro lado e limpa cópias ao concluir ou interromper', () => {
  const { paper, parent, calls, fields } = fixture();
  const outgoing = capturePaper(paper, 'full', false);
  assert.equal(outgoing.inert, true);
  assert.equal(outgoing.attributes['aria-hidden'], 'true');
  assert.equal(outgoing.children.length, 3);
  const front = outgoing.children[0];
  assert.equal(front.attributes.id, undefined);
  assert.deepEqual(front.querySelectorAll().map(field => field.value), fields.map(field => field.value));
  assert.ok(front.querySelectorAll().every(field => field.attributes.id === undefined));
  fields[1].value = 'Próxima página';
  outgoing.style.left = '660px'; outgoing.style.top = '20px';
  turnPaper(paper, 1, 'full', false, outgoing);
  assert.equal(outgoing.style.left, '0px');
  assert.equal(outgoing.style.top, '8px');
  assert.equal(outgoing.style.transformOrigin, 'left center');
  assert.equal(calls[0].node, outgoing);
  assert.equal(calls[0].frames[0].transform, 'rotateY(0deg)');
  assert.equal(calls[0].frames.at(-1).transform, 'rotateY(-180deg)');
  assert.equal(front.querySelectorAll()[1].value, 'Texto ainda no editor');
  calls[0].animation.onfinish();
  assert.equal(parent.children.length, 0);

  turnPaper(paper, -1, 'light', false, capturePaper(paper, 'light', false));
  assert.equal(parent.children.length, 1);
  assert.equal(parent.children[0].style.transformOrigin, 'right center');
  assert.equal(calls[1].frames[0].transform, 'rotateY(0deg)');
  assert.equal(calls[1].frames.at(-1).transform, 'rotateY(180deg)');
  assert.ok(calls[1].options.duration < calls[0].options.duration);
  stopPaperMotion(paper);
  assert.equal(calls[1].animation.canceled, true);
  assert.equal(parent.children.length, 0);
  stopPaperMotion(paper);
  turnPaper(paper, 1, 'full', false, capturePaper(paper, 'full', false));
  const superseded = calls.at(-1).animation;
  turnPaper(paper, 1, 'full', false, capturePaper(paper, 'full', false));
  assert.equal(superseded.canceled, true);
  superseded.onfinish();
  assert.equal(parent.children.length, 1);
  calls.at(-1).animation.onfinish();
  assert.equal(parent.children.length, 0);
});

test('redução de movimento, modo desligado e ausência de suporte não criam cópias', () => {
  const { paper, parent, calls } = fixture();
  assert.equal(capturePaper(paper, 'off', false), null);
  assert.equal(capturePaper(paper, 'full', true), null);
  assert.equal(capturePaper({}, 'full', false), null);
  turnPaper(paper, 1, 'off', false, capturePaper(paper, 'full', false));
  assert.equal(parent.children.length, 0);
  assert.equal(calls.length, 0);
});

test('a aterrissagem e interrupções limpam a face estacionária uma única vez', () => {
  const { paper, calls } = fixture();
  let landings = 0;
  turnPaper(paper, 1, 'full', false, capturePaper(paper, 'full', false), 0, () => landings++);
  stopPaperMotion(paper);
  calls[0].animation.onfinish();
  assert.equal(landings, 1);
  turnPaper(paper, 1, 'off', false, null, 0, () => landings++);
  assert.equal(landings, 2);
});

test('virada da capa mostra guarda interna em vez de repetir revestimento externo', () => {
  const { paper } = fixture();
  paper.classList.contains = name => name === 'book-face';
  paper.dataset = { face: 'back' };
  const classes = [];
  const create = paper.ownerDocument.createElement;
  paper.ownerDocument.createElement = () => { const node = create(); node.dataset = {}; node.classList.add = name => classes.push(name); return node; };
  const copy = capturePaper(paper, 'full', false);
  assert.ok(classes.includes('cover-inside'));
  assert.equal(copy.children[1].dataset.face, 'back');
});

test('virada arrastada continua do ângulo atual e mantém direção e limites', () => {
  assert.equal(cornerProgress(-250, 1000, 1), .25);
  assert.equal(cornerProgress(250, 1000, -1), .25);
  assert.equal(cornerProgress(250, 1000, 1), 0);
  assert.equal(cornerProgress(-2000, 1000, 1), 1);
  const { paper, parent, calls } = fixture();
  turnPaper(paper, -1, 'full', false, capturePaper(paper, 'full', false), .4);
  assert.equal(calls[0].frames[0].transform, 'rotateY(72deg)');
  assert.equal(calls[0].frames.at(-1).transform, 'rotateY(180deg)');
  assert.equal(calls[0].options.duration, 432);
  assert.equal(parent.children[0].style.transformOrigin, 'right center');
  calls[0].animation.onfinish();
  assert.equal(parent.children.length, 0);
});

test('sombra acompanha o ângulo restante e a aterrissagem quase completa não pisca', () => {
  const { paper, calls } = fixture();
  const outgoing = capturePaper(paper, 'full', false);
  const shade = outgoing.children[2];
  outgoing.querySelector = () => shade;
  let cleanups = 0;
  turnPaper(paper, 1, 'full', false, outgoing, .98, () => cleanups++);
  assert.equal(calls[0].options.duration, 120);
  assert.equal(calls[1].options.duration, calls[0].options.duration);
  assert.equal(calls[1].options.easing, calls[0].options.easing);
  const opacities = calls[1].frames.map(frame => frame.opacity);
  assert.ok(opacities[0] < .04);
  assert.ok(opacities.every((value, index) => !index || value <= opacities[index - 1]));
  stopPaperMotion(paper);
  calls[0].animation.onfinish();
  assert.equal(cleanups, 1);
  assert.equal(calls[1].animation.canceled, true);
});

test('cancelar arraste impede clique residual, remove retorno e preserva virada por teclado', t => {
  const originalWindow = globalThis.window;
  const events = {};
  globalThis.window = { scrollX: 0, scrollY: 600, scrollTo(value) { this.scrollY = value.top; }, addEventListener(name, handler) { events[name] = handler; } };
  t.after(() => { if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; });
  const { paper, parent, calls } = fixture();
  paper.getBoundingClientRect = () => ({ width: 1000 });
  const handlers = {}; const turns = [];
  let captured = false;
  const button = { dataset: { direction: '1' },
    addEventListener(name, handler) { handlers[name] = handler; },
    setPointerCapture() { captured = true; }, hasPointerCapture: () => captured,
    releasePointerCapture() { captured = false; },
  };
  let previews = 0;
  const previewDirections = [];
  const options = { mode: 'full', reduced: false, preview(direction) {
    previews++; previewDirections.push(direction);
    return () => { previews--; };
  } };
  const cancel = setupPageCorner(button, paper, () => options, (...args) => turns.push(args));
  const down = () => handlers.pointerdown({ button: 0, ctrlKey: false, pointerId: 7, clientX: 1000, preventDefault() {} });
  down(); globalThis.window.scrollY = 900; handlers.pointermove({ pointerId: 7, clientX: 700 });
  assert.equal(globalThis.window.scrollY, 600);
  assert.equal(parent.children.length, 1);
  assert.equal(previews, 1);
  assert.equal(previewDirections.at(-1), 1);
  events.keydown({ key: 'Escape' });
  assert.equal(previews, 0);
  assert.equal(parent.children.length, 0); assert.equal(captured, false);
  handlers.pointerup({ pointerId: 7 }); handlers.click({ detail: 1 });
  assert.equal(turns.length, 0);
  handlers.click({ detail: 0 }); assert.equal(turns.length, 1);
  down(); handlers.pointermove({ pointerId: 7, clientX: 900 }); handlers.pointerup({ pointerId: 7 });
  assert.equal(parent.children.length, 1);
  cancel(); assert.equal(parent.children.length, 0); assert.equal(calls.at(-1).animation.canceled, true);
  assert.equal(previews, 0);
  handlers.click({ detail: 1 }); assert.equal(turns.length, 1);
  down(); handlers.pointermove({ pointerId: 7, clientX: 600 }); handlers.pointerup({ pointerId: 7 });
  assert.equal(turns.length, 2); assert.equal(turns[1][1].progress, .4);
  assert.equal(previews, 0);
  turns[1][1].outgoing.remove(); handlers.click({ detail: 1 }); assert.equal(turns.length, 2);
  down(); handlers.pointermove({ pointerId: 7, clientX: 900 }); handlers.lostpointercapture();
  assert.equal(parent.children.length, 0);
  options.freeDirection = true; options.dragOnly = true; button.dataset.direction = '-1';
  down(); handlers.pointermove({ pointerId: 7, clientX: 600 }); handlers.pointerup({ pointerId: 7 });
  assert.equal(turns.at(-1)[0], 1); assert.equal(turns.at(-1)[1].progress, .4);
  turns.at(-1)[1].outgoing.remove(); handlers.click({ detail: 1 });
  const total = turns.length;
  down(); handlers.pointerup({ pointerId: 7 }); handlers.click({ detail: 1 });
  assert.equal(turns.length, total);
  options.pan = true; down(); handlers.pointermove({ pointerId: 7, clientX: 600 }); handlers.pointerup({ pointerId: 7 }); handlers.click({ detail: 1 });
  assert.equal(turns.length, total); assert.equal(parent.children.length, 0);
});
