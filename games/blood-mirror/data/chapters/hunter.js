// Chapter "hunter": content only. Rules live in engine/.
// Added after the first release, so a journey that already passed it may leave it for later (catchUp).
export default {
  id: 'hunter',
  title: '獵人的心臟',
  subtitle: '玻璃裡的孩子',
  chapter: '第三幕',
  image: 'hunter-cabin.webp',
  atmosphere: 'hunter',
  catchUp: true,
  // Views (視角): the cabin, and the black-pine path behind it.
  views: [
    { id: 'cabin', label: '獵人小屋', image: 'hunter-cabin.webp' },
    { id: 'path', label: '黑松林小徑', image: 'black-pine-path.webp' }
  ],
  intro: '黑松林深處有一間獵人的小屋。桌上放著一只玻璃罐，裡面的東西還在微弱地跳動，像是不肯睡去。獵人背對著妳，沒有回頭：「我替她取過心。取不下來的那一顆，我留在這裡。」',
  objective: '點亮玻璃心臟的法陣，弄清楚獵人為什麼沒有交出妳的心。',
  puzzle: 'interrogation',
  // Positional answers: one word per blank of the interrogation below.
  answer: ['queen', 'snowwhite', 'toby', 'hide'],
  requires: null,
  reward: '獵人的證詞',
  evidence: 'heart',
  evidenceButton: '點亮法陣',
  evidenceGate: '魔鏡不聽沒有憑據的說法。獵人的證詞鎖在玻璃心臟裡——先依筆記的規則，把七個符文依序點亮。',
  unlock: '符文熄滅，玻璃罐裡的光安靜下來。獵人轉過身，第一次直視妳：「我沒有殺妳。我只是……選了另一個人的心，騙過了她。」',
  interrogation: {
    prompt: '魔鏡問：「獵人為什麼沒有交出妳的心？那顆在玻璃裡的，又是誰的？」',
    template: ['獵人奉', 0, '的命令，要取走', 1, '的心，卻發現玻璃裡裝的是', 2, '的心；他選擇讓這件事永遠被', 3, '。'],
    blanks: [
      { group: 'person', answer: 'queen' },
      { group: 'person', answer: 'snowwhite' },
      { group: 'person', answer: 'toby' },
      { group: 'action', answer: 'hide' }
    ]
  },
  // The glass heart (選擇): only changes later text, never the route.
  choice: {
    key: 'tobyHeart',
    title: '托比的心臟',
    prompt: '玻璃罐裡的光還在微弱地跳動。獵人把罐子推向妳：「這顆心，該由誰來決定它的去處？」',
    options: [
      { id: 'take', label: '帶走托比的心臟', text: '妳把玻璃罐抱進懷裡。罐子比想像中溫暖，裡面的光像在回應妳的呼吸。獵人沒有阻止，只說：「別讓他再回到那些機器裡。」' },
      { id: 'bury', label: '讓獵人安葬它', text: '妳把罐子交還給獵人。他沒有說話，只在小屋後面挖了一個很小的洞，把罐子埋進去，再蓋上一塊刻著名字的石頭。妳站在雪地裡，沒有回頭。' }
    ]
  },
  spots: [
    {
      id: 'heart',
      label: '玻璃心臟',
      icon: 'gem',
      x: 30,
      y: 52,
      text: '玻璃罐裡浮著一顆晶瑩的器官，血管蜿蜒，在罐壁上投出紅色的影子。罐座刻著七個符文，圍成一圈。\n它不屬於任何人的胸膛——但它還在跳。\n要讀懂它，得先把圍著它的法陣點亮。',
      restoredText: '七個符文依序亮起，玻璃裡浮現一個孩子的影子。他缺了一根手指，緊緊抱著一只木頭玩具。\n他的名字是托比。獵人低聲說：「他是貧民區失蹤的第一個孩子。我答應過他，不讓他們再把他送回去。」',
      clues: ['glassheart'],
      restoredClues: ['toby'],
      clue: true
    },
    {
      id: 'notes',
      label: '獵人的筆記',
      icon: 'scroll',
      x: 56,
      y: 60,
      text: '筆記上寫著：「奉王后之命，取白雪公主之心。」字跡到這一行就斷了，下面是一圈被反覆劃掉的符文。\n頁尾有一行很小的字：「從月開始，每次越過兩個，轉三圈。」',
      clues: ['queen', 'snowwhite'],
      clue: true
    },
    {
      id: 'knife',
      label: '生鏽的獵刀',
      icon: 'key',
      x: 12,
      y: 42,
      text: '獵刀掛在牆上，刀刃有一道新磨過的亮痕，卻沒有一點血跡。\n刀柄纏著舊布條，上面繡著一個歪歪扭扭的字：「安」。',
      item: 'knife',
      itemName: '生鏽的獵刀',
      clues: ['knife'],
      clue: true
    },
    {
      id: 'cabinwindow',
      label: '結霜的窗',
      icon: 'clock',
      x: 76,
      y: 32,
      text: '窗外是一片黑松林。雪地裡有一排新鮮的腳印，從小屋一路延伸到林子深處。\n風一吹，樹梢上的雪落下來，像一場很輕的、無聲的哭泣。',
      clues: ['blackpine'],
      clue: true
    },
    {
      id: 'fire',
      portrait: 'hunter',
      label: '壁爐的灰燼',
      icon: 'gear',
      x: 86,
      y: 62,
      text: '壁爐裡還留著沒燒完的紙。燒焦的邊緣露出幾個字：「……證物……銷毀……」\n有人把一切證據都燒掉了。獵人說：「這是我唯一能替他做的事——讓這件事被永遠隱瞞下去。」',
      clues: ['hide'],
      clue: true
    },
    {
      id: 'toy',
      label: '孩子的木頭玩具',
      icon: 'gem',
      x: 14,
      y: 76,
      text: '一只小小的木頭玩具，被磨得發亮。底部刻著一個很小的名字，被磨得看不清。\n妳不確定是誰刻的，只知道刻字的人很用力，像怕自己忘記。',
      item: 'toy',
      itemName: '托比的木頭玩具',
      clues: ['child'],
      clue: true
    },
    {
      id: 'antlers',
      portrait: 'hunter',
      label: '鹿角與頭骨',
      icon: 'gem',
      x: 22,
      y: 30,
      text: '鹿的頭骨掛在牆上，眼眶空著，卻讓人覺得它一直在看著門口。\n獵人說：「它是我第一次沒有射出的那一箭。」'
    },
    {
      id: 'lockh',
      label: '法陣之鎖',
      icon: 'lock',
      x: 52,
      y: 72,
      text: '魔鏡在玻璃罐的倒影裡浮現，等待妳說出事情的真相。',
      lock: true
    },
    {
      id: 'footprints',
      label: '雪地上的腳印',
      icon: 'gem',
      view: 'path',
      x: 50,
      y: 76,
      text: '雪地裡有一串新鮮的腳印，從小屋一路延伸到林子深處。大小是成年人的，步距卻很短——像是抱著什麼很重的東西，不敢走快。'
    },
    {
      id: 'redcloth',
      label: '勾在樹旁的紅布',
      icon: 'scroll',
      view: 'path',
      x: 30,
      y: 74,
      text: '一小塊撕破的紅布，勾在樹旁的陷阱邊。布料是王室衛兵斗篷的質地。\n有人追過來，卻沒有追到最後。'
    },
    {
      id: 'path',
      label: '通往黑松林的小徑',
      icon: 'gem',
      view: 'path',
      x: 50,
      y: 50,
      after: 'solved',
      text: '小屋的後門敞開了。雪地裡有一排新的腳印，通往黑松林深處，盡頭有一點微弱的紅光。\n獵人說：「那是我埋下的第一個東西。去看看吧，妳會明白為什麼妳還活著。」'
    },
    {
      id: 'hunter-memory',
      portrait: 'hunter',
      label: '記憶：獵人的手',
      icon: 'gem',
      x: 90,
      y: 40,
      after: 'ending',
      memory: true,
      text: '獵人的手上有很多舊疤。妳問他怎麼來的，他說是第一次違抗王后命令的那天，用刀劃的。\n「我必須讓自己記得，」他說，「那天我選擇了不聽命令。」'
    },
    {
      id: 'shard-hunter',
      label: '鏡之碎片',
      icon: 'gem',
      x: 8,
      y: 58,
      shard: true,
      text: '玻璃罐的底座邊，一片碎鏡映出妳的臉，眼睛的位置換成了另一個孩子的眼睛。妳把它收進口袋，聽見自己的心跳慢了一拍。'
    }
  ],
  // Step-aware hints (提示): three tiers for each stage of the evidence, the deduction and the seal.
  stages: ['runeheart'],
  stepHints: {
    runeheart: [
      '獵人筆記的頁尾寫著法陣的規則，先讀筆記。屋後的黑松林小徑可以用左右箭頭切換視角。',
      '從「月」開始，每次越過兩個符文，點亮第三個；繞過最後一個時，接回開頭繼續數。',
      '順序是：月 → 鏡 → 門 → 針 → 血 → 鐘 → 霜。'
    ],
    seal: [
      '審問共四格：誰下的命令、要取誰的心、玻璃裡是誰的心、這件事被怎樣處理。',
      '獵人筆記寫著命令的來源；玻璃心臟修復後，裡面男孩的名字才會出現；獵人做的事，是把真相藏起來。',
      '在審問頁按「魔鏡替妳填一格」，它會填入一個正確的詞。每次只解一格。'
    ]
  }
};
