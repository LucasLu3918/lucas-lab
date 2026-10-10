'use strict';
// Shared URL helpers, design-system components, page shell (metadata, structured data, asset fingerprints) and card/library templates.
const DEFAULT_OG_IMAGE='assets/images/og-default.jpg';
module.exports=function createLayout(ctx){
 const {fs,path,out}=ctx;
 const base=('/'+(process.env.BASE_PATH||'/').replace(/^\/+|\/+$/g,'')+'/').replace('//','/');
 const home=process.env.SITE_URL||'https://lucas-lab.owl3918.workers.dev';
 const url=r=>base+r.replace(/^\/+/,'');const ext=String(home).replace(/\/+$/,'');
 const {escape:e,createComponents}=require('../components.cjs');
 const {icon,button,badge,view,cover,media,notice,readerControls}=createComponents(url);
 // Fingerprinted copies (e.g. style.<hash>.css) are set by assets.cjs; unhashed paths are the fallback.
 const asset=p=>url((ctx.fingerprint&&ctx.fingerprint[p])||p);
 const jsonScript=obj=>JSON.stringify(obj).replace(/</g,'\\u003c');
 // Cloudflare Web Analytics: cookie-free beacon, enabled only when the build receives a token (never committed to the repository).
 // The beacon file is unversioned and changes upstream, so it carries no integrity hash; the CSP host allow-list is the control instead (see docs/plan).
 const analyticsToken=(process.env.CF_ANALYTICS_TOKEN||'').trim();
 if(analyticsToken&&!/^[A-Za-z0-9]{8,64}$/.test(analyticsToken))throw new Error('CF_ANALYTICS_TOKEN must be 8-64 letters or digits');
 const analyticsTag=analyticsToken?`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${JSON.stringify({token:analyticsToken})}'></script>`:'';
 const navItems=[['tools/','工具'],['stories/','故事'],['games/','遊戲'],['projects/','作品'],['gallery/','藝廊'],['journal/','日誌']];
 const stateLabel=s=>({demo:'原創示範',pending:'劇本待匯入',concept:'概念規劃',complete:'完整作品',live:'已公開',repo:'公開專案',playable:'可遊玩'})[s]||s;
 const tag=(text,tone)=>badge(text,tone);
 const card=(obj,kind)=>{
   const section={story:'stories',game:'games',project:'projects'}[kind]||kind;
   const href=url(section+'/'+obj.slug+'/');
   return `<article class="card${obj.cover?' book-card':''}" data-item data-category="${e(obj.category)}" data-index="${e([obj.title,obj.description,obj.category].join(' '))}">${media(obj)}<div class="body"><span class="label">${e(obj.category)}</span><h3><a href="${href}">${e(obj.title)}</a></h3><p>${e(obj.description)}</p><div class="bottom">${tag(stateLabel(obj.status),obj.status)}<a class="action" href="${href}">${kind==='game'&&obj.status==='playable'?'探索遊戲 ↗':'查看詳情 ↗'}</a></div></div></article>`;
 };
 const toolCard=t=>`<article class="tool" data-item data-category="${e(t.category)}" data-index="${e([t.title,t.description,t.category,t.trait].join(' '))}"><div class="symbol" aria-hidden="true">${icon(t.symbol)}</div><h3>${e(t.title)}</h3><p>${e(t.description)}</p><div class="bottom">${tag(t.trait)}<a class="action" href="${e(t.href)}" target="_blank" rel="noopener noreferrer" aria-label="${e('開啟 '+t.title+'（新分頁）')}">開啟原工具 ↗</a></div></article>`;
 const header=current=>`<a class="skip" href="#main">跳到主要內容</a><header class="header"><div class="wrap headerin"><a class="brand" href="${url('')}" aria-label="LUCAS LAB 首頁"><svg class="brand-mark" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="22"/><circle cx="26" cy="26" r="17"/><path d="M26 4 30 22 48 26 30 30 26 48 22 30 4 26 22 22Z"/><circle cx="26" cy="26" r="3"/></svg><span class="brand-copy"><span class="brand-name">LUCAS LAB</span><span class="brand-tagline">暗黑科技 × 奇幻宇宙</span></span></a><button class="menu" type="button" data-menu aria-controls="site-nav" aria-expanded="false" aria-label="開啟導覽選單">${icon('menu')}</button><nav id="site-nav" class="nav" aria-label="主要導覽"><a href="${url('')}" ${current==='home'?'aria-current="page"':''}>首頁</a>${navItems.map(([r,n])=>`<a href="${url(r)}" ${current===r.split('/')[0]?'aria-current="page"':''}>${n}</a>`).join('')}<a href="${url('about/')}" ${current==='about'?'aria-current="page"':''}>關於</a></nav><a class="github" href="${url('search/')}" aria-label="搜尋本站作品">${icon('search')}<span>搜尋</span></a></div></header>`;
 const footer=()=>`<footer class="footer"><div class="wrap footerin"><div><strong>LUCAS✳LAB</strong><br>Code · Create · Imagine<br><small>部分作品為規劃或閱讀展示，狀態均已明確標示。</small></div><div class="footlinks"><a href="${url('about/')}">關於我</a><a href="${url('search/')}">全站搜尋</a><a href="https://github.com/LucasLu3918" target="_blank" rel="noopener noreferrer">GitHub</a><a href="${url('legal/')}">內容與授權</a></div></div></footer>`;
 // opts.head: extra <head> markup for a page (for example its feed link); opts.noindex keeps reader and utility pages out of search.
 const page=(title,desc,current,html,route='',opts={})=>{
   const clean=route.replace(/^\/|\/$/g,'');const canonical=ext+'/'+(clean?clean+'/':'');
   const noindex=opts.noindex?'<meta name="robots" content="noindex,follow">':'<meta name="robots" content="index,follow">';
   const pageTitle=title+'｜LUCAS LAB';
   const image=ext+url(opts.image||DEFAULT_OG_IMAGE);
   const imageAlt=opts.image?(opts.imageAlt||title):'月夜城堡的原創奇幻插畫';
   const structured=(opts.jsonld||[]).map(obj=>`<script type="application/ld+json">${jsonScript(obj)}</script>`).join('');
   return `<!doctype html><html lang="zh-Hant" data-sw="${e(url('sw.js'))}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#080e16"><meta name="description" content="${e(desc)}">${noindex}<title>${e(pageTitle)}</title><link rel="icon" href="${url('assets/favicon.svg')}" type="image/svg+xml"><link rel="apple-touch-icon" href="${url('assets/icons/apple-touch-icon.png')}"><link rel="manifest" href="${url('manifest.webmanifest')}"><link rel="canonical" href="${e(canonical)}"><meta property="og:type" content="${e(opts.type||'website')}"><meta property="og:site_name" content="LUCAS LAB"><meta property="og:locale" content="zh_TW"><meta property="og:title" content="${e(pageTitle)}"><meta property="og:description" content="${e(desc)}"><meta property="og:url" content="${e(canonical)}"><meta property="og:image" content="${e(image)}"><meta property="og:image:alt" content="${e(imageAlt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(pageTitle)}"><meta name="twitter:description" content="${e(desc)}"><meta name="twitter:image" content="${e(image)}"><link rel="stylesheet" href="${asset('assets/style.css')}"><script src="${asset('assets/app.js')}" defer></script>${analyticsTag}${opts.head||''}${structured}</head><body>${header(current)}<main id="main">${html}</main>${footer()}</body></html>`;
 };
 const write=(route,html)=>{const dir=path.join(out,route);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html,'utf8')};
 const intro=(eyebrow,title,desc)=>`<div class="wrap pageintro"><div class="eyebrow">${e(eyebrow)}</div><h1>${e(title)}</h1><p>${e(desc)}</p></div>`;
 const section=(eyebrow,title,desc,link,body)=>`<section class="section"><div class="wrap"><div class="sectionhead"><div><div class="eyebrow">${e(eyebrow)}</div><h2>${e(title)}</h2><p>${e(desc)}</p></div>${link?`<a class="more" href="${url(link)}">探索全部 ↗</a>`:''}</div>${body}</div></section>`;
 const library=(items,renderer,gridClass,options=true)=>`<div class="wrap" data-region>${options?`<div class="toolbar"><input class="search" type="search" data-search placeholder="搜尋名稱、分類或關鍵字" aria-label="搜尋作品"><div class="filters" aria-label="分類篩選"><button class="filter" type="button" data-filter="all" aria-pressed="true">全部</button>${[...new Set(items.map(x=>x.category))].map(cat=>`<button class="filter" type="button" data-filter="${e(cat)}" aria-pressed="false">${e(cat)}</button>`).join('')}</div></div>`:''}<p class="count" data-count aria-live="polite"></p><div class="${gridClass}">${items.map(renderer).join('')}</div><div class="empty" data-empty hidden>找不到符合條件的作品，請更換搜尋詞。</div></div>`;
 // Search results in labelled groups; app.js hides a group heading when none of its items match.
 const groupedLibrary=(items,groups)=>`<div class="wrap" data-region><div class="toolbar"><input class="search" type="search" data-search placeholder="搜尋名稱、分類或關鍵字" aria-label="搜尋作品"><div class="filters" aria-label="分類篩選"><button class="filter" type="button" data-filter="all" aria-pressed="true">全部</button>${[...new Set(items.map(x=>x.category))].map(cat=>`<button class="filter" type="button" data-filter="${e(cat)}" aria-pressed="false">${e(cat)}</button>`).join('')}</div></div><p class="count" data-count aria-live="polite"></p>${groups.map(group=>`<section class="search-group" data-group><h2 class="group-title">${e(group.label)}</h2><div class="${group.gridClass}">${group.items.map(group.render).join('')}</div></section>`).join('')}<div class="empty" data-empty hidden>找不到符合條件的作品，請更換搜尋詞。</div></div>`;
 return {base,home,url,ext,e,asset,jsonScript,icon,button,badge,view,cover,media,notice,readerControls,navItems,stateLabel,tag,card,toolCard,header,footer,page,write,intro,section,library,groupedLibrary,analyticsEnabled:Boolean(analyticsToken),analyticsTag};
};
