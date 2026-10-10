'use strict';
// Software portfolio detail pages.
module.exports=function renderProjects(ctx){
 const {fs,path,root,out,catalog,url,ext,e,icon,button,badge,view,cover,media,notice,readerControls,navItems,stateLabel,tag,card,toolCard,header,footer,page,write,intro,section,library}=ctx;
 for(const p of catalog.projects){
   const links=[p.href?`<a class="btn primary" href="${e(p.href)}" target="_blank" rel="noopener noreferrer">${e(p.hrefLabel||(p.status==='live'?'開啟原網站':'開啟專案'))} ↗</a>`:'',p.repo?`<a class="btn" href="${e(p.repo)}" target="_blank" rel="noopener noreferrer">GitHub 原始碼 ↗</a>`:''].join('');
   const html=`<div class="wrap"><div class="crumb"><a href="${url('projects/')}">軟體作品集</a> / ${e(p.title)}</div><div class="detail"><div class="cover">${view(p.symbol,p.palette)}</div><div><div class="eyebrow">${e(p.category)}</div><h1>${e(p.title)}</h1><p>${e(p.description)}</p><div class="label">狀態：${e(stateLabel(p.status))}</div><h2>作品重點</h2><ul>${p.highlights.map(x=>`<li>${e(x)}</li>`).join('')}</ul>${p.status==='concept'?'<div class="warning">此作品目前只是規劃概念，尚無公開可操作的 Demo。</div>':''}<div class="btnrow">${links||`<a class="btn" href="${url('projects/')}">返回作品清單 →</a>`}</div></div></div></div>`;
   write('projects/'+p.slug,page(p.title,p.description,'projects',html,'projects/'+p.slug,{noindex:p.status==='concept'}));
 }
};
