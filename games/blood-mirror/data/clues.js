// Clue words (線索詞) collected from scene text into the deduction notebook.
// `group` decides which kind of blank a word can fill in the mirror interrogation.
export const clueWords = {
  thirteenth: { label: '第十三聲', group: 'number' },
  heir: { label: '失蹤的公主', group: 'person' },
  queen: { label: '薇菈王后', group: 'person' },
  prince: { label: '奧瑞恩王子', group: 'person' },
  blood: { label: '王室血脈', group: 'concept' },
  forgotten: { label: '遺忘', group: 'action' },
  remembered: { label: '記住', group: 'action' },
  throne: { label: '空王座', group: 'object' },
  // Act 1: the black-bell library
  twelve: { label: '十二座鐘塔', group: 'number' },
  forbidden: { label: '禁忌魔法', group: 'concept' },
  watchback: { label: '倒走的懷錶', group: 'object' },
  chain: { label: '門外的鎖鏈', group: 'object' },
  ink: { label: '新的墨漬', group: 'object' },
  king: { label: '國王', group: 'person' },
  children73: { label: '七十三名兒童', group: 'number' },
  // The blood-red ball (added in M6)
  invitation: { label: '血色請柬', group: 'object' },
  frozen: { label: '凝結的賓客', group: 'concept' },
  lastdance: { label: '最後一支舞', group: 'concept' },
  rosepetals: { label: '玫瑰花瓣', group: 'object' },
  blackglove: { label: '黑手套', group: 'object' },
  mirrorhall: { label: '鏡廳', group: 'object' },
  // The hunter's heart (added in M6)
  snowwhite: { label: '白雪', group: 'person' },
  toby: { label: '托比', group: 'person' },
  child: { label: '失蹤的孩子', group: 'person' },
  hide: { label: '隱瞞', group: 'action' },
  glassheart: { label: '玻璃心臟', group: 'object' },
  knife: { label: '獵刀', group: 'object' },
  blackpine: { label: '黑松林', group: 'object' },
  // Act 2: the silver-bone mine
  names: { label: '名字', group: 'concept' },
  silverbone: { label: '銀骨礦石', group: 'object' },
  barrier: { label: '魔法結界', group: 'object' },
  heatenergy: { label: '熱能', group: 'concept' },
  frost: { label: '霜潮', group: 'object' },
  coldwater: { label: '冷水', group: 'object' },
  hesso: { label: '赫索', group: 'person' },
  cityseven: { label: '七座城市', group: 'number' },
  // Act 3: the glass crypt
  seventytwo: { label: '七十二道', group: 'number' },
  unchanged: { label: '沒有改變', group: 'action' },
  mirrorrealm: { label: '魔鏡內部', group: 'object' },
  eli: { label: '伊萊', group: 'person' },
  moon: { label: '月亮', group: 'object' },
  breath: { label: '終止呼吸', group: 'action' },
  veil: { label: '蒙塵的白紗', group: 'object' },
  lucy: { label: '露西', group: 'person' },
  // Act 4: the queen's chamber
  lover: { label: '愛人', group: 'person' },
  contract: { label: '契約', group: 'concept' },
  silverneedle: { label: '銀針', group: 'object' },
  thirdway: { label: '第三種方法', group: 'concept' },
  crown: { label: '王冠', group: 'object' },
  grayrabbit: { label: '灰兔', group: 'object' },
  // Act 5: the mirror realm
  children: { label: '七十三個孩子', group: 'person' },
  mirrorcorridor: { label: '鏡像走廊', group: 'object' }
};

export const clueGroups = { person: '人物', concept: '概念', object: '物件', action: '動作', number: '數字與時間' };
