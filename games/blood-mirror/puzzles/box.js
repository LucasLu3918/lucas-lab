// E5 七重魔鏡匣 (the master mirror box), six mechanisms - one per face of the box: a 13-notch dial, a prism-lit engraving,
// the apple lock, the red thread, the shard ring and the zhuyin cipher disc. Each face is a stage; the stage list is the
// box (puzzles/index.js shows it as a picker), a face that needs something from E1-E4 stays closed until that level is
// done (`requires` names the level's puzzle), and the cipher waits for the other five (`after`). Rules, hints and the
// cipher are pure functions so scripts/blood-mirror-abyss.test.mjs can check them exhaustively; the mount* functions only
// draw. The rules mirror plan-improve/prototypes/e5-box.html, which e5-box.solve.cjs checks the same way.
import {abyss} from '../data/abyss.js';
import {rooms} from '../engine/rules.js';
import {bindHints,hintMarkup} from './belfry-hints.js';
import {ensureMaterials} from './materials.js';

// ---- The four keys. Each of E1-E4 gives one item and one zhuyin symbol (data/abyss.js, level reward).
export const KEY_LEVELS=['e1','e2','e3','e4'].map(id=>{
 const level=abyss.levels.find(item=>item.id===id);
 return {id,number:level.number,puzzle:level.puzzle,item:level.reward.name,mark:level.reward.mark};
});
export const KEYS=KEY_LEVELS.map(level=>level.mark);

// ---- Cipher: the 37 standard zhuyin symbols, a shift cipher whose key is one symbol per level (Vigenere style).
export const ZHUYIN37=['ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ','ㄍ','ㄎ','ㄏ','ㄐ','ㄑ','ㄒ','ㄓ','ㄔ','ㄕ','ㄖ','ㄗ','ㄘ','ㄙ','ㄚ','ㄛ','ㄜ','ㄝ','ㄞ','ㄟ','ㄠ','ㄡ','ㄢ','ㄣ','ㄤ','ㄥ','ㄦ','ㄧ','ㄨ','ㄩ'];
export const PLAIN='ㄌㄨㄒㄧ'; // 露西 without tones: what the disc must spell
export const idx=symbol=>ZHUYIN37.indexOf(symbol)+1; // 1-based position in the standard order
export const shift=(symbol,key,dir)=>ZHUYIN37[(((idx(symbol)-1+dir*idx(key))%37)+37)%37];
export const encrypt=(plain,keys=KEYS)=>[...plain].map((p,i)=>shift(p,keys[i%keys.length],1)).join('');
export const decrypt=(cipher,keys=KEYS)=>[...cipher].map((c,i)=>shift(c,keys[i%keys.length],-1)).join('');
export const CIPHER=encrypt(PLAIN);
// What the disc reads when letter i has been counted back offsets[i] places.
export const reading=(offsets,cipher=CIPHER)=>[...cipher].map((c,i)=>ZHUYIN37[(((idx(c)-1-offsets[i])%37)+37)%37]).join('');

// ---- Face answers
export const TIME=13,TIME_SLOTS=13;
export const COLORS={
 R:{name:'紅',shape:'▲'},G:{name:'綠',shape:'●'},B:{name:'藍',shape:'■'},Y:{name:'黃',shape:'◆'},P:{name:'紫',shape:'★'}
};
export const LIGHT=['R','B','G']; // the engraving the prism reveals, left to right
export const APPRENTICES=['白芷','遠志','決明','茯苓','紫蘇','杜仲','甘松']; // the same seven as puzzles/apothecary.js
export const HOLDER=6; // 甘松, the seventh, the one holding the poisoned apple
// The four panels of E4 with the picture each one shows, and the order the red thread finally ran (either direction).
export const PANELS={A:{name:'鏡廊',art:'mirror-hall'},B:{name:'陽台',art:'balcony'},C:{name:'黑松林',art:'black-pine-path'},D:{name:'舞廳',art:'ballroom'}};
export const CHAIN=['B','A','D','C'];
export const prefixOk=seq=>seq.every((p,i)=>p===CHAIN[i])||seq.every((p,i)=>p===CHAIN[CHAIN.length-1-i]);
// One shard per act, carved with the act's title; the slot it belongs in is the act's number.
export const ACT_SHARDS=rooms.flatMap((room,i)=>room.spots.filter(spot=>spot.shard).map(spot=>({id:spot.id,act:i+1,title:room.title})));
const NUMERAL=['零','一','二','三','四','五','六','七'];

