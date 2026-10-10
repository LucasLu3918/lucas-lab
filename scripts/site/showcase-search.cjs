'use strict';
// Component showcase (noindex) and the global search page. Chapter search reads search-index.json only after the reader starts typing.
module.exports=function renderShowcaseAndSearch(ctx){
 const {fs,path,root,out,catalog,url,ext,e,icon,button,badge,view,cover,media,notice,readerControls,navItems,stateLabel,tag,card,toolCard,header,footer,page,write,intro,section,library,groupedLibrary}=ctx;
 const showcase=intro('DESIGN SYSTEM','元件與封面樣式','共用元件的尺寸、狀態與材質範例。此頁提供設計與維護時檢視。')+`<section class="wrap section"><div class="component-grid"><div class="component-panel"><h2>按鈕與圖示</h2><div class="btnrow">${button('開始探索',url('stories/'),true)}${button('查看作品',url('projects/'))}<button type="button" class="btn" disabled>暫未開放</button></div></div><div class="component-panel"><h2>內容狀態</h2><div class="btnrow">${badge('完整作品','complete')}${badge('原創示範','demo')}${badge('概念規劃','concept')}${badge('已公開','live')}</div>${notice('此為內容提示元件，依各作品題材提供閱讀前資訊。')}</div><div class="component-panel"><h2>搜尋與篩選</h2><div data-region><input class="search" data-search type="search" aria-label="元件示範搜尋" placeholder="搜尋作品"><div class="filters"><button class="filter" type="button" data-filter="all" aria-pressed="true">全部</button><button class="filter" type="button" data-filter="黑暗童話" aria-pressed="false">黑暗童話</button></div><p data-count class="count" aria-live="polite"></p></div></div><div class="component-panel"><h2>色彩與表面</h2><div class="swatches">${[['swatch-night','夜幕'],['swatch-panel','面板'],['swatch-gold','古金'],['swatch-wine','酒紅']].map(([tone,title])=>`<div class="swatch"><i class="${tone}"></i>${title}</div>`).join('')}</div></div></div><div class="sectionhead"><h2>書籍卡片</h2></div><div class="cards bookgrid">${catalog.stories.map(story=>card(story,'story')).join('')}</div></section>`;
 write('style-guide',page('元件樣式','共用元件與故事封面設計系統。','',showcase,'style-guide',{noindex:true}));
 const searchable=[...catalog.stories.map(x=>({...x,kind:'story'})),...catalog.games.map(x=>({...x,kind:'game'})),...catalog.projects.map(x=>({...x,kind:'project'})),...catalog.tools.map(x=>({...x,kind:'tool'}))];
 const chapterSearch=`<section class="wrap section chapter-search" data-chapter-search data-index-src="${url('search-index.json')}" hidden aria-labelledby="chapter-search-title"><div class="sectionhead"><div><div class="eyebrow">CHAPTERS</div><h2 id="chapter-search-title">章節搜尋</h2><p data-chapter-status aria-live="polite">依章節標題、所屬作品與開頭摘要搜尋。</p></div></div><ol class="chapter-results" data-chapter-results></ol></section>`;
 const searchHtml=intro('ALL CREATIONS','全站作品搜尋','搜尋故事、遊戲、專案與工具；公開工具會直接連結至 Lucas Tools 原站，搜尋內容只在瀏覽器處理。')+groupedLibrary(searchable,[
  {label:'故事',items:searchable.filter(x=>x.kind==='story'),render:x=>card(x,'story'),gridClass:'cards bookgrid'},
  {label:'互動遊戲',items:searchable.filter(x=>x.kind==='game'),render:x=>card(x,'game'),gridClass:'cards'},
  {label:'軟體作品',items:searchable.filter(x=>x.kind==='project'),render:x=>card(x,'project'),gridClass:'cards'},
  {label:'工具',items:searchable.filter(x=>x.kind==='tool'),render:toolCard,gridClass:'cards'}
])+chapterSearch;
 write('search',page('搜尋作品','搜尋故事、遊戲、工程作品與工具。','search',searchHtml,'search',{noindex:true}));
};
