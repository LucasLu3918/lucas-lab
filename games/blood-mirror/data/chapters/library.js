// Chapter "library": content only. Rules live in engine/.
export default {
  id: 'library',
  title: '黑鐘書庫',
  subtitle: '第十三聲鐘響',
  chapter: '第一幕',
  image: 'chamber.webp',
  // Views (視角): the first one is the arrival view; the seal and the evidence stay there.
  views: [
    { id: 'chamber', label: '黑鐘書庫', image: 'chamber.webp' },
    { id: 'desk', label: '書桌特寫', image: 'library-desk.webp' }
  ],
  atmosphere: 'library',
  intro: '午夜，黑鐘學院敲響了第十三聲。妳在禁書庫醒來。門外有人拖動鎖鏈，而桌上的懷錶……正在倒著走。',
  // Opening scene (對話場景): one line per click in the dialogue box. `speaker` is a key of the
  // speakers table in index.js (omitted for the narrator); `byChoice` swaps the text after an earlier act's choice.
  scene: [
    { text: '午夜，黑鐘學院敲響了第十三聲。妳在禁書庫醒來，臉頰還貼著冰冷的書頁。' },
    { text: '門外有人拖動鎖鏈，停在妳的門前，沒有再動。桌上的懷錶……正在倒著走。' },
    { speaker: 'mirror', text: '「醒了嗎，公主？今夜多敲的那一聲，是為妳敲的。」' },
    { speaker: 'mirror', text: '「禁書櫃裡鎖著妳出生的價錢。找到那四個數字，妳就會知道自己欠了誰。」' }
  ],
  objective: '找到禁書櫃的四位密碼，取回王室生命契約。',
  puzzle: 'code',
  answer: '1373',
  requires: 'watch',
  reward: '王室契約',
  evidence: 'birth',
  evidenceButton: '拼回帳頁',
  evidenceGate: '刻度旁有一行細小的刻字：「後兩位，寫在出生的帳上。」\n出生紀錄被撕碎了。先把它拼回原狀，才能讀到缺少的數字。',
  unlock: '四個刻度同時歸位，禁書櫃後方的暗門緩緩打開。冷風從石縫裡吹出，帶著封蠟與鐵鏽的氣味。',
  // Pre-seal deduction (魔鏡審問 for this act): the seal's digits follow from these blanks.
  deduction: {
    prompt: '魔鏡問：「這座學院多敲響的是哪一聲？出生的帳上，抵押了誰的生命？」',
    template: ['學院只有', 0, '，多敲響的那一聲是', 1, '，代表一道禁忌魔法被啟動。出生帳上抵押了', 2, '的生命，落款的是', 3, '。'],
    blanks: [
      { group: 'number', answer: 'twelve' },
      { group: 'number', answer: 'thirteenth' },
      { group: 'number', answer: 'children73' },
      { group: 'person', answer: 'king' }
    ]
  },
  spots: [
    {
      id: 'bells',
      label: '鐘塔手札',
      icon: 'book',
      view: 'desk',
      x: 41,
      y: 52,
      text: '「學院只有十二座鐘塔，每晚最多敲響十二聲。多出來的每一聲，都代表一道禁忌魔法被啟動。」\n妳想起醒來時聽見的鐘聲。今夜，它多敲了一下。',
      clues: ['thirteenth', 'twelve'],
      clue: true
    },
    {
      id: 'watch',
      label: '黃金懷錶',
      icon: 'clock',
      x: 21,
      y: 62,
      text: '錶蓋內刻著一行字，卻被倒走的齒輪擋住，只露出頭尾：「鐘……在前，……在後。」',
      // Readable once the act's evidence (ledger and gears) is restored: the gears no longer cover it.
      restoredText: '齒輪歸位，指針重新往前走。錶蓋內的刻字完整露了出來：「鐘聲在前，代價在後。」',
      clues: ['watchback'],
      item: 'watch',
      itemName: '黃金懷錶',
      clue: true
    },
    {
      id: 'birth',
      label: '出生紀錄',
      icon: 'scroll',
      x: 29,
      y: 67,
      text: '帳頁被撕成九片，散落在桌上。墨跡在裂縫處斷開：「確保公主出生：抵押……名兒童的……生命。」\n缺少的數字，就在這些碎片之間。',
      restoredText: '帳頁拼回原狀：「確保公主出生：抵押七十三名兒童的完整生命。」\n簽名欄被一道新的墨漬蓋住，只剩下王室的蠟印。七十三個人，換來妳的第一聲啼哭。',
      restoredClues: ['children73'],
      clue: true
    },
    {
      id: 'lock1',
      label: '禁書櫃封印',
      icon: 'lock',
      x: 89,
      y: 78,
      text: '四個刻度。封印只接受四位數字。',
      lock: true
    },
    {
      id: 'contract',
      label: '暗門後的契約',
      icon: 'scroll',
      x: 85,
      y: 38,
      after: 'solved',
      text: '暗門後的石台上，壓著一份以血蠟封緘的王室契約：「以王室血脈為擔保，換取霜棘王國百年的溫暖。」\n落款的筆跡妳再熟悉不過——那是妳父親的簽名。原來，魔法從來不是免費的。',
      item: 'contract',
      itemName: '王室契約',
      clue: true
    },
    {
      id: 'tower',
      label: '鐘塔窗口',
      icon: 'clock',
      x: 65,
      y: 32,
      text: '窗外的鐘塔只亮著十二盞燈。第十三盞的位置是黑的，像有人剛把它吹熄。\n鐘擺的影子在石板上來回，每一次都比前一次慢了一點。'
    },
    {
      id: 'chain',
      label: '門外的鎖鏈',
      icon: 'lock',
      x: 80,
      y: 58,
      text: '鎖鏈在門外被拖過石地，停在妳的門前，沒有再動。\n門縫下滲進一道冷光——不是走廊的燈，是鏡子的反光。',
      clues: ['chain'],
      clue: true
    },
    {
      id: 'waxseal',
      label: '王室蠟印',
      icon: 'scroll',
      view: 'desk',
      x: 26,
      y: 74,
      text: '桌角的蠟塊還帶著餘溫，印面是一頂三尖的王冠。\n能蓋下這個印的人，整個霜棘王國只有一位。',
      clues: ['king'],
      clue: true
    },
    {
      id: 'spine',
      label: '被撕走書頁的禁書',
      icon: 'book',
      view: 'desk',
      x: 52,
      y: 70,
      text: '書脊上燙著金字：《抵押與代償》。被撕走的那幾頁，邊緣留著同樣的蠟印。\n殘頁寫著：「每一道禁忌魔法，都要有人預先付出代價。」',
      clues: ['forbidden'],
      clue: true
    },
    {
      id: 'inkwell',
      label: '打翻的墨水',
      icon: 'gem',
      view: 'desk',
      x: 15,
      y: 72,
      text: '墨水還沒有乾，順著桌沿一滴一滴落下。有人剛剛在這裡蓋掉了一個簽名。\n墨漬的形狀，像一個被刻意抹去的名字。',
      clues: ['ink'],
      clue: true
    },
    {
      id: 'toby',
      label: '記憶：玻璃心臟',
      icon: 'gem',
      x: 60,
      y: 80,
      after: 'ending',
      memory: true,
      text: '妳想起那顆被妳偷走的玻璃心臟。裡面的男孩缺了一根手指，和貧民區失蹤的孩子一模一樣。\n妳問他叫什麼名字。他說：「托比。」\n他沒有說媽媽在哪裡，只是一直重複：「不要讓他們帶走妹妹。」'
    },
    {
      id: 'shard-library',
      label: '鏡之碎片',
      icon: 'gem',
      x: 44,
      y: 30,
      shard: true,
      text: '禁書櫃的玻璃上嵌著一片碎鏡。鏡中映出一個沒有名字的女孩，她正數著自己的手指，數到一半就停下來。妳把碎片收進口袋，不敢再看第二眼。'
    }
  ],
  // Step-aware hints (提示): three tiers for each stage of the evidence, the deduction and the seal.
  stages: ['ledger', 'watch'],
  stepHints: {
    ledger: [
      '出生紀錄在桌上。拼回帳頁和懷錶齒輪是同一份證據的兩道機關，先做哪一道都可以。',
      '看碎片邊框的斷口與文字走向：先把四個角放好，再一列一列補齊。',
      '依序交換這七組（格子由左到右、由上到下編號 1 到 9）：1↔2、2↔6、3↔4、4↔7、5↔6、6↔9、7↔9。做完九片就全部歸位。'
    ],
    watch: [
      '先轉一枚齒輪，看看它的下一枚怎麼動：每轉一格，下一枚就倒退一格。',
      '只有秒輪會把時輪拉回。先把分輪對準，最後再處理秒輪。',
      '暖身之後，轉分輪 2 次，再轉秒輪 2 次，三道刻痕就會同時對準。（轉時輪 4 次也可以。）'
    ],
    deduction: [
      '推理用的詞來自鐘塔手札、王室蠟印與修復後的出生紀錄。還沒收錄的話，先回到場景檢視它們。',
      '第一、二格是數字：鐘塔有幾座、今夜多敲的是哪一聲；第三格是被抵押的人數；第四格是能蓋下三尖王冠蠟印的人。',
      '十二座鐘塔 → 第十三聲 → 七十三名兒童 → 國王。'
    ],
    seal: [
      '齒輪歸位後，懷錶的刻字讀得到了：「鐘聲在前，代價在後。」四位數字就藏在推理的答案裡。',
      '前兩位是「不應存在」的那一聲鐘，後兩位是出生帳上抵押的人數。',
      '密碼是 1373：前兩位 13 是不應存在的第十三聲，後兩位 73 是出生帳上抵押的孩子人數。'
    ]
  }
};
