// Chapter "library": content only. Rules live in engine/.
export default {
  id: 'library',
  title: '黑鐘書庫',
  subtitle: '第十三聲鐘響',
  chapter: '第一幕',
  image: 'chamber.webp',
  atmosphere: 'library',
  intro: '午夜，黑鐘學院敲響了第十三聲。妳在禁書庫醒來。門外有人拖動鎖鏈，而桌上的懷錶……正在倒著走。',
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
      x: 22,
      y: 56,
      text: '「學院只有十二座鐘塔，每晚最多敲響十二聲。多出來的每一聲，都代表一道禁忌魔法被啟動。」\n妳想起醒來時聽見的鐘聲。今夜，它多敲了一下。',
      clues: ['thirteenth', 'twelve'],
      clue: true
    },
    {
      id: 'watch',
      label: '黃金懷錶',
      icon: 'clock',
      x: 38,
      y: 74,
      text: '錶蓋內刻著兩句話：「前兩位是那不應存在的鐘聲。後兩位，是公主誕生時抵押的生命。」',
      clues: ['watchback'],
      item: 'watch',
      itemName: '黃金懷錶',
      clue: true
    },
    {
      id: 'birth',
      label: '出生紀錄',
      icon: 'scroll',
      x: 67,
      y: 48,
      text: '帳頁被撕成九片，散落在桌上。墨跡在裂縫處斷開：「確保公主出生：抵押……名兒童的……生命。」\n缺少的數字，就在這些碎片之間。',
      restoredText: '帳頁拼回原狀：「確保公主出生：抵押七十三名兒童的完整生命。」\n簽名欄被一道新的墨漬蓋住，只剩下王室的蠟印。七十三個人，換來妳的第一聲啼哭。',
      restoredClues: ['children73'],
      clue: true
    },
    {
      id: 'lock1',
      label: '禁書櫃封印',
      icon: 'lock',
      x: 83,
      y: 63,
      text: '四個刻度。封印只接受四位數字。',
      lock: true
    },
    {
      id: 'contract',
      label: '暗門後的契約',
      icon: 'scroll',
      x: 82,
      y: 30,
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
      x: 52,
      y: 32,
      text: '窗外的鐘塔只亮著十二盞燈。第十三盞的位置是黑的，像有人剛把它吹熄。\n鐘擺的影子在石板上來回，每一次都比前一次慢了一點。'
    },
    {
      id: 'chain',
      label: '門外的鎖鏈',
      icon: 'lock',
      x: 8,
      y: 80,
      text: '鎖鏈在門外被拖過石地，停在妳的門前，沒有再動。\n門縫下滲進一道冷光——不是走廊的燈，是鏡子的反光。',
      clues: ['chain'],
      clue: true
    },
    {
      id: 'waxseal',
      label: '王室蠟印',
      icon: 'scroll',
      x: 72,
      y: 66,
      text: '桌角的蠟塊還帶著餘溫，印面是一頂三尖的王冠。\n能蓋下這個印的人，整個霜棘王國只有一位。',
      clues: ['king'],
      clue: true
    },
    {
      id: 'spine',
      label: '被撕走書頁的禁書',
      icon: 'book',
      x: 36,
      y: 34,
      text: '書脊上燙著金字：《抵押與代償》。被撕走的那幾頁，邊緣留著同樣的蠟印。\n殘頁寫著：「每一道禁忌魔法，都要有人預先付出代價。」',
      clues: ['forbidden'],
      clue: true
    },
    {
      id: 'inkwell',
      label: '打翻的墨水',
      icon: 'gem',
      x: 50,
      y: 58,
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
      x: 10,
      y: 30,
      shard: true,
      text: '禁書櫃的玻璃上嵌著一片碎鏡。鏡中映出一個沒有名字的女孩，她正數著自己的手指，數到一半就停下來。妳把碎片收進口袋，不敢再看第二眼。'
    }
  ],
  hints: [
    '先檢視鐘塔手札、王室蠟印與出生紀錄，把線索詞收進推理簿。拼回帳頁後才讀得到抵押的人數。',
    '推理共四格：前兩格是數字（鐘塔的數量與多出的那一聲），第三格是被抵押的人數，第四格是落款的人。',
    '推理成立後，密碼是「第十三聲」接「七十三名兒童」：1373。'
  ]
};
