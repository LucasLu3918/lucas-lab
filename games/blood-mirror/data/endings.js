// The three endings. Text is shown on the ending screen.
// `epilogue` is a short operable coda: the player picks one of two gestures and reads its line.
export const endings = {
  dawn: {
    title: '春天沒有記住她',
    eyebrow: 'TRUE ENDING · 無名的黎明',
    text: '妳先交出工程藍圖，讓蒸汽塔替代魔法結界。最後，妳把名字交給魔鏡。\n' +
      '\n' +
      '所有生命抵押終止。伊萊、奈菈與整個世界，都忘了妳。\n' +
      '\n' +
      '八年後，妳走進一間茶館。灰眼睛的男人問：「我們以前見過嗎？」\n' +
      '妳笑著搖頭。這一次，沒有魔法，沒有王冠。只有一杯熱茶。',
    quote: '「叫我白吧。」',
    epilogue: {
      prompt: '茶館的窗外下著雪。桌上有兩只杯子，妳的手指停在其中一只上。',
      options: [
        { id: 'hold', label: '握住自己的杯子', text: '熱氣透過瓷杯傳進掌心。妳第一次不必為誰的生命付帳。' },
        { id: 'offer', label: '把另一杯推向對面', text: '對面沒有人坐，妳卻仍習慣為誰留一杯茶。男人低頭笑了，沒有說話。' }
      ]
    }
  },
  frost: {
    title: '沒有名字的冬天',
    eyebrow: 'ENDING II · 霜潮',
    text: '妳立刻將名字交給魔鏡。所有抵押都獲得自由，結界卻也一同消失。\n\n蒸汽塔還未準備好，北方七座城市迎來霜潮。那些妳想救的人，在沒有魔法的雪夜裡等待天亮。\n\n妳活了下來，卻必須用餘生面對這場選擇的代價。',
    quote: '自由需要準備，善意仍需承擔後果。',
    epilogue: {
      prompt: '北方的城牆上，第一片霜落在妳的袖口。城裡的燈一盞盞亮起，又一盞盞熄滅。',
      options: [
        { id: 'count', label: '數城牆上還亮著的燈', text: '妳數到第七十三盞，才發現那是一盞都沒有熄滅的燈。' },
        { id: 'walk', label: '走下城牆，去敲每一扇門', text: '有人開門，有人關上。妳仍把熱湯遞出去，直到鍋子見底。' }
      ]
    }
  },
  crown: {
    title: '血色王冠',
    eyebrow: 'ENDING III · 永恆的契約',
    text: '妳保住自己的名字，坐上王座。城市依舊溫暖，生命帳簿卻翻開了新的一頁。\n\n魔鏡稱讚妳是仁慈的女王。妳說，等到下一個春天，妳一定會改變一切。\n\n鏡中的薇菈也曾這樣說。',
    quote: '「代價永遠存在。只是不一定由妳支付。」',
    epilogue: {
      prompt: '王座廳的鏡面映出妳的倒影。鏡中有一排孩子，正牽著彼此的手，等妳開口。',
      options: [
        { id: 'look', label: '回頭看鏡中的孩子們', text: '他們的手仍牽著，沒有人叫妳的名字。妳忽然想不起自己為什麼坐在這裡。' },
        { id: 'sit', label: '轉身坐回王座，不去看鏡子', text: '鏡面裂開一道細縫，裡面傳來一個孩子的笑聲，很輕，很快就消失了。' }
      ]
    }
  }
};
