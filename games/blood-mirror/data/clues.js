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
  throne: { label: '空王座', group: 'object' }
};

export const clueGroups = { person: '人物', concept: '概念', object: '物件', action: '動作', number: '數字與時間' };
