export const SAVE_KEY = 'blood-mirror-v1';
export const rooms = [
  {id:'library',title:'黑鐘書庫',subtitle:'第十三聲鐘響',chapter:'第一幕',image:'chamber.webp',atmosphere:'library',intro:'午夜，黑鐘學院敲響了第十三聲。妳在禁書庫醒來。門外有人拖動鎖鏈，而桌上的懷錶……正在倒著走。',objective:'找到禁書櫃的四位密碼，取回王室生命契約。',puzzle:'code',answer:'1373',requires:'watch',reward:'王室契約',unlock:'暗門緩緩打開。契約上是妳父親的簽名。原來，魔法從來不是免費的。',spots:[
    {id:'bells',label:'鐘塔手札',icon:'book',x:22,y:56,text:'「學院只有十二座鐘塔。第十三聲，代表禁忌魔法。」\n頁緣補註：先記下禁忌的鐘聲，再記下出生的代價。',clue:true},
    {id:'watch',label:'黃金懷錶',icon:'clock',x:38,y:74,text:'錶蓋內刻著兩句話：「前兩位是那不應存在的鐘聲。後兩位，是公主誕生時抵押的生命。」',item:'watch',itemName:'黃金懷錶',clue:true},
    {id:'birth',label:'出生紀錄',icon:'scroll',x:67,y:48,text:'確保公主出生：抵押七十三名兒童的完整生命。\n日期旁邊，是妳父親的簽名。七十三個人，換來妳的第一聲啼哭。',clue:true},
    {id:'lock1',label:'禁書櫃封印',icon:'lock',x:83,y:63,text:'四個刻度。封印只接受四位數字。',lock:true}],hints:['查閱鐘塔手札與出生紀錄，懷錶會告訴妳順序。','先填禁忌鐘聲的次數，再填被抵押的兒童人數。','第十三聲 + 七十三名兒童：1373。']},
  {id:'mine',title:'銀骨礦坑',subtitle:'七個被遺忘的人',chapter:'第二幕',image:'mine.webp',atmosphere:'mine',intro:'奈菈帶妳穿過銀骨礦坑。玻璃容器裡，有人不停呼喚母親。赫索指著停擺的管線：「不靠魔法，也能讓城市暖起來。」',objective:'裝上閥柄，依工程手札啟動三段蒸汽管線。',puzzle:'sequence',answer:['water','heat','city'],requires:'valve',reward:'工程藍圖',unlock:'熱泉湧進銅管。妳第一次看見，一種不需要生命抵押的溫暖。赫索將工程藍圖交給妳。',spots:[
    {id:'minebook',label:'生命帳簿',icon:'book',x:23,y:68,text:'奈菈、魯恩、赫索、莫格、奇妲、斐恩、提米。\n他們曾經有普通人的身高。銀骨礦石奪走了健康，王國又奪走了他們的名字。',clue:true},
    {id:'valve',label:'銅製閥柄',icon:'gear',x:78,y:65,text:'赫索留下的閥柄。沉甸甸的金屬依然溫暖，可以裝回控制盤。',item:'valve',itemName:'銅製閥柄'},
    {id:'pipeNote',label:'工程手札',icon:'scroll',x:49,y:43,text:'「先讓冷水進入管線；再引入地下熱泉；最後向城市輸送。」\n沒有水就加熱，銅管會破裂。出口必須最後開啟。',clue:true},
    {id:'lock2',label:'蒸汽控制盤',icon:'gear',x:86,y:41,text:'三道閥門，等待正確的開啟順序。',lock:true}],options:[{id:'city',label:'城市出口',symbol:'♜'},{id:'heat',label:'地下熱泉',symbol:'☀'},{id:'water',label:'冷水入口',symbol:'≈'}],hints:['先找到閥柄，再看工程手札。','從水源開始，加熱居中，輸送最後。','依序點選：冷水入口 → 地下熱泉 → 城市出口。']},
  {id:'crypt',title:'玻璃棺室',subtitle:'毒蘋果是一把鑰匙',chapter:'第三幕',image:'crypt.webp',atmosphere:'crypt',intro:'妳的呼吸停了，意識卻仍在。伊萊的聲音隔著玻璃傳來。薇菈說過，蘋果不是結束，而是通往魔鏡內部的鑰匙。',objective:'收取毒蘋果，依咒語排列三個符印，打開鏡界。',puzzle:'sequence',answer:['moon','apple','mirror'],requires:'apple',reward:'鏡界印記',unlock:'月亮、蘋果、鏡子依次亮起。棺室的倒影忽然轉過頭——那不是妳。',spots:[
    {id:'grimoire',label:'封印咒書',icon:'book',x:21,y:70,text:'「讓月亮見證沉睡，以蘋果終止呼吸，讓鏡子保存名字。」\n只有循著這段咒語，活人的意識才不會迷失。',clue:true},
    {id:'apple',label:'血紅蘋果',icon:'apple',x:81,y:69,text:'鮮紅果皮下浮著黑色咒文。薇菈說：「這是一把鑰匙。」妳將它帶在身邊。',item:'apple',itemName:'毒蘋果'},
    {id:'coffin',label:'玻璃棺',icon:'gem',x:49,y:62,text:'玻璃裡刻著七十二道保護咒。妳聽見伊萊低語：「她還在裡面。」\n王子的吻沒有讓任何咒文改變。',clue:true},
    {id:'lock3',label:'三重符印',icon:'mirror',x:63,y:32,text:'三個符印相互交錯。必須按照咒書的敘述排列。',lock:true}],options:[{id:'mirror',label:'鏡子',symbol:'◇'},{id:'moon',label:'月亮',symbol:'☾'},{id:'apple',label:'蘋果',symbol:'♧'}],hints:['封印咒書中的三句話，描述了三個符印的順序。','先見證沉睡，再終止呼吸，最後保存名字。','月亮 → 蘋果 → 鏡子。']},
  {id:'queen',title:'王后寢宮',subtitle:'她最後的謊言',chapter:'第四幕',image:'queen.webp',atmosphere:'queen',intro:'鏡子讓妳看見年輕的薇菈。她為了救愛人嫁給國王，卻成為契約的囚徒。床頭那隻灰兔，右耳被一針一線縫好了。',objective:'取得銀針，回答王后留下的三個問題。',puzzle:'questions',answer:['no','third','yes'],requires:'needle',reward:'第八份證詞',unlock:'妳用銀針挑開契約的接縫。鏡中浮現母親伊蓮的最後記憶：她不是死於生產。',spots:[
    {id:'rabbit',label:'灰色兔子',icon:'gem',x:23,y:65,text:'兔子的右耳總是會掉。每次醒來，耳朵卻又被縫好。\n原來替妳修補它的人，一直是薇菈。',clue:true},
    {id:'needle',label:'魔法銀針',icon:'key',x:40,y:74,text:'銀針藏在王后的縫線盒裡。鏡中的回憶顯示，國王曾用另一支銀針刺向伊蓮。證詞可以刺破謊言。',item:'needle',itemName:'魔法銀針',clue:true},
    {id:'letter',label:'王后的信',icon:'scroll',x:69,y:47,text:'白雪的三個回答：\n「我不想成為女王。」\n「我會尋找第三種方法。」\n「即使世界不知道，我仍願意。」\n薇菈留下補註：請用妳自己的意志，重新回答。',clue:true},
    {id:'lock4',label:'王后的三問',icon:'mirror',x:84,y:61,text:'魔鏡重複著王后的三個問題。回答決定它是否讓妳看到最後的證詞。',lock:true}],questions:[{text:'妳想成為女王嗎？',options:[{id:'yes',label:'我想繼承王冠'},{id:'no',label:'我不想成為女王'}]},{text:'殺死一個孩子，能救一千個人。妳會怎麼做？',options:[{id:'sacrifice',label:'犧牲那個孩子'},{id:'third',label:'尋找第三種方法'}]},{text:'如果世界永遠不知道是妳救了它，妳還願意嗎？',options:[{id:'yes',label:'我仍然願意'},{id:'no',label:'我需要被記住'}]}],hints:['讀王后的信，留意白雪對權力、犧牲與被遺忘的回答。','她拒絕王冠與生命交易，也不要求世界記住她。','不當女王 → 尋找第三種方法 → 仍然願意。']},
  {id:'mirror',title:'鏡中之國',subtitle:'一個名字的代價',chapter:'第五幕',image:'mirror.webp',atmosphere:'mirror',intro:'七十三個孩子站在鏡子的另一端。露西握住妳的手。魔鏡提出最後一筆交易：「我可以讓妳活過來。代價，是妳的名字。」',objective:'揭露王冠契約的繼承者，然後決定妳的代價。',puzzle:'name',answer:'snow',requires:null,reward:'契約真相',unlock:'名字不是字母，是所有人對妳的記憶。王族的名字仍被承認，生命抵押就會繼續。妳終於握住契約的終點。',spots:[
    {id:'lucy',label:'露西的倒影',icon:'gem',x:30,y:47,text:'「妳又沒有殺我們。妳不是來幫我們的嗎？」\n露西曾經有名字，有母親，也有一個等不到的春天。',clue:true},
    {id:'witness',label:'見證者手稿',icon:'scroll',x:21,y:74,text:'第一位國王將臣民的生命抵押給王冠。\n最終繼承人是失蹤的公主——不是王后，也不是奧瑞恩。唯有她的名字被世界遺忘，抵押才會失去繼承人。',item:'witness',itemName:'見證者手稿',clue:true},
    {id:'heatplan',label:'遠方的蒸汽塔',icon:'gear',x:79,y:47,text:'赫索的工程能取代魔法結界，但必須先準備熱能與遷移。立即毀掉結界，會讓北方七座城市暴露在霜潮之中。',clue:true},
    {id:'lock5',label:'最後一面鏡子',icon:'mirror',x:52,y:37,text:'「告訴我，誰是生命契約最後的血脈繼承人？」',lock:true}],options:[{id:'queen',label:'薇菈王后'},{id:'prince',label:'奧瑞恩王子'},{id:'snow',label:'白雪公主'}],hints:['見證者手稿記載了契約的真正繼承人。','契約看的是王室血脈，而非誰現在坐在王座上。','選擇「白雪公主」。']}
];
export const items = {
 watch:{name:'黃金懷錶',icon:'clock',text:'前兩位是禁忌鐘聲，後兩位是出生的代價。它為別人偷走每一分鐘。'},
 valve:{name:'銅製閥柄',icon:'gear',text:'赫索的工具。先冷水、再熱泉、最後向城市輸送。'},
 apple:{name:'毒蘋果',icon:'apple',text:'它讓呼吸停止，卻讓意識進入魔鏡。月亮、蘋果、鏡子。'},
 needle:{name:'魔法銀針',icon:'key',text:'挑開契約的接縫。真相不是原諒，但真相可以終結謊言。'},
 witness:{name:'見證者手稿',icon:'scroll',text:'白雪才是最後的血脈繼承人。名字一旦消失，生命抵押便失去主人。'},
 blueprint:{name:'工程藍圖',icon:'scroll',text:'地下熱泉 → 蒸汽管線 → 城市暖氣。先建設與遷移，再解除魔法結界。'}
};
export const endings = {
 dawn:{title:'春天沒有記住她',eyebrow:'TRUE ENDING · 無名的黎明',text:'妳先交出工程藍圖，讓蒸汽塔替代魔法結界。最後，妳把名字交給魔鏡。\n\n所有生命抵押終止。伊萊、奈菈與整個世界，都忘了妳。\n\n八年後，妳走進一間茶館。灰眼睛的男人問：「我們以前見過嗎？」\n妳笑著搖頭。這一次，沒有魔法，沒有王冠。只有一杯熱茶。',quote:'「叫我白吧。」'},
 frost:{title:'沒有名字的冬天',eyebrow:'ENDING II · 霜潮',text:'妳立刻將名字交給魔鏡。所有抵押都獲得自由，結界卻也一同消失。\n\n蒸汽塔還未準備好，北方七座城市迎來霜潮。那些妳想救的人，在沒有魔法的雪夜裡等待天亮。\n\n妳活了下來，卻必須用餘生面對這場選擇的代價。',quote:'自由需要準備，善意仍需承擔後果。'},
 crown:{title:'血色王冠',eyebrow:'ENDING III · 永恆的契約',text:'妳保住自己的名字，坐上王座。城市依舊溫暖，生命帳簿卻翻開了新的一頁。\n\n魔鏡稱讚妳是仁慈的女王。妳說，等到下一個春天，妳一定會改變一切。\n\n鏡中的薇菈也曾這樣說。',quote:'「代價永遠存在。只是不一定由妳支付。」'}
};
export function initialState(){return {version:1,started:false,room:0,unlocked:0,solved:[],inventory:[],seen:[],hints:{},elapsed:0,ending:null,endings:[],muted:true};}
export function restoreState(raw){
 try{const s=typeof raw==='string'?JSON.parse(raw):raw;if(!s||s.version!==1)return initialState();
 const validItems=Object.keys(items),validSeen=rooms.flatMap(r=>r.spots.map(s=>s.id));
 const solved=Array.isArray(s.solved)?[...new Set(s.solved.filter(n=>Number.isInteger(n)&&n>=0&&n<5))].sort():[];
 // Progress is a contiguous chain, so invalid or edited saves cannot skip chapters.
 let chain=0;while(solved.includes(chain)&&chain<5)chain++;
 const unlocked=Math.min(chain,4),room=Math.min(Math.max(Number.isInteger(s.room)?s.room:0,0),unlocked);
 return {...initialState(),started:s.started===true,room,unlocked,solved:solved.filter(n=>n<chain),inventory:Array.isArray(s.inventory)?[...new Set(s.inventory.filter(i=>validItems.includes(i)))]:[],seen:Array.isArray(s.seen)?[...new Set(s.seen.filter(i=>validSeen.includes(i)))]:[],hints:Object.fromEntries(rooms.map((_,i)=>[i,Math.min(3,Math.max(0,Number.isInteger(s.hints?.[i])?s.hints[i]:0))])),elapsed:Number.isFinite(s.elapsed)?Math.min(Math.max(s.elapsed,0),604800):0,ending:chain===5&&endings[s.ending]?s.ending:null,endings:Array.isArray(s.endings)?s.endings.filter(e=>endings[e]):[],muted:s.muted!==false};
 }catch{return initialState();}
}
export function inspect(state,id){const spot=rooms[state.room].spots.find(s=>s.id===id);if(!spot)return null;if(!spot.lock&&!state.seen.includes(id))state.seen.push(id);return spot;}
export function collect(state,id){const spot=rooms[state.room].spots.find(s=>s.id===id);if(!spot?.item)return false;if(!state.inventory.includes(spot.item))state.inventory.push(spot.item);return true;}
export function solve(state,answer){const r=rooms[state.room];if(state.solved.includes(state.room))return {ok:true,already:true};if(r.requires&&!state.inventory.includes(r.requires))return {ok:false,reason:'item',item:r.requires};const correct=Array.isArray(r.answer)?JSON.stringify(r.answer)===JSON.stringify(answer):r.answer===answer;if(!correct)return {ok:false,reason:'answer'};state.solved.push(state.room);state.unlocked=Math.min(state.room+1,4);if(state.room===1&&!state.inventory.includes('blueprint'))state.inventory.push('blueprint');return {ok:true};}
export function travel(state,index){if(!Number.isInteger(index)||index<0||index>state.unlocked)return false;state.room=index;return true;}
export function chooseEnding(state,id){if(state.solved.length!==5||!endings[id])return false;if(id==='dawn'&&!state.inventory.includes('blueprint'))return false;state.ending=id;if(!state.endings.includes(id))state.endings.push(id);return true;}
