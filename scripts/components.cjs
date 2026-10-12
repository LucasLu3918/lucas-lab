'use strict';

const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
// One icon family for the site: 24px grid, 1.5px outline, round caps. Shapes carrying class "ac" are small solid accents
// (dots, flames, gems) that give each icon a focal point; they inherit the stroke colour as their fill.
const paths = {
  // Interface
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle class="ac" cx="12" cy="7.8" r="1"/>',
  check: '<path d="m5 12.5 4 4L19 6.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2m0 15v2M2.5 12h2m15 0h2M5.3 5.3l1.4 1.4m10.6 10.6 1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/><path class="ac" d="m17 4 .6 1.4L19 6l-1.4.6L17 8l-.6-1.4L15 6l1.4-.6Z"/>',
  sparkle: '<path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z"/><path class="ac" d="m18.5 15.5.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5Z"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="m3.5 16 4.5-4.5 3.5 3.5 2.5-2.5 6.5 6"/><circle class="ac" cx="15.5" cy="9" r="1.6"/>',
  // Site sections
  tool: '<path d="M14.6 3.6a4.6 4.6 0 0 0-4.2 6.1L3.9 16.2a1.9 1.9 0 0 0 2.7 2.7l6.5-6.5a4.6 4.6 0 0 0 6.1-4.2l-2.8 2.1-2.5-.5-.5-2.5Z"/><path d="M15.5 15.5 20 20"/><path class="ac" d="m13.6 13.6 1.4-1.4 2.2 2.2-1.4 1.4Z"/>',
  book: '<path d="M12 6.6C9.9 5.1 7 4.6 3.5 5v13.6c3.5-.4 6.4.1 8.5 1.6 2.1-1.5 5-2 8.5-1.6V5C17 4.6 14.1 5.1 12 6.6Z"/><path d="M12 6.6v13.6M6 9c1.6-.2 2.9 0 4 .5M6 12c1.6-.2 2.9 0 4 .5"/><path class="ac" d="M15.5 4.9h3v5.6l-1.5-1.2-1.5 1.2Z"/>',
  game: '<path d="M8.2 7.5h7.6a4.4 4.4 0 0 1 4.3 3.5l1 4.8a2.5 2.5 0 0 1-4.4 2L15 16H9l-1.7 1.8a2.5 2.5 0 0 1-4.4-2l1-4.8a4.4 4.4 0 0 1 4.3-3.5Z"/><path d="M7.8 10.3v3.4M6.1 12h3.4"/><circle class="ac" cx="15.3" cy="11" r="1"/><circle class="ac" cx="17.3" cy="13" r="1"/>',
  code: '<rect x="3" y="4.5" width="18" height="15" rx="1.5"/><path d="M3 8.5h18M9.5 12l-2.5 2.5 2.5 2.5m5-5 2.5 2.5-2.5 2.5m-1.4-5.5-2.2 6.5"/><circle class="ac" cx="5.6" cy="6.5" r=".7"/><circle class="ac" cx="7.8" cy="6.5" r=".7"/>',
  gallery: '<path d="M4 3.5h16v17H4Z"/><path d="M6.5 6h11v9.5h-11Z"/><path d="m6.5 13.5 3-3 2.5 2.5 1.5-1.5 4 4"/><path class="ac" d="M15.8 7.2a1.7 1.7 0 1 0 1.4 2.6 1.4 1.4 0 0 1-1.4-2.6Z"/><path d="M8.5 18h7"/>',
  pen: '<path d="M20 3.5C12.6 3.9 8.2 8.6 7.2 15.6L5 20.5"/><path d="M20 3.5c-.2 7.1-4.6 11.4-12.6 12.2M15.6 8.4l-4.4 4.4"/><path d="M4 20.5h8"/><circle class="ac" cx="14" cy="20.5" r=".9"/>',
  music: '<path d="M9 17.5V6l10.5-2.5v11.5"/><path d="M9 9.5l10.5-2.5"/><circle class="ac" cx="6.5" cy="17.5" r="2.6"/><circle class="ac" cx="17" cy="15" r="2.6"/>',
  // Projects
  toolbox: '<rect x="3" y="8.5" width="18" height="11" rx="1.5"/><path d="M9 8.5V6.2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.3M3 13.5h18"/><path class="ac" d="M10.5 12.3h3v2.9h-3Z"/>',
  aips: '<path d="M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4Z"/><path d="M12 8v4m0 0-3.6 2.1M12 12l3.6 2.1M8.4 14.1 12 16.2l3.6-2.1"/><circle class="ac" cx="12" cy="8" r="1.3"/><circle class="ac" cx="8.4" cy="14.1" r="1.3"/><circle class="ac" cx="15.6" cy="14.1" r="1.3"/><circle class="ac" cx="12" cy="12" r=".9"/>',
  storefront: '<path d="M4 9.5V20h16V9.5M3 9.5 5 4h14l2 5.5Z"/><path d="M3 9.5c0 1.4 1.1 2.5 2.5 2.5S8 10.9 8 9.5c0 1.4 1.1 2.5 2.5 2.5h3c1.4 0 2.5-1.1 2.5-2.5 0 1.4 1.1 2.5 2.5 2.5S21 10.9 21 9.5"/><path d="M9.5 20v-4.5h5V20"/><circle class="ac" cx="12" cy="7" r=".9"/>',
  // Tools
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.8 9.2h16.4M3.8 14.8h16.4M12 3.5c-2.4 2.4-3.6 5.2-3.6 8.5s1.2 6.1 3.6 8.5m0-17c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5"/>',
  imageSwap: '<rect x="3" y="3.5" width="12.5" height="10" rx="1.2"/><path d="m3 11 3.5-3.5 3 3 1.5-1.5 4.5 4.5"/><circle class="ac" cx="11.8" cy="6.8" r="1.2"/><path d="M19.5 9v7.5a3 3 0 0 1-3 3H9.5m2-2.2-2.2 2.2 2.2 2.2"/>',
  braces: '<path d="M8.5 4H7.6a2 2 0 0 0-2 2v3.4L3.5 12l2.1 2.6V18a2 2 0 0 0 2 2h.9m7-16h.9a2 2 0 0 1 2 2v3.4l2.1 2.6-2.1 2.6V18a2 2 0 0 1-2 2h-.9"/><circle class="ac" cx="9.5" cy="12" r=".95"/><circle class="ac" cx="12" cy="12" r=".95"/><circle class="ac" cx="14.5" cy="12" r=".95"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 8.5V13l3 2M9.5 2.5h5M12 2.5V5m6.4.8 1.4 1.4"/><circle class="ac" cx="12" cy="13" r="1"/>',
  file: '<path d="M6 3h8.5L19 7.5V21H6Z"/><path d="M14 3v5h5M9 12h7m-7 3h7m-7 3h4.5"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.3 0 2-.8 2-1.8 0-1.2-1-1.6-1-2.7 0-1 .8-1.7 1.8-1.7H17a3.5 3.5 0 0 0 3.5-3.5c0-4.1-3.8-7.3-8.5-7.3Z"/><circle class="ac" cx="7.6" cy="11.6" r="1.25"/><circle class="ac" cx="9.6" cy="7.6" r="1.25"/><circle class="ac" cx="14.2" cy="7" r="1.25"/><circle class="ac" cx="17.2" cy="10.2" r="1.25"/>',
  bolt: '<path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6Z"/>',
  qr: '<path d="M3.5 3.5h6.5V10H3.5Zm10.5 0h6.5V10H14ZM3.5 14H10v6.5H3.5Z"/><path class="ac" d="M5.6 5.6h2.3v2.3H5.6Zm10.5 0h2.3v2.3h-2.3ZM5.6 16.1h2.3v2.3H5.6ZM14 14h2.5v2.5H14Zm4 4h2.5v2.5H18Z"/><path d="M14 19.5h1.5m4-5.5v1.5"/>',
  // Worlds and games
  mirror: '<path d="M12 2.5c3 0 5.2 2.9 5.2 6.6S15 15.7 12 15.7 6.8 12.8 6.8 9.1 9 2.5 12 2.5Z"/><path d="M12 15.7v4.8m-4 0h8M9.6 6.4C9 7.1 8.7 8 8.7 9"/><path class="ac" d="m12 .9.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5Z"/>',
  lantern: '<path d="M9 6h6M12 2.8V6M8.2 6 7 9v8.2l1.2 2.8h7.6l1.2-2.8V9l-1.2-3M7 9h10M7 17.2h10"/><path class="ac" d="M12 10.4c1 1.2 1.6 2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-.9.6-1.7 1.6-2.9Z"/>',
  rune: '<circle cx="12" cy="12" r="8.5"/><path d="M12 5.2 17.9 15.4H6.1Z"/><path d="M12 3.5v1.7m0 13.6v1.7M3.5 12h1.7m13.6 0h1.7"/><circle class="ac" cx="12" cy="12" r="1.5"/>',
  tree: '<path d="M12 3 7.5 9.5h2.3L6.5 14h2.8L5.5 19h13l-3.8-5h2.8l-3.3-4.5h2.3Z"/><path d="M12 19v2.5"/><circle class="ac" cx="18.5" cy="5" r="1"/>',
  hood: '<path d="M12 3c-4 0-6.5 3.4-6.5 7.8 0 3.4-1 6.6-2 9.2h17c-1-2.6-2-5.8-2-9.2C18.5 6.4 16 3 12 3Z"/><path d="M8.6 12.5c0-2.6 1.5-4.4 3.4-4.4s3.4 1.8 3.4 4.4c0 2.2-1.5 4-3.4 4s-3.4-1.8-3.4-4Z"/><path class="ac" d="M12 17.8 13 20h-2Z"/>',
  wave: '<path d="M2.5 9c2 0 2-1.5 4-1.5S8.5 9 10.5 9s2-1.5 4-1.5 2 1.5 4 1.5 1.5-.8 3-1.2M2.5 14c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 1.5-.8 3-1.2"/><path d="M5 19h14"/><circle class="ac" cx="17.5" cy="4" r="1"/><circle class="ac" cx="14.8" cy="3.3" r=".6"/>',
  stars: '<path d="M12 3.5A8.5 8.5 0 1 1 3.5 12M12 7a5 5 0 1 1-5 5"/><path class="ac" d="m12 10.6.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4Z"/><circle class="ac" cx="5.9" cy="6" r=".9"/>',
  letter: '<rect x="3" y="5.5" width="18" height="13" rx="1.3"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/><circle class="ac" cx="12" cy="14.6" r="1.4"/>',
  crown: '<path d="M4 18.5h16M4.8 15.5 3.5 7l4.6 3.6L12 4.5l3.9 6.1L20.5 7l-1.3 8.5Z"/><circle class="ac" cx="12" cy="12.2" r="1.2"/>',
  sword: '<path d="M19.5 4.5 10 14m9.5-9.5h-3.8L7.8 12.4M19.5 4.5v3.8l-7.9 7.9M6.5 13l4.5 4.5M7.5 16.5l-3 3"/><circle class="ac" cx="4" cy="20" r="1"/>',
  quill: '<path d="M20 3.5C12.6 3.9 8.2 8.6 7.2 15.6L5 20.5"/><path d="M20 3.5c-.2 7.1-4.6 11.4-12.6 12.2M15.6 8.4l-4.4 4.4"/><path d="M4 20.5h8"/><circle class="ac" cx="14" cy="20.5" r=".9"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m12 5.5 1.6 4.9L18.5 12l-4.9 1.6L12 18.5l-1.6-4.9L5.5 12l4.9-1.6Z"/><circle class="ac" cx="12" cy="12" r="1.2"/>',
};
// Legacy catalog glyphs still resolve to the family; new entries should use the names above.
const symbolIcons = {'⚙':'tool','📖':'book','🎮':'game','◫':'code','✦':'sparkle','✧':'sparkle','✳':'compass','✎':'pen','✉':'letter','☾':'moon','♛':'crown','♟':'game','⌘':'code','◇':'mirror','≈':'wave','⚔':'sword','🌐':'globe','▧':'imageSwap','{}':'braces','◷':'clock','▤':'file','◈':'palette','⚡':'bolt','▦':'qr'};
function icon(name, className = '') {
  return `<svg class="icon ${escape(className)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths[symbolIcons[name]] || paths.sparkle}</svg>`;
}
function createComponents(url) {
  const badge = (text, tone = 'neutral') => `<span class="status status-${escape(tone)}">${escape(text)}</span>`;
  const button = (text, href, primary = false) => `<a class="btn${primary ? ' primary' : ''}" href="${escape(href)}">${escape(text)}${icon('arrow')}</a>`;
  // Placeholder art: the icon set inside a compass medallion that echoes the brand mark.
  const emblem = `<svg class="emblem-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="57" class="er-outer"/><circle cx="60" cy="60" r="49"/><circle cx="60" cy="60" r="53" class="er-ticks"/><path d="M60 0v9M60 111v9M0 60h9M111 60h9" class="er-cross"/><path d="m60 3 2.2 4L60 11l-2.2-4Zm0 106 2.2 4-2.2 4-2.2-4ZM3 60l4-2.2 4 2.2-4 2.2Zm106 0 4-2.2 4 2.2-4 2.2Z" class="er-gem"/></svg>`;
  const view = (symbol, palette = 'blue') => `<div class="visual ${escape(palette)}" aria-hidden="true"><span class="emblem">${emblem}${icon(symbol)}</span></div>`;
  const cover = (story, {priority = false, detail = false} = {}) => {
    const sizes = detail ? '(max-width:720px) 280px, 360px' : '(max-width:480px) 120px, (max-width:720px) 45vw, 360px';
    const srcset = story.coverSmall ? ` srcset="${url(story.coverSmall)} 360w, ${url(story.cover)} 900w" sizes="${sizes}"` : '';
    return `<div class="visual cover-visual book-art" data-cover="${escape(story.slug)}"><img class="book-cover" src="${url(story.cover)}"${srcset} alt="${escape(story.coverAlt || story.title + '原創封面插畫')}" loading="${priority ? 'eager' : 'lazy'}" decoding="async" width="900" height="1350"><div class="cover-edition" aria-hidden="true">LUCAS LAB <span>✦</span></div><div class="cover-caption" aria-hidden="true"><span class="cover-series">${escape(story.coverSeries || 'DARK FANTASY')}</span><strong>${escape(story.coverTitle || story.title)}</strong>${story.coverSubtitle ? `<span class="cover-subtitle">${escape(story.coverSubtitle)}</span>` : ''}</div></div>`;
  };
  // Project screenshots: 16:10 captures of the live site, shown inside a thin browser-style frame.
  const shot = (project, {priority = false, detail = false} = {}) => `<div class="visual shot-visual"><img src="${url(project.shot)}" srcset="${url(project.shotSmall)} 600w, ${url(project.shot)} 1200w" sizes="${detail ? '(max-width:720px) 90vw, 520px' : '(max-width:480px) 34vw, (max-width:1100px) 45vw, 400px'}" alt="${escape(project.shotAlt || project.title + '畫面')}" loading="${priority ? 'eager' : 'lazy'}" decoding="async" width="1200" height="750"></div>`;
  const media = (obj, priority = false) => obj.cover ? cover(obj, {priority}) : obj.shot ? shot(obj, {priority}) : view(obj.symbol, obj.palette);
  const notice = text => `<div class="warning" role="note">${icon('info')}<span>${escape(text)}</span></div>`;
  const readerControls = (story, currentChapter) => `<div class="readerbar"><div class="control-group" role="group" aria-label="閱讀主題"><button type="button" data-theme="paper" aria-pressed="true">${icon('sun')}紙張</button><button type="button" data-theme="night" aria-pressed="false">${icon('moon')}夜間</button></div><div class="control-group reader-buttons" role="group" aria-label="文字大小"><button type="button" data-font="-1" aria-label="縮小字體">A−</button><span data-size aria-live="polite">18px</span><button type="button" data-font="1" aria-label="放大字體">A＋</button></div><label class="chapter-select">章節<select data-chapter-select aria-label="跳至章節">${story.chapters.map(c => `<option value="${url('stories/' + story.slug + '/chapters/' + c.id + '/')}"${c.id === currentChapter.id ? ' selected' : ''}>${escape(c.title)}</option>`).join('')}</select></label></div><div class="reading-progress"><span>本章進度</span><progress data-reading-progress max="100" value="0" aria-label="本章閱讀進度"></progress><span data-reading-percent>0%</span></div>`;
  return {icon, badge, button, view, cover, shot, media, notice, readerControls};
}
const hasIcon = name => Boolean(paths[name] || paths[symbolIcons[name]]);
module.exports = {escape, icon, hasIcon, createComponents};