// ---- Faces, in the order the box lists them. `needs` are puzzle ids of the levels that give the tool.
export const FACES=[
 {id:'time',stage:'box-time',name:'時辰面',needs:['belfry']},
 {id:'light',stage:'box-light',name:'光之面',needs:['prism']},
 {id:'apple',stage:'box-apple',name:'蘋果鎖',needs:['apothecary']},
 {id:'thread',stage:'box-thread',name:'鏡中鏡',needs:['gallery']},
 {id:'shards',stage:'box-shards',name:'碎片面',needs:[]},
 {id:'cipher',stage:'box-cipher',name:'密碼盤',needs:KEY_LEVELS.map(level=>level.puzzle)}
];
const GOALS={
 time:{title:'時辰面',goal:'匣面嵌著一個十三格的撥盤。把指針轉到對的那一格，再按「扣上」。'},
 light:{title:'光之面',goal:'這一面看起來只是光滑的黑鏡。用舞廳帶來的稜鏡照一照，再依刻線的順序按下顏色。'},
 apple:{title:'蘋果鎖',goal:'鎖是一顆蘋果的形狀，旁邊排著七顆小蘋果，各刻著一名學徒的名字。把回魂藥滴進對的那一顆。'},
 thread:{title:'鏡中鏡',goal:'兩個鏡孔之間可以穿過一條紅線。依序點選四格，讓紅線穿過它們。'},
 shards:{title:'碎片面',goal:'七片碎片各記得七十三個孩子之中的一個名字，也各有一個位置。先點一片碎片，再點它的位置。'},
 cipher:{title:'密碼盤',goal:'王后留在匣內的字條，用的是小時候教過妳的那套記號。把四個符號讀出來。'}
};

// ---- Hints: three tiers (where to look, the rule, the answer), keyed by the step the player's own board needs next.
export const HINTS={
 time:[
  '這一面有一個十三格的撥盤。想想看，哪一聲鐘響，是這座學院原本沒有的。',
  '學院只有十二座鐘塔，多出來的是第十三聲。撥盤的每一格都有編號。',
  '把指針轉到第 13 格，再按「扣上」。'
 ],
 'light-lift':[
  '面上好像什麼也沒有。妳在舞廳拿到的東西，能讓看不見的光現形。',
  '按「舉起稜鏡」，隱藏的刻線就會浮現。',
  '舉起稜鏡，記下三道刻線的顏色與順序，再依序按下三個顏色。'
 ],
 'light-seq':[
  '刻線有三道，每道一個顏色。順序從左到右。',
  '依刻線的順序按下三個顏色；按滿三個才會判定，錯了就重來，不會有任何懲罰。',
  '紅 → 藍 → 綠。'
 ],
 apple:[
  '蘋果鎖要用回魂藥打開，但七顆蘋果之中只有一顆對得上。回想藥房裡的七份證詞。',
  '把意識送進鏡子的，是那位被帳冊寫成說謊的學徒。回魂藥是它的反面，要滴進同一顆蘋果。',
  '選「甘松」（第七位學徒）的那一顆，再按「滴入回魂藥」。'
 ],
 thread:[
  '紅線要依序穿過四格，每一格都是妳在無限鏡廊見過的畫面。回想最後排成一列的順序。',
  '相鄰的兩格靠同一樣東西連著：月亮連著陽台與鏡廊，門連著鏡廊與舞廳，燈連著舞廳與黑松林。',
  '陽台 → 鏡廊 → 舞廳 → 黑松林。（倒過來，從黑松林穿也可以。）'
 ],
 shards:[
  '每片碎片刻著它來自哪一幕的標題，每個位置標著第幾幕。',
  '把碎片放進它那一幕的位置。幕的順序就是旅程的順序，首頁的章節卡片上有編號。',
  ACT_SHARDS.map(shard=>'第'+NUMERAL[shard.act]+'幕：'+shard.title).join('、')+'。'
 ],
 cipher:[
  '這是四個注音符號的密文，要用妳一路帶來的四個記號才讀得出來。',
  '每個記號在注音順序表上有編號（ㄅ＝1 … ㄩ＝37）。把密文符號往回數那麼多格，就是明文。第 1 個符號用 E1 的記號，第 2 個用 E2，依此類推。',
  '四個記號是 '+KEYS.map(key=>key+'（'+idx(key)+'）').join('、')+'。答案是「'+PLAIN+'」。'
 ]
};

