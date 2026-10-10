export const SAVE_KEY = 'blood-mirror-v1';
export const rooms = [
  {id:'library',title:'黑鐘書庫',subtitle:'第十三聲鐘響',chapter:'第一幕',image:'chamber.webp',atmosphere:'library',intro:'午夜，黑鐘學院敲響了第十三聲。妳在禁書庫醒來。門外有人拖動鎖鏈，而桌上的懷錶……正在倒著走。',objective:'找到禁書櫃的四位密碼，取回王室生命契約。',puzzle:'code',answer:'1373',requires:'watch',reward:'王室契約',evidence:'birth',evidenceButton:'拼回帳頁',evidenceGate:'刻度旁有一行細小的刻字：「後兩位，寫在出生的帳上。」\n出生紀錄被撕碎了。先把它拼回原狀，才能讀到缺少的數字。',unlock:'四個刻度同時歸位，禁書櫃後方的暗門緩緩打開。冷風從石縫裡吹出，帶著封蠟與鐵鏽的氣味。',spots:[
    {id:'bells',label:'鐘塔手札',icon:'book',x:22,y:56,text:'「學院只有十二座鐘塔，每晚最多敲響十二聲。多出來的每一聲，都代表一道禁忌魔法被啟動。」\n妳想起醒來時聽見的鐘聲。今夜，它多敲了一下。',clue:true},
    {id:'watch',label:'黃金懷錶',icon:'clock',x:38,y:74,text:'錶蓋內刻著兩句話：「前兩位是那不應存在的鐘聲。後兩位，是公主誕生時抵押的生命。」',item:'watch',itemName:'黃金懷錶',clue:true},
    {id:'birth',label:'出生紀錄',icon:'scroll',x:67,y:48,text:'帳頁被撕成九片，散落在桌上。墨跡在裂縫處斷開：「確保公主出生：抵押……名兒童的……生命。」\n缺少的數字，就在這些碎片之間。',restoredText:'帳頁拼回原狀：「確保公主出生：抵押七十三名兒童的完整生命。」\n簽名欄被一道新的墨漬蓋住，只剩下王室的蠟印。七十三個人，換來妳的第一聲啼哭。',clue:true},
    {id:'lock1',label:'禁書櫃封印',icon:'lock',x:83,y:63,text:'四個刻度。封印只接受四位數字。',lock:true},
    {id:'contract',label:'暗門後的契約',icon:'scroll',x:82,y:30,after:'solved',text:'暗門後的石台上，壓著一份以血蠟封緘的王室契約：「以王室血脈為擔保，換取霜棘王國百年的溫暖。」\n落款的筆跡妳再熟悉不過——那是妳父親的簽名。原來，魔法從來不是免費的。',item:'contract',itemName:'王室契約',clue:true},
    {id:'toby',label:'記憶：玻璃心臟',icon:'gem',x:60,y:80,after:'ending',memory:true,text:'妳想起那顆被妳偷走的玻璃心臟。裡面的男孩缺了一根手指，和貧民區失蹤的孩子一模一樣。\n妳問他叫什麼名字。他說：「托比。」\n他沒有說媽媽在哪裡，只是一直重複：「不要讓他們帶走妹妹。」'}],hints:['懷錶規定了密碼的順序。鐘塔手札和醒來時的鐘聲，能告訴妳前兩位。','出生紀錄被撕碎了。打開它並拼回帳頁，就能讀到後兩位。','第十三聲 + 七十三名兒童：1373。']},
  {id:'mine',title:'銀骨礦坑',subtitle:'七個被遺忘的人',chapter:'第二幕',image:'mine.webp',atmosphere:'mine',intro:'奈菈帶妳穿過銀骨礦坑。玻璃容器裡，有人不停呼喚母親。赫索指著停擺的管線：「不靠魔法，也能讓城市暖起來。」',objective:'裝上閥柄，依工程手札啟動三段蒸汽管線。',puzzle:'sequence',answer:['water','heat','city'],requires:'valve',reward:'工程藍圖',evidence:'pipes',evidenceButton:'接回管網',evidenceGate:'控制盤上的三個壓力錶全指著零。蒸汽管網還沒接好，現在開閥只會讓蒸汽從接縫外洩。',unlock:'熱泉湧進銅管。妳第一次看見，一種不需要生命抵押的溫暖。赫索將工程藍圖交給妳。',spots:[
    {id:'minebook',label:'生命帳簿',icon:'book',x:23,y:68,text:'奈菈、魯恩、赫索、莫格、奇妲、斐恩、提米。\n他們曾經有普通人的身高。銀骨礦石奪走了健康，王國又奪走了他們的名字。',clue:true},
    {id:'valve',label:'銅製閥柄',icon:'gear',x:78,y:65,text:'赫索留下的閥柄。沉甸甸的金屬依然溫暖，可以裝回控制盤。',item:'valve',itemName:'銅製閥柄'},
    {id:'pipeNote',label:'工程手札',icon:'scroll',x:49,y:43,text:'「先讓冷水進入管線；再引入地下熱泉；最後向城市輸送。」\n沒有水就加熱，銅管會破裂。出口必須最後開啟。',clue:true},
    {id:'pipes',label:'斷裂的蒸汽管',icon:'gear',x:56,y:74,text:'控制盤後方的銅管全都錯開了，蒸汽從接縫裡嘶嘶外洩。\n不先把管網接回去，開哪一道閥門都沒有用。',restoredText:'五段銅管重新咬合，蒸汽沿著管網一路送到城市出口。\n控制盤上的三個壓力錶同時跳動——現在，可以依工程手札的順序開閥了。',clue:true},
    {id:'lock2',label:'蒸汽控制盤',icon:'gear',x:86,y:41,text:'三道閥門，等待正確的開啟順序。',lock:true},
    {id:'miners',label:'甦醒的礦工',icon:'gem',x:28,y:34,after:'solved',text:'暖氣沿著管線湧進礦坑，玻璃容器裡的呼喊第一次停了下來。\n奈菈一個一個念出同伴的名字：魯恩、赫索、莫格、奇妲、斐恩、提米。\n赫索拍了拍妳手裡的藍圖：「記住，先把塔蓋好，再拆掉結界。順序錯了，死的會是整座城。」',clue:true},
    {id:'nyla',label:'記憶：雪地裡的毯子',icon:'gem',x:68,y:27,after:'ending',memory:true,text:'奈菈第一次看見妳手臂上的王室印記時，叫妳出去。\n「我妹妹十二歲被帶走。他們說她有魔法天賦。一年後，送回來的只有骨灰，連名字都沒有。」\n那晚妳睡在屋外的雪地。半夜，一條毯子從窗戶丟了出來：「別死在門口。我們明天還要掃雪。」'}],options:[{id:'city',label:'城市出口',symbol:'♜'},{id:'heat',label:'地下熱泉',symbol:'☀'},{id:'water',label:'冷水入口',symbol:'≈'}],hints:['先收取閥柄，再檢查斷裂的蒸汽管，把管網接回去。','管網接通後，照工程手札開閥：水先進管，加熱居中，出口最後。','依序點選：冷水入口 → 地下熱泉 → 城市出口。']},
  {id:'crypt',title:'玻璃棺室',subtitle:'毒蘋果是一把鑰匙',chapter:'第三幕',image:'crypt.webp',atmosphere:'crypt',intro:'妳的呼吸停了，意識卻仍在。伊萊的聲音隔著玻璃傳來。薇菈說過，蘋果不是結束，而是通往魔鏡內部的鑰匙。',objective:'收取毒蘋果，依咒語排列三個符印，打開鏡界。',puzzle:'sequence',answer:['moon','apple','mirror'],requires:'apple',reward:'鏡界印記',evidence:'coffin',evidenceButton:'聆聽心跳',evidenceGate:'三重符印沒有任何反應。咒書說，順序刻在沉睡者的心跳裡——先到玻璃棺旁聽聽看。',unlock:'月亮、蘋果、鏡子依次亮起。棺室的倒影忽然轉過頭——那不是妳。',spots:[
    {id:'grimoire',label:'封印咒書',icon:'book',x:21,y:70,text:'「鏡子保存名字，蘋果終止呼吸，月亮見證沉睡。」\n頁尾寫著：三個符印的順序不在書裡，而在沉睡者最後的心跳裡。只有循著那段心跳，活人的意識才不會迷失。',clue:true},
    {id:'apple',label:'血紅蘋果',icon:'apple',x:81,y:69,text:'鮮紅果皮下浮著黑色咒文。薇菈說：「這是一把鑰匙。」妳將它帶在身邊。',item:'apple',itemName:'毒蘋果'},
    {id:'coffin',label:'玻璃棺',icon:'gem',x:49,y:62,text:'玻璃裡刻著七十二道保護咒。妳聽見伊萊低語：「她還在裡面。」\n棺蓋上的符印隨著某種節奏微微發亮，像一顆仍在跳動的心。',restoredText:'妳跟上了棺中的心跳：每一次心跳之後，依序亮起月亮、蘋果、鏡子。\n先見證沉睡，再終止呼吸，最後保存名字。伊萊說：「照這個順序，妳就不會迷失。」王子的吻沒有讓任何咒文改變。',clue:true},
    {id:'lock3',label:'三重符印',icon:'mirror',x:63,y:32,text:'三個符印相互交錯。必須按照沉睡者的心跳排列。',lock:true},
    {id:'reflection',label:'轉過頭的倒影',icon:'mirror',x:30,y:38,after:'solved',text:'倒影比妳先一步轉過頭。她的嘴唇在動，卻沒有聲音——妳讀出了兩個字：「露西」。\n鏡界的門開了。有人在另一邊等妳。',clue:true},
    {id:'eli',label:'記憶：黑色手套',icon:'gem',x:82,y:20,after:'ending',memory:true,text:'伊萊第一次來找妳時，脫下了右手的黑手套。整隻手掌布滿魔法灼傷，有些皮膚已經變得透明。\n「玻璃心臟裡的法陣，是我設計的。我當時以為，裡面只會存放罪犯自願提供的生命。」\n他沒有替自己辯解。妳問他能不能毀掉那些機器。他說：「我可以教妳。」'}],options:[{id:'mirror',label:'鏡子',symbol:'◇'},{id:'moon',label:'月亮',symbol:'☾'},{id:'apple',label:'蘋果',symbol:'♧'}],hints:['先收取毒蘋果，再到玻璃棺旁聆聽符印的心跳。','每次心跳後亮起的符印就是順序；咒書說明了每個符印的作用：先見證，再終止，最後保存。','月亮 → 蘋果 → 鏡子。']},
  {id:'queen',title:'王后寢宮',subtitle:'她最後的謊言',chapter:'第四幕',image:'queen.webp',atmosphere:'queen',intro:'鏡子讓妳看見年輕的薇菈。她為了救愛人嫁給國王，卻成為契約的囚徒。床頭那隻灰兔，右耳被一針一線縫好了。',objective:'取得銀針，用妳自己的意志回答王后留下的三個問題。',puzzle:'questions',free:true,answer:['no','third','yes'],requires:'needle',reward:'第八份證詞',evidence:'letter',evidenceButton:'翻開記憶卡',evidenceGate:'王后的三問，答案沒有對錯；但信上記著白雪當年怎麼回答。信已經被淚水暈開——先拼湊王后遺落的記憶，讓字跡重新浮現。',unlock:'妳用銀針挑開契約的接縫。鏡中浮現母親伊蓮的最後記憶：她不是死於生產。',unlockEcho:['妳的三個回答，和當年的她一模一樣。','妳的回答和當年的白雪不同。薇菈沒有阻止，只是把它們一字一字記了下來。'],spots:[
    {id:'rabbit',label:'灰色兔子',icon:'gem',x:23,y:65,text:'兔子的右耳總是會掉。每次醒來，耳朵卻又被縫好。\n原來替妳修補它的人，一直是薇菈。',clue:true},
    {id:'needle',label:'魔法銀針',icon:'key',x:40,y:74,text:'銀針藏在王后的縫線盒裡。鏡中的回憶顯示，國王曾用另一支銀針刺向伊蓮。證詞可以刺破謊言。',item:'needle',itemName:'魔法銀針',clue:true},
    {id:'letter',label:'王后的信',icon:'scroll',x:69,y:47,text:'信紙被淚水暈開，只剩幾個字還看得清：「我不想……」「……第三種……」「即使……」\n角落有薇菈的補註：「她的回答，藏在我們共同的記憶裡。」',restoredText:'記憶拼回之後，信上的字重新浮現。白雪曾經這樣回答王后：\n「我不想成為女王。」\n「我會尋找第三種方法。」\n「即使世界不知道，我仍願意。」\n薇菈的補註：這是她當年的回答。如今，請用妳自己的意志回答。',clue:true},
    {id:'lock4',label:'王后的三問',icon:'mirror',x:84,y:61,text:'魔鏡重複著王后的三個問題。沒有標準答案；妳怎麼回答，薇菈就會留下怎樣的證詞。',lock:true},
    {id:'elaine',label:'母親的最後記憶',icon:'gem',x:42,y:28,after:'solved',text:'鏡中的伊蓮抱著剛出生的妳，對著鏡子輕聲說：「如果有一天她讀到這裡，告訴她——名字不是王冠給的。」\n國王手裡的銀針，在燭光下閃了一下。',clue:true},
    {id:'vera',label:'記憶：雪為什麼是白的',icon:'gem',x:62,y:80,after:'ending',memory:true,text:'二十一歲的薇菈還不是王后，只是黑鐘學院的窮學生。她愛上一位醫師，兩人計畫畢業後開一間診所。\n霜潮讓他全身結冰。沒有魔法師願意免費救他。魔鏡說：「嫁給國王，妳就能動用王室生命庫。」她答應了。等她成為王后，他已經死了。\n妳小時候總問她，雪為什麼是白的。她說，因為天空把所有顏色都藏起來了。'}],questions:[{text:'妳想成為女王嗎？',options:[{id:'yes',label:'我想繼承王冠',response:'薇菈笑了一下，笑容裡沒有一點高興：「我當年也這麼想。王冠會讓妳以為，自己終於能救所有人。」'},{id:'no',label:'我不想成為女王',response:'「很好。」薇菈說，「不想要王冠的人，才有資格碰它。」'}]},{text:'殺死一個孩子，能救一千個人。妳會怎麼做？',options:[{id:'sacrifice',label:'犧牲那個孩子',response:'薇菈閉上眼睛：「國王也是這樣算的。七十三個孩子，換一座城的冬天。他從來沒有算錯，只是付錢的從來不是他。」'},{id:'third',label:'尋找第三種方法',response:'「第三種方法，」薇菈重複了一次，「我找了二十年，沒有找到。也許妳會。」'}]},{text:'如果世界永遠不知道是妳救了它，妳還願意嗎？',options:[{id:'yes',label:'我仍然願意',response:'薇菈伸手，像很多年前一樣替妳整理頭髮：「那妳已經比我勇敢了。」'},{id:'no',label:'我需要被記住',response:'「想被記住不是罪。」薇菈輕聲說，「我也想。所以我在鏡子裡，留下了這麼多證詞。」'}]}],hints:['先收取銀針，再打開王后的信，翻開記憶卡讓字跡浮現。','王后的三問沒有標準答案。信上記著白雪當年的回答；妳可以照著回答，也可以說出自己的想法。','任何回答都能讓魔鏡交出證詞。不同的回答，會聽到薇菈不同的回應，也會留在結局的回顧裡。']},
  {id:'mirror',title:'鏡中之國',subtitle:'一個名字的代價',chapter:'第五幕',image:'mirror.webp',atmosphere:'mirror',intro:'七十三個孩子站在鏡子的另一端。露西握住妳的手。魔鏡提出最後一筆交易：「我可以讓妳活過來。代價，是妳的名字。」',objective:'揭露王冠契約的繼承者，然後決定妳的代價。',puzzle:'name',answer:'snow',requires:null,reward:'契約真相',evidence:'witness',evidenceButton:'映照手稿',evidenceGate:'魔鏡的問題需要證據。見證者手稿的字全是反寫的——先在鏡面上把它映照回來。',unlock:'名字不是字母，是所有人對妳的記憶。王族的名字仍被承認，生命抵押就會繼續。妳終於握住契約的終點。',spots:[
    {id:'lucy',label:'露西的倒影',icon:'gem',x:30,y:47,text:'「妳又沒有殺我們。妳不是來幫我們的嗎？」\n露西曾經有名字，有母親，也有一個等不到的春天。',clue:true},
    {id:'witness',label:'見證者手稿',icon:'scroll',x:21,y:74,text:'手稿上的字全是反寫的，像是寫給鏡子讀的。妳只認得出幾個詞：「第一位國王」「抵押」「最終繼承人」。\n要讀懂它，得讓鏡子替妳翻過來。',restoredText:'第一位國王將臣民的生命抵押給王冠。\n最終繼承人是失蹤的公主——不是王后，也不是奧瑞恩。唯有她的名字被世界遺忘，抵押才會失去繼承人。',item:'witness',itemName:'見證者手稿',clue:true},
    {id:'heatplan',label:'遠方的蒸汽塔',icon:'gear',x:79,y:47,text:'赫索的工程能取代魔法結界，但必須先準備熱能與遷移。立即毀掉結界，會讓北方七座城市暴露在霜潮之中。',clue:true},
    {id:'lock5',label:'最後一面鏡子',icon:'mirror',x:52,y:37,text:'「告訴我，誰是生命契約最後的血脈繼承人？」',lock:true},
    {id:'lucy-mother',label:'記憶：露西的問題',icon:'gem',x:66,y:74,after:'ending',memory:true,text:'露西八歲，是最後一個被抽取生命的孩子。被帶走那晚，她還一直問母親什麼時候來接她。\n在鏡子裡，她沒有生氣，只問了妳一件事：「我媽媽後來怎麼樣了？」\n那時妳答不出來。現在，妳知道答案必須由活下來的人去找。'}],options:[{id:'queen',label:'薇菈王后'},{id:'prince',label:'奧瑞恩王子'},{id:'snow',label:'白雪公主'}],hints:['見證者手稿是反寫的。打開它，讓鏡面把字映照回來。','手稿記載了契約真正的繼承人：契約看的是王室血脈，而非誰坐在王座上。','選擇「白雪公主」。']}
];
export const items = {
 watch:{name:'黃金懷錶',icon:'clock',text:'前兩位是禁忌鐘聲，後兩位是出生的代價。它為別人偷走每一分鐘。'},
 valve:{name:'銅製閥柄',icon:'gear',text:'赫索的工具。先冷水、再熱泉、最後向城市輸送。'},
 apple:{name:'毒蘋果',icon:'apple',text:'它讓呼吸停止，卻讓意識進入魔鏡。月亮、蘋果、鏡子。'},
 needle:{name:'魔法銀針',icon:'key',text:'挑開契約的接縫。真相不是原諒，但真相可以終結謊言。'},
 witness:{name:'見證者手稿',icon:'scroll',text:'白雪才是最後的血脈繼承人。名字一旦消失，生命抵押便失去主人。'},
 contract:{name:'王室契約',icon:'scroll',text:'以王室血脈擔保的生命契約。落款是妳父親的簽名——這筆帳，從妳出生那天就開始記。'},
 blueprint:{name:'工程藍圖',icon:'scroll',text:'地下熱泉 → 蒸汽管線 → 城市暖氣。先建設與遷移，再解除魔法結界。'}
};
export const endings = {
 dawn:{title:'春天沒有記住她',eyebrow:'TRUE ENDING · 無名的黎明',text:'妳先交出工程藍圖，讓蒸汽塔替代魔法結界。最後，妳把名字交給魔鏡。\n\n所有生命抵押終止。伊萊、奈菈與整個世界，都忘了妳。\n\n八年後，妳走進一間茶館。灰眼睛的男人問：「我們以前見過嗎？」\n妳笑著搖頭。這一次，沒有魔法，沒有王冠。只有一杯熱茶。',quote:'「叫我白吧。」'},
 frost:{title:'沒有名字的冬天',eyebrow:'ENDING II · 霜潮',text:'妳立刻將名字交給魔鏡。所有抵押都獲得自由，結界卻也一同消失。\n\n蒸汽塔還未準備好，北方七座城市迎來霜潮。那些妳想救的人，在沒有魔法的雪夜裡等待天亮。\n\n妳活了下來，卻必須用餘生面對這場選擇的代價。',quote:'自由需要準備，善意仍需承擔後果。'},
 crown:{title:'血色王冠',eyebrow:'ENDING III · 永恆的契約',text:'妳保住自己的名字，坐上王座。城市依舊溫暖，生命帳簿卻翻開了新的一頁。\n\n魔鏡稱讚妳是仁慈的女王。妳說，等到下一個春天，妳一定會改變一切。\n\n鏡中的薇菈也曾這樣說。',quote:'「代價永遠存在。只是不一定由妳支付。」'}
};
export function initialState(){return {version:1,started:false,room:0,unlocked:0,solved:[],inventory:[],seen:[],hints:{},elapsed:0,ending:null,endings:[],memories:[],answers:null,muted:true};}
export function restoreState(raw){
 try{const s=typeof raw==='string'?JSON.parse(raw):raw;if(!s||s.version!==1)return initialState();
 const validItems=Object.keys(items),validSeen=rooms.flatMap(r=>r.spots.map(s=>s.id));
 const solved=Array.isArray(s.solved)?[...new Set(s.solved.filter(n=>Number.isInteger(n)&&n>=0&&n<5))].sort():[];
 // Progress is a contiguous chain, so invalid or edited saves cannot skip chapters.
 let chain=0;while(solved.includes(chain)&&chain<5)chain++;
 const unlocked=Math.min(chain,4),room=Math.min(Math.max(Number.isInteger(s.room)?s.room:0,0),unlocked);
 return {...initialState(),started:s.started===true,room,unlocked,solved:solved.filter(n=>n<chain),inventory:Array.isArray(s.inventory)?[...new Set(s.inventory.filter(i=>validItems.includes(i)))]:[],seen:Array.isArray(s.seen)?[...new Set(s.seen.filter(i=>validSeen.includes(i)))]:[],hints:Object.fromEntries(rooms.map((_,i)=>[i,Math.min(3,Math.max(0,Number.isInteger(s.hints?.[i])?s.hints[i]:0))])),elapsed:Number.isFinite(s.elapsed)?Math.min(Math.max(s.elapsed,0),604800):0,ending:chain===5&&endings[s.ending]?s.ending:null,endings:Array.isArray(s.endings)?s.endings.filter(e=>endings[e]):[],answers:chain>3&&validAnswers(s.answers)?[...s.answers]:null,memories:Array.isArray(s.memories)?[...new Set(s.memories.filter(id=>memorySpots.some(spot=>spot.id===id)))]:[],muted:s.muted!==false};
 }catch{return initialState();}
}
// Spots marked after:'solved' appear once their chapter's seal is open; after:'ending'
// memories appear in every act once any ending has been reached, and stay collected.
export const memorySpots=rooms.flatMap((room,index)=>room.spots.filter(spot=>spot.memory).map(spot=>({...spot,room:index})));
export function visibleSpots(state,index=state.room){return rooms[index].spots.filter(spot=>spot.after==='solved'?state.solved.includes(index):spot.after==='ending'?(state.endings?.length??0)>0:true);}
export function inspect(state,id){const spot=visibleSpots(state).find(s=>s.id===id);if(!spot)return null;if(!spot.lock&&!state.seen.includes(id))state.seen.push(id);if(spot.memory){state.memories=state.memories||[];if(!state.memories.includes(id))state.memories.push(id);}return spot;}
export function collect(state,id){const spot=visibleSpots(state).find(s=>s.id===id);if(!spot?.item)return false;if(!state.inventory.includes(spot.item))state.inventory.push(spot.item);return true;}
export function solve(state,answer){const r=rooms[state.room];if(state.solved.includes(state.room))return {ok:true,already:true};if(r.requires&&!state.inventory.includes(r.requires))return {ok:false,reason:'item',item:r.requires};const correct=r.free?validAnswers(answer):Array.isArray(r.answer)?JSON.stringify(r.answer)===JSON.stringify(answer):r.answer===answer;if(!correct)return {ok:false,reason:'answer'};if(r.free)state.answers=[...answer];state.solved.push(state.room);state.unlocked=Math.min(state.room+1,4);if(state.room===1&&!state.inventory.includes('blueprint'))state.inventory.push('blueprint');return {ok:true};}
export function travel(state,index){if(!Number.isInteger(index)||index<0||index>state.unlocked)return false;state.room=index;return true;}
export function chooseEnding(state,id){if(state.solved.length!==5||!endings[id])return false;if(id==='dawn'&&!state.inventory.includes('blueprint'))return false;state.ending=id;if(!state.endings.includes(id))state.endings.push(id);return true;}
// The queen's questions have no wrong answer: any one option per question is a valid reply.
export function validAnswers(answer){const q=rooms.find(r=>r.free)?.questions;return Array.isArray(answer)&&!!q&&answer.length===q.length&&answer.every((a,i)=>q[i].options.some(o=>o.id===a));}
export function queenResponse(index,id){return rooms.find(r=>r.free)?.questions[index]?.options.find(o=>o.id===id)?.response||'';}
export function queenResponses(answers){const q=rooms.find(r=>r.free).questions;return validAnswers(answers)?answers.map((a,i)=>q[i].options.find(o=>o.id===a).response):[];}
export function unlockText(state,index=state.room){const r=rooms[index];if(!r.unlockEcho||!validAnswers(state.answers))return r.unlock;return r.unlockEcho[JSON.stringify(state.answers)===JSON.stringify(r.answer)?0:1]+'\n'+r.unlock;}
