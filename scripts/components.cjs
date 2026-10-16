'use strict';

const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
// One icon family for the site (the same library as the Blood Mirror game): 24px grid, 1.5px outline, round caps.
// Icons come from Lucide 1.57.0 (ISC; some are derived from Feather, MIT). Notice: LUCIDE_LICENSE.txt at the repository root.
// Each entry holds the icon geometry only; icon() supplies the 24px grid, stroke and caps.
const paths = {
  search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
  menu: '<path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>',
  sparkle: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',
  book: '<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>',
  game: '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
  code: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  gallery: '<path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/><path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/><circle cx="13" cy="7" r="1" fill="currentColor"/><rect x="8" y="2" width="14" height="14" rx="2"/>',
  pen: '<path d="M13 21h8"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  toolbox: '<path d="M16 12v4"/><path d="M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><path d="M17 6a2 2 0 011.414.586l3 3A2 2 0 0122 11v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8a2 2 0 01.586-1.414l3-3A2 2 0 017 6z"/><path d="M2 14h20"/><path d="M8 12v4"/>',
  aips: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  storefront: '<path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  imageSwap: '<path d="M14 4a1 1 0 0 1 1-1"/><path d="M15 10a1 1 0 0 1-1-1"/><path d="M21 4a1 1 0 0 0-1-1"/><path d="M21 9a1 1 0 0 1-1 1"/><path d="m3 7 3 3 3-3"/><path d="M6 10V5a2 2 0 0 1 2-2h2"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  braces: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  file: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  palette: '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
  bolt: '<path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/>',
  qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  mirror: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  lantern: '<path d="M12 12v6"/><path d="M4.077 10.615A1 1 0 0 0 5 12h14a1 1 0 0 0 .923-1.385l-3.077-7.384A2 2 0 0 0 15 2H9a2 2 0 0 0-1.846 1.23Z"/><path d="M8 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z"/>',
  rune: '<path d="M20.341 6.484A10 10 0 0 1 10.266 21.85"/><path d="M3.659 17.516A10 10 0 0 1 13.74 2.152"/><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/>',
  tree: '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
  hood: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  wave: '<path d="M2 12q2.5 2 5 0t5 0 5 0 5 0"/><path d="M2 19q2.5 2 5 0t5 0 5 0 5 0"/><path d="M2 5q2.5 2 5 0t5 0 5 0 5 0"/>',
  stars: '<path d="M18 5h4"/><path d="M20 3v4"/><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>',
  letter: '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
  crown: '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>',
  sword: '<path d="m13 19 6-6"/><path d="M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5"/><path d="m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/><path d="m5 14 4 4"/><path d="m5 21-2-2"/><path d="M7.5 16.5 4 20"/>',
  quill: '<path d="M14.086 18.412A2 2 0 0112.67 19H5v-7.672a2 2 0 01.586-1.414L11.75 3.75a6 6 0 118.49 8.49z"/><path d="M16 8 2 22"/><path d="M17.488 15H9"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
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
  const readerControls = (story, currentChapter) => `<div class="readerbar"><div class="reader-preferences" data-vue-reader-preferences><div class="control-group" role="group" aria-label="閱讀主題"><button type="button" data-theme="paper" aria-pressed="true">${icon('sun')}紙張</button><button type="button" data-theme="night" aria-pressed="false">${icon('moon')}夜間</button></div><div class="control-group reader-buttons" role="group" aria-label="文字大小"><button type="button" data-font="-1" aria-label="縮小字體">A−</button><span data-size aria-live="polite">18px</span><button type="button" data-font="1" aria-label="放大字體">A＋</button></div></div><label class="chapter-select">章節<select data-chapter-select aria-label="跳至章節">${story.chapters.map(c => `<option value="${url('stories/' + story.slug + '/chapters/' + c.id + '/')}"${c.id === currentChapter.id ? ' selected' : ''}>${escape(c.title)}</option>`).join('')}</select></label></div><div class="reading-progress"><span>本章進度</span><progress data-reading-progress max="100" value="0" aria-label="本章閱讀進度"></progress><span data-reading-percent>0%</span></div>`;
  return {icon, badge, button, view, cover, shot, media, notice, readerControls};
}
const hasIcon = name => Boolean(paths[name] || paths[symbolIcons[name]]);
module.exports = {escape, icon, hasIcon, createComponents};
