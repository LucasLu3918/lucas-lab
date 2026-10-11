// Chapter "crypt": content only. Rules live in engine/.
export default {
  id: 'crypt',
  title: '玻璃棺室',
  subtitle: '毒蘋果是一把鑰匙',
  chapter: '第三幕',
  image: 'crypt.webp',
  atmosphere: 'crypt',
  intro: '妳的呼吸停了，意識卻仍在。伊萊的聲音隔著玻璃傳來。薇菈說過，蘋果不是結束，而是通往魔鏡內部的鑰匙。',
  objective: '收取毒蘋果，依咒語排列三個符印，打開鏡界。',
  puzzle: 'sequence',
  answer: [
    'moon',
    'apple',
    'mirror'
  ],
  requires: 'apple',
  reward: '鏡界印記',
  evidence: 'coffin',
  evidenceButton: '聆聽心跳',
  evidenceGate: '三重符印沒有任何反應。咒書說，順序刻在沉睡者的心跳裡——先到玻璃棺旁聽聽看。',
  unlock: '月亮、蘋果、鏡子依次亮起。棺室的倒影忽然轉過頭——那不是妳。',
  spots: [
    {
      id: 'grimoire',
      label: '封印咒書',
      icon: 'book',
      x: 21,
      y: 70,
      text: '「鏡子保存名字，蘋果終止呼吸，月亮見證沉睡。」\n頁尾寫著：三個符印的順序不在書裡，而在沉睡者最後的心跳裡。只有循著那段心跳，活人的意識才不會迷失。',
      clue: true
    },
    {
      id: 'apple',
      label: '血紅蘋果',
      icon: 'apple',
      x: 81,
      y: 69,
      text: '鮮紅果皮下浮著黑色咒文。薇菈說：「這是一把鑰匙。」妳將它帶在身邊。',
      item: 'apple',
      itemName: '毒蘋果'
    },
    {
      id: 'coffin',
      label: '玻璃棺',
      icon: 'gem',
      x: 49,
      y: 62,
      text: '玻璃裡刻著七十二道保護咒。妳聽見伊萊低語：「她還在裡面。」\n棺蓋上的符印隨著某種節奏微微發亮，像一顆仍在跳動的心。',
      restoredText: '妳跟上了棺中的心跳：每一次心跳之後，依序亮起月亮、蘋果、鏡子。\n先見證沉睡，再終止呼吸，最後保存名字。伊萊說：「照這個順序，妳就不會迷失。」王子的吻沒有讓任何咒文改變。',
      clue: true
    },
    {
      id: 'lock3',
      label: '三重符印',
      icon: 'mirror',
      x: 63,
      y: 32,
      text: '三個符印相互交錯。必須按照沉睡者的心跳排列。',
      lock: true
    },
    {
      id: 'reflection',
      label: '轉過頭的倒影',
      icon: 'mirror',
      x: 30,
      y: 38,
      after: 'solved',
      text: '倒影比妳先一步轉過頭。她的嘴唇在動，卻沒有聲音——妳讀出了兩個字：「露西」。\n鏡界的門開了。有人在另一邊等妳。',
      clue: true
    },
    {
      id: 'eli',
      label: '記憶：黑色手套',
      icon: 'gem',
      x: 82,
      y: 20,
      after: 'ending',
      memory: true,
      text: '伊萊第一次來找妳時，脫下了右手的黑手套。整隻手掌布滿魔法灼傷，有些皮膚已經變得透明。\n' +
        '「玻璃心臟裡的法陣，是我設計的。我當時以為，裡面只會存放罪犯自願提供的生命。」\n' +
        '他沒有替自己辯解。妳問他能不能毀掉那些機器。他說：「我可以教妳。」'
    },
    {
      id: 'shard-crypt',
      label: '鏡之碎片',
      icon: 'gem',
      x: 56,
      y: 86,
      shard: true,
      text: '玻璃棺的縫隙裡，一片碎鏡背面刻著六個光點的順序。妳看了一眼，就知道這個順序會一直在夢裡響起。'
    }
  ],
  options: [
    {
      id: 'mirror',
      label: '鏡子',
      symbol: '◇'
    },
    {
      id: 'moon',
      label: '月亮',
      symbol: '☾'
    },
    {
      id: 'apple',
      label: '蘋果',
      symbol: '♧'
    }
  ],
  hints: [
    '先收取毒蘋果，再到玻璃棺旁聆聽符印的心跳。',
    '每次心跳後亮起的符印就是順序；咒書說明了每個符印的作用：先見證，再終止，最後保存。',
    '月亮 → 蘋果 → 鏡子。'
  ]
};
