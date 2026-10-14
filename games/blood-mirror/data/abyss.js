// "帳本的背面" (鏡淵): optional expert levels, kept apart from the seven acts in chapters/. They are not part of the
// journey chain, so they never move an act's index, the truth count or the endings. A level is done when its puzzle
// is in the save's puzzles list (engine/save.js). Lines follow the dialogue draft (plan-improve/expert-dialogue-draft.md);
// scripts/blood-mirror-abyss.test.mjs keeps the two in step. `speaker` is a key of the speakers table in chapters/index.js.
export const abyss={
 title:'帳本的背面',
 eyebrow:'THE LEDGER\'S REVERSE · 帳本的背面',
 // The home page shows the way in once the player has seen any ending; a finished level keeps it open (main.js).
 entry:[
  {text:'七片鏡之碎片在妳掌心排成一圈，像一本合上的帳冊。'},
  {text:'鏡面早已不在，但帳冊還記得它的聲音。'},
  {speaker:'mirror',text:'「妳看過我的正面。這一面，是我記帳時不給人看的。」'},
  {speaker:'mirror',text:'「每一筆抵押，我都留了底稿。今晚，妳可以一頁一頁翻。」'}
 ],
 levels:[
  {
   id:'e1',
   puzzle:'belfry',
   number:'E1',
   title:'逆走鐘樓',
   subtitle:'第十三座鐘塔',
   // The mechanisms of the puzzle in play order (puzzles/index.js); the save records each finished one as "<puzzle>.<stage>".
   stages:['belfry-gears','belfry-pendulum','belfry-wheel'],
   thumb:'belfry-gears',
   scene:[
    {text:'書庫的暗門後，有一段沒有出現在任何地圖上的樓梯。'},
    {text:'學院有十二座鐘塔，妳數過。樓梯卻通向第十三座。'},
    {speaker:'mirror',text:'「第十三聲不是鐘響。是帳本替妳記下的一筆。」'},
    {text:'齒輪軸上坐著一隻灰兔。右耳的針腳很細，像有人每天夜裡都來縫。'},
    {speaker:'mirror',text:'「想讓它再響一次，先讓這些齒輪說同一種語言。」'}
   ],
   unlock:[
    {text:'曲柄轉了十三圈，輸出軸剛好轉了一圈。第十三格的暗格彈開，裡面躺著一枚時辰環。'},
    {text:'環的內側刻著一個小記號：ㄎ。很久以前有人教過妳，這記號只有兩個人看得懂。'}
   ],
   enter:'走進鐘塔',
   reward:{name:'時辰環',mark:'ㄎ'}
  },
  {
   id:'e2',
   puzzle:'prism',
   number:'E2',
   title:'稜鏡舞廳',
   subtitle:'停住的冬至舞會',
   stages:['prism-rays','prism-blend','prism-ballroom'],
   thumb:'prism-rays',
   scene:[
    {text:'冬至舞會停在最華麗的那一刻。賓客凍成雕像，面具下的眼窩嵌著寶石。'},
    {speaker:'mirror',text:'「吊燈裡有一百零八隻火精靈，一直替這場舞會燒著。」'},
    {speaker:'mirror',text:'「它們的火只有三種顏色。讓每張面具，看見它該看見的那一種。」'}
   ],
   unlock:[
    {text:'三張面具同時亮起。吊燈裡傳來一陣尖叫。'},
    {text:'那些火精靈一直都在叫，只是從來沒有人聽得見。一枚稜鏡落進妳的手心，還帶著熱度。'}
   ],
   enter:'走進舞廳',
   reward:{name:'稜鏡',mark:'ㄒ'}
  },
  {
   id:'e3',
   puzzle:'apothecary',
   number:'E3',
   title:'毒蘋果調配室',
   subtitle:'王后還是醫師的時候',
   stages:['apothecary-testimony','apothecary-vessels','apothecary-mixing'],
   thumb:'apothecary-testimony',
   scene:[
    {text:'薇菈在成為王后之前，是這座王宮的醫師。這間藥房還留著她的字跡。'},
    {text:'帳冊裡寫著七名學徒：白芷、遠志、決明、茯苓、紫蘇、杜仲、甘松。'},
    {speaker:'mirror',text:'「他們每人替王后調過一顆蘋果。只有一顆，會把人的意識送進鏡子。」'},
    {speaker:'mirror',text:'「七個人都留了證詞。拿著那顆蘋果的人，說的是帳本要他說的話。」'}
   ],
   // Shown right after one mechanism is solved, before the next one opens (puzzles/index.js startPuzzle).
   stageLines:{
    'apothecary-testimony':[
     {text:'甘松的證詞只有一句，字跡卻不是他的。那是帳冊替他寫下的話。'},
     {speaker:'mirror',text:'「他不是說謊的人。他是被寫成說謊的人。」'}
    ],
    'apothecary-vessels':[
     {text:'蘋果汁在 B 杯停在剛好四格。杯壁映出的人影，比妳的動作慢了一拍。'}
    ]
   },
   unlock:[
    {text:'藥液的顏色和手持鏡裡的一模一樣。妳取得回魂藥——毒蘋果的反面，能讓意識從鏡中回到身體。'}
   ],
   enter:'走進藥房',
   reward:{name:'回魂藥',mark:'ㄋ',place:'瓶底'}
  }
 ]
};
