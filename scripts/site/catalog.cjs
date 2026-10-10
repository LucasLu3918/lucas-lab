'use strict';
// Loads data/catalog.json, parses full manuscripts into chapters, and validates the catalog before any page is rendered.
const fs=require('node:fs'),path=require('node:path');
const {loadMarkdownChapters}=require('../story-source.cjs');

const ENUMS={story:['demo','pending','complete'],game:['playable','concept'],project:['live','repo','concept']};
const REQUIRED={
 stories:['slug','title','description','category','status','palette','symbol','cover','coverSmall','coverAlt'],
 games:['slug','title','description','category','status','palette','symbol'],
 projects:['slug','title','description','category','status','palette','symbol','highlights'],
 tools:['title','description','category','trait','href','symbol'],
 gallery:['title','description','palette','symbol'],
 journal:['slug','date','title','description']
};

function validateCatalog(catalog,root){
 const fail=msg=>{throw new Error('catalog: '+msg)};
 for(const [group,fields] of Object.entries(REQUIRED)){
  if(!Array.isArray(catalog[group]))fail(group+' must be an array');
  const seen=new Set();
  for(const item of catalog[group]){
   for(const field of fields)if(item[field]===undefined||item[field]==='')fail(group+' item '+(item.slug||item.title)+' is missing '+field);
   const key=item.slug||item.title;
   if(seen.has(key))fail('duplicate '+group+' entry '+key);
   seen.add(key);
  }
 }
 for(const s of catalog.stories){
  if(!ENUMS.story.includes(s.status))fail('invalid story status '+s.status+' for '+s.slug);
  for(const asset of [s.cover,s.coverSmall])if(!fs.existsSync(path.join(root,asset)))fail('missing cover file '+asset);
 }
 const storySlugs=new Set(catalog.stories.map(s=>s.slug));
 for(const g of catalog.games){
  if(!ENUMS.game.includes(g.status))fail('invalid game status '+g.status+' for '+g.slug);
  if(g.status==='playable'){
   if(!storySlugs.has(g.storySlug))fail('playable game '+g.slug+' needs an existing storySlug');
   if(!Array.isArray(g.warnings)||!g.warnings.length)fail('playable game '+g.slug+' needs warnings');
   if(!Array.isArray(g.highlights)||!g.highlights.length)fail('playable game '+g.slug+' needs highlights');
   if(!g.cover||!g.coverSmall||!g.coverAlt)fail('playable game '+g.slug+' needs cover metadata');
  }
 }
 for(const p of catalog.projects){
  if(!ENUMS.project.includes(p.status))fail('invalid project status '+p.status+' for '+p.slug);
 }
 for(const t of catalog.tools){
  if(!/^https:\/\//.test(t.href))fail('tool href must be https: '+t.title);
 }
 for(const j of catalog.journal){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(j.date))fail('journal date must be YYYY-MM-DD: '+j.slug);
  if(j.paragraphs!==undefined&&(!Array.isArray(j.paragraphs)||!j.paragraphs.length||j.paragraphs.some(p=>typeof p!=='string'||!p.trim())))fail('journal paragraphs invalid: '+j.slug);
 }
}

function loadCatalog(root){
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
 for(const story of catalog.stories)if(story.manuscript)story.chapters=loadMarkdownChapters(story.manuscript);
 validateCatalog(catalog,root);
 return catalog;
}
module.exports={loadCatalog,validateCatalog};
