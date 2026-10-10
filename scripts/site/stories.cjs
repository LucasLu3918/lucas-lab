'use strict';
// Story detail pages and reader chapter pages. Chapter progress is stored in the browser only (see assets/app.js).

// Roughly 500 CJK characters per minute of silent reading; a floor of one minute keeps very short chapters honest.
const readingMinutes=paragraphs=>Math.max(1,Math.round(paragraphs.join('').length/500));
const excerpt=(text,limit=90)=>text.length>limit?text.slice(0,limit).trimEnd()+'…':text;

module.exports=function renderStories(ctx){
 const {fs,path,root,out,catalog,url,ext,e,icon,button,badge,view,cover,media,notice,readerControls,navItems,stateLabel,tag,card,toolCard,header,footer,page,write,intro,section,library,jsonScript}=ctx;
 for(const s of catalog.stories){
   const ready=Array.isArray(s.chapters)&&s.chapters.length>0;
   const storyUrl=ext+url('stories/'+s.slug+'/');
   const items=ready?s.chapters.map((c,i)=>`${c.part&&c.part!==s.chapters[i-1]?.part?'<li class="part-heading">'+e(c.part)+'</li>':''}<li data-chapter-id="${e(c.id)}"><a href="${url('stories/'+s.slug+'/chapters/'+c.id+'/')}">${e(c.title)}<span>開始閱讀 ↗</span></a></li>`).join(''):'<li><span>章節內容待匯入與校稿<span>尚未開放</span></span></li>';
   const relatedGame=catalog.games.find(g=>g.status==='playable'&&g.storySlug===s.slug);
   const gameLink=relatedGame?`<aside class="callout"><div class="eyebrow">PLAY THIS STORY</div><h2>走進故事，解開魔鏡。</h2><p>同名密室逃脫遊戲已可遊玩。探索五幕、蒐集線索，決定白雪的代價。</p><a class="btn" href="${url('games/'+relatedGame.slug+'/')}">探索同名遊戲 ${icon('game')}</a></aside>`:'';
   const warning=s.warnings?.length?`<div class="warning" role="note">內容提示：${e(s.warnings.join('、'))}。${ready?'請評估是否適合閱讀。':'此作品目前尚未開放章節內容。'}</div>`:'';
   const continueNote=ready?`<p class="continue-note" data-story-continue="${e(s.slug)}" hidden><a class="btn primary" href="${url('stories/'+s.slug+'/')}" data-story-continue-link>繼續閱讀</a></p>`:'';
   const html=`<div class="wrap"><div class="crumb"><a href="${url('stories/')}">故事藏書館</a> / ${e(s.title)}</div><div class="detail"><div class="cover">${cover(s,{priority:true,detail:true})}</div><div><div class="eyebrow">${e(s.subtitle)}</div><h1>${e(s.title)}</h1><p>${e(s.description)}</p><p class="label">狀態：${e(stateLabel(s.status))}</p>${warning}${gameLink}${continueNote}<h2>章節目錄</h2><ol class="chapterlist">${items}</ol>${ready?`<a class="btn primary" href="${url('stories/'+s.slug+'/chapters/'+s.chapters[0].id+'/')}">開始閱讀 →</a>`:`<a class="btn" href="${url('stories/')}">返回故事清單 →</a>`}</div></div></div>`;
   const bookSchema={'@context':'https://schema.org','@type':'Book',name:s.title,description:s.description,url:storyUrl,image:ext+url(s.cover),inLanguage:'zh-Hant',genre:s.category,isAccessibleForFree:true};
   const crumbs={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'首頁',item:ext+url('')},{'@type':'ListItem',position:2,name:'故事藏書館',item:ext+url('stories/')},{'@type':'ListItem',position:3,name:s.title,item:storyUrl}]};
   write('stories/'+s.slug,page(s.title,s.description,'stories',html,'stories/'+s.slug,{noindex:!ready,image:s.cover,imageAlt:s.coverAlt,type:'book',jsonld:[bookSchema,crumbs]}));
   if(!ready)continue;
   s.chapters.forEach((c,i)=>{
     const prev=s.chapters[i-1],next=s.chapters[i+1];
     const back=url('stories/'+s.slug+'/');
     const controls=readerControls(s,c);
     const minutes=readingMinutes(c.paragraphs);
     const chapterUrl=ext+url('stories/'+s.slug+'/chapters/'+c.id+'/');
     const attrs=`data-reader data-story="${e(s.slug)}" data-story-title="${e(s.title)}" data-story-url="${e(url('stories/'+s.slug+'/'))}" data-chapter-id="${e(c.id)}" data-chapter-title="${e(c.title)}" data-chapter-url="${e(url('stories/'+s.slug+'/chapters/'+c.id+'/'))}"`;
     const nextCard=next?`<a class="next-card" href="${url('stories/'+s.slug+'/chapters/'+next.id+'/')}"><span class="label">下一章</span><strong>${e(next.title)}</strong></a>`:'';
     const content=`<div class="readerwrap"><div class="crumb"><a href="${url('stories/')}">故事藏書館</a> / <a href="${back}">${e(s.title)}</a> / ${e(c.title)}</div>${controls}<article class="readerpage${s.manuscript?' manuscript':''}" ${attrs}><div class="chaptermeta">LUCAS LAB · ${s.manuscript?'FULL STORY':'ORIGINAL DEMO'}${c.part?' · '+e(c.part):''} · 約 ${minutes} 分鐘</div><h1>${e(c.title)}</h1>${c.paragraphs.map(p=>`<p>${e(p)}</p>`).join('')}${s.manuscript?'':'<p style="text-indent:0;text-align:center;font-size:13px;opacity:.6">— 本章完 —</p>'}</article>${nextCard}<nav class="chapternav" aria-label="章節導覽"><a class="btn" href="${prev?url('stories/'+s.slug+'/chapters/'+prev.id+'/'):back}" ${prev?'data-prev':'data-back'}>${prev?'← 上一章':'← 返回目錄'}</a><a class="btn primary" href="${next?url('stories/'+s.slug+'/chapters/'+next.id+'/'):back}" ${next?'data-next':'data-back'}>${next?'下一章 →':'返回目錄 →'}</a></nav><p class="keyhint muted">鍵盤 ← / → 可切換上一章與下一章。</p></div>`;
     const chapterSchema={'@context':'https://schema.org','@type':'Article',headline:c.title,name:c.title,description:excerpt(c.paragraphs[0]),url:chapterUrl,inLanguage:'zh-Hant',wordCount:c.paragraphs.join('').length,position:i+1,isPartOf:{'@type':'Book',name:s.title,url:storyUrl},image:ext+url(s.cover)};
     const chapterCrumbs={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'首頁',item:ext+url('')},{'@type':'ListItem',position:2,name:'故事藏書館',item:ext+url('stories/')},{'@type':'ListItem',position:3,name:s.title,item:storyUrl},{'@type':'ListItem',position:4,name:c.title,item:chapterUrl}]};
     write('stories/'+s.slug+'/chapters/'+c.id,page(c.title+' — '+s.title,excerpt(c.paragraphs[0],120),'stories',content,'stories/'+s.slug+'/chapters/'+c.id,{type:'article',image:s.cover,imageAlt:s.coverAlt,jsonld:[chapterSchema,chapterCrumbs]}));
   });
 }
};
