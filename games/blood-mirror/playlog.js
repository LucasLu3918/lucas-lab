// Opt-in solo playtest log. Off by default, stays in this browser, never sent
// anywhere; separate from the story save so it survives a new journey.
const KEY='blood-mirror-playlog-v1',LIMIT=2000;
export const playlogKinds=['journey','room','spot','collect','restore-start','restore-done','seal-fail','seal-ok','hint','ending'];

export function summarizePlaylog(events,roomTitles=[]){
 const rooms=roomTitles.map((title,index)=>({index,title,start:null,end:null,spots:0,restoreStart:null,restoreMs:null,fails:0,hint:0}));
 for(const e of Array.isArray(events)?events:[]){
  const r=rooms[e?.room];if(!r||!Number.isFinite(e.t))continue;
  if(r.start===null)r.start=e.t;
  if(e.kind==='spot')r.spots++;
  if(e.kind==='restore-start'&&r.restoreStart===null)r.restoreStart=e.t;
  if(e.kind==='restore-done'&&r.restoreStart!==null&&r.restoreMs===null)r.restoreMs=e.t-r.restoreStart;
  if(e.kind==='seal-fail')r.fails++;
  if(e.kind==='hint')r.hint=Math.max(r.hint,Number(e.level)||0);
  if(e.kind==='seal-ok'&&r.end===null)r.end=e.t;
 }
 return rooms.filter(r=>r.start!==null).map(({index,title,start,end,spots,restoreMs,fails,hint})=>({index,title,minutes:end===null?null:Math.round((end-start)/6000)/10,spots,restoreMinutes:restoreMs===null?null:Math.round(restoreMs/6000)/10,fails,hint,solved:end!==null}));
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
