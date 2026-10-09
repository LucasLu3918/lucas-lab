'use strict';

const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const paths = {
  book: '<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1Z"/><path d="M12 6v14"/>',
  tool: '<path d="m14 6 4-3a6 6 0 0 1-7 8l-7 7a2 2 0 0 0 3 3l7-7a6 6 0 0 0 7-8l-3 4Z"/>',
  game: '<path d="M7 7h10c3 0 5 10 3 11-2 1-4-3-5-3H9c-1 0-3 4-5 3-2-1 0-11 3-11Z"/><path d="M8 9v5m-2-2h4m6-1h.01m2 2h.01"/>',
  code: '<path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-16-2 20"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',
  pen: '<path d="m14 4 6 6M4 20l5-1L21 7l-4-4L5 15Z"/>',
  sparkle: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  moon: '<path d="M20 15a9 9 0 0 1-11-11 9 9 0 1 0 11 11Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  file: '<path d="M5 3h9l5 5v13H5Z M14 3v5h5 M8 12h8m-8 4h6"/>',
  bolt: '<path d="m14 2-9 12h6l-1 8 9-13h-6Z"/>',
  grid: '<path d="M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z"/>',
};
const symbolIcons = {'⚙':'tool','📖':'book','🎮':'game','◫':'code','✦':'sparkle','✎':'pen','☾':'moon','♛':'sparkle','♟':'game','⌘':'code','◇':'sparkle','🌐':'globe','▧':'image','{}':'code','◷':'clock','▤':'file','◈':'sparkle','⚡':'bolt','▦':'grid'};
function icon(name, className = '') {
  return `<svg class="icon ${escape(className)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths[symbolIcons[name]] || paths.sparkle}</svg>`;
}
function createComponents(url) {
  const badge = (text, tone = 'neutral') => `<span class="status status-${escape(tone)}">${escape(text)}</span>`;
  const button = (text, href, primary = false) => `<a class="btn${primary ? ' primary' : ''}" href="${escape(href)}">${escape(text)}${icon('arrow')}</a>`;
  const view = (symbol, palette = 'blue') => `<div class="visual ${escape(palette)}" aria-hidden="true"><span>${icon(symbol)}</span></div>`;
  const cover = (story, {priority = false, detail = false} = {}) => {
    const sizes = detail ? '(max-width:720px) 280px, 360px' : '(max-width:480px) 120px, (max-width:720px) 45vw, 360px';
    const srcset = story.coverSmall ? ` srcset="${url(story.coverSmall)} 360w, ${url(story.cover)} 900w" sizes="${sizes}"` : '';
    return `<div class="visual cover-visual book-art" data-cover="${escape(story.slug)}"><img class="book-cover" src="${url(story.cover)}"${srcset} alt="${escape(story.coverAlt || story.title + '原創封面插畫')}" loading="${priority ? 'eager' : 'lazy'}" decoding="async" width="900" height="1350"><div class="cover-edition" aria-hidden="true">LUCAS LAB <span>✦</span></div><div class="cover-caption" aria-hidden="true"><span class="cover-series">${escape(story.coverSeries || 'DARK FANTASY')}</span><strong>${escape(story.coverTitle || story.title)}</strong>${story.coverSubtitle ? `<span class="cover-subtitle">${escape(story.coverSubtitle)}</span>` : ''}</div></div>`;
  };
  const media = (obj, priority = false) => obj.cover ? cover(obj, {priority}) : view(obj.symbol, obj.palette);
  const notice = text => `<div class="warning" role="note">${icon('info')}<span>${escape(text)}</span></div>`;
  const readerControls = (story, currentChapter) => `<div class="readerbar"><div class="control-group" role="group" aria-label="閱讀主題"><button type="button" data-theme="paper" aria-pressed="true">${icon('sun')}紙張</button><button type="button" data-theme="night" aria-pressed="false">${icon('moon')}夜間</button></div><div class="control-group reader-buttons" role="group" aria-label="文字大小"><button type="button" data-font="-1" aria-label="縮小字體">A−</button><span data-size aria-live="polite">18px</span><button type="button" data-font="1" aria-label="放大字體">A＋</button></div><label class="chapter-select">章節<select data-chapter-select aria-label="跳至章節">${story.chapters.map(c => `<option value="${url('stories/' + story.slug + '/chapters/' + c.id + '/')}"${c.id === currentChapter.id ? ' selected' : ''}>${escape(c.title)}</option>`).join('')}</select></label></div><div class="reading-progress"><span>本章進度</span><progress data-reading-progress max="100" value="0" aria-label="本章閱讀進度"></progress><span data-reading-percent>0%</span></div>`;
  return {icon, badge, button, view, cover, media, notice, readerControls};
}
module.exports = {escape, icon, createComponents};
