// One icon family for the whole game: 24px grid, 1.5px outline, round caps, no fills.
// Spots, items, HUD tools and arrows all draw from this table, so the line weight and size never drift.
const paths = {
  // UI chrome
  hint: 'M9 17.5h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  candle: 'M12 2.5c1.5 1.8 2.2 2.9 2.2 4a2.2 2.2 0 0 1-4.4 0c0-1.1.7-2.2 2.2-4z M9.5 11h5v9h-5z M8 20.5h8',
  journal: 'M7 3.5h10.5a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H7z M7 3.5v17 M4.5 7.5H7 M4.5 12H7 M4.5 16.5H7 M11 8h4.5',
  gallery: 'M4 5h16v14H4z M4 15l4.5-4.5 4 4 2.5-2.5L20 17 M15.5 9.5h.01',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  arrowR: 'M6.4 12h9.4',
  arrowL: 'M17.6 12H8.2',
  arrowD: 'M12 6.4v9.4',
  arrowUR: 'M6.4 12h9.4',
  viewL: 'M14.5 5.5 8 12l6.5 6.5',
  viewR: 'M9.5 5.5 16 12l-6.5 6.5',
  undo: 'M9 14 4 9l5-5 M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  chevD: 'm6 9 6 6 6-6',
  sound: 'M3.5 10a1 1 0 0 1 1-1H7l4.5-3.8v13.6L7 15H4.5a1 1 0 0 1-1-1z M15 9.2a4 4 0 0 1 0 5.6 M17.8 6.5a7.8 7.8 0 0 1 0 11',
  mute: 'M3.5 10a1 1 0 0 1 1-1H7l4.5-3.8v13.6L7 15H4.5a1 1 0 0 1-1-1z M15.5 9.5l5 5 M20.5 9.5l-5 5',
  settings: 'M10.56 4.74 10.65 2.5A9.6 9.6 0 0 1 13.35 2.5L13.44 4.74A7.4 7.4 0 0 1 16.11 5.85L17.76 4.32A9.6 9.6 0 0 1 19.68 6.24L18.15 7.89A7.4 7.4 0 0 1 19.26 10.56L21.5 10.65A9.6 9.6 0 0 1 21.5 13.35L19.26 13.44A7.4 7.4 0 0 1 18.15 16.11L19.68 17.76A9.6 9.6 0 0 1 17.76 19.68L16.11 18.15A7.4 7.4 0 0 1 13.44 19.26L13.35 21.5A9.6 9.6 0 0 1 10.65 21.5L10.56 19.26A7.4 7.4 0 0 1 7.89 18.15L6.24 19.68A9.6 9.6 0 0 1 4.32 17.76L5.85 16.11A7.4 7.4 0 0 1 4.74 13.44L2.5 13.35A9.6 9.6 0 0 1 2.5 10.65L4.74 10.56A7.4 7.4 0 0 1 5.85 7.89L4.32 6.24A9.6 9.6 0 0 1 6.24 4.32L7.89 5.85A7.4 7.4 0 0 1 10.56 4.74z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  clockface: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z M12 7.5V12l3 2',
  chapters: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z',
  facet: 'M7 4h10l4 5-9 11L3 9z M3 9h18 M9.5 4 8 9l4 11 4-11-1.5-5',
  ending: 'M12 21s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 8.2a4.2 4.2 0 0 1 7.5 2.6C19.5 16.4 12 21 12 21z',
  // Things in the rooms
  book: 'M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2z M12 6.5v13',
  document: 'M7 3h7l4 4v14H7z M14 3v4h4 M10 12h5 M10 16h5',
  envelope: 'M3.5 6h17v12h-17z M3.5 7l8.5 6.5L20.5 7',
  seal: 'M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M8.5 12 7 21l5-3 5 3-1.5-9 M10 8l1.5 1.5L14.5 6.5',
  blueprint: 'M4 4h16v16H4z M4 9h16 M9 4v16 M13 13h4 M13 16h4',
  clock: 'M12 6a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M12 9.5V13l2.5 1.5 M10 3h4 M12 3v3',
  bell: 'M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15z M10 21.5h4',
  lock: 'M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3 M12 14.5v2.5',
  chain: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  gear: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M10.3 3.5h3.4l.5 2.2 1.6.9 2.1-.8 1.7 2.9-1.7 1.5v1.8l1.7 1.5-1.7 2.9-2.1-.8-1.6.9-.5 2.2h-3.4l-.5-2.2-1.6-.9-2.1.8-1.7-2.9 1.7-1.5v-1.8L4.4 9.7l1.7-2.9 2.1.8 1.6-.9z',
  apple: 'M12 8c-2-1.6-6-1.2-6.6 3.4C4.8 15.5 8 20.5 10 20.5c.8 0 1.2-.4 2-.4s1.2.4 2 .4c2 0 5.2-5 4.6-9.1C18 6.8 14 6.4 12 8z M12 8c0-2 1-3.4 2.6-4',
  gem: 'M7 4h10l4 5-9 11L3 9z M3 9h18 M9.5 4 8 9l4 11 4-11-1.5-5',
  key: 'M8.5 7a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M11 12.5l9 8 M16 17l2.5-2.5 M18.5 19.5 21 17',
  mirror: 'M12 2.5c-3.6 0-6 3.5-6 8.5s2.4 8.5 6 8.5 6-3.5 6-8.5-2.4-8.5-6-8.5z M9 21.5h6 M12 19.5v2',
  shard: 'M6 4l9-1 4 8-6 10-7-9z M10 8l4 3',
  heart: 'M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.5 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z M13 8l-2 3 2 2-1 3',
  memory: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z',
  window: 'M6 21V10a6 6 0 0 1 12 0v11z M12 4v17 M6 13h12',
  door: 'M6 21V4h12v17 M4 21h16 M14.5 12.5h.01',
  ink: 'M8 10h8l2 3v6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-6z M10 10V8h4v2 M15 3l-3 5',
  petals: 'M12 12c-2.5-2-2.5-5.5 0-8 2.5 2.5 2.5 6 0 8z M12 12c-3.2.5-6 2-7 5 3.2 1 6-.5 7-5z M12 12c3.2.5 6 2 7 5-3.2 1-6-.5-7-5z',
  chandelier: 'M12 3v5 M5 9h14l-2.5 5h-9z M8 14v4 M12 14v6 M16 14v4',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3.5 20a5.5 5.5 0 0 1 11 0 M17 6a2.6 2.6 0 0 1 0 5 M16.5 14.5a5 5 0 0 1 4 5.5',
  crown: 'M4 18.5 3.5 8 8.5 12 12 5.5 15.5 12l5-4-.5 10.5z M4.5 21h15',
  mask: 'M3 8c3-2 6-2.5 9-1 3-1.5 6-1 9 1-.3 5-2 8-5 8-1.5 0-2.5-1-4-1s-2.5 1-4 1c-3 0-4.7-3-5-8z M7.5 10.5l2.5 1 M16.5 10.5l-2.5 1',
  glove: 'M8 21v-4L5 12.5v-4l2 1V5a1.2 1.2 0 0 1 2.4 0v4.5V4a1.2 1.2 0 0 1 2.4 0v5.5V5a1.2 1.2 0 0 1 2.4 0v5.5V7a1.2 1.2 0 0 1 2.4 0v7c0 3-1 4-2 5v2z',
  knife: 'M4 20l2-5 9-10c1-1 3.5-1.7 5-1.5.2 1.5-.5 4-1.5 5l-10 9z M6 15l3 3',
  needle: 'M4 20 20 4 M17 3.5a2 2 0 0 1 3.5 3.5 M9 15c-2 .5-4 1.5-5 5',
  thimble: 'M7 20h10 M8 20c-1-3-2-6-1.5-8A5.5 5.5 0 0 1 12 6.5 5.5 5.5 0 0 1 17.5 12c.5 2-.5 5-1.5 8 M9.5 11h.01 M12 11h.01 M14.5 11h.01 M10.5 14.5h.01 M13.5 14.5h.01',
  ribbon: 'M12 12 4 7.5v9z M12 12l8-4.5v9z M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z M11 14.5 9 21 M13 14.5 15 21',
  toy: 'M4 20v-8h8v8z M12 20v-8h8v8z M8 12V4h8v8',
  lantern: 'M9.5 3.5h5 M8 6h8l1 3v9l-1 2.5H8L7 18V9z M12 10c1 1.2 1.3 2 .6 3a1.7 1.7 0 0 1-1.2 0c-.7-1-.4-1.8.6-3z',
  coffin: 'M9 3h6l3 6-3 12H9L6 9z M9 9h6',
  whisper: 'M4 5h16v11H11l-4 4v-4H4z M8 10h8',
  lips: 'M3 12c3-3 5-3 9-1.5 4-1.5 6-1.5 9 1.5-3 4-6 5-9 5s-6-1-9-5z M3 12c6 1.5 12 1.5 18 0',
  veil: 'M5 20c1-6 1-11 7-16 6 5 6 10 7 16 M9 20c0-4 1-7 3-9 2 2 3 5 3 9',
  flame: 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 1.5 1 2 2 2 0-3-1-5 1-8z',
  antlers: 'M12 21v-8 M12 13c-2 0-4-1-5-4 M7 9V4 M7 9c-1.5 0-3-1-3.5-3 M12 13c2 0 4-1 5-4 M17 9V4 M17 9c1.5 0 3-1 3.5-3',
  footprints: 'M8 3.5c1.5 0 2.5 1.8 2.5 4S9.5 11 8 11 5.5 9.7 5.5 7.5 6.5 3.5 8 3.5z M7 13h2.2l-.3 3.2c-.1.6-.5 1-1 1s-1-.4-1-1z M16 9.5c1.5 0 2.5 1.8 2.5 4s-1 3.5-2.5 3.5-2.5-1.3-2.5-3.5 1-4 2.5-4z M15 19h2.2l-.3 1.7c-.1.5-.5.8-1 .8s-.9-.3-1-.8z',
  flag: 'M5 3v18 M5 4h14l-3 4.5 3 4.5H5',
  trail: 'M10 21c-3-4 7-7 4-11-1-1.5-3-2-3-5 M8 3h6',
  pipes: 'M3 8h6a3 3 0 0 1 3 3v2a3 3 0 0 0 3 3h6 M3 5.5v5 M21 13.5v5',
  cart: 'M4 8h16l-2 8H6z M8 19.5a1.5 1.5 0 1 0 0 .01 M16 19.5a1.5 1.5 0 1 0 0 .01',
  cradle: 'M4 12h16c0 4-3 6-8 6s-8-2-8-6z M7 12V7 M17 12V7 M5 21h14',
  portrait: 'M5 3h14v18H5z M12 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z M8 18c.5-2 2-3 4-3s3.5 1 4 3',
  rabbit: 'M9 3c-1.5 0-2 3-1 7 M15 3c1.5 0 2 3 1 7 M12 21c-4 0-6-2-6-5s2-6 6-6 6 3 6 6-2 5-6 5z',
  // Lucide icon (ISC; the x is derived from Feather, MIT). Full notices: LUCIDE_LICENSE.txt. Only generic controls the hand-drawn set does not cover go here.
  close: 'M18 6 6 18 M6 6l12 12',
  inspect: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'
};

