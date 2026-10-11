// Act density report (plan §4.2). Read-only: counts what each act ships and prints the gap to the
// target table. It reports; it never fails the build, because the content work is still in progress.
// Run: node scripts/blood-mirror-density.mjs            (add --strict to exit 1 when any act is short)
import {rooms,items} from '../games/blood-mirror/engine/index.js';
import {puzzles} from '../games/blood-mirror/puzzles/index.js';

const strict=process.argv.includes('--strict');
// Targets from plan §4.2. "views" is not modelled in the data yet, so it is reported as unknown.
const targets={interactive:[8,12],mechanisms:[2,2],items:[2,3],clueWords:[8,12],shards:[1,1],afterSolved:[1,Infinity],memories:[1,Infinity]};

const rows=rooms.map(room=>{
 const spots=room.spots.filter(spot=>!spot.memory&&!spot.shard);
 const clueWords=new Set(room.spots.flatMap(spot=>[...(spot.clues||[]),...(spot.restoredClues||[])]));
 const mechanisms=[puzzles[room.id]?1:0,room.interrogation?1:0].reduce((a,b)=>a+b,0);
 return {
  act:room.chapter+' '+room.title,
  interactive:spots.length,
  mechanisms,
  items:new Set(room.spots.filter(spot=>spot.item).map(spot=>items[spot.item]?.name)).size,
  clueWords:clueWords.size,
  shards:room.spots.filter(spot=>spot.shard).length,
  afterSolved:room.spots.filter(spot=>spot.after==='solved').length,
  memories:room.spots.filter(spot=>spot.memory).length
 };
});

const short=(value,[min,max])=>value<min||value>max;
const cell=(value,range)=>short(value,range)?`${value} ✗`:`${value} ✓`;
console.log('Blood Mirror act density (plan §4.2 targets in brackets)\n');
console.log('| 幕 | 可互動點 [8–12] | 機關 [2] | 物品 [2–3] | 線索詞 [8–12] | 碎片 [1] | 解封後變化 [≥1] | 人物記憶 [≥1] |');
console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
for(const row of rows){
 console.log(`| ${row.act} | ${cell(row.interactive,targets.interactive)} | ${cell(row.mechanisms,targets.mechanisms)} | ${cell(row.items,targets.items)} | ${cell(row.clueWords,targets.clueWords)} | ${cell(row.shards,targets.shards)} | ${cell(row.afterSolved,targets.afterSolved)} | ${cell(row.memories,targets.memories)} |`);
}
console.log('\n視角（全景＋特寫）、角色立繪與對話場景尚未在資料中建模，未列入計算。');

const gaps=rows.filter(row=>['interactive','mechanisms','items','clueWords','shards','afterSolved','memories'].some(key=>short(row[key],targets[key])));
console.log(`\n${gaps.length} / ${rows.length} 幕尚有缺口。`);
if(strict&&gaps.length)process.exitCode=1;
