import {rooms,items,endings,visibleSpots} from './engine.js';

// Presentation derived from existing progress; never writes or migrates a save.
export function spotText(spot,restored=false){return restored&&spot.restoredText?spot.restoredText:spot.text;}

export function journeyGuide(state,challengeComplete=false){
 const room=rooms[state.room],done=state.solved.includes(state.room),spots=visibleSpots(state);
 const discovered=spots.filter(spot=>!spot.lock&&state.seen.includes(spot.id)).length;
 const total=spots.filter(spot=>!spot.lock).length;
 // Newly revealed spots lead first: an uncollected item, or an unread scene change.
 const aftermath=done&&spots.find(spot=>spot.after==='solved'&&(spot.item?!state.inventory.includes(spot.item):!state.seen.includes(spot.id)));
 let next;
 if(state.ending){
  next={kind:'ending',label:'回看結局',text:'這段旅程已完成。可以回看結局，或到藝廊欣賞已解鎖的收藏。'};
 }else if(aftermath){
  next={kind:'spot',spot:aftermath.id,label:'檢視'+aftermath.label,text:aftermath.item&&state.seen.includes(aftermath.id)?'妳已讀過'+aftermath.label+'，但還未收取。把它帶在身邊。':'封印解開後，場景裡出現了新的東西。去看看留下了什麼。'};
 }else if(done){
  next=state.room===rooms.length-1
   ?{kind:'fate',label:'面對最後的交易',text:'五份真相已齊備。下一步由妳決定願意支付的代價。'}
   :{kind:'travel',room:state.room+1,label:'前往'+rooms[state.room+1].title,text:'本幕封印已解開，下一幕正在等待妳。也可以留在此處重看線索。'};
 }else if(room.requires&&!state.inventory.includes(room.requires)){
  const spot=room.spots.find(spot=>spot.item===room.requires);
  next={kind:'spot',spot:spot.id,label:'檢視'+spot.label,text:state.seen.includes(spot.id)?'妳已查看'+spot.label+'，但還未收取。打開它並放入隨身物品。':'先找到並收取'+items[room.requires].name+'，它是解開本幕封印的必要物品。'};
 }else{
  const unseen=spots.find(spot=>!spot.lock&&!state.seen.includes(spot.id));
  const evidence=room.evidence&&!challengeComplete&&room.spots.find(spot=>spot.id===room.evidence);
  next=unseen
   ?{kind:'spot',spot:unseen.id,label:'探索'+unseen.label,text:'還有未查看的線索。先觀察'+unseen.label+'，再與筆記中的資訊比對。'}
   :evidence
    ?{kind:'spot',spot:evidence.id,label:room.evidenceButton||'修復'+evidence.label,text:room.evidenceGate||evidence.label+'已經損毀。把它修復，才能讀到缺少的資訊。'}
    :room.evidence
     ?{kind:'puzzle',label:'解開封印',text:'證據已修復。比對筆記中的線索與隨身物品，解開封印。'}
     :{kind:'puzzle',label:challengeComplete?'檢視封印':'開始互動謎題',text:challengeComplete?'互動謎題已完成。比對已找到的線索，解開最後的封印。':'本幕線索已查看。可以開始互動謎題；需要幫助時，隨時打開筆記或提示。'};
 }
 return {chapter:room.chapter,title:room.title,objective:done?'本幕封印已解開。':room.objective,discovered,total,solved:state.solved.length,endingTitle:state.ending?endings[state.ending].title:null,next};
}

export function journalChapters(state,isRestored=()=>false){
 return rooms.map((room,index)=>({index,title:room.title,chapter:room.chapter,entries:visibleSpots(state,index).filter(spot=>!spot.lock&&state.seen.includes(spot.id)).map(spot=>({...spot,text:spotText(spot,room.evidence===spot.id&&isRestored(room.id))}))})).filter(section=>section.index<=state.unlocked);
}
