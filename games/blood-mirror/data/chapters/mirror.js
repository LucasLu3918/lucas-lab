// Chapter "mirror": content only. Rules live in engine/.
export default {
  id: 'mirror',
  title: '鏡中之國',
  subtitle: '一個名字的代價',
  chapter: '第七幕',
  image: 'mirror.webp',
  atmosphere: 'mirror',
  intro: '七十三個孩子站在鏡子的另一端。露西握住妳的手。魔鏡提出最後一筆交易：「我可以讓妳活過來。代價，是妳的名字。」',
  objective: '揭露王冠契約的繼承者，然後決定妳的代價。',
  puzzle: 'interrogation',
  // Positional answers: one word per blank of the interrogation below.
  answer: ['heir', 'queen', 'prince', 'blood', 'forgotten'],
  requires: null,
  reward: '契約真相',
  evidence: 'witness',
  evidenceButton: '映照手稿',
  evidenceGate: '魔鏡的問題需要證據。見證者手稿的字全是反寫的——先在鏡面上把它映照回來。',
  unlock: '名字不是字母，是所有人對妳的記憶。王族的名字仍被承認，生命抵押就會繼續。妳終於握住契約的終點。',
  // The mirror's statement (魔鏡審問). Numbers in `template` are blanks; blanks sharing a `set`
  // may hold their words in either order. Words come from the clue notebook (data/clues.js).
  interrogation: {
    template: ['最終繼承人是', 0, '，不是', 1, '，也不是', 2, '。契約承認的是', 3, '，而唯有被世界', 4, '的名字，抵押才會失去主人。'],
    blanks: [
      { group: 'person', answer: 'heir' },
      { group: 'person', set: 'rejected', answer: 'queen' },
      { group: 'person', set: 'rejected', answer: 'prince' },
      { group: 'concept', answer: 'blood' },
      { group: 'action', answer: 'forgotten' }
    ]
  },
  spots: [
    {
      id: 'lucy',
      portrait: 'lucy',
      label: '露西的倒影',
      icon: 'gem',
      x: 30,
      y: 47,
      text: '「妳又沒有殺我們。妳不是來幫我們的嗎？」\n鏡中的露西身後，站著薇菈王后與奧瑞恩王子的影子，王座卻是空的。他們誰都沒有回頭。\n露西曾經有名字，有母親，也有一個等不到的春天。',
      clues: ['queen', 'prince', 'throne'],
      clue: true
    },
    {
      id: 'witness',
      label: '見證者手稿',
      icon: 'scroll',
      x: 21,
      y: 74,
      text: '手稿上的字全是反寫的，像是寫給鏡子讀的。妳只認得出幾個詞：「第一位國王」「抵押」「最終繼承人」「血脈」「遺忘」。\n要讀懂它，得讓鏡子替妳翻過來。',
      restoredText: '第一位國王將臣民的生命抵押給王冠。\n最終繼承人是失蹤的公主——不是王后，也不是奧瑞恩。唯有她的名字被世界遺忘，抵押才會失去繼承人。',
      clues: ['blood', 'forgotten'],
      restoredClues: ['heir'],
      item: 'witness',
      itemName: '見證者手稿',
      clue: true
    },
    {
      id: 'heatplan',
      label: '遠方的蒸汽塔',
      icon: 'gear',
      x: 79,
      y: 47,
      text: '赫索的工程能取代魔法結界，但必須先準備熱能與遷移。立即毀掉結界，會讓北方七座城市暴露在霜潮之中。\n工程師赫索說：「人們只記得會發光的東西。」',
      clues: ['remembered'],
      clue: true
    },
    {
      id: 'children',
      label: '牽著手的孩子',
      icon: 'gem',
      x: 44,
      y: 64,
      text: '七十三個孩子背對著妳，手牽著手排成一列，紅線從他們的腕間一直連到碎裂的巨鏡。\n沒有人回頭。他們只是在等，等某個人替他們數完最後一個。',
      clues: ['children73', 'children'],
      clue: true
    },
    {
      id: 'emptythrone',
      label: '鏡片王座',
      icon: 'mirror',
      x: 70,
      y: 34,
      text: '王座由無數鏡片拼成，每一片裡都映著不同的人，唯獨坐上去的位置是空的。\n座椅扶手上刻著一行小字：「在此就座者，替所有人記帳。」',
      clues: ['throne', 'crown'],
      clue: true
    },
    {
      id: 'corridor',
      label: '鏡像走廊',
      icon: 'mirror',
      x: 10,
      y: 50,
      text: '走廊兩側的鏡子都在反映妳，卻沒有一個和妳做相同的動作。\n往左走的那個妳，永遠在往右看。',
      clues: ['mirrorcorridor'],
      clue: true
    },
    {
      id: 'ribbon',
      label: '露西的髮帶',
      icon: 'scroll',
      x: 38,
      y: 86,
      text: '褪色的紅髮帶落在鏡面上，結打得很用力，像是怕自己被帶走。\n妳把它放進口袋。這是七十三個孩子裡，唯一留下來的東西。',
      item: 'ribbon',
      itemName: '露西的髮帶'
    },
    {
      id: 'lock5',
      label: '最後一面鏡子',
      icon: 'mirror',
      x: 52,
      y: 37,
      text: '「告訴我，誰是生命契約最後的血脈繼承人？」',
      lock: true
    },
    {
      id: 'shard-mirror',
      label: '鏡之碎片',
      icon: 'gem',
      x: 88,
      y: 60,
      shard: true,
      needs: 'ribbon',
      veiled: '地板上有一片碎鏡。妳每次伸手，它就滑開一寸，像在躲妳。\n在這裡，沒有被緊緊繫住的東西，都會被鏡子帶走。',
      text: '妳用露西的髮帶繞住碎鏡，打了一個很用力的結，它不再滑開了。碎鏡映出妳的名字被劃去的瞬間。妳把它收了起來，沒有讓它再映出任何東西。'
    },
    {
      id: 'lucy-mother',
      portrait: 'lucy',
      label: '記憶：露西的問題',
      icon: 'gem',
      x: 66,
      y: 74,
      after: 'ending',
      memory: true,
      text: '露西八歲，是最後一個被抽取生命的孩子。被帶走那晚，她還一直問母親什麼時候來接她。\n在鏡子裡，她沒有生氣，只問了妳一件事：「我媽媽後來怎麼樣了？」\n那時妳答不出來。現在，妳知道答案必須由活下來的人去找。'
    }
  ],
  // Step-aware hints (提示): three tiers for each stage of the evidence, the deduction and the seal.
  stages: ['reflection', 'maze'],
  stepHints: {
    reflection: [
      '左側是刻在紙上的光紋，不能修改；只點右側。每一列都要成為左右鏡像。',
      '同一列裡，左邊第 1 格對應右邊第 2 格，左邊第 2 格對應右邊第 1 格。',
      '逐列把右側改成左側的左右翻轉：亮的位置對調，暗的位置也對調。'
    ],
    maze: [
      '迷廊深處有一扇停在「關上那一刻」的鏡門。倒走的黃金懷錶能讓它回到還沒關上的時候。',
      '左右是顛倒的：想讓倒影往右，就按「向左」。左下那一片是死路；鏡門在第三列，從起點往右、往下就會撞見它。',
      '先轉動懷錶打開鏡門，再依序按：左、左、後、後、左、左、後、左、後。'
    ],
    seal: [
      '見證者手稿、露西、鏡片王座與孩子們都留著線索。審問共五格。',
      '第一格是最終的繼承人；第二、三格是被排除的人，兩者可以互換；第四格是契約真正承認的東西；第五格描述世界怎樣對待那個名字。',
      '在審問頁按「魔鏡替妳填一格」，它會填入一個正確的詞。每次只解一格。'
    ]
  }
};
