// Chapter "mine": content only. Rules live in engine/.
export default {
  id: 'mine',
  title: '銀骨礦坑',
  subtitle: '七個被遺忘的人',
  chapter: '第四幕',
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
  // Pre-seal deduction: why the valves matter, before the order is entered.
  deduction: {
    prompt: '赫索問：「在開閥之前，妳得先說清楚——我們到底在換什麼？」',
    template: ['銀骨礦石奪走了礦工的健康，王國又奪走他們的', 0, '。赫索的工程要取代', 1, '，但必須先準備', 2, '與遷移，否則北方城市會暴露在', 3, '之中。'],
    blanks: [
      { group: 'concept', answer: 'names' },
      { group: 'object', answer: 'barrier' },
      { group: 'concept', answer: 'heatenergy' },
      { group: 'object', answer: 'frost' }
    ]
  },
  spots: [
    {
      id: 'minebook',
      label: '生命帳簿',
      icon: 'book',
      x: 23,
      y: 68,
      text: '奈菈、魯恩、赫索、莫格、奇妲、斐恩、提米。\n他們曾經有普通人的身高。銀骨礦石奪走了健康，王國又奪走了他們的名字。',
      clues: ['names', 'silverbone'],
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
      clues: ['coldwater'],
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
      id: 'lantern',
      label: '礦工提燈',
      icon: 'gear',
      x: 12,
      y: 52,
      text: '玻璃罩上刻著七個歪斜的記號，像七個小孩各自畫上去的名字。\n燈芯還是濕的。有人剛剛離開，並且很用力地想被記住。',
      item: 'lantern',
      itemName: '礦工提燈',
      clues: ['hesso'],
      clue: true
    },
    {
      id: 'furnace',
      label: '熄滅的熔爐',
      icon: 'gear',
      x: 36,
      y: 52,
      text: '爐膛裡全是冷灰。赫索在牆上用炭筆寫著：「熱能不夠，就先別拆結界。」\n管線需要的不是魔法，是穩定、持續的熱。',
      clues: ['heatenergy'],
      clue: true
    },
    {
      id: 'cart',
      label: '結霜的礦車',
      icon: 'gem',
      x: 64,
      y: 58,
      text: '礦車的鐵輪凍在軌道上，輪緣結著一層細霜。霜不是從外面來的——是從結界的缺口滲進來的。\n沒有結界的地方，霜潮會先吞掉最北邊的城市。',
      clues: ['frost'],
      clue: true
    },
    {
      id: 'blueprintwall',
      portrait: 'heso',
      label: '藍圖牆',
      icon: 'scroll',
      x: 90,
      y: 34,
      text: '牆上釘滿發黃的圖紙：蒸汽塔、管線、七座城市的暖氣出口。\n最上方一行字：「工程取代魔法結界，不是反過來。」',
      clues: ['barrier', 'cityseven'],
      clue: true
    },
    {
      id: 'cradle',
      label: '礦工宿舍的搖籃',
      icon: 'gem',
      x: 5,
      y: 38,
      text: '宿舍角落擺著一只小搖籃，被子疊得很整齊，像在等某個孩子回來。',
      byChoice: {
        tobyHeart: {
          take: '宿舍角落擺著一只空搖籃。妳卻覺得它不該是空的——托比的心臟就在妳的行囊裡，微微發熱，像在回應這間屋子。',
          bury: '宿舍角落擺著一只空搖籃。窗外有一座新堆的小土丘，上面放著一塊刻了名字的石頭。獵人說過，這裡的孩子，終於可以睡了。'
        }
      }
    },
    {
      id: 'miners',
      portrait: 'nyla',
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
      portrait: 'nyla',
      label: '記憶：雪地裡的毯子',
      icon: 'gem',
      x: 68,
      y: 27,
      after: 'ending',
      memory: true,
      text: '奈菈第一次看見妳手臂上的王室印記時，叫妳出去。\n' +
        '「我妹妹十二歲被帶走。他們說她有魔法天賦。一年後，送回來的只有骨灰，連名字都沒有。」\n' +
        '那晚妳睡在屋外的雪地。半夜，一條毯子從窗戶丟了出來：「別死在門口。我們明天還要掃雪。」'
    },
    {
      id: 'shard-mine',
      label: '鏡之碎片',
      icon: 'gem',
      x: 14,
      y: 18,
      shard: true,
      text: '一片碎鏡卡在閥門的縫隙裡，映出蒸汽管的倒影。管子裡流動的不是熱水，而是一排排細小的名字。'
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
    '先收取閥柄，再檢查斷裂的蒸汽管，把管網接回去。管網接好後，赫索會要妳先說清楚工程要換什麼（推理四格）。',
    '管網接通後，照工程手札開閥：水先進管，加熱居中，出口最後。',
    '依序點選：冷水入口 → 地下熱泉 → 城市出口。'
  ]
};
