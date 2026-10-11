// Chapter "mine": content only. Rules live in engine/.
export default {
  id: 'mine',
  title: '銀骨礦坑',
  subtitle: '七個被遺忘的人',
  chapter: '第二幕',
  image: 'mine.webp',
  atmosphere: 'mine',
  intro: '奈菈帶妳穿過銀骨礦坑。玻璃容器裡，有人不停呼喚母親。赫索指著停擺的管線：「不靠魔法，也能讓城市暖起來。」',
  objective: '裝上閥柄，依工程手札啟動三段蒸汽管線。',
  puzzle: 'sequence',
  answer: [
    'water',
    'heat',
    'city'
  ],
  requires: 'valve',
  reward: '工程藍圖',
  grants: ['blueprint'],
  evidence: 'pipes',
  evidenceButton: '接回管網',
  evidenceGate: '控制盤上的三個壓力錶全指著零。蒸汽管網還沒接好，現在開閥只會讓蒸汽從接縫外洩。',
  unlock: '熱泉湧進銅管。妳第一次看見，一種不需要生命抵押的溫暖。赫索將工程藍圖交給妳。',
  spots: [
    {
      id: 'minebook',
      label: '生命帳簿',
      icon: 'book',
      x: 23,
      y: 68,
      text: '奈菈、魯恩、赫索、莫格、奇妲、斐恩、提米。\n他們曾經有普通人的身高。銀骨礦石奪走了健康，王國又奪走了他們的名字。',
      clue: true
    },
    {
      id: 'valve',
      label: '銅製閥柄',
      icon: 'gear',
      x: 78,
      y: 65,
      text: '赫索留下的閥柄。沉甸甸的金屬依然溫暖，可以裝回控制盤。',
      item: 'valve',
      itemName: '銅製閥柄'
    },
    {
      id: 'pipeNote',
      label: '工程手札',
      icon: 'scroll',
      x: 49,
      y: 43,
      text: '「先讓冷水進入管線；再引入地下熱泉；最後向城市輸送。」\n沒有水就加熱，銅管會破裂。出口必須最後開啟。',
      clue: true
    },
    {
      id: 'pipes',
      label: '斷裂的蒸汽管',
      icon: 'gear',
      x: 56,
      y: 74,
      text: '控制盤後方的銅管全都錯開了，蒸汽從接縫裡嘶嘶外洩。\n不先把管網接回去，開哪一道閥門都沒有用。',
      restoredText: '五段銅管重新咬合，蒸汽沿著管網一路送到城市出口。\n控制盤上的三個壓力錶同時跳動——現在，可以依工程手札的順序開閥了。',
      clue: true
    },
    {
      id: 'lock2',
      label: '蒸汽控制盤',
      icon: 'gear',
      x: 86,
      y: 41,
      text: '三道閥門，等待正確的開啟順序。',
      lock: true
    },
    {
      id: 'miners',
      label: '甦醒的礦工',
      icon: 'gem',
      x: 28,
      y: 34,
      after: 'solved',
      text: '暖氣沿著管線湧進礦坑，玻璃容器裡的呼喊第一次停了下來。\n' +
        '奈菈一個一個念出同伴的名字：魯恩、赫索、莫格、奇妲、斐恩、提米。\n' +
        '赫索拍了拍妳手裡的藍圖：「記住，先把塔蓋好，再拆掉結界。順序錯了，死的會是整座城。」',
      clue: true
    },
    {
      id: 'nyla',
      label: '記憶：雪地裡的毯子',
      icon: 'gem',
      x: 68,
      y: 27,
      after: 'ending',
      memory: true,
      text: '奈菈第一次看見妳手臂上的王室印記時，叫妳出去。\n' +
        '「我妹妹十二歲被帶走。他們說她有魔法天賦。一年後，送回來的只有骨灰，連名字都沒有。」\n' +
        '那晚妳睡在屋外的雪地。半夜，一條毯子從窗戶丟了出來：「別死在門口。我們明天還要掃雪。」'
    }
  ],
  options: [
    {
      id: 'city',
      label: '城市出口',
      symbol: '♜'
    },
    {
      id: 'heat',
      label: '地下熱泉',
      symbol: '☀'
    },
    {
      id: 'water',
      label: '冷水入口',
      symbol: '≈'
    }
  ],
  hints: [
    '先收取閥柄，再檢查斷裂的蒸汽管，把管網接回去。',
    '管網接通後，照工程手札開閥：水先進管，加熱居中，出口最後。',
    '依序點選：冷水入口 → 地下熱泉 → 城市出口。'
  ]
};
