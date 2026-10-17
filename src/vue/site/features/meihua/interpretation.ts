// 斷卦文案：依體用生克、互卦、變卦、旺衰與動爻組出固定規則的句子。所有句子都以「卦象顯示」「可能」等可能性語氣表達，
// 負面關係一律附上可執行的方向（見 fortune-core/ethics 的檢查規則）。
import {
  RELATION_LABELS, timingHint, topicView, type MeihuaReading, type Relation, type Strength, type Topic, type TopicView,
} from './meihua';

export interface MeihuaInterpretation {
  tiYong: string;
  nuclear: string;
  changed: string;
  strength: string;
  overall: string;
  suggestions: string[];
  timing: string;
  topic: TopicView | null;
}

const RELATION_TEXT: Record<Relation, (yong: string, yongElement: string, ti: string, tiElement: string) => string> = {
  'yong-generates-ti': (yong, yongElement, ti, tiElement) =>
    `用卦${yong}（${yongElement}）生體卦${ti}（${tiElement}），此為用生體，卦象顯示外在條件對問卦者有助益，事情較有主動向好的傾向。`,
  'ti-generates-yong': (yong, yongElement, ti, tiElement) =>
    `體卦${ti}（${tiElement}）生用卦${yong}（${yongElement}），此為體生用，問卦者需要投入較多心力；結果可以期待，但過程中留意精力與資源的耗用。`,
  'yong-controls-ti': (yong, yongElement, ti, tiElement) =>
    `用卦${yong}（${yongElement}）克體卦${ti}（${tiElement}），此為用克體，卦象顯示外部阻力較強，時機宜審慎，不宜強行推進。`,
  'ti-controls-yong': (yong, yongElement, ti, tiElement) =>
    `體卦${ti}（${tiElement}）克用卦${yong}（${yongElement}），此為體克用，問卦者較能掌握局面，事情大致在自己的把握之中，可以適度推進。`,
  same: (_yong, yongElement) =>
    `體用五行同為${yongElement}，比和之卦，事情發展較平穩，無明顯起伏；結果多取決於自身努力與外部細節。`,
};

const STRENGTH_TEXT: Record<Strength, string> = {
  旺: '體卦正當令，承受外力的能力較足，判斷可以偏向目前的趨勢。',
  相: '體卦處於次旺的位置，仍有一定的承受力，可參考旺衰的修正後再判斷。',
  休: '體卦力量平和，承受力一般；若是克體之象，壓力會被放大，若是生體之象，助力會更容易感受到。',
  囚: '體卦目前偏弱，承受外力的能力有限；若是克體之象，宜先保守，留出調整空間。',
  死: '體卦目前最弱，不宜獨自承擔大幅變動；若是生體之象，仍能感受到外部的支援。',
};

const OVERALL_DIRECTION: Record<'favorable' | 'mixed' | 'caution' | 'neutral', string> = {
  favorable: '整體偏向較有利的方向',
  mixed: '整體需要有條件地推進',
  caution: '整體需要審慎，先穩住節奏',
  neutral: '整體偏向平穩發展',
};

const SUGGESTIONS: Record<'favorable' | 'mixed' | 'caution' | 'neutral', string[]> = {
  favorable: ['趁勢推進，但先把目標與期限寫清楚。', '保留一份備案，讓順利的走向更穩定。'],
  mixed: ['先確認可投入的資源上限，再分階段投入。', '每完成一個階段就回頭檢視，看趨勢是否如預期。'],
  caution: ['先降低風險，避免一次承擔太多。', '若有合適時機，可等待體卦五行旺相的月份再行動，並準備替代方案。'],
  neutral: ['依既有節奏穩定推進，留意細節與溝通。', '若問題涉及他人，先把彼此的期待說清楚。'],
};

const TIMING_NOTE = '應期只是參考方向，不作精確預測。';

function relationLevel(relation: Relation) {
  return RELATION_LABELS[relation].level;
}

function sentenceFor(reading: MeihuaReading, relation: Relation, yong: { name: string; element: string }) {
  return RELATION_TEXT[relation](yong.name, yong.element, reading.ti.name, reading.ti.element);
}

/** 綜合判斷以本卦體用為主；互卦、變卦只在主判斷為中性時，才用來補充方向。 */
function overallLevel(reading: MeihuaReading): 'favorable' | 'mixed' | 'caution' | 'neutral' {
  const primary = relationLevel(reading.relation);
  if (primary !== 'neutral') return primary;
  const changed = relationLevel(reading.changed.relation);
  return changed === 'neutral' ? 'neutral' : changed;
}

export function interpret(reading: MeihuaReading, topic: Topic = 'general'): MeihuaInterpretation {
  const yong = reading.yong;
  const ti = reading.ti;
  const primaryLabel = RELATION_LABELS[reading.relation].label;
  const level = overallLevel(reading);
  const nuclearLabel = RELATION_LABELS[reading.nuclear.relation].label;
  const changedLabel = RELATION_LABELS[reading.changed.relation].label;
  const strength = reading.strength;
  const strengthNote = STRENGTH_TEXT[strength];

  return {
    tiYong: sentenceFor(reading, reading.relation, { name: yong.name, element: yong.element }),
    nuclear: `互卦為${reading.nuclear.hexagram.name}，取用卦所在的半卦，與體卦相比為${nuclearLabel}；此為事情進行的中間過程，${RELATION_LABELS[reading.nuclear.relation].level === 'caution' ? '中途可能有阻力，宜逐步確認' : '中途的變化大致可以掌握'}。`,
    changed: `變卦為${reading.changed.hexagram.name}，第 ${reading.moving} 爻動而變化，變卦的用卦與體卦相比為${changedLabel}；此為結果的走向，${RELATION_LABELS[reading.changed.relation].level === 'caution' ? '最終仍需留意外部阻力' : '結局傾向於較順的方向'}。`,
    strength: `體卦${ti.element}在${reading.season.label}為「${strength}」。${strengthNote}`,
    overall: `綜合來看，本卦${reading.primary.name}的體用為${primaryLabel}，${OVERALL_DIRECTION[level]}；旺衰只調整力度，不改變方向。`,
    suggestions: SUGGESTIONS[level],
    timing: `${timingHint(reading)}${TIMING_NOTE}`,
    topic: topicView(reading, topic),
  };
}
