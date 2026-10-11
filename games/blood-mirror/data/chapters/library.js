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
  spots: [
    {
      id: 'bells',
      label: '鐘塔手札',
      icon: 'book',
      x: 22,
      y: 56,
      text: '「學院只有十二座鐘塔，每晚最多敲響十二聲。多出來的每一聲，都代表一道禁忌魔法被啟動。」\n妳想起醒來時聽見的鐘聲。今夜，它多敲了一下。',
      clue: true
    },
    {
      id: 'watch',
      label: '黃金懷錶',
      icon: 'clock',
      x: 38,
      y: 74,
      text: '錶蓋內刻著兩句話：「前兩位是那不應存在的鐘聲。後兩位，是公主誕生時抵押的生命。」',
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
      id: 'toby',
      label: '記憶：玻璃心臟',
      icon: 'gem',
      x: 60,
      y: 80,
      after: 'ending',
      memory: true,
      text: '妳想起那顆被妳偷走的玻璃心臟。裡面的男孩缺了一根手指，和貧民區失蹤的孩子一模一樣。\n妳問他叫什麼名字。他說：「托比。」\n他沒有說媽媽在哪裡，只是一直重複：「不要讓他們帶走妹妹。」'
    }
  ],
  hints: [
    '懷錶規定了密碼的順序。鐘塔手札和醒來時的鐘聲，能告訴妳前兩位。',
    '出生紀錄被撕碎了。打開它並拼回帳頁，就能讀到後兩位。',
    '第十三聲 + 七十三名兒童：1373。'
  ]
};
