'use strict';
// Playable game entries (copied as a static bundle) and concept-only game pages.
const GAME_FILE_EXTENSIONS=['.js','.css','.svg'];

// Original PNG sources live in games/<slug>/source-art/ (see games/blood-mirror/MEDIA_ASSETS.md), outside the copied assets/ tree.

module.exports=function renderGames(ctx){
 const {fs,path,root,out,catalog,url,ext,e,icon,button,badge,view,cover,media,notice,readerControls,navItems,stateLabel,tag,card,toolCard,header,footer,page,write,intro,section,library}=ctx;
 for(const g of catalog.games){
   if(g.status==='playable'){
     const story=catalog.stories.find(s=>s.slug===g.storySlug);
     if(!story)throw new Error('Playable game requires an existing story: '+g.slug);
     const playRoute='games/'+g.slug+'/play';
     const gameUrl=ext+url('games/'+g.slug+'/');
     const html=`<div class="wrap"><div class="crumb"><a href="${url('games/')}">互動遊戲館</a> / ${e(g.title)}</div><div class="detail"><div class="cover">${cover(g,{priority:true,detail:true})}</div><div><div class="eyebrow">ESCAPE ROOM · ${e(g.category)}</div><h1>${e(g.title)}</h1>${tag('可遊玩','playable')}<p>${e(g.description)}</p><p class="label">${e(g.duration)} · 五幕探索 · 三種結局 · 16+</p>${notice('內容提示：'+g.warnings.join('、')+'。無閃光驚嚇；音效預設關閉。')}<div class="btnrow">${button('開始遊戲',url(playRoute+'/'),true)}${button('閱讀原著',url('stories/'+story.slug+'/'))}</div><h2>妳的旅程</h2><ul>${g.highlights.map(h=>'<li>'+e(h)+'</li>').join('')}</ul><h2>關於這次改編</h2><p>依同名原作重新編排為五幕密室探索。部分謎題與分支結局為遊戲原創；「無名的黎明」承接原作尾聲。完整小說保留原文，仍可獨立閱讀。</p><h2>存檔與操作</h2><p>點擊場景光點、收取道具並解開封印。沒有倒數失敗；提示不會扣分。進度自動儲存在此瀏覽器，換裝置或清除網站資料後無法同步。鍵盤可用 Tab 選取控制項、Enter 操作、Esc 關閉視窗。</p>${button('返回遊戲館',url('games/'))}</div></div></div>`;
     const gameSchema={'@context':'https://schema.org','@type':'VideoGame',name:g.title,description:g.description,url:gameUrl,image:ext+url(g.cover),genre:g.category,gamePlatform:'Web Browser',inLanguage:'zh-Hant',isAccessibleForFree:true,contentRating:'16+'};
     const crumbs={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'首頁',item:ext+url('')},{'@type':'ListItem',position:2,name:'互動遊戲館',item:ext+url('games/')},{'@type':'ListItem',position:3,name:g.title,item:gameUrl}]};
     write('games/'+g.slug,page(g.title,g.description,'games',html,'games/'+g.slug,{image:g.cover,imageAlt:g.coverAlt,jsonld:[gameSchema,crumbs]}));
     const source=path.join(root,'games',g.slug),destination=path.join(out,playRoute);
     fs.mkdirSync(destination,{recursive:true});
     // Every top-level script and stylesheet ships, so a new module can no longer be left out by accident.
     for(const file of fs.readdirSync(source))if(GAME_FILE_EXTENSIONS.includes(path.extname(file)))fs.copyFileSync(path.join(source,file),path.join(destination,file));
     fs.cpSync(path.join(source,'assets'),path.join(destination,'assets'),{recursive:true});
     // The same optional analytics beacon as every other page; the game shell is hand-written HTML, so it is added here.
     const gameHtml=fs.readFileSync(path.join(source,'index.html'),'utf8').replaceAll('__LAB_GAMES_URL__',url('games/')).replaceAll('__LAB_STORY_URL__',url('stories/'+story.slug+'/')).replace('</head>',()=>ctx.analyticsTag+'</head>');
     fs.writeFileSync(path.join(destination,'index.html'),gameHtml);
     continue;
   }
   const html=`<div class="wrap"><div class="crumb"><a href="${url('games/')}">互動遊戲館</a> / ${e(g.title)}</div><div class="detail"><div class="cover">${view(g.symbol,g.palette)}</div><div><div class="eyebrow">${e(g.category)}</div><h1>${e(g.title)}</h1><p>${e(g.description)}</p><div class="warning">目前只有玩法規劃，尚無可遊玩版本，也未啟用存檔或成就。</div><h2>預計玩法</h2><p>以瀏覽器作為遊玩環境；正式完成後將提供觸控操作、鍵盤操作及進度保存。</p><a class="btn" href="${url('games/')}">返回遊戲清單 →</a></div></div></div>`;
   write('games/'+g.slug,page(g.title,g.description,'games',html,'games/'+g.slug,{noindex:true}));
 }
};