// ---- Which faces can be opened with what the player has done. `done(puzzleId)` says whether a level is finished.
export const faceOpen=(face,done)=>face.needs.every(done);
export const missing=(face,done)=>KEY_LEVELS.filter(level=>face.needs.includes(level.puzzle)&&!done(level.puzzle));

const reduced=()=>document.body.classList.contains('reduce-motion');

const shell=face=>'<div class="belfry box" data-face="'+face+'"><p class="challenge-help"><b>'+GOALS[face].title+'。</b>'+GOALS[face].goal+'</p>'
 +'<p id="bf-status" class="belfry-status" role="status"></p>'
 +'<div id="box-body" class="box-body"></div>'
 +'<p id="box-feedback" class="challenge-feedback" role="status"></p>'+hintMarkup+'</div>';

// Shared frame: the shell, the status line, the hints and the "face opened" step. `build(h)` draws one face and gives h.step.
function mountFace(ctx,face,build){
 ensureMaterials();
 ctx.render(shell(face));
 const $=id=>document.getElementById(id),body=$('box-body'),alive=()=>body.isConnected;
 let finished=false;
 const h={ctx,body,
  say:(text,tone='')=>{const el=$('bf-status');el.textContent=text;el.dataset.tone=tone;},
  note:text=>{$('box-feedback').textContent=text||'';},
  step:()=>face,
  redraw(html,focus){
   body.innerHTML=html;
   if(focus)body.querySelector(focus)?.focus({preventScroll:true});
   hints.changed();
  },
  win(text){
   if(finished)return;
   finished=true;h.say(text,'ok');hints.changed();ctx.playCue('door');
   setTimeout(()=>{if(alive())ctx.done();},reduced()?0:ctx.fresh?300:1200); // a replay moves on quickly
  },
  get finished(){return finished;}
 };
 const hints=bindHints({hints:HINTS,currentStep:()=>finished?null:h.step(),alive});
 build(h);
 hints.changed();
 // A test hook, read-only state for the browser suites.
 body.__box={get finished(){return finished;}};
}
const buttons=(root,attr,fn)=>root.querySelectorAll('['+attr+']').forEach(el=>{el.onclick=()=>fn(el.getAttribute(attr),el);});

