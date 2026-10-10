(() => {
 'use strict';
 const one=(selector,root=document)=>root.querySelector(selector);
 const many=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
 const toggle=one('[data-menu]'),nav=one('#site-nav');
 if(toggle&&nav){
  const close=()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','開啟導覽選單')};
  toggle.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'關閉導覽選單':'開啟導覽選單')});
  many('a',nav).forEach(link=>link.addEventListener('click',close));
  document.addEventListener('click',event=>{if(!toggle.contains(event.target)&&!nav.contains(event.target))close()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){close();toggle.focus()}});
  const media=window.matchMedia('(max-width:920px)');
  const onChange=()=>{if(!media.matches)close()};
  if(media.addEventListener)media.addEventListener('change',onChange);else media.addListener(onChange);
 }
 many('[data-region]').forEach(region=>{
  const search=one('[data-search]',region),filters=many('[data-filter]',region),items=many('[data-item]',region),count=one('[data-count]',region),empty=one('[data-empty]',region);
  let active='all';
  const run=()=>{
   const query=(search?.value||'').trim().toLocaleLowerCase();let visible=0;
   items.forEach(item=>{const found=(active==='all'||item.dataset.category===active)&&(item.dataset.index||item.textContent).toLocaleLowerCase().includes(query);item.hidden=!found;if(found)visible++});
   if(count)count.textContent='找到 '+visible+' 個項目';if(empty)empty.hidden=visible!==0;
  };
  filters.forEach(button=>button.addEventListener('click',()=>{active=button.dataset.filter;filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));run()}));
  const params=new URLSearchParams(location.search);
  if(search&&params.has('q'))search.value=(params.get('q')||'').slice(0,80);
  search?.addEventListener('input',run);run();
 });
 const reader=one('[data-reader]');
 if(reader){
  const key='lucaslab.reader.preferences';
  const settings={theme:'paper',font:18};
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved){settings.theme=saved.theme==='night'?'night':'paper';settings.font=Number.isFinite(saved.font)?Math.min(24,Math.max(16,saved.font)):18}}catch{}
  const progress=one('[data-reading-progress]'),percent=one('[data-reading-percent]');
  let scheduled=false;
  const updateProgress=()=>{
   scheduled=false;if(!progress)return;
   const rect=reader.getBoundingClientRect();
   const length=Math.max(1,rect.height-window.innerHeight);
   const value=Math.round(Math.min(100,Math.max(0,-rect.top/length*100)));
   progress.value=value;if(percent)percent.textContent=value+'%';
  };
  const scheduleProgress=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateProgress)}};
  const update=()=>{
   reader.classList.toggle('night',settings.theme==='night');reader.style.setProperty('--reader-size',settings.font+'px');
   many('[data-theme]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.theme===settings.theme)));
   many('[data-font]').forEach(button=>{button.disabled=Number(button.dataset.font)<0?settings.font<=16:settings.font>=24});
   const size=one('[data-size]');if(size)size.textContent=settings.font+'px';
   try{localStorage.setItem(key,JSON.stringify(settings))}catch{}
   scheduleProgress();
  };
  many('[data-theme]').forEach(button=>button.addEventListener('click',()=>{settings.theme=button.dataset.theme;update()}));
  many('[data-font]').forEach(button=>button.addEventListener('click',()=>{settings.font=Math.max(16,Math.min(24,settings.font+Number(button.dataset.font)));update()}));
  one('[data-chapter-select]')?.addEventListener('change',event=>location.assign(event.target.value));
  window.addEventListener('scroll',scheduleProgress,{passive:true});window.addEventListener('resize',scheduleProgress);
  update();
 }
 const dialog=one('#gallery-dialog');
 if(dialog&&typeof dialog.showModal==='function'){
  many('[data-preview]').forEach(button=>button.addEventListener('click',()=>{
   const art=one('[data-dialog-visual]',dialog);
   art.replaceChildren();
   if(button.dataset.coverSrc){
    art.className='visual has-art';
    const image=document.createElement('img');image.src=button.dataset.coverSrc;image.alt=button.dataset.coverAlt||button.dataset.title;image.width=900;image.height=1350;art.append(image);
   }else{
    art.className='visual '+(button.dataset.palette||'blue');
    const graphic=one('.visual>span',button);if(graphic)art.append(graphic.cloneNode(true));
   }
   one('[data-dialog-title]',dialog).textContent=button.dataset.title;
   one('[data-dialog-desc]',dialog).textContent=button.dataset.description||'世界概念示意圖，正式場景插畫尚在構思。';
   dialog.showModal();
  }));
  one('[data-dialog-close]',dialog)?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 }
 // Reading progress: kept only in this browser under one versioned key. Every storage access is guarded so private windows and blocked storage just lose the feature.
 const progressKey='lucaslab.progress.v1';
 const readProgress=()=>{try{const data=JSON.parse(localStorage.getItem(progressKey)||'null');return data&&typeof data.stories==='object'&&data.stories?data:{stories:{}}}catch{return{stories:{}}}};
 const writeProgress=data=>{try{localStorage.setItem(progressKey,JSON.stringify(data))}catch{}};
 // Only same-origin links from our own saved data are rendered.
 const sameOrigin=href=>{try{return typeof href==='string'&&new URL(href,location.origin).origin===location.origin}catch{return false}};
 const readerEl=one('[data-reader]');
 if(readerEl){
  let lastSaved=-1,lastWrite=0;
  const track=()=>{
   const rect=readerEl.getBoundingClientRect();
   const length=Math.max(1,rect.height-window.innerHeight);
   const value=Math.round(Math.min(100,Math.max(0,-rect.top/length*100)));
   // Short chapters that fit on screen count as finished once their end is visible.
   const finished=value>=90||rect.bottom<=window.innerHeight+8;
   const slug=readerEl.dataset.story,id=readerEl.dataset.chapterId;
   if(!slug||!id)return;
   const now=Date.now();
   if(value===lastSaved&&!finished)return;
   if(now-lastWrite<800&&!finished)return;
   lastSaved=value;lastWrite=now;
   const data=readProgress(),entry=data.stories[slug]||{read:[]};
   Object.assign(entry,{title:readerEl.dataset.storyTitle,url:readerEl.dataset.storyUrl,chapterId:id,chapterTitle:readerEl.dataset.chapterTitle,chapterUrl:readerEl.dataset.chapterUrl,percent:value,updated:now});
   if(!Array.isArray(entry.read))entry.read=[];
   if(finished&&!entry.read.includes(id))entry.read.push(id);
   data.stories[slug]=entry;writeProgress(data);
  };
  let trackScheduled=false;
  const scheduleTrack=()=>{if(!trackScheduled){trackScheduled=true;requestAnimationFrame(()=>{trackScheduled=false;track()})}};
  window.addEventListener('scroll',scheduleTrack,{passive:true});window.addEventListener('resize',scheduleTrack);
  track();
  // Arrow keys move between chapters unless the reader is typing in a form control.
  document.addEventListener('keydown',event=>{
   if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
   const target=event.target;
   if(target&&(target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))return;
   const link=event.key==='ArrowLeft'?one('[data-prev]'):event.key==='ArrowRight'?one('[data-next]'):null;
   if(link&&sameOrigin(link.getAttribute('href')))location.assign(link.href);
  });
 }
 // Story page: resume button and per-chapter read marks.
 const continueNote=one('[data-story-continue]');
 if(continueNote){
  const entry=readProgress().stories[continueNote.dataset.storyContinue];
  if(entry&&sameOrigin(entry.chapterUrl)&&entry.chapterTitle){
   const link=one('[data-story-continue-link]',continueNote);
   link.href=entry.chapterUrl;link.textContent='繼續閱讀：'+entry.chapterTitle;
   continueNote.hidden=false;
  }
  const read=Array.isArray(entry?.read)?entry.read:[];
  many('.chapterlist [data-chapter-id]').forEach(item=>{
   if(!read.includes(item.dataset.chapterId))return;
   const flag=document.createElement('span');flag.className='read-flag';flag.textContent='已讀';(item.querySelector('a')||item).append(flag);
  });
 }
 // Home and archive: continue-reading shelf lists the three most recently read stories.
 const shelf=one('[data-continue-shelf]');
 if(shelf){
  const list=one('[data-continue-list]',shelf);
  const entries=Object.entries(readProgress().stories).filter(([,entry])=>entry&&sameOrigin(entry.chapterUrl)&&entry.chapterTitle).sort((a,b)=>(b[1].updated||0)-(a[1].updated||0)).slice(0,3);
  if(entries.length){
   shelf.hidden=false;
   for(const [slug,entry] of entries){
    const item=document.createElement('li'),link=document.createElement('a'),title=document.createElement('strong'),meta=document.createElement('span');
    link.href=entry.chapterUrl;title.textContent=entry.title||slug;meta.textContent=entry.chapterTitle+' · 已讀 '+Math.round(Number(entry.percent)||0)+'%';
    link.append(title,meta);item.append(link);list.append(item);
   }
  }
 }
 // Search page: chapter results load the index on first input, so visitors who never search do not download it.
 const chapterSearch=one('[data-chapter-search]'),searchInput=one('[data-search]');
 if(chapterSearch&&searchInput){
  const status=one('[data-chapter-status]',chapterSearch),results=one('[data-chapter-results]',chapterSearch);
  let index=null,loading=null,timer=0;
  const loadIndex=()=>{
   if(!loading)loading=fetch(chapterSearch.dataset.indexSrc).then(response=>{if(!response.ok)throw new Error('index '+response.status);return response.json()}).then(data=>{index=data;return data});
   return loading;
  };
  const render=query=>{
   const matches=index.filter(item=>(item.t+' '+item.s+' '+item.x).toLocaleLowerCase().includes(query)).slice(0,30);
   results.replaceChildren();
   for(const item of matches){
    if(!sameOrigin(item.u))continue;
    const li=document.createElement('li'),link=document.createElement('a'),title=document.createElement('strong'),work=document.createElement('span'),excerpt=document.createElement('p');
    link.href=item.u;title.textContent=item.t;work.textContent=item.s;excerpt.textContent=item.x;
    link.append(title,work,excerpt);li.append(link);results.append(li);
   }
   status.textContent=matches.length?'找到 '+matches.length+' 個章節'+(matches.length===30?'（僅顯示前 30 筆）':''):'沒有符合的章節，請換個關鍵字。';
  };
  const update=()=>{
   const query=searchInput.value.trim().toLocaleLowerCase();
   chapterSearch.hidden=query.length<2;
   if(query.length<2){results.replaceChildren();return}
   loadIndex().then(()=>render(query)).catch(()=>{status.textContent='章節索引暫時無法載入，請稍後再試。'});
  };
  searchInput.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(update,200)});
  if(searchInput.value)update();
 }
 // Offline reading: the worker is registered only where the page declares one (every page does) and the origin is secure.
 const swSource=document.documentElement.dataset.sw;
 if(swSource&&'serviceWorker' in navigator&&window.isSecureContext){
  window.addEventListener('load',()=>{navigator.serviceWorker.register(swSource).catch(()=>{})});
 }
})();
