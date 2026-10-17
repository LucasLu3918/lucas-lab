// 梅花易數（邵雍）起卦與體用計算。規則依 docs/plan/FORTUNE_HUB_PLAN.md §3.7：
// 上卦、下卦與動爻都由數字取餘得出；本卦、互卦、變卦由卦爻推導；體用以動爻所在的半卦為用。
import { toLunarDate } from '../fortune-core/calendar';

export const MEIHUA_METHOD_VERSION = 'meihua-shaoyong-v1';

export type Element = '金' | '木' | '水' | '火' | '土';
export type CastMethod = 'time' | 'numbers' | 'text';
export type Relation = 'yong-generates-ti' | 'ti-generates-yong' | 'yong-controls-ti' | 'ti-controls-yong' | 'same';
export type Strength = '旺' | '相' | '休' | '囚' | '死';
export type Topic = 'general' | 'love' | 'career' | 'wealth' | 'health';

export interface Trigram {
  /** 先天八卦數：1 乾、2 兌、3 離、4 震、5 巽、6 坎、7 艮、8 坤。 */
  number: number;
  name: string;
  symbol: string;
  element: Element;
  direction: string;
  /** 三爻由上至下，1 為陽、0 為陰（與先天八卦數表相同）。 */
  lines: string;
  /** 類象：人物、事業、身體、器物。 */
  attributes: Record<'person' | 'career' | 'body' | 'object', string>;
}

// 依先天八卦數順序排列；索引 = 先天數 − 1。
export const TRIGRAMS: readonly Trigram[] = [
  { number: 1, name: '乾', symbol: '☰', element: '金', direction: '西北', lines: '111', attributes: { person: '君主、父親、長官、長者（男）', career: '權力、政治、領導、競爭', body: '頭、骨、肺、大腸', object: '金屬器具、圓形物' } },
  { number: 2, name: '兌', symbol: '☱', element: '金', direction: '西', lines: '011', attributes: { person: '少女、歌手、律師、口才好的人', career: '演講、談判、法律、金融', body: '口、舌、牙齒、喉嚨、肺', object: '口器、樂器、刀剪' } },
  { number: 3, name: '離', symbol: '☲', element: '火', direction: '南', lines: '101', attributes: { person: '中年女性、學者、文人', career: '文化、教育、媒體、藝術', body: '眼、心臟、血液、小腸', object: '燈具、書本、文件' } },
  { number: 4, name: '震', symbol: '☳', element: '木', direction: '東', lines: '001', attributes: { person: '長男、領導者、開拓者、運動員', career: '創業、行動、體育、農業', body: '肝、膽、足、聲音', object: '木製品、鼓、車輛' } },
  { number: 5, name: '巽', symbol: '☴', element: '木', direction: '東南', lines: '110', attributes: { person: '長女、商人、旅行者、外國人', career: '貿易、物流、諮詢、外交', body: '大腿、神經系統、氣管', object: '繩索、細長木製物、信件' } },
  { number: 6, name: '坎', symbol: '☵', element: '水', direction: '北', lines: '010', attributes: { person: '中男、智者、隱士', career: '水利、航運、策劃、暗中謀劃', body: '腎、膀胱、耳朵、血液', object: '水器、鏡子、輪子' } },
  { number: 7, name: '艮', symbol: '☶', element: '土', direction: '東北', lines: '100', attributes: { person: '少男、隱士、道士、醫生', career: '地產、倉儲、醫療、停滯', body: '手、背、脾胃、鼻子', object: '石頭、土製品、瓦器' } },
  { number: 8, name: '坤', symbol: '☷', element: '土', direction: '西南', lines: '000', attributes: { person: '母親、老年女性、大眾、農民', career: '農業、房地產、團隊合作', body: '腹部、脾臟、肌肉', object: '方形物、布匹、車輛' } },
];

// 六十四卦名，列為下卦（行）× 上卦（欄），順序同 TRIGRAMS。
const HEXAGRAM_NAMES: readonly (readonly string[])[] = [
  ['乾為天', '澤天夬', '火天大有', '雷天大壯', '風天小畜', '水天需', '山天大畜', '地天泰'],
  ['天澤履', '兌為澤', '火澤睽', '雷澤歸妹', '風澤中孚', '水澤節', '山澤損', '地澤臨'],
  ['天火同人', '澤火革', '離為火', '雷火豐', '風火家人', '水火既濟', '山火賁', '地火明夷'],
  ['天雷無妄', '澤雷隨', '火雷噬嗑', '震為雷', '風雷益', '水雷屯', '山雷頤', '地雷復'],
  ['天風姤', '澤風大過', '火風鼎', '雷風恆', '巽為風', '水風井', '山風蠱', '地風升'],
  ['天水訟', '澤水困', '火水未濟', '雷水解', '風水渙', '坎為水', '山水蒙', '地水師'],
  ['天山遯', '澤山咸', '火山旅', '雷山小過', '風山漸', '水山蹇', '艮為山', '地山謙'],
  ['天地否', '澤地萃', '火地晉', '雷地豫', '風地觀', '水地比', '山地剝', '坤為地'],
];

