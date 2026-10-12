import { clampZoom } from './notebook-viewport.js';

export function preferences(value = {}) {
  const choice = (name, options, fallback) => options.includes(value?.[name]) ? value[name] : fallback;
  return {
    paper: choice('paper', ['cream', 'white', 'sand'], 'cream'),
    cover: choice('cover', ['walnut', 'clay', 'slate'], 'walnut'),
    coverColor: /^#[\da-f]{6}$/i.test(value?.coverColor || '') ? value.coverColor : '',
    finish: choice('finish', ['leather', 'cloth', 'smooth'], 'leather'),
    font: choice('font', ['mono', 'serif', 'sans', 'hand'], 'sans'),
    binding: choice('binding', ['stitched', 'spiral', 'soft'], 'stitched'),
    ruling: choice('ruling', ['lined', 'plain', 'dotted', 'grid'], 'lined'),
    desk: choice('desk', ['wood', 'dark', 'linen'], 'wood'),
    light: choice('light', ['warm', 'day', 'night'], 'warm'),
    layout: choice('layout', ['single', 'spread'], 'single'),
    motion: choice('motion', ['full', 'light', 'off'], 'full'),
    reading: value?.reading === true,
    reminder: value?.reminder === true,
    ambient: value?.ambient === true,
    zoom: Number.isFinite(value?.zoom) ? clampZoom(value.zoom) : 1,
  };
}

export function recentPosition(book, now = Date.now()) {
  const position = book.position;
  if (!position || !Number.isFinite(position.at) || position.at > now || now - position.at > 86400000) return null;
  const page = book.pages.find(page => page.id === position.pageId);
  if (!page) return null;
  return { page, caret: Math.max(0, Math.min(page.content.length, Number(position.caret) || 0)),
    fraction: Math.max(0, Math.min(1, Number(position.fraction) || 0)), at: position.at };
}
