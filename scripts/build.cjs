'use strict';
// Static site generator: orchestrates the modules in scripts/site/ in a fixed order.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {loadCatalog}=require('./site/catalog.cjs');
const root=path.resolve(__dirname,'..');
const catalog=loadCatalog(root);
const out=path.join(root,'dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'assets'),{recursive:true});
let commit=process.env.SOURCE_COMMIT||process.env.GITHUB_SHA||process.env.CF_PAGES_COMMIT_SHA||'unknown';
if(commit==='unknown'){try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()}catch{}}
const ctx={fs,path,root,out,catalog,commit};
// Order matters: fingerprints before layout (pages reference them), layout before every page module.
Object.assign(ctx,require('./site/assets.cjs')(ctx));
Object.assign(ctx,require('./site/layout.cjs')(ctx));
require('./site/pages.cjs')(ctx);
require('./site/stories.cjs')(ctx);
require('./site/games.cjs')(ctx);
require('./site/projects.cjs')(ctx);
require('./site/showcase-search.cjs')(ctx);
require('./site/pwa.cjs')(ctx);
require('./site/finalize.cjs')(ctx);
