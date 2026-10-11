// Chapter "mirror": content only. Rules live in engine/.
export default {
  id: 'mirror',
  title: '鏡中之國',
  subtitle: '一個名字的代價',
  chapter: '第五幕',
  image: 'mirror.webp',
  atmosphere: 'mirror',
  intro: '七十三個孩子站在鏡子的另一端。露西握住妳的手。魔鏡提出最後一筆交易：「我可以讓妳活過來。代價，是妳的名字。」',
  objective: '揭露王冠契約的繼承者，然後決定妳的代價。',
  puzzle: 'name',
  answer: 'snow',
  requires: null,
  reward: '契約真相',
  evidence: 'witness',
  evidenceButton: '映照手稿',
  evidenceGate: '魔鏡的問題需要證據。見證者手稿的字全是反寫的——先在鏡面上把它映照回來。',
  unlock: '名字不是字母，是所有人對妳的記憶。王族的名字仍被承認，生命抵押就會繼續。妳終於握住契約的終點。',
  spots: [
    {
      id: 'lucy',
      label: '露西的倒影',
      icon: 'gem',
      x: 30,
      y: 47,
      text: '「妳又沒有殺我們。妳不是來幫我們的嗎？」\n露西曾經有名字，有母親，也有一個等不到的春天。',
      clue: true
    },
    {
      id: 'witness',
      label: '見證者手稿',
      icon: 'scroll',
      x: 13,
      y: 64,
      text: '手稿上的字全是反寫的，像是寫給鏡子讀的。妳只認得出幾個詞：「第一位國王」「抵押」「最終繼承人」。\n要讀懂它，得讓鏡子替妳翻過來。',
      restoredText: '第一位國王將臣民的生命抵押給王冠。\n最終繼承人是失蹤的公主——不是王后，也不是奧瑞恩。唯有她的名字被世界遺忘，抵押才會失去繼承人。',
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
      text: '赫索的工程能取代魔法結界，但必須先準備熱能與遷移。立即毀掉結界，會讓北方七座城市暴露在霜潮之中。',
      clue: true
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
      id: 'lucy-mother',
      label: '記憶：露西的問題',
      icon: 'gem',
      x: 66,
      y: 74,
      after: 'ending',
      memory: true,
      text: '露西八歲，是最後一個被抽取生命的孩子。被帶走那晚，她還一直問母親什麼時候來接她。\n在鏡子裡，她沒有生氣，只問了妳一件事：「我媽媽後來怎麼樣了？」\n那時妳答不出來。現在，妳知道答案必須由活下來的人去找。'
    }
  ],
  options: [
    {
      id: 'queen',
      label: '薇菈王后'
    },
    {
      id: 'prince',
      label: '奧瑞恩王子'
    },
    {
      id: 'snow',
      label: '白雪公主'
    }
  ],
  hints: [
    '見證者手稿是反寫的。打開它，讓鏡面把字映照回來。',
    '手稿記載了契約真正的繼承人：契約看的是王室血脈，而非誰坐在王座上。',
    '選擇「白雪公主」。'
  ]
};
