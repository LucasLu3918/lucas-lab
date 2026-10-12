// Inventory items: name, icon key and the description shown in the inventory. A `keepsake` is never
// used on anything; the inventory says so, so players do not hunt for a use that does not exist.
export const items = {
  watch: {
    name: '黃金懷錶',
    icon: 'clock',
    text: '它為別人偷走每一分鐘。指針倒著走，像能讓時間回到某件事發生之前。'
  },
  valve: {
    name: '銅製閥柄',
    icon: 'gear',
    text: '赫索的工具。柄上烙著：冷水歸爐火邊第一張床，熱泉歸正中間那張床，出口歸門邊最後一張床。'
  },
  apple: {
    name: '毒蘋果',
    icon: 'apple',
    text: '它讓呼吸停止，卻讓意識進入魔鏡。'
  },
  needle: {
    name: '魔法銀針',
    icon: 'key',
    text: '挑開契約的接縫。真相不是原諒，但真相可以終結謊言。'
  },
  witness: {
    name: '見證者手稿',
    icon: 'scroll',
    keepsake: true,
    text: '白雪才是最後的血脈繼承人。名字一旦消失，生命抵押便失去主人。'
  },
  contract: {
    name: '王室契約',
    icon: 'scroll',
    text: '以王室血脈擔保的生命契約。落款是妳父親的簽名——這筆帳，從妳出生那天就開始記。背面是空白的。'
  },
  blueprint: {
    name: '工程藍圖',
    icon: 'scroll',
    text: '地下熱泉 → 蒸汽管線 → 城市暖氣。先建設與遷移，再解除魔法結界。'
  },
  lantern: {
    name: '礦工提燈',
    icon: 'gear',
    text: '玻璃罩上刻著七個歪斜的記號，像七個小孩各自畫上去的名字。'
  },
  candle: {
    name: '守夜燭台',
    icon: 'clock',
    text: '燭芯被人剪過許多次。有人在玻璃棺旁守了很久。'
  },
  thimble: {
    name: '銀頂針',
    icon: 'key',
    text: '內側磨得發亮。縫了無數次兔耳的指尖，就是被它保護的。'
  },
  ribbon: {
    name: '露西的髮帶',
    icon: 'scroll',
    text: '褪色的紅髮帶，結打得很用力，像是怕自己被帶走。'
  },
  foxmask: {
    name: '銀狐面具',
    icon: 'mirror',
    text: '內側繡著一個名字：「安娜貝爾」。面具比臉更能保守祕密。'
  },
  glove: {
    name: '伊萊的黑手套',
    icon: 'scroll',
    keepsake: true,
    text: '指尖被灼燒過的黑色皮手套。它遮住的，是一隻為了別人而燒傷的手。'
  },
  knife: {
    name: '生鏽的獵刀',
    icon: 'key',
    text: '本來是用來取走一顆心的刀，刀刃上卻沒有一滴血。'
  },
  toy: {
    name: '托比的木頭玩具',
    icon: 'gem',
    keepsake: true,
    text: '被磨得發亮的木頭玩具。底部的刻字很用力，像怕自己忘記。'
  }
};
