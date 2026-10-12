// Opt-in solo playtest log. Off by default, stays in this browser, never sent
// anywhere; separate from the story save so it survives a new journey.
const KEY='blood-mirror-playlog-v1',LIMIT=2000;
export const playlogKinds=['journey','room','spot','collect','restore-start','restore-done','stage-start','stage-done','whisper','seal-fail','seal-ok','hint','ending'];
// A stage that kept a player longer than this is reported as a stall (plan r5: find the real difficulty cliffs).
export const STALL_MINUTES=5;

export function summarizePlaylog(events,roomTitles=[]){
 const rooms=roomTitles.map((title,index)=>({index,title,start:null,end:null,spots:0,restoreStart:null,restoreMs:null,fails:0,hint:0,stageOpen:{},stageMs:{}}));
 for(const e of Array.isArray(events)?events:[]){
  const r=rooms[e?.room];if(!r||!Number.isFinite(e.t))continue;
  if(r.start===null)r.start=e.t;
  if(e.kind==='spot')r.spots++;
  if(e.kind==='restore-start'&&r.restoreStart===null)r.restoreStart=e.t;
  if(e.kind==='restore-done'&&r.restoreStart!==null&&r.restoreMs===null)r.restoreMs=e.t-r.restoreStart;
  // Time on a stage runs from its first mount to its completion, across closing and reopening the modal.
  if(e.kind==='stage-start'&&e.step&&!(e.step in r.stageOpen))r.stageOpen[e.step]=e.t;
  if(e.kind==='stage-done'&&e.step in r.stageOpen&&!(e.step in r.stageMs))r.stageMs[e.step]=e.t-r.stageOpen[e.step];
  if(e.kind==='seal-fail')r.fails++;
  if(e.kind==='hint')r.hint=Math.max(r.hint,Number(e.level)||0);
  if(e.kind==='seal-ok'&&r.end===null)r.end=e.t;
 }
 const minutes=ms=>Math.round(ms/6000)/10;
 return rooms.filter(r=>r.start!==null).map(({index,title,start,end,spots,restoreMs,fails,hint,stageMs})=>{
  const stages=Object.entries(stageMs).map(([step,ms])=>({step,minutes:minutes(ms)})).sort((a,b)=>b.minutes-a.minutes);
  return {index,title,minutes:end===null?null:minutes(end-start),spots,restoreMinutes:restoreMs===null?null:minutes(restoreMs),fails,hint,solved:end!==null,stages,longest:stages[0]||null,stalled:stages.filter(s=>s.minutes>STALL_MINUTES).map(s=>s.step)};
 });
}

export function createPlaylog(storage=globalThis.localStorage){
 let enabled=false,events=[];
 try{const saved=JSON.parse(storage?.getItem(KEY)||'null');if(saved?.enabled===true){enabled=true;events=Array.isArray(saved.events)?saved.events.filter(e=>playlogKinds.includes(e?.kind)).slice(-LIMIT):[];}}catch{}
 const persist=()=>{try{enabled?storage?.setItem(KEY,JSON.stringify({enabled,events})):storage?.removeItem(KEY);}catch{}};
 return {
  get enabled(){return enabled;},
  get events(){return [...events];},
  setEnabled(value){enabled=value===true;events=[];persist();},
  record(kind,data={}){if(!enabled||!playlogKinds.includes(kind))return;events.push({t:Date.now(),kind,...data});if(events.length>LIMIT)events.shift();persist();},
  clear(){events=[];persist();},
  export(){return JSON.stringify({format:KEY,exported:new Date().toISOString(),events},null,1);}
 };
}
