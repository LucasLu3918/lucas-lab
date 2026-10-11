// The secret epilogue (祕密尾聲「露西的母親」). Unlocked once every shard is collected.
// It answers the memory question Lucy asked in the mirror act (memory spot `lucy-mother`).
// Two short scenes: each gesture is one choice, and each choice has its own reply.
export const secretEpilogue = {
  title: '露西的母親',
  eyebrow: 'SECRET EPILOGUE · 祕密尾聲',
  opening: [
    '妳把所有碎片拼回成一面小小的圓鏡。鏡中，露西的母親坐在窗邊，等著一個不會來的敲門聲。'
  ],
  scenes: [
    {
      prompt: '她抬起頭，看見妳，像是早就知道妳會來。「她還好嗎？」',
      options: [
        { id: 'alive', label: '「她還活著，在很遠的地方。」', text: '母親閉上眼睛，像是終於能鬆開一直握緊的手。「那就夠了。」' },
        { id: 'quiet', label: '沉默，只把碎片放在窗台上', text: '她看了很久那片碎鏡，然後輕輕點頭。「謝謝妳替我把它帶回來。」' }
      ]
    },
    {
      prompt: '妳想了很久，才說出露西問過的那句話。',
      options: [
        { id: 'tell', label: '「她問過我，妳後來怎麼樣了。」', text: '母親笑了，眼角有淚。「告訴她，我一直在數著她的名字。」' },
        { id: 'hold', label: '「她不想讓妳難過。」', text: '母親搖搖頭。「我知道。所以我更想聽她親口說。」' }
      ]
    }
  ],
  closing: [
    '鏡面慢慢暗下去，只留下一行字，像是有人用指尖寫在霧上：「名字不是王冠給的。」'
  ]
};