// ---- 1. Time: a 13-notch dial. The tool (the hour ring) only opens the face; the number comes from E1.
export const mountBoxTime=ctx=>mountFace(ctx,'time',h=>{
 let pos=1;
 const point=(i,r)=>{const a=(i-1)/TIME_SLOTS*2*Math.PI-Math.PI/2;return [100+r*Math.cos(a),100+r*Math.sin(a)];};
 const html=()=>{
  let s='<svg class="box-dial" viewBox="0 0 200 200" role="group" aria-label="十三格撥盤"><circle class="box-dial-shadow" cx="101.5" cy="103" r="94"/><circle class="box-dial-rim" cx="100" cy="100" r="94"/><circle class="box-dial-shine" cx="100" cy="100" r="92.4"/><circle class="box-dial-face" cx="100" cy="100" r="68"/><image href="assets/puzzles/compass-plate.webp" x="32" y="32" width="136" height="136" opacity=".75" pointer-events="none"/><circle class="box-dial-ring" cx="100" cy="100" r="71"/>';
  for(let i=1;i<=TIME_SLOTS;i++){
   const [x,y]=point(i,82),[tx,ty]=point(i,82);
   s+='<g class="box-notch'+(i===pos?' on':'')+'" data-n="'+i+'" role="button" tabindex="0" aria-label="第 '+i+' 格" aria-pressed="'+(i===pos)+'"><circle class="hit" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="11"/><text x="'+tx.toFixed(1)+'" y="'+(ty+3.5).toFixed(1)+'" text-anchor="middle">'+i+'</text></g>';
  }
  const [px,py]=point(pos,60);
  s+='<line class="box-pointer" x1="100" y1="100" x2="'+px.toFixed(1)+'" y2="'+py.toFixed(1)+'"/><line class="box-pointer-hi" x1="100" y1="100" x2="'+px.toFixed(1)+'" y2="'+py.toFixed(1)+'"/><circle class="box-hub" cx="100" cy="100" r="7"/></svg>'
   +'<div class="box-row"><button class="secondary-button" data-k="dec" aria-label="往前一格">−</button><span class="box-readout" aria-live="polite">指針在第 '+pos+' 格</span><button class="secondary-button" data-k="inc" aria-label="往後一格">＋</button></div>'
   +'<div class="box-row"><button class="primary-button" data-k="lock">扣上</button></div>';
  return s;
 };
 const set=(n,focus)=>{pos=Math.max(1,Math.min(TIME_SLOTS,n));h.ctx.playCue('click');draw(focus);};
 function draw(focus){
  h.redraw(html(),focus);
  h.body.querySelectorAll('[data-n]').forEach(g=>{
   g.onclick=()=>set(+g.dataset.n,'[data-n="'+g.dataset.n+'"]');
   g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();g.onclick();}};
  });
  buttons(h.body,'data-k',key=>{
   if(key==='dec')set(pos-1,'[data-k="dec"]');
   else if(key==='inc')set(pos+1,'[data-k="inc"]');
   else lock();
  });
 }
 function lock(){
  if(pos===TIME){h.note('');h.win('撥盤咔的一聲停在第 13 格，時辰面鬆開了。');return;}
  h.note('撥盤停在第 '+pos+' 格，什麼也沒有發生。');h.ctx.playCue('wrong');
 }
 h.say('撥盤停在第 1 格。');
 draw();
});

