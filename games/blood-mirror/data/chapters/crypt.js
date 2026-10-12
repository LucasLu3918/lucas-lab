// Chapter "crypt": content only. Rules live in engine/.
export default {
  id: 'crypt',
  title: '玻璃棺室',
  subtitle: '毒蘋果是一把鑰匙',
  chapter: '第五幕',
  image: 'crypt.webp',
  atmosphere: 'crypt',
  intro: '妳的呼吸停了，意識卻仍在。伊萊的聲音隔著玻璃傳來。薇菈說過，蘋果不是結束，而是通往魔鏡內部的鑰匙。',
  objective: '收取毒蘋果，聽出心跳的順序、拓出被鑿掉的符印，再把四枚符印排回棺蓋，打開鏡界。',
  puzzle: 'sequence',
  answer: [
    'moon',
    'apple',
    'mirror',
    'name'
  ],
  // The seal combines both stages: the heartbeat order plus the seal chiselled off the lid (r6).
  seal: { title: '通往鏡界的符印', prompt: '依心跳的順序觸碰符印；被鑿掉的那一枚，也要放回它該在的位置。' },
  requires: 'apple',
  reward: '鏡界印記',
  evidence: 'coffin',
  evidenceButton: '聆聽心跳',
  evidenceGate: '三重符印沒有任何反應。咒書說，順序刻在沉睡者的心跳裡——先到玻璃棺旁聽聽看。',
  unlock: '月亮、蘋果、鏡子依次亮起，最後一枚「名」被妳親手補回棺蓋。棺室的倒影忽然轉過頭——那不是妳。',
  deduction: {
    prompt: '伊萊問：「在妳碰那些符印之前，告訴我——妳看懂這口棺材了嗎？」',
    template: ['玻璃棺上刻著', 0, '保護咒，', 1, '的吻', 2, '任何咒文；蘋果不是結束，而是通往', 3, '的鑰匙。'],
    blanks: [
      { group: 'number', answer: 'seventytwo' },
      { group: 'person', answer: 'prince' },
      { group: 'action', answer: 'unchanged' },
      { group: 'object', answer: 'mirrorrealm' }
    ]
  },
  spots: [
    {
      id: 'grimoire',
      label: '封印咒書',
      icon: 'book',
      x: 21,
      y: 70,
      text: '「鏡子保存名字，蘋果終止呼吸，月亮見證沉睡。」\n頁尾寫著：三個符印的順序不在書裡，而在沉睡者最後的心跳裡。只有循著那段心跳，活人的意識才不會迷失。',
      clues: ['moon', 'breath'],
      clue: true
    },
    {
      id: 'apple',
      label: '血紅蘋果',
      icon: 'apple',
      x: 81,
      y: 69,
      text: '鮮紅果皮下浮著黑色咒文。薇菈說：「這是一把鑰匙，通往魔鏡內部。」妳將它帶在身邊。',
      clues: ['mirrorrealm'],
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
      clues: ['seventytwo'],
      restoredClues: ['unchanged'],
      restoredText: '妳跟上了棺中的心跳：每一次心跳之後，依序亮起月亮、蘋果、鏡子。\n拓在契約背面的刻文少了一枚——被鑿掉的是「名」。伊萊說：「照心跳的順序，再把名字放回去，妳就不會迷失。」王子的吻沒有讓任何咒文改變。',
      clue: true
    },
    {
      id: 'lock3',
      label: '三重符印',
      icon: 'mirror',
      x: 63,
      y: 32,
      text: '棺蓋上的符印相互交錯，其中一格是空的。必須按照沉睡者的心跳排列。',
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
      id: 'voice',
      portrait: 'eli',
      label: '玻璃外的低語',
      icon: 'gem',
      x: 88,
      y: 40,
      text: '玻璃外有人低聲說話，一遍又一遍。聲音是伊萊的。\n「她還在裡面……不要吻她，不要再試了。」\n他的聲音在抖，像是已經試過很多次。',
      clues: ['eli'],
      clue: true
    },
    {
      id: 'kiss',
      portrait: 'orion',
      label: '冷卻的唇印',
      icon: 'gem',
      x: 38,
      y: 50,
      text: '玻璃上留著一個淡淡的唇印，是王子留下的。印子下方，咒文的光仍然安靜地閃著，一個字也沒有動。\n愛情沒有打斷任何東西，也沒有改變任何東西。',
      byChoice: {
        lastDance: {
          prince: '玻璃上留著一個淡淡的唇印，是王子的。他在舞會的最後一支舞裡握過妳的手，所以他來了——來得太晚，也來得太認真。咒文的光安靜地閃著，一個字也沒有動。',
          eli: '玻璃上留著一個淡淡的唇印，是王子的。舞會上他沒能等到妳的回答，只能把剩下的話，吻在冰冷的玻璃上。咒文的光安靜地閃著，一個字也沒有動。'
        }
      },
      clues: ['prince'],
      clue: true
    },
    {
      id: 'veil',
      label: '蒙塵的白紗',
      icon: 'scroll',
      x: 12,
      y: 84,
      text: '一件白紗搭在棺旁的椅背上，裙擺已經積了一層灰。\n沒有人替她收起來，因為沒有人相信她會醒來。',
      clues: ['veil'],
      clue: true
    },
    {
      id: 'candle',
      label: '守夜燭台',
      icon: 'clock',
      x: 90,
      y: 52,
      text: '燭芯被人剪過許多次。有人在玻璃棺旁守了很久，連燭淚都沒有擦。\n燭光照出棺蓋上幾乎看不見的刻痕。',
      item: 'candle',
      itemName: '守夜燭台',
      clues: ['lucy'],
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
    { id: 'mirror', label: '鏡子', symbol: '◇' },
    { id: 'frost', label: '霜', symbol: '❄' },
    { id: 'moon', label: '月亮', symbol: '☾' },
    { id: 'name', label: '名', symbol: '名' },
    { id: 'apple', label: '蘋果', symbol: '♧' },
    { id: 'star', label: '星', symbol: '✶' }
  ],

  // Step-aware hints (提示): three tiers for each stage of the evidence, the deduction and the seal.
  stages: ['rune', 'rubbing'],
  stepHints: {
    rune: [
      '到玻璃棺旁「聆聽心跳」。觀看六次光芒，再照順序觸碰；也可以放慢心跳。',
      '每一次心跳（✦）之後都會亮起一個符印。失敗兩次後，可以查看棺蓋上的刻痕。',
      '順序是：心跳 → 月亮 → 心跳 → 蘋果 → 心跳 → 鏡子。'
    ],
    rubbing: [
      '拓印要用紙：黑鐘書庫暗門後那份王室契約的背面是空白的。把棺蓋八格的污垢全部抹開。',
      '刻文最上方列出保護咒需要的八枚符印，和棺蓋上看得到的七枚逐一比對。',
      '被鑿掉的是「名」。'
    ],
    deduction: [
      '推理的詞來自玻璃棺、咒書、血紅蘋果、玻璃外的低語與唇印。',
      '第一格是保護咒的數量；第二格是吻了玻璃的人；第三格是那個吻對咒文造成的結果；第四格是蘋果通往的地方。',
      '七十二道 → 奧瑞恩王子 → 沒有改變 → 魔鏡內部。'
    ],
    seal: [
      '心跳排出了三枚符印的順序，拓印找出了被鑿掉的那一枚——兩者都要用上。',
      '咒書說「鏡子保存名字」：被鑿掉的那一枚，要緊跟在保存它的符印之後。',
      '月亮 → 蘋果 → 鏡子 → 名。'
    ]
  }
};
