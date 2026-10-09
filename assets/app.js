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
})();