// ---- 2. Light: lift the prism to read the engraving, then press its colours. Three of five, judged after the third.
export const mountBoxLight=ctx=>mountFace(ctx,'light',h=>{
 let lifted=false,seq=[];
 h.step=()=>lifted?'light-seq':'light-lift';
 const chip=c=>'<span class="box-chip c-'+c+'"><b aria-hidden="true">'+COLORS[c].shape+'</b>'+COLORS[c].name+'</span>';
 const html=()=>'<div class="box-row"><button class="secondary-button" data-k="prism" aria-pressed="'+lifted+'">'+(lifted?'放下稜鏡':'舉起稜鏡')+'</button></div>'
  +'<div class="box-glass'+(lifted?' lit':'')+'" aria-live="polite">'+(lifted?'<span class="box-glass-title">刻線浮現：</span>'+LIGHT.map(chip).join(''):'<span class="box-dim">（光滑的黑鏡，什麼也看不到）</span>')+'</div>'
  +'<p class="box-line">依刻線的順序按下三個顏色。已按 <b>'+seq.length+'</b> / 3：'+(seq.length?seq.map(chip).join(''):'<span class="box-dim">尚未按下</span>')+'</p>'
  +'<div class="box-row wrap">'+Object.keys(COLORS).map(c=>'<button class="box-color c-'+c+'" data-c="'+c+'" aria-label="'+COLORS[c].name+'色"><b aria-hidden="true">'+COLORS[c].shape+'</b>'+COLORS[c].name+'</button>').join('')+'</div>'
  +(seq.length?'<div class="box-row"><button class="text-button" data-k="clear">清掉重按</button></div>':'');
 function draw(focus){
  h.redraw(html(),focus);
  buttons(h.body,'data-k',key=>{
   if(key==='prism'){lifted=!lifted;h.ctx.playCue('click');h.note('');draw('[data-k="prism"]');}
   else{seq=[];h.note('');draw('[data-k="prism"]');}
  });
  buttons(h.body,'data-c',(c)=>{
   seq.push(c);h.ctx.playCue('click');
   if(seq.length<3){h.note('');draw('[data-c="'+c+'"]');return;}
   if(seq.every((x,i)=>x===LIGHT[i])){draw();h.note('');h.win('三道刻線同時亮起，光之面鬆開了。');return;}
   seq=[];h.note('三個顏色都按下了，沒有反應。');h.ctx.playCue('wrong');draw('[data-c="'+c+'"]');
  });
 }
 h.say('面上還沒有任何反應。');
 draw();
});

// ---- 3. Apple lock: seven apples, one per apprentice; the revival draught goes into the right one.
export const mountBoxApple=ctx=>mountFace(ctx,'apple',h=>{
 let pick=null;const tried=new Set();
 const html=()=>'<div class="box-apples">'+APPRENTICES.map((name,i)=>'<button class="box-apple'+(pick===i?' on':'')+(tried.has(i)?' tried':'')+'" data-a="'+i+'" aria-pressed="'+(pick===i)+'" aria-label="第 '+(i+1)+' 顆蘋果：'+name+(tried.has(i)?'（試過了，沒有反應）':'')+'"><b aria-hidden="true">'+(i+1)+'</b><span>'+name+'</span></button>').join('')+'</div>'
  +'<div class="box-row"><button class="primary-button" data-k="drop"'+(pick===null?' disabled':'')+'>滴入回魂藥</button></div>';
 function draw(focus){
  h.redraw(html(),focus);
  buttons(h.body,'data-a',a=>{pick=pick===+a?null:+a;h.ctx.playCue('click');h.note('');draw('[data-a="'+a+'"]');});
  buttons(h.body,'data-k',()=>{
   if(pick===null)return;
   if(pick===HOLDER){draw();h.note('');h.win('回魂藥滲進了'+APPRENTICES[HOLDER]+'的那顆蘋果，鎖開了。');return;}
   tried.add(pick);h.note('藥液滴在「'+APPRENTICES[pick]+'」的蘋果上，沒有反應。');h.ctx.playCue('wrong');pick=null;draw('[data-a]');
  });
 }
 h.say('七顆小蘋果排成一圈，鎖眼在中央。');
 draw();
});

