'use strict';
// Shared setup for the browser suites: one Chromium launcher and one preview server on port 4173.
// Launch order: BROWSER_EXECUTABLE, then Playwright's bundled Chromium, then the newest Chromium already in
// Playwright's local cache (after a Playwright upgrade the bundled build can be missing until `npx playwright install`).
const {spawn,spawnSync}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {chromium}=require('playwright');

const PORT=4173;
const CACHE_ROOTS=[path.join(os.homedir(),'Library','Caches','ms-playwright'),path.join(os.homedir(),'.cache','ms-playwright')];
// Where Playwright's Chromium builds keep the executable on macOS and Linux.
const EXECUTABLES=[
 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
 'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
 'chrome-linux64/chrome',
 'chrome-linux/chrome'
];

function cachedChromium(){
 for(const root of CACHE_ROOTS){
  if(!fs.existsSync(root))continue;
  const builds=fs.readdirSync(root).filter(name=>/^chromium-\d+$/.test(name)).sort((a,b)=>Number(b.slice('chromium-'.length))-Number(a.slice('chromium-'.length)));
  for(const build of builds)for(const executable of EXECUTABLES){
   const file=path.join(root,build,executable);
   if(fs.existsSync(file))return file;
  }
 }
 return null;
}

async function launchChromium(){
 if(process.env.BROWSER_EXECUTABLE)return chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 try{
  return await chromium.launch({headless:true});
 }catch(error){
  const fallback=cachedChromium();
  if(!fallback)throw error;
  console.warn('Playwright bundled Chromium is not installed; using '+fallback);
  return chromium.launch({headless:true,executablePath:fallback});
 }
}

// True when something already answers on the port. A suite must not test another server by accident.
function portInUse(port=PORT){
 const probe=`require('net').connect(${port},'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))`;
 return spawnSync(process.execPath,['-e',probe],{timeout:5000}).status===0;
}

function startPreviewServer(root){
 if(portInUse())throw new Error(`Port ${PORT} is already served by another process. Stop the preview or dev server and rerun; the suite starts its own server on that port.`);
 return spawn(process.execPath,[path.join(root,'scripts','serve.cjs')],{cwd:root,stdio:'ignore'});
}

module.exports={PORT,launchChromium,portInUse,startPreviewServer};