// 收錄的常用字筆畫（取自規則表）。未收錄的字請改用數字起卦，避免用錯筆畫數。
const STROKES: Record<string, number> = {
  一: 1, 人: 2, 大: 3, 心: 4, 木: 4, 水: 4, 金: 8, 事: 8, 业: 5, 業: 13, 合: 6, 好: 6, 工: 3,
  财: 7, 財: 10, 情: 11, 婚: 11, 家: 10, 健: 11, 考: 6, 运: 7, 運: 12, 求: 7, 升: 4, 作: 7,
  天: 4, 地: 6, 山: 3, 日: 4, 月: 4, 火: 4, 土: 3, 上: 3, 下: 3, 中: 4, 愛: 13, 爱: 10, 錢: 16,
};

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
const BRANCH_ELEMENT: Record<(typeof BRANCHES)[number], Element> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
};
// 農曆正月為寅，依月序排列地支；以農曆月近似月令，未以節氣精算。
const MONTH_BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const;
const ELEMENT_MONTHS: Record<Element, string> = { 金: '申、酉', 木: '寅、卯', 水: '亥、子', 火: '巳、午', 土: '辰、戌、丑、未' };
const LINE_TIMING = [
  '時間較久，或趨向當日起始階段', '約數日之內', '約三日之內，或本月之內', '約一個月之內，或近一季',
  '可能較快，約五日之內', '時間較遠，或事情趨於收束',
];

const GENERATES: Record<Element, Element> = { 金: '水', 水: '木', 木: '火', 火: '土', 土: '金' };
const CONTROLS: Record<Element, Element> = { 金: '木', 木: '土', 土: '水', 水: '火', 火: '金' };

export interface CastSeeds {
  upper: number;
  lower: number;
  moving: number;
}

export interface Hexagram {
  name: string;
  upper: Trigram;
  lower: Trigram;
}

export interface HalfRelation {
  hexagram: Hexagram;
  /** 與體卦比較的用卦（取原用卦所在的半卦）。 */
  yong: Trigram;
  relation: Relation;
}

export interface MeihuaReading {
  method: CastMethod;
  methodVersion: string;
  /** 逐步的計算過程，供使用者核對。 */
  steps: string[];
  primary: Hexagram;
  nuclear: HalfRelation;
  changed: HalfRelation;
  moving: number;
  /** 動爻在上卦時，用卦為上卦；否則為下卦。 */
  yongPosition: 'upper' | 'lower';
  yong: Trigram;
  ti: Trigram;
  relation: Relation;
  season: { branch: string; element: Element; label: string };
  strength: Strength;
  /** 時間起卦時的農曆換算說明。 */
  lunar?: string;
}

export function trigramOf(seed: number): Trigram {
  return TRIGRAMS[((seed % 8) || 8) - 1];
}

/** 動爻：取餘 6，餘 0 取 6。 */
export function movingLineOf(seed: number): number {
  return (seed % 6) || 6;
}

function linesBottomUp(trigram: Trigram): number[] {
  return [...trigram.lines].reverse().map(Number);
}

function trigramFromBottomUp(bits: readonly number[]): Trigram {
  const top = [...bits].reverse().join('');
  const found = TRIGRAMS.find(item => item.lines === top);
  if (!found) throw new RangeError('無法辨識的三爻組合。');
  return found;
}

function hexagramOf(upper: Trigram, lower: Trigram): Hexagram {
  return { name: HEXAGRAM_NAMES[lower.number - 1][upper.number - 1], upper, lower };
}

export function relationOf(yong: Element, ti: Element): Relation {
  if (yong === ti) return 'same';
  if (GENERATES[yong] === ti) return 'yong-generates-ti';
  if (GENERATES[ti] === yong) return 'ti-generates-yong';
  if (CONTROLS[yong] === ti) return 'yong-controls-ti';
  return 'ti-controls-yong';
}

export const RELATION_LABELS: Record<Relation, { label: string; level: 'favorable' | 'mixed' | 'caution' | 'neutral' }> = {
  'yong-generates-ti': { label: '用生體', level: 'favorable' },
  'ti-generates-yong': { label: '體生用', level: 'mixed' },
  'yong-controls-ti': { label: '用克體', level: 'caution' },
  'ti-controls-yong': { label: '體克用', level: 'favorable' },
  same: { label: '比和', level: 'neutral' },
};

