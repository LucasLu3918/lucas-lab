'use strict';
// Component showcase (noindex) and the global search page. Chapter search reads search-index.json only after the reader starts typing.
module.exports=function renderShowcaseAndSearch(ctx){
 const {fs,path,root,out,catalog,url,ext,e,icon,button,badge,view,cover,media,notice,readerControls,navItems,stateLabel,tag,card,toolCard,header,footer,page,write,intro,section,library,groupedLibrary}=ctx;
 const showcase=intro('DESIGN SYSTEM','元件與封面樣式','共用元件的尺寸、狀態與材質範例。此頁提供設計與維護時檢視。')+`<section class="wrap section"><div class="component-grid"><div class="component-panel"><h2>按鈕與圖示</h2><div class="btnrow">${button('開始探索',url('stories/'),true)}${button('查看作品',url('projects/'))}<button type="button" class="btn" disabled>暫未開放</button></div></div><div class="component-panel"><h2>內容狀態</h2><div class="btnrow">${badge('完整作品','complete')}${badge('原創示範','demo')}${badge('概念規劃','concept')}${badge('已公開','live')}</div>${notice('此為內容提示元件，依各作品題材提供閱讀前資訊。')}</div><div class="component-panel"><h2>搜尋與篩選</h2><div data-region><input class="search" data-search type="search" aria-label="元件示範搜尋" placeholder="搜尋作品"><div class="filters"><button class="filter" type="button" data-filter="all" aria-pressed="true">全部</button><button class="filter" type="button" data-filter="黑暗童話" aria-pressed="false">黑暗童話</button></div><p data-count class="count" aria-live="polite"></p></div></div><div class="component-panel"><h2>色彩與表面</h2><div class="swatches">${[['swatch-night','夜幕'],['swatch-panel','面板'],['swatch-gold','古金'],['swatch-wine','酒紅']].map(([tone,title])=>`<div class="swatch"><i class="${tone}"></i>${title}</div>`).join('')}</div></div></div><div class="sectionhead"><h2>書籍卡片</h2></div><div class="cards bookgrid">${catalog.stories.map(story=>card(story,'story')).join('')}</div></section>`;
 write('style-guide',page('元件樣式','共用元件與故事封面設計系統。','',showcase,'style-guide',{noindex:true}));
 const searchable=[...catalog.stories.map(x=>({...x,kind:'story'})),...catalog.games.map(x=>({...x,kind:'game'})),...catalog.projects.map(x=>({...x,kind:'project'})),...catalog.tools.map(x=>({...x,kind:'tool'}))].map(item=>({
  ...item,
  searchCoverSmall:item.coverSmall?.replace(/-small\.webp$/,'-search-180.webp')||null,
  searchCoverMedium:item.coverSmall?.replace(/-small\.webp$/,'-search-360.webp')||null,
  searchShotSmall:item.shotSmall?.replace(/-small\.webp$/,'-search-180.webp')||null,
  searchShotMedium:item.shotSmall?.replace(/-small\.webp$/,'-search-600.webp')||null
 }));
 const searchCard=(item,kind)=>{
  let markup=card(item,kind);
  if(item.searchCoverSmall)markup=markup.replace(`srcset="${url(item.coverSmall)} 360w, ${url(item.cover)} 900w"`,`srcset="${url(item.searchCoverSmall)} 180w, ${url(item.searchCoverMedium)} 360w, ${url(item.cover)} 900w"`);
  if(item.searchShotSmall)markup=markup.replace(`srcset="${url(item.shotSmall)} 600w, ${url(item.shot)} 1200w"`,`srcset="${url(item.searchShotSmall)} 180w, ${url(item.searchShotMedium)} 600w, ${url(item.shot)} 1200w"`);
  return markup;
 };
 const groups=[
  {label:'故事',items:searchable.filter(x=>x.kind==='story'),render:x=>searchCard(x,'story'),gridClass:'cards bookgrid'},
  {label:'互動遊戲',items:searchable.filter(x=>x.kind==='game'),render:x=>searchCard(x,'game'),gridClass:'cards'},
  {label:'軟體作品',items:searchable.filter(x=>x.kind==='project'),render:x=>searchCard(x,'project'),gridClass:'cards'},
  {label:'工具',items:searchable.filter(x=>x.kind==='tool'),render:toolCard,gridClass:'cards'}
 ];
 const searchItems=searchable.map(item=>{
  const kind=item.kind,section={story:'stories',game:'games',project:'projects'}[kind];
  const image=item.cover?{type:'cover',src:url(item.cover),tiny:item.searchCoverSmall?url(item.searchCoverSmall):null,small:item.searchCoverMedium?url(item.searchCoverMedium):item.coverSmall?url(item.coverSmall):null,alt:item.coverAlt||item.title+'原創封面插畫',title:item.coverTitle||item.title,subtitle:item.coverSubtitle||'',series:item.coverSeries||'DARK FANTASY'}:item.shot?{type:'shot',src:url(item.shot),tiny:item.searchShotSmall?url(item.searchShotSmall):null,small:item.searchShotMedium?url(item.searchShotMedium):item.shotSmall?url(item.shotSmall):null,alt:item.shotAlt||item.title+'畫面'}:null;
  return {id:kind+':'+(item.slug||item.title),kind,title:item.title,description:item.description,category:item.category,searchText:[item.title,item.description,item.category,item.trait||''].join(' '),href:kind==='tool'?item.href:url(section+'/'+item.slug+'/'),external:kind==='tool',status:item.status||'',statusLabel:item.status?stateLabel(item.status):'',trait:item.trait||'',symbol:item.symbol||'✦',palette:item.palette||'blue',image};
 });
 const categoryButtons=[...new Set(searchable.map(item=>item.category))].map(category=>`<button class="filter" type="button" data-search-filter="${e(category)}" aria-pressed="false">${e(category)}</button>`).join('');
 const staticSearch=`<div class="toolbar"><label class="vue-search__static-label" for="site-search">搜尋作品</label><input id="site-search" class="search" type="search" placeholder="搜尋名稱、分類或關鍵字" autocomplete="off"><div class="filters" role="group" aria-label="分類篩選"><button class="filter" type="button" data-search-filter="all" aria-pressed="true">全部</button>${categoryButtons}</div></div><p class="count" aria-live="polite">找到 ${searchable.length} 個項目</p>${groups.map(group=>`<section class="search-group"><h2 class="group-title">${e(group.label)}</h2><div class="${group.gridClass}">${group.items.map(group.render).join('')}</div></section>`).join('')}<div class="empty" hidden>找不到符合條件的作品，請更換搜尋詞。</div>`;
 const appHost=`<section class="wrap section vue-search" aria-label="全站作品搜尋" data-vue-site-island="search" data-search-items="${e(JSON.stringify(searchItems))}" data-search-index-src="${e(url('search-index.json'))}">${staticSearch}</section>`;
 const searchHtml=intro('ALL CREATIONS','全站作品搜尋','搜尋故事、遊戲、專案與工具；公開工具會直接連結至 Lucas Tools 原站，搜尋內容只在瀏覽器處理。')+appHost;
 write('search',page('搜尋作品','搜尋故事、遊戲、工程作品與工具。','search',searchHtml,'search',{noindex:true,vueIsland:'site-lazy'}));
};
