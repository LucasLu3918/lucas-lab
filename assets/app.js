(() => {
 'use strict';
 const one=(selector,root=document)=>root.querySelector(selector);
 const many=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
 // Search matching ignores full/half-width differences, letter case and spaces, so "白雪 公主" finds "白雪公主".
 const normalize=text=>String(text||'').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'');
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
  const search=one('[data-search]',region),filters=many('[data-filter]',region),items=many('[data-item]',region),groups=many('[data-group]',region),count=one('[data-count]',region),empty=one('[data-empty]',region);
  let active='all';
  const run=()=>{
   const query=normalize(search?.value);let visible=0;
   items.forEach(item=>{const found=(active==='all'||item.dataset.category===active)&&normalize(item.dataset.index||item.textContent).includes(query);item.hidden=!found;if(found)visible++});
   // A group heading only shows when at least one of its items matches.
   groups.forEach(group=>{group.hidden=!many('[data-item]',group).some(item=>!item.hidden)});
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
 // Content warnings the reader has acknowledged, one flag per work.
 const warningKey='lucaslab.warnings.v1';
 const readAcks=()=>{try{const data=JSON.parse(localStorage.getItem(warningKey)||'null');return data&&typeof data==='object'?data:{}}catch{return{}}};
 const writeAcks=data=>{try{localStorage.setItem(warningKey,JSON.stringify(data))}catch{}};
 // Offline books: the pages live in the service worker's books cache; this index only records which works were saved on this device.
 const offlineKey='lucaslab.offline.v1',booksCache='lucas-lab-books';
 const readOffline=()=>{try{const data=JSON.parse(localStorage.getItem(offlineKey)||'null');return data&&typeof data==='object'?data:{}}catch{return{}}};
 const writeOffline=data=>{try{localStorage.setItem(offlineKey,JSON.stringify(data))}catch{}};
 const hasCacheStorage=typeof caches!=='undefined'&&window.isSecureContext;
 // Only same-origin links from our own saved data are rendered.
 const sameOrigin=href=>{try{return typeof href==='string'&&new URL(href,location.origin).origin===location.origin}catch{return false}};
 const readerEl=one('[data-reader]');
 if(readerEl){
  let lastSaved=-1,lastWrite=0;
  // Offer to return to the saved position, but never jump on its own. Read before track() overwrites the saved percentage.
  // While the offer stands, the page-load check does not overwrite the saved position; scrolling still saves.
  const resumeBox=one('[data-resume]');
  let resumeOffered=false;
  if(resumeBox){
   const saved=readProgress().stories[readerEl.dataset.story];
   if(saved&&saved.chapterId===readerEl.dataset.chapterId&&saved.percent>=3&&saved.percent<90){
    resumeOffered=true;
    one('[data-resume-percent]',resumeBox).textContent=Math.round(saved.percent)+'%';
    resumeBox.hidden=false;
    one('[data-resume-action]',resumeBox).addEventListener('click',()=>{
     const rect=readerEl.getBoundingClientRect(),span=Math.max(0,rect.height-window.innerHeight);
     window.scrollTo({top:rect.top+window.scrollY+span*saved.percent/100});
     resumeBox.hidden=true;
    });
   }
  }
  let trailing=0;
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
   // A throttled position is saved once the window closes, so the last scroll position is never lost.
   if(now-lastWrite<800&&!finished){clearTimeout(trailing);trailing=setTimeout(track,820-(now-lastWrite));return}
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
  if(!resumeOffered)track();
  // Arrow keys move between chapters unless the reader is typing in a form control.
  document.addEventListener('keydown',event=>{
   if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
   const target=event.target;
   if(target&&(target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))return;
   const link=event.key==='ArrowLeft'?one('[data-prev]'):event.key==='ArrowRight'?one('[data-next]'):null;
   if(link&&sameOrigin(link.getAttribute('href')))location.assign(link.href);
  });
 }
 // Story page: resume button, reading position summary, read marks, content warning acknowledgement and offline saving.
 const continueNote=one('[data-story-continue]');
 if(continueNote){
  const entry=readProgress().stories[continueNote.dataset.storyContinue];
  const chapters=many('.chapterlist [data-chapter-id]');
  if(entry&&sameOrigin(entry.chapterUrl)&&entry.chapterTitle){
   const link=one('[data-story-continue-link]',continueNote);
   link.href=entry.chapterUrl;link.textContent='繼續閱讀：'+entry.chapterTitle;
   continueNote.hidden=false;
   const summary=one('[data-story-progress]');
   if(summary){
    const read=Array.isArray(entry.read)?entry.read:[];
    summary.textContent='讀到：'+entry.chapterTitle+' · 已讀 '+read.length+' / '+chapters.length+' 章';
    summary.hidden=false;
   }
  }
  const read=Array.isArray(entry?.read)?entry.read:[];
  chapters.forEach(item=>{
   if(!read.includes(item.dataset.chapterId))return;
   const flag=document.createElement('span');flag.className='read-flag';flag.textContent='已讀';(item.querySelector('a')||item).append(flag);
  });
 }
 many('[data-content-warning]').forEach(box=>{
  const slug=box.dataset.contentWarning,text=one('.warning-text',box),acked=one('.warning-acked',box);
  const apply=()=>{const done=Boolean(readAcks()[slug]);text.hidden=done;acked.hidden=!done};
  one('[data-warning-ack]',box)?.addEventListener('click',()=>{const data=readAcks();data[slug]=true;writeAcks(data);apply();});
  apply();
 });
 const offlineBox=one('[data-offline-save]');
 if(offlineBox&&hasCacheStorage){
  offlineBox.hidden=false;
  const slug=offlineBox.dataset.offlineSave,status=one('[data-offline-status]',offlineBox),action=one('[data-offline-action]',offlineBox);
  const mb=bytes=>(bytes/1048576).toFixed(1)+' MB';
  const render=async()=>{
   const saved=readOffline()[slug];
   action.disabled=false;
   if(!saved){status.textContent='把整本書保存在此瀏覽器，之後沒有網路也能閱讀。';action.textContent='離線保存全書';action.dataset.mode='save';return}
   let text='已離線保存 '+saved.count+' 個頁面與圖片，沒有網路時也能閱讀。';
   try{const estimate=await navigator.storage?.estimate?.();if(estimate?.usage)text+=' 瀏覽器目前使用 '+mb(estimate.usage)+'。'}catch{}
   status.textContent=text;action.textContent='移除離線版本';action.dataset.mode='remove';
  };
  action.addEventListener('click',async()=>{
   action.disabled=true;
   try{
    if(action.dataset.mode==='remove'){
     const data=readOffline(),entry=data[slug];
     if(entry){const cache=await caches.open(booksCache);await Promise.all(entry.urls.map(url=>cache.delete(url)))}
     delete data[slug];writeOffline(data);
    }else{
     status.textContent='正在取得全書清單…';
     const manifest=await fetch(offlineBox.dataset.offlineSrc,{cache:'no-cache'}).then(response=>{if(!response.ok)throw new Error('manifest');return response.json()});
     const cache=await caches.open(booksCache);
     for(const [index,target] of manifest.urls.entries()){
      status.textContent='保存中 '+index+' / '+manifest.urls.length+' 個頁面與圖片…';
      const response=await fetch(target,{cache:'no-cache'});
      if(!response.ok)throw new Error(target);
      await cache.put(target,response);
     }
     const data=readOffline();
     data[slug]={title:manifest.title,urls:manifest.urls,count:manifest.urls.length,saved:Date.now()};
     writeOffline(data);
     try{await navigator.storage?.persist?.()}catch{}
    }
   }catch{
    status.textContent='離線保存沒有完成，請確認網路後再試。已取得的部分會保留，重試時會補齊。';
    action.disabled=false;
    return;
   }
   await render();
  });
  render();
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
   const matches=index.filter(item=>normalize(item.t+' '+item.s+' '+item.x).includes(query)).slice(0,30);
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
   const query=normalize(searchInput.value);
   chapterSearch.hidden=query.length<2;
   if(query.length<2){results.replaceChildren();return}
   loadIndex().then(()=>render(query)).catch(()=>{status.textContent='章節索引暫時無法載入，請稍後再試。'});
  };
  searchInput.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(update,200)});
  if(searchInput.value)update();
 }
 // Offline page: lists the works saved on this device.
 const offlineList=one('[data-offline-list]');
 if(offlineList){
  const entries=Object.entries(readOffline()).filter(([,entry])=>entry&&Array.isArray(entry.urls)&&sameOrigin(entry.urls[0]));
  if(entries.length){
   offlineList.hidden=false;one('[data-offline-empty]')?.setAttribute('hidden','');
   for(const [slug,entry] of entries){
    const item=document.createElement('li'),link=document.createElement('a'),title=document.createElement('strong'),meta=document.createElement('span');
    link.href=entry.urls[0];title.textContent=entry.title||slug;meta.textContent='已離線保存 '+entry.count+' 個頁面與圖片';
    link.append(title,meta);item.append(link);offlineList.append(item);
   }
  }
 }
 // Legal page: the reader can clear what this site stores on the device.
 const clearStatus=one('[data-clear-status]');
 const report=text=>{if(clearStatus)clearStatus.textContent=text};
 one('[data-clear-progress]')?.addEventListener('click',()=>{try{localStorage.removeItem(progressKey);localStorage.removeItem(warningKey)}catch{}report('已清除閱讀紀錄與內容提示確認。')});
 one('[data-clear-offline]')?.addEventListener('click',async()=>{
  if(!window.confirm('要移除所有離線保存的作品嗎？'))return;
  try{if(hasCacheStorage)await caches.delete(booksCache);localStorage.removeItem(offlineKey)}catch{}
  report('已移除所有離線版本。');
 });
 // Service worker: updates wait for the reader. A banner offers the new version; the page reloads only after the reader accepts it.
 const swSource=document.documentElement.dataset.sw;
 if(swSource&&'serviceWorker' in navigator&&window.isSecureContext){
  // Add ?nosw to a local address to skip offline support and remove the worker, so development never reads stale pages.
  if(new URLSearchParams(location.search).has('nosw')){
   navigator.serviceWorker.getRegistrations().then(registrations=>registrations.forEach(registration=>registration.unregister())).catch(()=>{});
  }else{
   let accepted=false;
   navigator.serviceWorker.addEventListener('controllerchange',()=>{if(accepted)location.reload()});
   const offer=worker=>{
    if(document.querySelector('[data-update-banner]'))return;
    const banner=document.createElement('div'),message=document.createElement('p'),button=document.createElement('button');
    banner.className='update-banner';banner.dataset.updateBanner='';banner.setAttribute('role','status');
    message.textContent='LUCAS LAB 有新版本。';
    button.type='button';button.className='btn primary';button.textContent='重新整理';
    button.addEventListener('click',()=>{accepted=true;worker.postMessage('SKIP_WAITING')});
    banner.append(message,button);document.body.append(banner);
   };
   window.addEventListener('load',()=>{
    navigator.serviceWorker.register(swSource).then(registration=>{
     if(registration.waiting&&navigator.serviceWorker.controller)offer(registration.waiting);
     registration.addEventListener('updatefound',()=>{
      const worker=registration.installing;
      worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)offer(worker)});
     });
    }).catch(()=>{});
   });
  }
 }
})();
