// Chapter "queen": content only. Rules live in engine/.
export default {
  id: 'queen',
  title: '王后寢宮',
  subtitle: '她最後的謊言',
  chapter: '第六幕',
  image: 'queen.webp',
  // Views (視角): the first one is the arrival view; the seal and the evidence stay there.
  views: [
    { id: 'chamber', label: '王后寢宮', image: 'queen.webp' },
    { id: 'vanity', label: '梳妝台', image: 'queen-vanity.webp' }
  ],
  atmosphere: 'queen',
  intro: '鏡子讓妳看見年輕的薇菈。她為了救愛人嫁給國王，卻成為契約的囚徒。床頭那隻灰兔，右耳被一針一線縫好了。',
  // Opening scene (對話場景): one line per click in the dialogue box. `speaker` is a key of the
  // speakers table in index.js (omitted for the narrator); `byChoice` swaps the text after an earlier act's choice.
  scene: [
    { text: '鏡子讓妳看見年輕的薇菈。她為了救愛人嫁給國王，卻成為契約的囚徒。' },
    { text: '床頭那隻灰兔，右耳被一針一線縫好了。' },
    { speaker: 'vera', text: '「又把兔子的耳朵扯掉了？過來，我縫給妳。」' },
    { speaker: 'vera', text: '「我會問妳三個問題。沒有對錯——我只想知道，妳會成為什麼樣的人。」' }
  ],
  objective: '取得銀針，用妳自己的意志回答王后留下的三個問題。',
  puzzle: 'questions',
  free: true,
  answer: [
    'no',
    'third',
    'yes'
  ],
  requires: 'needle',
  reward: '第八份證詞',
  evidence: 'letter',
  evidenceButton: '翻開記憶卡',
  evidenceGate: '王后的三問，答案沒有對錯；但信上記著白雪當年怎麼回答。信已經被淚水暈開——先拼湊王后遺落的記憶，讓字跡重新浮現。',
  unlock: '妳用銀針挑開契約的接縫。鏡中浮現母親伊蓮的最後記憶：她不是死於生產。',
  unlockEcho: [
    '妳的三個回答，和當年的她一模一樣。',
    '妳的回答和當年的白雪不同。薇菈沒有阻止，只是把它們一字一字記了下來。'
  ],
  deduction: {
    prompt: '魔鏡問：「在回答王后的問題之前，先說說妳認識的那個薇菈。」',
    template: ['替妳縫好兔耳的人是', 0, '；她為了救', 1, '才嫁給國王，從此成了', 2, '的囚徒。'],
    blanks: [
      { group: 'person', answer: 'queen' },
      { group: 'person', answer: 'lover' },
      { group: 'concept', answer: 'contract' }
    ]
  },
  spots: [
    {
      id: 'rabbit',
      label: '灰色兔子',
      icon: 'gem',
      x: 15,
      y: 53,
      text: '兔子的右耳總是會掉。每次醒來，耳朵卻又被縫好。\n原來替妳修補它的人，一直是薇菈。',
      clues: ['queen', 'grayrabbit'],
      clue: true
    },
    {
      id: 'needle',
      label: '魔法銀針',
      icon: 'key',
      x: 24,
      y: 70,
      text: '銀針藏在王后的縫線盒裡。鏡中的回憶顯示，國王曾用另一支銀針刺向伊蓮。證詞可以刺破謊言。',
      item: 'needle',
      itemName: '魔法銀針',
      clues: ['silverneedle'],
      clue: true
    },
    {
      id: 'letter',
      label: '王后的信',
      icon: 'scroll',
      x: 86,
      y: 55,
      text: '信紙被淚水暈開，只剩幾個字還看得清：「我不想……」「……第三種……」「即使……」\n角落有薇菈的補註：「她的回答，藏在我們共同的記憶裡。」',
      restoredText: '記憶拼回之後，信上的字重新浮現。白雪曾經這樣回答王后：\n「我不想成為女王。」\n「我會尋找第三種方法。」\n「即使世界不知道，我仍願意。」\n薇菈的補註：這是她當年的回答。如今，請用妳自己的意志回答。',
      clues: ['thirdway'],
      clue: true
    },
    {
      id: 'lock4',
      label: '王后的三問',
      icon: 'mirror',
      x: 41,
      y: 48,
      text: '魔鏡重複著王后的三個問題。沒有標準答案；妳怎麼回答，薇菈就會留下怎樣的證詞。',
      lock: true
    },
    {
      id: 'portrait',
      label: '年輕醫師的畫像',
      icon: 'gem',
      view: 'vanity',
      x: 66,
      y: 40,
      text: '畫像裡的男人戴著一副圓框眼鏡，白袍的口袋裡插著聽診器。畫框背面寫著：「等我畢業，我們開一間診所。」\n畫像的玻璃被擦得很亮，是這間寢宮裡唯一沒有灰塵的東西。\n畫像右下角有一圈細小的霜痕，永遠擦不掉。',
      clues: ['lover', 'frost'],
      clue: true
    },
    {
      id: 'agreement',
      label: '床頭的婚約文書',
      icon: 'scroll',
      view: 'vanity',
      x: 66,
      y: 68,
      text: '婚約文書夾在祈禱書裡，邊角被反覆摺過。每一條條款都在談王室生命庫，沒有一條談到愛。\n簽名處有被淚水暈開的痕跡：薇菈簽下的，是一份她再也無法離開的契約。',
      clues: ['contract'],
      clue: true
    },
    {
      id: 'vanity',
      portrait: 'vera',
      label: '梳妝台的王冠',
      icon: 'mirror',
      view: 'vanity',
      x: 30,
      y: 64,
      text: '王冠被隨意放在梳妝台上，鏡面朝下。薇菈說過：「它不是榮耀，是鎖。戴上它的人，要替整個王國記帳。」\n冠上少了一顆寶石，缺口的形狀剛好是一滴眼淚。',
      clues: ['crown'],
      clue: true
    },
    {
      id: 'thimble',
      label: '縫線盒的頂針',
      icon: 'key',
      x: 31,
      y: 60,
      text: '銀頂針的內側磨得發亮。縫了無數次兔耳的指尖，就是被它保護的。\n盒子裡的線已經用掉一大半，每一種顏色都縫過同一隻兔子。',
      item: 'thimble',
      itemName: '銀頂針'
    },
    {
      id: 'elaine',
      label: '母親的最後記憶',
      icon: 'gem',
      x: 42,
      y: 28,
      after: 'solved',
      text: '鏡中的伊蓮抱著剛出生的妳，對著鏡子輕聲說：「如果有一天她讀到這裡，告訴她——名字不是王冠給的。」\n國王手裡的銀針，在燭光下閃了一下。',
      clue: true
    },
    {
      id: 'shard-queen',
      label: '鏡之碎片',
      icon: 'gem',
      x: 30,
      y: 74,
      shard: true,
      needs: 'thimble',
      veiled: '縫線盒的底層纏滿白線，線裡裹著一片硬硬的東西。一伸手，斷掉的針尖就扎進指腹。\n縫了無數次兔耳的人，是怎麼保護她的手指的？',
      text: '妳套上銀頂針，一層一層撥開白線。碎鏡裹在最裡面，線頭穿過鏡面的裂痕，像是有人在這裡縫過一隻兔子的耳朵。'
    },
    {
      id: 'vera',
      portrait: 'vera',
      label: '記憶：雪為什麼是白的',
      icon: 'gem',
      x: 62,
      y: 80,
      after: 'ending',
      memory: true,
      text: '二十一歲的薇菈還不是王后，只是黑鐘學院的窮學生。她愛上一位醫師，兩人計畫畢業後開一間診所。\n' +
        '霜潮讓他全身結冰。沒有魔法師願意免費救他。魔鏡說：「嫁給國王，妳就能動用王室生命庫。」她答應了。等她成為王后，他已經死了。\n' +
        '妳小時候總問她，雪為什麼是白的。她說，因為天空把所有顏色都藏起來了。'
    }
  ],
  questions: [
    {
      text: '妳想成為女王嗎？',
      options: [
        {
          id: 'yes',
          label: '我想繼承王冠',
          response: '薇菈笑了一下，笑容裡沒有一點高興：「我當年也這麼想。王冠會讓妳以為，自己終於能救所有人。」'
        },
        {
          id: 'no',
          label: '我不想成為女王',
          response: '「很好。」薇菈說，「不想要王冠的人，才有資格碰它。」'
        }
      ]
    },
    {
      text: '殺死一個孩子，能救一千個人。妳會怎麼做？',
      options: [
        {
          id: 'sacrifice',
          label: '犧牲那個孩子',
          response: '薇菈閉上眼睛：「國王也是這樣算的。七十三個孩子，換一座城的冬天。他從來沒有算錯，只是付錢的從來不是他。」'
        },
        {
          id: 'third',
          label: '尋找第三種方法',
          response: '「第三種方法，」薇菈重複了一次，「我找了二十年，沒有找到。也許妳會。」'
        }
      ]
    },
    {
      text: '如果世界永遠不知道是妳救了它，妳還願意嗎？',
      options: [
        {
          id: 'yes',
          label: '我仍然願意',
          response: '薇菈伸手，像很多年前一樣替妳整理頭髮：「那妳已經比我勇敢了。」'
        },
        {
          id: 'no',
          label: '我需要被記住',
          response: '「想被記住不是罪。」薇菈輕聲說，「我也想。所以我在鏡子裡，留下了這麼多證詞。」'
        }
      ]
    }
  ],
  // Step-aware hints (提示): three tiers for each stage of the evidence, the deduction and the seal.
  stages: ['memory', 'stitch'],
  stepHints: {
    memory: [
      '八張卡裡，四張是王后的記憶、四張是物件。翻開一張記憶，再找出它說的那件物件。',
      '記憶不會直接說出物件的名字，讀它描述的用途：只讓人沉睡的是藥；擋住惡夢的，縫在枕頭裡。',
      '只會沉睡的藥 ↔ 藥瓶、枕中擋夢 ↔ 白羽、紅得像血的一口 ↔ 蘋果、伊蓮的房間 ↔ 鑰匙。'
    ],
    stitch: [
      '第一針已經示範：背面第 1 針在最左上，正面就在最右上。照編號順序繼續縫。',
      '列不變，只有左右翻轉：背面的第 1 行到了正面是第 4 行，第 2 行變第 3 行。',
      '正面依序縫：1列4行、1列3行、1列2行、2列2行、3列3行、4列3行、4列2行。'
    ],
    deduction: [
      '推理的詞來自灰兔、王后的畫像與壁上的協議。',
      '第一格是縫好兔耳的人；第二格是她想救的人；第三格是把她困住的東西。',
      '薇菈王后 → 愛人 → 契約。'
    ],
    seal: [
      '先收取銀針。王后的三問沒有標準答案，信上記著白雪當年的回答。',
      '妳可以照著信上的回答，也可以說出自己的想法。',
      '任何回答都能讓魔鏡交出證詞。不同的回答，會聽到薇菈不同的回應，也會留在結局的回顧裡。'
    ]
  }
};