// ---- 4. Thread: pass the red thread through the four panels in the order E4 ended with.
export const mountBoxThread=ctx=>mountFace(ctx,'thread',h=>{
 let seq=[];
 const holes=['D','B','C','A']; // shown in an order that gives nothing away
 const html=()=>'<p class="box-line">紅線已穿過：'+(seq.length?seq.map(p=>'<span class="box-chip">'+PANELS[p].name+'</span>').join('→'):'<span class="box-dim">尚未穿過任何一格</span>')+'</p>'
  +'<div class="box-holes">'+holes.map(p=>'<button class="box-hole'+(seq.includes(p)?' used':'')+'" data-h="'+p+'" aria-label="'+PANELS[p].name+(seq.includes(p)?'（紅線已穿過）':'')+'"'+(seq.includes(p)?' disabled':'')+'><img src="assets/'+PANELS[p].art+'.webp" alt="" width="1664" height="944" decoding="async" draggable="false"><span>'+PANELS[p].name+'</span></button>').join('')+'</div>'
  +(seq.length?'<div class="box-row"><button class="text-button" data-k="undo">收回紅線</button></div>':'');
 function draw(focus){
  h.redraw(html(),focus);
  buttons(h.body,'data-h',p=>{
   seq.push(p);h.ctx.playCue('click');
   if(!prefixOk(seq)){
    const bad=seq.length;
    h.note('紅線從「'+PANELS[seq[bad-1]].name+'」穿不過去，它和前一格之間沒有接上。紅線收回來了。');
    seq=[];h.ctx.playCue('wrong');draw();return;
   }
   if(seq.length===CHAIN.length){draw();h.note('');h.win('紅線穿過了四面鏡孔，鏡中鏡轉開了。');return;}
   h.note('');draw('[data-h]:not(:disabled)');
  });
  buttons(h.body,'data-k',()=>{seq=[];h.note('');draw();});
 }
 h.say('四格都還沒有穿線。');
 draw();
});

// ---- 5. Shards: each collected shard goes into the slot of its act. Whatever was not found stays empty.
export const mountBoxShards=ctx=>mountFace(ctx,'shards',h=>{
 const mine=ACT_SHARDS.filter(shard=>ctx.has(shard.id));
 let sel=null;const placed=new Set();
 const html=()=>{
  const tray=mine.filter(shard=>!placed.has(shard.id));
  return (mine.length<ACT_SHARDS.length?'<p class="box-line">妳收集了 <b>'+mine.length+'</b> / '+ACT_SHARDS.length+' 片。沒收集到的位置會留空。</p>':'')
   +(mine.length&&tray.length?'<div class="box-row wrap" role="group" aria-label="碎片">'+tray.map(s=>'<button class="box-shard'+(sel===s.id?' on':'')+'" data-s="'+s.id+'" aria-pressed="'+(sel===s.id)+'" aria-label="碎片：'+s.title+'"><b aria-hidden="true">◆</b>'+s.title+'</button>').join('')+'</div>':'')
   +'<div class="box-slots" role="group" aria-label="位置">'+ACT_SHARDS.map(s=>{
     const has=placed.has(s.id);
     return '<button class="box-slot'+(has?' on':'')+(mine.some(m=>m.id===s.id)?'':' gap')+'" data-p="'+s.id+'" aria-label="第'+NUMERAL[s.act]+'幕的位置'+(has?'（已嵌入）':mine.some(m=>m.id===s.id)?'':'（沒有收集到，來自'+s.title+'）')+'"'+(has?' disabled':'')+'>'+(has?'<b aria-hidden="true">◆</b>':'')+'第'+NUMERAL[s.act]+'幕'+(mine.some(m=>m.id===s.id)?'':'<small>缺：'+s.title+'</small>')+'</button>';
    }).join('')+'</div>'
   +(mine.length===0?'<div class="box-row"><button class="primary-button" data-k="empty">這一面先空著</button></div>':'');
 };
 function draw(focus){
  h.redraw(html(),focus);
  buttons(h.body,'data-s',id=>{sel=sel===id?null:id;h.ctx.playCue('click');h.note('');draw('[data-s="'+id+'"]');});
  buttons(h.body,'data-p',id=>{
   if(!sel){h.note('先選一片碎片。');return;}
   if(sel!==id){
    const s=ACT_SHARDS.find(x=>x.id===sel),at=ACT_SHARDS.find(x=>x.id===id);
    h.note('「'+s.title+'」放不進第'+NUMERAL[at.act]+'幕的位置。');h.ctx.playCue('wrong');return;
   }
   placed.add(id);sel=null;h.ctx.playCue('click');h.note('');
   if(placed.size===mine.length){draw();h.win(mine.length===ACT_SHARDS.length?'七片碎片都嵌進去了，碎片面鬆開了。':'碎片都嵌進去了，碎片面鬆開了，只是還有位置空著。');return;}
   draw('[data-s]');
  });
  buttons(h.body,'data-k',()=>h.win('一片碎片也沒有。這一面空著，其餘的先鬆開了。'));
 }
 h.say(mine.length?'碎片散在匣旁，位置排成一圈。':'匣旁沒有任何碎片。');
 draw();
});

