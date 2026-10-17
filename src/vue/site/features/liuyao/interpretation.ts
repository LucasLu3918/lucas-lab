// 斷卦文案：依世應、用神旺衰、原忌神、動爻與變卦，以固定規則組出句子。所有句子都以「卦象顯示」「趨勢」等可能性語氣表達，
// 負面情況一律附上可執行的方向（見 fortune-core/ethics 的檢查規則）。
import { TOPIC_YONG, type Direction, type LiuyaoReading, type Relation, type Strength, type Topic, type YongAnalysis } from './liuyao';

export interface LiuyaoInterpretation {
  structure: string;
  yong: string;
  moving: string;
  changed: string;
  overall: string;
  suggestions: string[];
  timing: string;
  topicNote: string;
}

const SHI_YING_TEXT: Record<Relation, string> = {
  generates: '世生應，問卦者較願意付出，對方的回應還需要再觀察。',
  generated: '應生世，對方或外部條件較主動，對問卦者有所助益。',
  controls: '世克應，問卦者較能主導局面，但要留意對方的不配合。',
  controlled: '應克世，對方或外部條件較占上風，宜審慎評估後再推進。',
  same: '世應比和，雙方立場相近，較容易取得共識。',
};

const STRENGTH_TEXT: Record<Strength, string> = {
  旺: '月令當令，力量充足',
  相: '月令次旺，仍有餘力',
  休: '月令力量平和，承受力一般',
  囚: '月令受制，力量偏弱',
  死: '月令失勢，力量最弱',
};

const LEVEL_TEXT: Record<'strong' | 'moderate' | 'weak', string> = {
  strong: '用神旺相有力，',
  moderate: '用神中平，吉凶取決於動爻與原忌神的消長，',
  weak: '用神偏弱，阻力較大，',
};

const DAY_RELATION_TEXT: Record<Relation, string> = {
  generates: '日辰生用神，有所扶助',
  generated: '日辰受用神所生，用神力量略有耗損',
  controls: '日辰克用神，短期內受制較明顯',
  controlled: '用神克日辰，需要耗力應對',
  same: '日辰與用神同類，力量相助',
};

const DIRECTION_TEXT: Record<Direction, string> = {
  favorable: '綜合來看，用神得力、動爻多有助力，卦象顯示當前時機較有利，可以積極推進。',
  mixed: '綜合來看，吉凶參半，卦象顯示需要分階段推進，並留意動爻的後續變化。',
  caution: '綜合來看，用神受制、阻力偏多，卦象顯示當前宜暫緩或先穩住節奏，待用神得令的時機再行推進。',
};

const SUGGESTIONS: Record<Direction, string[]> = {
  favorable: ['把握用神得令的時機，先定下可衡量的第一步。', '同時保留一份替代方案，讓順利的走向更穩定。'],
  mixed: ['先確認可投入的資源上限，再分階段推進。', '每個階段結束後回頭檢視，看動爻的變化是否如預期。'],
  caution: ['先降低風險，避免一次承擔過多。', '若必須推進，先處理忌神所在的方面，並準備替代方案。'],
};

const NO_DIRECTION_SUGGESTIONS = ['把問題拆成更具體的情境，逐項整理手上的資訊。', '卦象只是參考角度，最終仍以自己的判斷為主。'];

const TOPIC_SUGGESTION: Partial<Record<Topic, string>> = {
  wealth: '財務上請留意預算上限與風險承受度，避免把全部資源押在同一處。',
  career: '職場上可以把成果寫成具體紀錄，讓考核或評估有依據可循。',
  'love-male': '感情上多聽對方的想法，讓彼此的期待在對話中慢慢對齊。',
  'love-female': '感情上多聽對方的想法，讓彼此的期待在對話中慢慢對齊。',
  health: '若涉及身體狀況，請以就醫與專業醫療意見為準，卦象不能取代診斷。',
  contract: '合作或簽約前，把條件與權責寫成文件，逐條確認。',
  travel: '出行前留意天候、交通與行程安排，預留緩衝時間。',
  child: '家庭事務上，把期待與現實的節奏說清楚，循序漸進。',
  general: '把想要的結果與可接受的底線寫下來，有助於判斷下一步。',
};

function kinLabel(analysis: YongAnalysis): string {
  return analysis.target === '世' ? '世爻' : analysis.target;
}

function structureText(reading: LiuyaoReading): string {
  const parts = [`本卦${reading.primary.name}屬${reading.primary.palace.name}宮，第 ${reading.primary.shi} 爻持世、第 ${reading.primary.ying} 爻為應。`, SHI_YING_TEXT[reading.shiYing]];
  if (reading.clash) parts.push('六沖卦，內外對應爻兩兩相沖，事情容易反覆，關係較難穩定，宜先留出調整的空間。');
  if (reading.harmony) parts.push('六合卦，內外相合，較有凝聚力，但也可能表示現狀難以改變。');
  return parts.join('');
}

