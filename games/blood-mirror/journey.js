import {rooms,items,endings,visibleSpots,memorySpots,validAnswers} from './engine.js';

// Presentation derived from existing progress; never writes or migrates a save.
export function spotText(spot,restored=false){return restored&&spot.restoredText?spot.restoredText:spot.text;}

export function journeyGuide(state,challengeComplete=false){
 // Optional post-game memories never count toward progress or appear in the guide.
 const room=rooms[state.room],done=state.solved.includes(state.room),spots=visibleSpots(state).filter(spot=>!spot.memory);
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
 return rooms.map((room,index)=>({index,title:room.title,chapter:room.chapter,entries:visibleSpots(state,index).filter(spot=>!spot.lock&&!spot.memory&&state.seen.includes(spot.id)).map(spot=>({...spot,text:spotText(spot,room.evidence===spot.id&&isRestored(room.id))}))})).filter(section=>section.index<=state.unlocked);
}

// Memories persist across journeys; unfound ones only reveal which act holds them.
export function memoryCollection(state){
 const found=state.memories||[];
 return memorySpots.map(spot=>({id:spot.id,room:spot.room,chapter:rooms[spot.room].chapter,title:rooms[spot.room].title,found:found.includes(spot.id),label:found.includes(spot.id)?spot.label:null,text:found.includes(spot.id)?spot.text:null}));
}

const causes={
 dawn:state=>['妳帶著赫索的工程藍圖，選擇先讓蒸汽塔取代結界，再交出名字。',state.seen.includes('miners')?'妳記得赫索的話：先把塔蓋好，再拆掉結界。':'工程與遷移完成之後，解除契約才不會讓任何城市被霜潮吞沒。'],
 frost:state=>['妳選擇立刻交出名字，所有生命抵押在同一刻終止。',state.seen.includes('miners')?'赫索說過順序錯了，死的會是整座城。妳聽見了，卻沒有等。':'蒸汽塔還沒完成，結界卻一同消失。'],
 crown:state=>['妳保住了自己的名字，也繼承了王冠。',state.inventory.includes('contract')?'妳讀過父親簽下的契約，卻仍戴上了同一頂王冠。':'王冠底下的生命帳簿，因此翻開了新的一頁。']
};
// What the player told the queen, set against the ending they chose (answers: crown, child, remembered).
const echoes={
 dawn:a=>[a[1]==='third'?'妳曾對王后說，要尋找第三種方法。蒸汽塔，就是妳找到的那一種。':'妳曾說會犧牲一個孩子去救一千人；最後，妳讓被犧牲的人成了自己。',a[2]==='yes'?'妳曾說即使世界不知道，妳仍願意。如今，世界真的忘了妳。':'妳曾說妳需要被記住。最後，妳仍把名字交了出去。'],
 frost:a=>[a[1]==='third'?'妳曾說要尋找第三種方法，卻沒有等到它完成。':'妳曾說會犧牲一個孩子去救一千人。這一次，被犧牲的是北方七座城市。'],
 crown:a=>[a[0]==='yes'?'妳曾告訴王后，妳想繼承王冠。妳做到了。':'妳曾告訴王后，妳不想成為女王，最後卻戴上了王冠。',a[2]==='no'?'妳曾說妳需要被記住。王冠讓所有人都記得妳。':'妳曾說即使世界不知道也願意，卻選了一個永遠會被記住的結局。']
};
export function journeyRecap(state){
 if(!state.ending||!causes[state.ending])return null;
 const memories=memoryCollection(state),found=memories.filter(m=>m.found).length,missingEndings=Object.keys(endings).length-state.endings.length;
 const scenes=rooms.flatMap(room=>room.spots.filter(spot=>spot.after==='solved')).filter(spot=>state.seen.includes(spot.id)).length;
 const hints=Object.values(state.hints||{}).reduce((sum,n)=>sum+(Number(n)||0),0);
 const next=missingEndings?'回到最後的選擇，看看另外 '+missingEndings+' 種代價。'
  :found<memories.length?'重返五幕，還有 '+(memories.length-found)+' 段人物記憶等妳發現：'+memories.filter(m=>!m.found).map(m=>m.chapter).join('、')+'。'
  :'妳已看見這面鏡子裡的全部真相。';
 const answers=validAnswers(state.answers)?echoes[state.ending](state.answers):[];
 return {cause:causes[state.ending](state),answers,scenes,sceneTotal:rooms.flatMap(room=>room.spots.filter(spot=>spot.after==='solved')).length,hints,memories:found,memoryTotal:memories.length,next};
}