// ---- 6. Cipher disc: count each symbol back by the number of the key from its level.
export const mountBoxCipher=ctx=>mountFace(ctx,'cipher',h=>{
 const offsets=[0,0,0,0];
 const rows=[ZHUYIN37.slice(0,10),ZHUYIN37.slice(10,19),ZHUYIN37.slice(19,28),ZHUYIN37.slice(28)];
 let n=0;
 const table='<table class="box-table"><caption>注音順序表</caption>'+rows.map(row=>'<tr>'+row.map(z=>'<td><b>'+z+'</b>'+(++n)+'</td>').join('')+'</tr>').join('')+'</table>';
 const keyStrip='<ul class="box-keys" aria-label="手上的記號">'+KEY_LEVELS.map(level=>'<li><small>'+level.number+'</small>'+level.item+'<b>'+level.mark+'</b></li>').join('')+'</ul>';
 const html=()=>keyStrip+table+KEY_LEVELS.map((level,i)=>{
  const shown=reading(offsets)[i];
  return '<div class="box-letter"><div class="box-pair"><span class="box-sym" aria-label="密文第 '+(i+1)+' 個">'+CIPHER[i]+'</span><span class="box-back">往回數 <b aria-label="往回數 '+offsets[i]+' 格">'+offsets[i]+'</b> 格 →</span><span class="box-sym out" aria-label="讀出第 '+(i+1)+' 個">'+shown+'</span></div>'
   +'<small class="box-from">用 '+level.number+' 的記號</small>'
   +'<label class="box-pick">直接選格數<select data-sel="'+i+'">'+Array.from({length:37},(_,n)=>'<option value="'+n+'"'+(n===offsets[i]?' selected':'')+'>'+n+'</option>').join('')+'</select></label>'
   +'<div class="box-count"><button class="secondary-button" data-o="'+i+'" data-s="-5" aria-label="第 '+(i+1)+' 個往回數減五">−5</button><button class="secondary-button" data-o="'+i+'" data-s="-1" aria-label="第 '+(i+1)+' 個往回數減一">−1</button><button class="secondary-button" data-o="'+i+'" data-s="1" aria-label="第 '+(i+1)+' 個往回數加一">＋1</button><button class="secondary-button" data-o="'+i+'" data-s="5" aria-label="第 '+(i+1)+' 個往回數加五">＋5</button></div></div>';
 }).join('')+'<p class="box-line">目前讀出：<b class="box-word" aria-live="polite">'+reading(offsets)+'</b></p>';
 function draw(focus){
  h.redraw(html(),focus);
  h.body.querySelectorAll('[data-sel]').forEach(el=>{
   el.onchange=()=>{
    const i=+el.dataset.sel;offsets[i]=+el.value;h.ctx.playCue('click');
    if(reading(offsets)===PLAIN){draw();h.note('');h.win('四個符號拼成「'+PLAIN+'」，是露西。盤面鬆開了。');return;}
    h.note('');draw('[data-sel="'+i+'"]');
   };
  });
  h.body.querySelectorAll('[data-o]').forEach(b=>{
   b.onclick=()=>{
    const i=+b.dataset.o;offsets[i]=(offsets[i]+(+b.dataset.s)+37)%37;h.ctx.playCue('click');
    if(reading(offsets)===PLAIN){draw();h.note('');h.win('四個符號拼成「'+PLAIN+'」，是露西。盤面鬆開了。');return;}
    h.note('');draw('[data-o="'+i+'"][data-s="'+b.dataset.s+'"]');
   };
  });
 }
 h.say('四個符號，還沒有讀出任何字。');
 draw();
});