/** 旺衰：以當令五行（本月月令之地支）判斷體卦五行的力量。 */
export function strengthOf(body: Element, season: Element): Strength {
  if (body === season) return '旺';
  if (GENERATES[season] === body) return '相';
  if (GENERATES[body] === season) return '休';
  if (CONTROLS[body] === season) return '囚';
  return '死';
}

export function seasonOf(lunarMonth: number): { branch: string; element: Element; label: string } {
  const month = ((lunarMonth - 1) % 12 + 12) % 12;
  const branch = MONTH_BRANCHES[month];
  const element = BRANCH_ELEMENT[branch as (typeof BRANCHES)[number]];
  const label = element === '土' ? '四季末（辰戌丑未月）' : `${element}當令（${branch}月）`;
  return { branch, element, label };
}

/** 由上卦數、下卦數與動爻數組出本卦、互卦、變卦與體用。 */
export function castFromSeeds(seeds: CastSeeds, method: CastMethod, context: { lunarMonth: number; steps: string[]; lunar?: string }): MeihuaReading {
  const upper = trigramOf(seeds.upper);
  const lower = trigramOf(seeds.lower);
  const moving = movingLineOf(seeds.moving);
  const bitsBottomUp = [...linesBottomUp(lower), ...linesBottomUp(upper)];

  const primary = hexagramOf(upper, lower);
  const nuclearLower = trigramFromBottomUp(bitsBottomUp.slice(1, 4));
  const nuclearUpper = trigramFromBottomUp(bitsBottomUp.slice(2, 5));
  const nuclearHexagram = hexagramOf(nuclearUpper, nuclearLower);
  const changedBits = bitsBottomUp.map((bit, index) => (index === moving - 1 ? 1 - bit : bit));
  const changedHexagram = hexagramOf(trigramFromBottomUp(changedBits.slice(3, 6)), trigramFromBottomUp(changedBits.slice(0, 3)));

  const yongPosition: 'upper' | 'lower' = moving >= 4 ? 'upper' : 'lower';
  const yong = yongPosition === 'upper' ? upper : lower;
  const ti = yongPosition === 'upper' ? lower : upper;
  const season = seasonOf(context.lunarMonth);
  const nuclearYong = yongPosition === 'upper' ? nuclearHexagram.upper : nuclearHexagram.lower;
  const changedYong = yongPosition === 'upper' ? changedHexagram.upper : changedHexagram.lower;

  return {
    method,
    methodVersion: MEIHUA_METHOD_VERSION,
    steps: context.steps,
    primary,
    nuclear: { hexagram: nuclearHexagram, yong: nuclearYong, relation: relationOf(nuclearYong.element, ti.element) },
    changed: { hexagram: changedHexagram, yong: changedYong, relation: relationOf(changedYong.element, ti.element) },
    moving,
    yongPosition,
    yong,
    ti,
    relation: relationOf(yong.element, ti.element),
    season,
    strength: strengthOf(ti.element, season.element),
    lunar: context.lunar,
  };
}

/** 時間起卦：農曆年支序數 + 月 + 日為上卦；再加時支為下卦；全數為動爻。 */
export function castByTimeIndices(input: { yearBranch: number; lunarMonth: number; lunarDay: number; hourBranch: number; lunarLabel?: string }): MeihuaReading {
  const upperSum = input.yearBranch + input.lunarMonth + input.lunarDay;
  const lowerSum = upperSum + input.hourBranch;
  const branch = BRANCHES[input.yearBranch - 1];
  const steps = [
    `年支：${branch} = ${input.yearBranch}`,
    `上卦數：(${input.yearBranch} + ${input.lunarMonth} + ${input.lunarDay}) % 8 = ${upperSum % 8 || 8}`,
    `下卦數：(${upperSum} + ${input.hourBranch}) % 8 = ${lowerSum % 8 || 8}`,
    `動爻：${lowerSum} % 6 = ${lowerSum % 6 || 6}`,
  ];
  return castFromSeeds({ upper: upperSum, lower: lowerSum, moving: lowerSum }, 'time', {
    lunarMonth: input.lunarMonth,
    steps,
    lunar: input.lunarLabel,
  });
}

