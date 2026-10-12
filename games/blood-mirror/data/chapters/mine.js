// Chapter "mine": content only. Rules live in engine/.
export default {
  id: 'mine',
  title: '銀骨礦坑',
  subtitle: '七個被遺忘的人',
  chapter: '第四幕',
  image: 'mine.webp',
  atmosphere: 'mine',
  intro: '奈菈帶妳穿過銀骨礦坑。玻璃容器裡，有人不停呼喚母親。赫索指著停擺的管線：「不靠魔法，也能讓城市暖起來。」',
  // Opening scene (對話場景): one line per click in the dialogue box. `speaker` is a key of the
  // speakers table in index.js (omitted for the narrator); `byChoice` swaps the text after an earlier act's choice.
  scene: [
    { text: '奈菈帶妳穿過銀骨礦坑。坑道越走越窄，玻璃容器裡有人不停呼喚母親。' },
    { speaker: 'nyla', text: '「別停下來。妳一停，他們就以為有人來接他們了。」' },
    { speaker: 'heso', text: '「不靠魔法，也能讓城市暖起來。前提是，管子得先接回去。」' },
    {
      text: '坑道深處很冷。這裡的名字，還沒有人替他們刻回去。',
      byChoice: {
        tobyHeart: {
          take: '妳的行囊微微發熱。玻璃罐裡的光跳快了一拍，像是認得這條坑道。',
          bury: '妳想起黑松林裡那塊刻著名字的小石頭。這裡的名字，還沒有人替他們刻回去。'
        }
      }
    }
  ],
  objective: '接回管網、把名字刻回床頭，再依工程手札轉動對應礦工的閥門。',
  puzzle: 'sequence',
  answer: [
    'kida',
    'hesso',
    'timi'
  ],
  // The seal combines both stages: the bed order (七個名字) tells whose valve is whose (r6).
  seal: { title: '讓城市重新溫暖', prompt: '控制盤上的閥門沒有標示用途，只掛著礦工的名牌。依工程手札的順序，轉動對應的人的閥門。' },
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
      text: '赫索留下的閥柄。沉甸甸的金屬依然溫暖，柄上烙著一行小字：「冷水歸爐火邊第一張床，熱泉歸正中間那張床，出口歸門邊最後一張床。誰睡那張床，那道閥就歸誰。」',
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
      restoredText: '五段銅管重新咬合，蒸汽沿著管網一路送到城市出口。\n宿舍的床頭也刻回了名字，從爐火數起：奇妲、魯恩、莫格、赫索、奈菈、斐恩、提米。\n控制盤上的三個壓力錶同時跳動——現在，可以依工程手札的順序開閥了。',
      clue: true
    },
    {
      id: 'lock2',
      label: '蒸汽控制盤',
      icon: 'gear',
      x: 91,
      y: 55,
      text: '一排閥門，每道只掛著一位礦工的名牌，等待正確的開啟順序。',
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
      needs: 'lantern',
      veiled: '坑道頂端的岩縫裡有東西閃了一下，又被黑暗吞了回去。燭光照不到那麼高。\n礦工們下到最深處時，手裡都提著什麼？',
      text: '妳舉起礦工提燈，燈光照進坑頂的岩縫：一片碎鏡卡在那裡，映出蒸汽管的倒影。管子裡流動的不是熱水，而是一排排細小的名字。'
    }
  ],
  options: [
    { id: 'fin', label: '斐恩的閥門', symbol: '斐' },
    { id: 'hesso', label: '赫索的閥門', symbol: '赫' },
    { id: 'kida', label: '奇妲的閥門', symbol: '奇' },
    { id: 'mog', label: '莫格的閥門', symbol: '莫' },
    { id: 'timi', label: '提米的閥門', symbol: '提' },
    { id: 'nyla', label: '奈菈的閥門', symbol: '奈' }
  ],

  // Step-aware hints (提示): three tiers for each stage of the evidence, the deduction and the seal.
  stages: ['pipes', 'names'],
  stepHints: {
    pipes: [
      '把左上的「泉源」接到右下的「城市」。每點一次，管件順時針轉 90°；看哪個接縫還在漏氣。',
      '蒸汽要走 S 形：上排往右，從右上轉下來，橫過正中央，再從下排中間轉進城市。',
      '上排中間的直管轉 1 次，其餘四個彎管各轉 2 次。'
    ],
    names: [
      '先放下兩個說出確切床位的人：赫索在正中間（第 4 床），提米在最後一張（第 7 床）。',
      '從赫索往兩邊推：莫格緊貼在他左邊、奈菈緊貼在他右邊，魯恩又緊貼在莫格左邊，斐恩在奈菈右邊。沒有證詞的那個人，睡在剩下的床位。',
      '從爐火數起：奇妲、魯恩、莫格、赫索、奈菈、斐恩、提米。'
    ],
    deduction: [
      '推理的詞散在礦坑各處：生命帳簿、藍圖牆、熔爐與礦車。',
      '第一格是王國從礦工身上奪走的東西；第二格是工程要取代的；第三格是取代它需要的能源；第四格是沒準備好時北方要面對的。',
      '名字 → 魔法結界 → 熱能 → 霜潮。'
    ],
    seal: [
      '控制盤上的閥門只掛著礦工的名牌。閥柄上烙著每道閥門歸誰管，開閥的順序寫在工程手札裡。',
      '手札說：冷水先、熱泉居中、出口最後。冷水閥歸爐火邊第一張床的人，熱泉閥歸正中間的人，出口閥歸門邊最後一張床的人。',
      '依序轉動：奇妲的閥門 → 赫索的閥門 → 提米的閥門。'
    ]
  }
};