function yongText(reading: LiuyaoReading, analysis: YongAnalysis): string {
  const label = kinLabel(analysis);
  if (!analysis.yong.line) {
    return `用神${label}不上卦，屬伏藏之象，斷卦以動靜、世應與個人判斷為主，不宜僅憑此卦下結論。`;
  }
  const line = analysis.yong.line;
  const strength = analysis.monthStrength ? STRENGTH_TEXT[analysis.monthStrength] : '';
  const levelPart = analysis.level ? LEVEL_TEXT[analysis.level] : '';
  const dayPart = analysis.dayRelation ? `${DAY_RELATION_TEXT[analysis.dayRelation]}。` : '';
  const breakPart = analysis.monthBroken ? '月建沖用神，力量大減。' : analysis.dayBroken ? '日辰沖用神，短期內波動較大。' : '';
  const support = analysis.supportLines.length;
  const restrain = analysis.restrainLines.length;
  return [
    `用神${label}見於第 ${line.position} 爻（${line.branch}${line.element}，${line.kind}）。${strength}（${reading.monthLabel}）。`,
    `${levelPart}${dayPart}${breakPart}`,
    `原神（生助用神）${support} 爻，忌神（克制用神）${restrain} 爻。`,
  ].join('');
}

function movingText(reading: LiuyaoReading, analysis: YongAnalysis): string {
  if (!analysis.moving.length) return '本卦無動爻，事情較靜，走向以目前格局為主。';
  return analysis.moving.map(item => {
    const position = `第 ${item.line.position} 爻（${item.line.branch}${item.line.element}）動`;
    if (item.isYong) return `${position}，用神自身發動，事情正在變化中，宜留意變化的方向。`;
    if (!analysis.yong.line) return `${position}，可為事情的變數來源。`;
    if (item.clash) return `${position}，沖用神，變動較多，需要保留調整的餘地。`;
    if (item.harmony) return `${position}，合用神，事情容易互相牽連。`;
    switch (item.relation) {
      case 'generates':
      case 'same':
        return `${position}，生助或同類用神，有助力可以運用。`;
      case 'controls':
        return `${position}，克制用神，是當前的主要阻力，宜先處理此方面。`;
      case 'generated':
        return `${position}，用神被其所耗，投入的力量容易外流。`;
      case 'controlled':
        return `${position}，用神克制之，用神需要耗力應對。`;
      default:
        return `${position}，影響較為中性。`;
    }
  }).join('');
}

function changedText(reading: LiuyaoReading, analysis: YongAnalysis): string {
  if (!reading.changed) return '無動爻，沒有變卦；事情的走向以本卦為準。';
  const target = analysis.target;
  const stillPresent = target === '世' || reading.lines.some(line => line.changedKin === target);
  const tail = stillPresent ? `變卦中仍可見${kinLabel(analysis)}，後續仍需持續關注。` : `變卦中${kinLabel(analysis)}不再出現，事情後續可能轉向。`;
  return `變卦為${reading.changed.name}，代表事情後續的走向。${tail}`;
}

function timingText(analysis: YongAnalysis): string {
  if (!analysis.yong.line) return '應期：用神不上卦，時間點難以從卦象直接推斷。';
  const branches = analysis.seasonBranches.join('、');
  const element = analysis.yong.element;
  const hint = analysis.level === 'weak'
    ? '用神偏弱，宜待得令之月再行推進。'
    : analysis.level === 'strong' ? '用神已旺，可把握得令之月或動爻所在的時間點。' : '用神中平，可留意得令之月前後的節點。';
  const moving = analysis.moving.some(item => item.isYong) ? '用神發動，時間節奏可能較快。' : '';
  return `應期參考：${element}五行得令之月為${branches}。${hint}${moving}應期僅為參考方向，不作精確預測。`;
}

export function interpret(reading: LiuyaoReading, analysis: YongAnalysis): LiuyaoInterpretation {
  const direction = analysis.direction;
  const overall = direction ? DIRECTION_TEXT[direction] : '用神不上卦，卦象不足以直接判斷吉凶，宜以世應、動爻與個人判斷為主。';
  const suggestions = [...(direction ? SUGGESTIONS[direction] : NO_DIRECTION_SUGGESTIONS)];
  const topicNote = TOPIC_SUGGESTION[analysis.topic];
  if (topicNote) suggestions.push(topicNote);
  return {
    structure: structureText(reading),
    yong: yongText(reading, analysis),
    moving: movingText(reading, analysis),
    changed: changedText(reading, analysis),
    overall,
    suggestions,
    timing: timingText(analysis),
    topicNote: `${TOPIC_YONG[analysis.topic].label}：${TOPIC_YONG[analysis.topic].yongNote}`,
  };
}