/** 數字起卦：兩數為上下卦、和為動爻；三數依序為上、下、動；單數則拆成上下兩段。 */
export function castByNumbers(values: readonly number[], now = new Date()): MeihuaReading {
  if (values.length < 1 || values.length > 3 || values.some(value => !Number.isSafeInteger(value) || value < 0)) {
    throw new RangeError('請輸入一到三個非負整數，例如「7 3」。');
  }
  const monthNow = currentLunarMonth(now);
  let seeds: CastSeeds;
  let steps: string[];
  if (values.length === 1) {
    const digits = String(values[0]);
    const split = digits.length === 1 ? 1 : Math.ceil(digits.length / 2);
    const upper = Number(digits.slice(0, split));
    const lower = digits.length === 1 ? values[0] : Number(digits.slice(split));
    seeds = { upper, lower, moving: values[0] };
    steps = [`數字 ${digits}：前段 ${upper} 為上卦，後段 ${digits.length === 1 ? digits : digits.slice(split)} 為下卦`, `動爻：${values[0]} % 6 = ${movingLineOf(values[0])}`];
  } else if (values.length === 2) {
    seeds = { upper: values[0], lower: values[1], moving: values[0] + values[1] };
    steps = [`上卦數：${values[0]} % 8 = ${trigramOf(values[0]).number}`, `下卦數：${values[1]} % 8 = ${trigramOf(values[1]).number}`, `動爻：(${values[0]} + ${values[1]}) % 6 = ${movingLineOf(seeds.moving)}`];
  } else {
    seeds = { upper: values[0], lower: values[1], moving: values[2] };
    steps = [`上卦數：${values[0]} % 8 = ${trigramOf(values[0]).number}`, `下卦數：${values[1]} % 8 = ${trigramOf(values[1]).number}`, `動爻：${values[2]} % 6 = ${movingLineOf(values[2])}`];
  }
  return castFromSeeds(seeds, 'numbers', { lunarMonth: monthNow, steps });
}

/** 文字起卦：第一字筆畫為上卦，第二字為下卦，全部筆畫和為動爻；單字時上、下、動皆取該字筆畫。 */
export function castByText(text: string, now = new Date()): MeihuaReading {
  const characters = Array.from(text.replace(/\s+/g, ''));
  if (characters.length < 1 || characters.length > 4) throw new RangeError('請輸入一到四個字。');
  const strokes = characters.map(character => {
    const count = STROKES[character];
    if (count === undefined) throw new RangeError(`「${character}」尚未收錄筆畫，請改用數字起卦。`);
    return count;
  });
  const total = strokes.reduce((sum, count) => sum + count, 0);
  const upper = strokes[0];
  const lower = strokes.length === 1 ? strokes[0] : strokes[1];
  const steps = [
    `筆畫：${characters.map((character, index) => `${character} ${strokes[index]} 畫`).join('、')}`,
    `上卦數：${upper} % 8 = ${trigramOf(upper).number}`,
    `下卦數：${lower} % 8 = ${trigramOf(lower).number}`,
    `動爻：${total} % 6 = ${movingLineOf(total)}`,
  ];
  return castFromSeeds({ upper, lower, moving: total }, 'text', { lunarMonth: currentLunarMonth(now), steps });
}

function currentLunarMonth(now: Date): number {
  return toLunarDate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }).month;
}

/** 時間起卦以本機目前時間換算農曆；時辰依子時 23–1 時起算。 */
export function castByCurrentTime(now = new Date()): MeihuaReading {
  const lunar = toLunarDate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
  const yearBranch = BRANCHES.indexOf(lunar.ganzhiYear.slice(1, 2) as (typeof BRANCHES)[number]) + 1;
  const hourBranch = Math.floor(((now.getHours() + 1) % 24) / 2) + 1;
  const monthLabel = `${lunar.isLeapMonth ? '閏' : ''}${lunar.month} 月`;
  const lunarLabel = `${lunar.ganzhiYear}年 ${monthLabel} ${lunar.day} 日 ${BRANCHES[hourBranch - 1]}時`;
  return castByTimeIndices({ yearBranch, lunarMonth: lunar.month, lunarDay: lunar.day, hourBranch, lunarLabel });
}

export interface TopicView {
  label: string;
  body: string;
  yong: string;
}

const TOPIC_DIMENSION: Record<Exclude<Topic, 'general'>, { label: string; key: keyof Trigram['attributes'] }> = {
  love: { label: '感情（人物象）', key: 'person' },
  career: { label: '事業（事業象）', key: 'career' },
  wealth: { label: '財運（器物象）', key: 'object' },
  health: { label: '健康（身體象）', key: 'body' },
};

/** 依問題方向列出體、用兩卦的類象；一般問題不列。 */
export function topicView(reading: MeihuaReading, topic: Topic): TopicView | null {
  if (topic === 'general') return null;
  const dimension = TOPIC_DIMENSION[topic];
  return {
    label: dimension.label,
    body: `體卦${reading.ti.name}：${reading.ti.attributes[dimension.key]}`,
    yong: `用卦${reading.yong.name}：${reading.yong.attributes[dimension.key]}`,
  };
}

export function timingHint(reading: MeihuaReading): string {
  return `應期參考可看${reading.ti.element}旺的月份（${ELEMENT_MONTHS[reading.ti.element]}）；動爻為第 ${reading.moving} 爻，${LINE_TIMING[reading.moving - 1]}。`;
}
