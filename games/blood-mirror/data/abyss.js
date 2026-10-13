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
   thumb:'belfry',
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
   reward:{name:'時辰環',mark:'ㄎ'}
  }
 ]
};