// Spot id → picture. Falls back to the kind of spot, then to the icon named in the chapter data.
const bySpot = {
  bells: 'bell', birth: 'document', watch: 'clock', tower: 'window', chain: 'chain', waxseal: 'seal', spine: 'book', inkwell: 'ink', contract: 'seal',
  invite: 'envelope', guests: 'people', prince: 'crown', bigmirror: 'mirror', chandelier: 'chandelier', petals: 'petals', window: 'window', foxmask: 'mask', glove: 'glove', hallmirrors: 'mirror', hall: 'door',
  heart: 'heart', notes: 'document', knife: 'knife', cabinwindow: 'window', fire: 'flame', toy: 'toy', antlers: 'antlers', footprints: 'footprints', redcloth: 'flag', path: 'trail',
  minebook: 'book', valve: 'gear', pipeNote: 'document', pipes: 'pipes', lantern: 'lantern', furnace: 'flame', cart: 'cart', blueprintwall: 'blueprint', cradle: 'cradle', miners: 'people',
  grimoire: 'book', apple: 'apple', coffin: 'coffin', reflection: 'mirror', voice: 'whisper', kiss: 'lips', veil: 'veil', candle: 'candle',
  rabbit: 'rabbit', needle: 'needle', letter: 'envelope', portrait: 'portrait', agreement: 'document', vanity: 'crown', thimble: 'thimble',
  lucy: 'mirror', witness: 'document', heatplan: 'gear', children: 'people', emptythrone: 'crown', corridor: 'door', ribbon: 'ribbon'
};
const byItem = {
  watch: 'clock', valve: 'gear', apple: 'apple', needle: 'needle', witness: 'document', contract: 'seal', blueprint: 'blueprint', lantern: 'lantern',
  candle: 'candle', thimble: 'thimble', ribbon: 'ribbon', foxmask: 'mask', glove: 'glove', knife: 'knife', toy: 'toy'
};

