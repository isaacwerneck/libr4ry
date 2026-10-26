import test from 'node:test';
import assert from 'node:assert/strict';
import markdownit from 'markdown-it';
import { preferences, COVER_COLORS } from '../public/notebook-preferences.js';
import { installStudyStyles, styledSelection } from '../public/notebook-writing.js';
import { animateNotebookCamera, stopNotebookCamera } from '../public/notebook-viewport.js';

test('novas fontes e materiais preservam validação, Markdown seguro e preferências antigas', () => {
  const markdown = installStudyStyles(markdownit({ html: false }));
  for (const font of ['book', 'humanist', 'typewriter']) {
    assert.equal(preferences({ font }).font, font);
    const style = styledSelection('<b>texto</b>', 0, 12, font, 'ink', '16');
    const html = markdown.render(style.text);
    assert.ok(html.includes('study-font-' + font));
    assert.ok(html.includes('&lt;b&gt;'));
  }
  for (const cover of Object.keys(COVER_COLORS)) assert.equal(preferences({ cover }).cover, cover);
  for (const paper of ['ivory', 'sage', 'rose', 'mist']) assert.equal(preferences({ paper }).paper, paper);
  for (const desk of ['oak', 'cherry', 'espresso', 'felt']) assert.equal(preferences({ desk }).desk, desk);
  assert.equal(preferences({ font: 'url(javascript:bad)' }).font, 'sans');
  assert.equal(preferences().paper, 'cream');
  assert.equal(preferences().desk, 'wood');
});

test('câmera interpola posições e zoom sem alterar geometria final, respeita cancelamento e movimento reduzido', () => {
  const calls = [];
  let cancelled = 0;
  const viewport = {
    getBoundingClientRect: () => ({ left: 20, top: 30 }),
    animate(frames, options) { calls.push({ frames, options }); return { cancel() { cancelled++; } }; },
  };
  const before = { left: 100, top: 80, width: 400 };
  const after = { left: 200, top: 150, width: 800 };
  animateNotebookCamera(viewport, before, after);
  assert.equal(calls[0].frames[0].transform, 'translate(-10px, -10px) scale(0.5)');
  assert.equal(calls[0].frames[1].transform, 'none');
  assert.equal(calls[0].options.duration, 320);
  animateNotebookCamera(viewport, before, after, 'light');
  assert.equal(cancelled, 1);
  assert.equal(calls[1].options.duration, 160);
  stopNotebookCamera(viewport); stopNotebookCamera(viewport);
  assert.equal(cancelled, 2);
  animateNotebookCamera(viewport, before, after, 'off');
  animateNotebookCamera(viewport, before, after, 'full', true);
  animateNotebookCamera(viewport, after, after);
  assert.equal(calls.length, 2);
});
