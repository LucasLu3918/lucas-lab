// Chapter "ballroom": content only. Rules live in engine/.
// Added after the first release, so a journey that already passed it may leave it for later (catchUp).
export default {
  id: 'ballroom',
  title: '血色舞會',
  subtitle: '面具下的謊言',
  chapter: '第二幕',
  image: 'ballroom.webp',
  atmosphere: 'ballroom',
  catchUp: true,
  // Views (視角): the first one is the arrival view. A spot belongs to the view named in `view` (default: the first).
  views: [
    { id: 'ballroom', label: '舞廳', image: 'ballroom.webp' },
    { id: 'hall', label: '鏡廳', image: 'mirror-hall.webp' },
    { id: 'balcony', label: '陽台', image: 'balcony.webp' }
  ],
  intro: '黑鐘學院的舞會在暴雪夜舉行。賓客全戴著面具，凝結成舞姿，像一排排蠟像；只有鏡子裡的倒影還在旋轉。伊萊在人群邊緣向妳點頭，指了指舞廳深處那面最大的鏡子。',
  // Opening scene (對話場景): one line per click in the dialogue box. `speaker` is a key of the
  // speakers table in index.js (omitted for the narrator); `byChoice` swaps the text after an earlier act's choice.
  scene: [
    { text: '黑鐘學院的舞會在暴雪夜舉行。賓客全戴著面具，凝結成舞姿，像一排排蠟像。' },
    { text: '只有鏡子裡的倒影還在旋轉。樂聲從鏡面的另一側傳來，慢了半拍。' },
    { speaker: 'eli', text: '「別看他們的眼睛，看面具。今晚，每個人都站錯了位置。」' },
    { speaker: 'eli', text: '「舞廳深處那面最大的鏡子——只要月光走得到它，門就會開。」' },
    { text: '他退回人群邊緣，一隻手藏在背後，像在遮住什麼。' }
  ],
  objective: '認出每張面具下的人，為鏡廳的暗門引來月光，再向魔鏡說出這場舞會的真相。',
  puzzle: 'interrogation',
  // Positional answers: one word per blank of the interrogation below.
  answer: ['queen', 'prince', 'eli', 'mirrorhall'],
  requires: null,
  reward: '舞會的真相',
  evidence: 'guests',
  evidenceButton: '核對面具',
  evidenceGate: '魔鏡只肯聽有憑據的陳述。賓客們凝在原地，沒有人肯開口——先逐一核對他們臉上的面具，再為鏡廳的暗門引來月光。',
  unlock: '鏡面泛起漣漪，舞廳另一端出現一條只存在於鏡中的走廊。伊萊低聲說：「從這裡開始，妳看見的每個人，都可能不是他自己。」',
  interrogation: {
    prompt: '魔鏡問：「這場舞會，是誰為了誰辦的？戴黑手套的人是誰？他想把妳引向哪裡？」',
    template: ['這場舞會是', 0, '為了替', 1, '挑選新娘而設的局；站在公爵夫人身旁、戴著黑手套的人是', 2, '，他暗中想把妳帶往', 3, '。'],
    blanks: [
      { group: 'person', answer: 'queen' },
      { group: 'person', answer: 'prince' },
      { group: 'person', answer: 'eli' },
      { group: 'object', answer: 'mirrorhall' }
    ]
  },
  // The last dance (選擇): only changes later text, never the route.
  choice: {
    key: 'lastDance',
    title: '最後一支舞',
    prompt: '樂聲停了一拍，又重新響起。這是舞會的最後一支舞。奧瑞恩王子向妳伸出手；而伊萊站在鏡廳的入口，沒有催促，只是把黑手套握得更緊。',
    options: [
      { id: 'prince', label: '接受王子的邀舞', text: '妳把手放進奧瑞恩的掌心。他的手很暖，暖得像一種還沒有被拆穿的謊言。舞步旋轉時，妳聽見他說：「我什麼都不記得，但我記得要保護妳。」' },
      { id: 'eli', label: '跟著伊萊走向鏡廳', text: '妳鬆開王子的視線，跟著黑手套走向鏡廳。身後的樂聲仍在繼續，沒有人發現舞池中少了一個人。伊萊沒有回頭，只說：「謝謝妳，願意先相信我一次。」' }
    ]
  },
  spots: [
    {
      id: 'invite',
      label: '血色請柬',
      icon: 'scroll',
      x: 50,
      y: 76,
      text: '請柬用血紅的蠟封緘，印面是薇菈王后的三尖冠。內文只有一行：「今夜，為奧瑞恩王子挑選新娘。」\n字跡很漂亮，漂亮得不像出於願意的人之手。',
      clues: ['invitation', 'queen'],
      clue: true
    },
    {
      id: 'guests',
      label: '凝結的賓客',
      icon: 'gem',
      x: 22,
      y: 62,
      text: '賓客們停在半個舞步裡，像被冰封的蠟像。每個人臉上都戴著不同的面具：銀狐、黑天鵝、白鹿、紅玫瑰、烏鴉、金蝶。\n他們的證詞寫在各自的衣襟上，但沒有人標明誰是誰。\n要弄清楚誰站在誰身旁，並替鏡廳的暗門引來月光，得先逐一核對這些面具。',
      restoredText: '六位賓客的位置全部對上了，鏡廳的暗門也被月光照亮了：銀狐是公爵夫人，黑天鵝是伊萊，白鹿是奧瑞恩王子，紅玫瑰是薇菈王后，烏鴉是外國使節，金蝶是宮廷總管。\n伊萊就站在公爵夫人身旁，右手的黑手套握得很緊——他一直在這裡，一直在看著妳。',
      clues: ['frozen'],
      restoredClues: ['eli', 'blackglove'],
      clue: true
    },
    {
      id: 'prince',
      portrait: 'orion',
      label: '王子的邀舞',
      icon: 'gem',
      x: 74,
      y: 58,
      text: '白鹿面具後的人向空氣伸出手，維持著邀舞的姿勢，彷彿等了很久。\n面具下的眼神有些恍惚。他似乎記得舞步，卻想不起要邀請的是誰。\n他是奧瑞恩王子。',
      clues: ['prince', 'lastdance'],
      clue: true
    },
    {
      id: 'bigmirror',
      label: '舞廳深處的大鏡',
      icon: 'mirror',
      x: 50,
      y: 44,
      text: '鏡面比任何一面都更深。鏡裡的舞者還在旋轉，而鏡外的人全都靜止了。\n鏡框邊緣刻著一行細字：「通往鏡廳。」伊萊說，今夜真正的舞會，在鏡子的另一端。',
      clues: ['mirrorhall'],
      clue: true
    },
    {
      id: 'chandelier',
      label: '碎裂的水晶吊燈',
      icon: 'gem',
      x: 40,
      y: 30,
      text: '水晶吊燈缺了一整排，碎片掉在地上，每一片都映出不同的角度，卻沒有一片映出妳的臉。\n燭火從高處滴下蠟油，一滴一滴落在黑色大理石上。'
    },
    {
      id: 'petals',
      label: '散落的玫瑰花瓣',
      icon: 'gem',
      x: 36,
      y: 78,
      text: '血紅的花瓣從舞池中央一路灑向大鏡，形成一條窄窄的路。\n有人在這條路上走過，而且走得很熟——花瓣被踩進大理石的細縫裡，沒有一片偏離方向。',
      clues: ['rosepetals'],
      clue: true
    },
    {
      id: 'window',
      label: '陽台外的霜棘城',
      icon: 'clock',
      view: 'balcony',
      x: 30,
      y: 40,
      text: '陽台外是被雪封住的霜棘城。遠處的蒸汽塔冒著白煙，煙柱在月光下直直升起。\n舞廳裡燭火通明，窗外卻是結冰的世界——彷彿這場舞會是整座城市唯一還在燃燒的地方。',
      clues: ['frost'],
      clue: true
    },
    {
      id: 'foxmask',
      label: '銀狐面具',
      icon: 'key',
      x: 70,
      y: 76,
      text: '一張銀狐面具被留在地上，內側用細針繡著一個名字：「安娜貝爾」。\n不知是哪一位賓客落下的。妳把它收了起來——面具總會有再用到的時候。',
      item: 'foxmask',
      itemName: '銀狐面具'
    },
    {
      id: 'glove',
      portrait: 'eli',
      label: '伊萊的黑手套',
      icon: 'scroll',
      view: 'balcony',
      x: 66,
      y: 68,
      text: '一隻黑色皮手套落在舞池邊緣。指尖的皮革被灼燒過，邊緣泛著不自然的光。\n不是意外。有人用過會燒傷自己的魔法。',
      item: 'glove',
      itemName: '伊萊的黑手套',
      clues: ['blackglove'],
      clue: true
    },
    {
      id: 'lockb',
      label: '舞池中央的鏡面',
      icon: 'mirror',
      x: 58,
      y: 66,
      text: '魔鏡在地面映出一個問題：這場舞會的真相是什麼？',
      lock: true
    },
    {
      id: 'hallmirrors',
      label: '鏡廳的長鏡',
      icon: 'mirror',
      view: 'hall',
      x: 22,
      y: 45,
      text: '長廊兩側的鏡子各自映著不同角度的月光。盡頭有一道微微合著的暗門，門縫沒有光。\n伊萊說：「只要光能走到那扇門，它就會自己打開。」'
    },
    {
      id: 'hall',
      label: '鏡廳的入口',
      icon: 'mirror',
      view: 'hall',
      x: 50,
      y: 52,
      after: 'solved',
      text: '大鏡無聲地滑開，露出一條長廊，兩側全是金框的鏡子，每一面都映著不同角度的月光。\n長廊的盡頭有一扇微微開著的門——那是通往下一個秘密的路。'
    },
    {
      id: 'ballroom-memory',
      label: '記憶：舞會上的灰眼人',
      icon: 'gem',
      x: 12,
      y: 40,
      after: 'ending',
      memory: true,
      text: '黑鐘學院的舞會，妳只參加過一次。那一次，有個灰眼睛的男人替妳擋掉了所有人的目光，沒有問妳是誰。\n那時妳以為他只是一位好心的陌生人。後來才知道，他一直都知道。'
    },
    {
      id: 'shard-ballroom',
      label: '鏡之碎片',
      icon: 'gem',
      x: 6,
      y: 60,
      shard: true,
      needs: 'foxmask',
      veiled: '牆邊一面落地鏡缺了一角。妳一靠近，鏡裡所有賓客同時轉頭盯著妳的臉，缺角的碎片立刻沉進鏡面深處。\n他們認得這張臉。也許換一張臉，他們就不會看了。',
      text: '妳戴上銀狐面具再靠近。鏡中的賓客認不出妳，一個個轉回舞池；缺角的碎片浮了上來。妳把它收進口袋，鏡中的人群同時鬆了一口氣。'
    }
  ],
  // Step-aware hints (提示): three tiers for each stage of the evidence, the deduction and the seal.
  stages: ['masks', 'light'],
  stepHints: {
    masks: [
      '證詞全是真話。先處理說出自己確切位置的人：公爵夫人在最左邊，宮廷總管在最右邊。',
      '伊萊緊貼在公爵夫人右邊；剩下三個位置給王子、王后與使節——王子緊貼在王后左邊，使節在王后右邊。',
      '從左到右：銀狐＝公爵夫人、黑天鵝＝伊萊、白鹿＝奧瑞恩王子、紅玫瑰＝薇菈王后、烏鴉＝外國使節、金蝶＝宮廷總管。'
    ],
    light: [
      '月光從左邊第三列射入，要從右邊第二列離開。每面鏡子只有「/」與「\」兩種方向。',
      '光得先往下、橫過底部，再往上折回：左邊兩面鏡子負責往下再往右，右邊兩面負責往上再往右。',
      '左側兩面鏡子都翻成「\」，右側兩面都翻成「/」。'
    ],
    seal: [
      '先檢視賓客與請柬，把線索詞收進推理簿。審問共四格：誰辦的舞會、替誰挑新娘、誰戴黑手套、他想帶妳去哪裡。',
      '請柬寫明了舞會的主人與目的；黑手套屬於站在公爵夫人身旁的人；伊萊一直指著同一面鏡子。',
      '在審問頁按「魔鏡替妳填一格」，它會填入一個正確的詞。每次只解一格。'
    ]
  }
};