// Arrows are drawn as a quill: a fine shaft, a small diamond at the tail and a filled spearhead with a notched back.
// The solid parts live in `solids` (filled, 1px rounded edge) so the line icons around them stay outline-only.
const solids = {
  arrowR: 'M21.5 12 15 7.7 16.6 12 15 16.3z M3 12l1.7-1.7L6.4 12l-1.7 1.7z',
  arrowL: 'M2.5 12 9 7.7 7.4 12 9 16.3z M21 12l-1.7-1.7-1.7 1.7 1.7 1.7z',
  arrowD: 'M12 21.5 7.7 15l4.3 1.6 4.3-1.6z M12 3l-1.7 1.7L12 6.4l1.7-1.7z',
  arrowUR: 'M21.5 12 15 7.7 16.6 12 15 16.3z M3 12l1.7-1.7L6.4 12l-1.7 1.7z',
  viewL: 'M3.6 12l1.6-1.6L6.8 12l-1.6 1.6z',
  viewR: 'M20.4 12l-1.6-1.6-1.6 1.6 1.6 1.6z'
};
const turn = { arrowUR: ' transform="rotate(-45 12 12)"' };

export const icon = (name) => {
  const key = paths[name] ? name : 'inspect';
  const solid = solids[key] ? `<path d="${solids[key]}" fill="currentColor" stroke-width="1"/>` : '';
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><g${turn[key] || ''}><path d="${paths[key]}"/>${solid}</g></svg>`;
};

export function spotIcon(spot) {
  if (spot.memory) return 'memory';
  if (spot.lock) return 'lock';
  if (spot.id.startsWith('shard-')) return 'shard';
  return bySpot[spot.id] || (paths[spot.icon] ? spot.icon : 'inspect');
}

export const itemIcon = (id, item) => byItem[id] || (paths[item?.icon] ? item.icon : 'inspect');

// Static markup in index.html asks for an icon with data-icon="name"; this fills them in once.
export function hydrateIcons(root = document) {
  for (const el of root.querySelectorAll('[data-icon]')) {
    el.innerHTML = icon(el.dataset.icon);
    el.removeAttribute('data-icon');
  }
}

// Button labels are written with text arrows (⟶ ↗ ← ↓ ✧). Fonts draw those at different sizes and baselines,
// so every one inside a button is swapped for the matching icon, now and whenever the label is rewritten.
const GLYPHS = { '⟶': 'arrowR', '→': 'arrowR', '↗': 'arrowUR', '↓': 'arrowD', '✧': 'memory', '←': 'arrowL', '↶': 'undo' };
const GLYPH_END = /\s*([⟶→↗↓✧])\s*$/;
const GLYPH_START = /^\s*([←↶])\s*/;
// Every arrow is the same quill from the icon family, so it is drawn as an SVG and inherits the button's colour.
const arrowMarkup = (glyph) => `<span class="btn-arrow" aria-hidden="true">${icon(GLYPHS[glyph])}</span>`;

function convertButton(button) {
  if (button.querySelector('.btn-arrow')) return;
  const nodes = [...button.childNodes];
  const last = nodes[nodes.length - 1];
  const first = nodes[0];
  if (last?.nodeType === 3 && GLYPH_END.test(last.nodeValue)) {
    const glyph = last.nodeValue.match(GLYPH_END)[1];
    last.nodeValue = last.nodeValue.replace(GLYPH_END, '');
    button.insertAdjacentHTML('beforeend', arrowMarkup(glyph));
  } else if (last?.nodeType === 1 && last.tagName === 'SPAN' && last.textContent.length <= 2 && GLYPHS[last.textContent.trim()] && !last.children.length) {
    last.outerHTML = arrowMarkup(last.textContent.trim());
  } else if (first?.nodeType === 3 && GLYPH_START.test(first.nodeValue)) {
    const glyph = first.nodeValue.match(GLYPH_START)[1];
    first.nodeValue = first.nodeValue.replace(GLYPH_START, '');
    button.insertAdjacentHTML('afterbegin', arrowMarkup(glyph));
  }
}

export function enableButtonArrows(root = document.body) {
  const scan = () => root.querySelectorAll('button').forEach(convertButton);
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; scan(); });
  }).observe(root, { childList: true, subtree: true, characterData: true });
  scan();
}
