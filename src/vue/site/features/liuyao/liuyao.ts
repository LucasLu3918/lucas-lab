// 六爻（京房納甲）起卦、裝卦與用神旺衰計算。規則整理自 liuyao-yijing skill 的 calculation-rules.md，並依傳統京房體系校正：
// - 納支：艮宮內卦為辰午申、外卦為戌子寅（skill 表中艮宮一列有誤）。
// - 六親：以所屬宮的五行為「我」（乾為天以金為我，子孫為水）。
// - 旺相休囚死：休為生旺者，死為旺所克（skill 表中木旺一列的休與死互換）。
// 日辰以 lunar-javascript 換算，子時換日與 /bazi/ 相同（晚子時屬當天，00:00 換日）。
import { Solar } from 'lunar-javascript';

export const LIUYAO_METHOD_VERSION = 'liuyao-jingfang-najia-v1';

export type Element = '金' | '木' | '水' | '火' | '土';
export type CastMethod = 'coins' | 'numbers';
export type KinName = '父母' | '兄弟' | '子孫' | '妻財' | '官鬼';
export type Strength = '旺' | '相' | '休' | '囚' | '死';
export type Topic = 'general' | 'wealth' | 'career' | 'love-male' | 'love-female' | 'health' | 'child' | 'travel' | 'contract';
export type Relation = 'generates' | 'generated' | 'controls' | 'controlled' | 'same';
export type Level = 'strong' | 'moderate' | 'weak';
export type Direction = 'favorable' | 'mixed' | 'caution';

export interface Trigram {
  /** 先天八卦數：1 乾、2 兌、3 離、4 震、5 巽、6 坎、7 艮、8 坤。 */
  number: number;
  name: string;
  symbol: string;
  element: Element;
  /** 三爻由下至上，1 為陽、0 為陰。 */
  bits: readonly number[];
  innerStem: string;
  outerStem: string;
  innerBranches: readonly string[];
  outerBranches: readonly string[];
}

// 依先天八卦數順序排列；索引 = 先天數 − 1。
export const TRIGRAMS: readonly Trigram[] = [
  { number: 1, name: '乾', symbol: '☰', element: '金', bits: [1, 1, 1], innerStem: '甲', outerStem: '壬', innerBranches: ['子', '寅', '辰'], outerBranches: ['午', '申', '戌'] },
  { number: 2, name: '兌', symbol: '☱', element: '金', bits: [1, 1, 0], innerStem: '丁', outerStem: '丁', innerBranches: ['巳', '卯', '丑'], outerBranches: ['亥', '酉', '未'] },
  { number: 3, name: '離', symbol: '☲', element: '火', bits: [1, 0, 1], innerStem: '己', outerStem: '己', innerBranches: ['卯', '丑', '亥'], outerBranches: ['酉', '未', '巳'] },
  { number: 4, name: '震', symbol: '☳', element: '木', bits: [1, 0, 0], innerStem: '庚', outerStem: '庚', innerBranches: ['子', '寅', '辰'], outerBranches: ['午', '申', '戌'] },
  { number: 5, name: '巽', symbol: '☴', element: '木', bits: [0, 1, 1], innerStem: '辛', outerStem: '辛', innerBranches: ['丑', '亥', '酉'], outerBranches: ['未', '巳', '卯'] },
  { number: 6, name: '坎', symbol: '☵', element: '水', bits: [0, 1, 0], innerStem: '戊', outerStem: '戊', innerBranches: ['寅', '辰', '午'], outerBranches: ['申', '戌', '子'] },
  { number: 7, name: '艮', symbol: '☶', element: '土', bits: [0, 0, 1], innerStem: '丙', outerStem: '丙', innerBranches: ['辰', '午', '申'], outerBranches: ['戌', '子', '寅'] },
  { number: 8, name: '坤', symbol: '☷', element: '土', bits: [0, 0, 0], innerStem: '乙', outerStem: '癸', innerBranches: ['未', '巳', '卯'], outerBranches: ['丑', '亥', '酉'] },
];

// 八宮六十四卦，依本宮、一世至五世、游魂、歸魂排列；宮的順序同先天數。
const PALACE_NAMES: readonly (readonly string[])[] = [
  ['乾為天', '天風姤', '天山遯', '天地否', '風地觀', '山地剝', '火地晉', '火天大有'],
  ['兌為澤', '澤水困', '澤地萃', '澤山咸', '水山蹇', '地山謙', '雷山小過', '雷澤歸妹'],
  ['離為火', '火山旅', '火風鼎', '火水未濟', '山水蒙', '風水渙', '天水訟', '天火同人'],
  ['震為雷', '雷地豫', '雷水解', '雷風恆', '地風升', '水風井', '澤風大過', '澤雷隨'],
  ['巽為風', '風天小畜', '風火家人', '風雷益', '天雷無妄', '火雷噬嗑', '山雷頤', '山風蠱'],
  ['坎為水', '水澤節', '水雷屯', '水火既濟', '澤火革', '雷火豐', '地火明夷', '地水師'],
  ['艮為山', '山火賁', '山天大畜', '山澤損', '火澤睽', '天澤履', '風澤中孚', '風山漸'],
  ['坤為地', '地雷復', '地澤臨', '地天泰', '雷天大壯', '澤天夬', '水天需', '水地比'],
];
// 各卦在宮內的世爻位置（1 至 6）。游魂同四世，歸魂同三世。
const SHI_BY_SLOT = [6, 1, 2, 3, 4, 5, 4, 3] as const;

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
const BRANCH_ELEMENT: Record<(typeof BRANCHES)[number], Element> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
};
const BRANCH_CLASH: Record<string, string> = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };
const BRANCH_HARMONY: Record<string, string> = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
const GODS = ['青龍', '朱雀', '勾陳', '螣蛇', '白虎', '玄武'] as const;
const LINE_LABELS = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'] as const;
const STEM_START: Record<string, number> = { 甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5 };

const GENERATES: Record<Element, Element> = { 金: '水', 水: '木', 木: '火', 火: '土', 土: '金' };
const CONTROLS: Record<Element, Element> = { 金: '木', 木: '土', 土: '水', 水: '火', 火: '金' };

/** 用神依問題方向選定；「世」代表以世爻為用神。 */
export const TOPIC_YONG: Record<Topic, { label: string; yong: KinName | '世'; yongNote: string }> = {
  general: { label: '一般', yong: '世', yongNote: '未指定事項，以世爻代表問卦者自身。' },
  wealth: { label: '求財（投資、生意、薪資）', yong: '妻財', yongNote: '妻財代表財利與資源。' },
  career: { label: '事業、升遷、考試', yong: '官鬼', yongNote: '官鬼代表職位、考核與權威。' },
  'love-male': { label: '感情（男問）', yong: '妻財', yongNote: '男問以妻財代表伴侶。' },
  'love-female': { label: '感情（女問）', yong: '官鬼', yongNote: '女問以官鬼代表伴侶。' },
  child: { label: '求子、子女事', yong: '子孫', yongNote: '子孫代表子女與福澤。' },
  health: { label: '健康與身體狀況', yong: '官鬼', yongNote: '官鬼代表病象；官鬼旺而克世，病況較受牽制。' },
  travel: { label: '出行', yong: '世', yongNote: '出行以世爻代表自身狀態，另可參考妻財（交通與花費）。' },
  contract: { label: '合作、合同', yong: '父母', yongNote: '父母代表文書、合同與長輩；應爻代表對方。' },
};

export interface Hexagram {
  name: string;
  /** 三爻由下至上的陰陽，1 為陽、0 為陰。 */
  bits: readonly number[];
  upper: Trigram;
  lower: Trigram;
  palace: Trigram;
  shi: number;
  ying: number;
  /** 所屬宮的序號，本宮為 0，歸魂為 7。 */
  slot: number;
}

export interface LiuyaoLine {
  position: number;
  label: string;
  yang: boolean;
  moving: boolean;
  /** 老陽、少陽、少陰、老陰。 */
  kind: string;
  stem: string;
  branch: string;
  element: Element;
  kin: KinName;
  god: string;
  shi: boolean;
  ying: boolean;
  changedBranch: string | null;
  changedElement: Element | null;
  changedKin: KinName | null;
}

export interface YongLine {
  line: LiuyaoLine | null;
  target: KinName | '世';
  element: Element;
  /** 同六親的爻不止一個時，記錄候選數量。 */
  candidates: number;
}

export interface LiuyaoReading {
  method: CastMethod;
  methodVersion: string;
  /** 逐步的計算過程，供使用者核對。 */
  steps: string[];
  primary: Hexagram;
  changed: Hexagram | null;
  lines: LiuyaoLine[];
  movingPositions: number[];
  palaceElement: Element;
  monthBranch: string;
  monthLabel: string;
  dayStem: string;
  dayBranch: string;
  dayLabel: string;
  shiYing: Relation;
  clash: boolean;
  harmony: boolean;
  /** 起卦當下的月建與日辰換算說明。 */
  calendarNote: string;
}

export interface YongAnalysis {
  topic: Topic;
  target: KinName | '世';
  yong: YongLine;
  monthStrength: Strength | null;
  monthBroken: boolean;
  dayBroken: boolean;
  dayRelation: Relation | null;
  level: Level | null;
  /** 原神：生助用神的六親（不含用神本身）。 */
  supportLines: LiuyaoLine[];
  /** 忌神：克制用神的六親。 */
  restrainLines: LiuyaoLine[];
  moving: Array<{ line: LiuyaoLine; relation: Relation | null; clash: boolean; harmony: boolean; isYong: boolean }>;
  direction: Direction | null;
  /** 應期參考：用神五行得令（旺）的月份地支。 */
  seasonBranches: readonly string[];
}

/** 天干地支元素。 */
export function branchElement(branch: string): Element {
  return BRANCH_ELEMENT[branch as (typeof BRANCHES)[number]];
}

export function relationOf(from: Element, to: Element): Relation {
  if (from === to) return 'same';
  if (GENERATES[from] === to) return 'generates';
  if (GENERATES[to] === from) return 'generated';
  if (CONTROLS[from] === to) return 'controls';
  return 'controlled';
}

/** 依先天數取卦：餘數為 0 取 8（坤）。 */
export function trigramOf(seed: number): Trigram {
  return TRIGRAMS[((seed % 8) || 8) - 1];
}

/** 動爻：取餘 6，餘 0 取上爻（6）。 */
export function movingLineOf(seed: number): number {
  return (seed % 6) || 6;
}

function trigramFromBits(bits: readonly number[]): Trigram {
  const found = TRIGRAMS.find(item => item.bits.every((bit, index) => bit === bits[index]));
  if (!found) throw new RangeError('無法辨識的三爻組合。');
  return found;
}

function flipLines(bits: readonly number[], positions: readonly number[]): number[] {
  return bits.map((bit, index) => (positions.includes(index) ? 1 - bit : bit));
}

// 八宮推演：一世至五世依序自本宮變動一爻，游魂為五世變四爻，歸魂取游魂之上卦與本宮之下卦。
function palaceBits(palace: Trigram): number[][] {
  const base = [...palace.bits, ...palace.bits];
  const cumulative = (count: number) => flipLines(base, Array.from({ length: count }, (_, index) => index));
  const fifth = cumulative(5);
  const wandering = flipLines(fifth, [3]);
  // 歸魂：下卦仍為本宮，上卦為游魂的上卦（bits 由下至上，前三位為下卦）。
  const returning = [...palace.bits, ...wandering.slice(3)];
  return [base, cumulative(1), cumulative(2), cumulative(3), cumulative(4), fifth, wandering, returning];
}

const HEXAGRAMS_BY_KEY = new Map<string, Hexagram>();
const HEXAGRAMS_BY_NAME = new Map<string, Hexagram>();
TRIGRAMS.forEach((palace, palaceIndex) => {
  palaceBits(palace).forEach((bits, slot) => {
    const hexagram: Hexagram = {
      name: PALACE_NAMES[palaceIndex][slot],
      bits,
      upper: trigramFromBits(bits.slice(3)),
      lower: trigramFromBits(bits.slice(0, 3)),
      palace,
      shi: SHI_BY_SLOT[slot],
      ying: SHI_BY_SLOT[slot] <= 3 ? SHI_BY_SLOT[slot] + 3 : SHI_BY_SLOT[slot] - 3,
      slot,
    };
    HEXAGRAMS_BY_KEY.set(bits.join(''), hexagram);
    HEXAGRAMS_BY_NAME.set(hexagram.name, hexagram);
  });
});

export function hexagramByName(name: string): Hexagram | undefined {
  return HEXAGRAMS_BY_NAME.get(name);
}

function hexagramOfBits(bits: readonly number[]): Hexagram {
  const found = HEXAGRAMS_BY_KEY.get(bits.join(''));
  if (!found) throw new RangeError('無法辨識的六爻組合。');
  return found;
}

/** 依納甲取得某爻的天干與地支。 */
function lineStemBranch(bits: readonly number[], position: number): { stem: string; branch: string } {
  const index = position - 1;
  if (index < 3) {
    const trigram = trigramFromBits(bits.slice(0, 3));
    return { stem: trigram.innerStem, branch: trigram.innerBranches[index] };
  }
  const trigram = trigramFromBits(bits.slice(3));
  return { stem: trigram.outerStem, branch: trigram.outerBranches[index - 3] };
}

/** 六親：以所屬宮的五行為「我」。 */
export function kinOf(element: Element, palaceElement: Element): KinName {
  if (element === palaceElement) return '兄弟';
  if (GENERATES[palaceElement] === element) return '子孫';
  if (GENERATES[element] === palaceElement) return '父母';
  if (CONTROLS[palaceElement] === element) return '妻財';
  return '官鬼';
}

/** 旺相休囚死：以月建地支的五行為當令，依生克判斷其他五行的強弱。 */
export function strengthOf(element: Element, monthBranch: string): Strength {
  const season = BRANCH_ELEMENT[monthBranch as (typeof BRANCHES)[number]];
  if (element === season) return '旺';
  if (GENERATES[season] === element) return '相';
  if (GENERATES[element] === season) return '休';
  if (CONTROLS[element] === season) return '囚';
  return '死';
}

export function elementBranches(element: Element): string[] {
  return BRANCHES.filter(branch => BRANCH_ELEMENT[branch] === element);
}

function lineLabel(yang: boolean, moving: boolean): string {
  if (yang) return moving ? '老陽' : '少陽';
  return moving ? '老陰' : '少陰';
}

function buildLines(bits: readonly number[], moving: readonly number[], changedBits: readonly number[] | null, palaceElement: Element, dayStem: string): LiuyaoLine[] {
  const startIndex = STEM_START[dayStem];
  return bits.map((bit, index) => {
    const position = index + 1;
    const { stem, branch } = lineStemBranch(bits, position);
    const element = branchElement(branch);
    const changedBranch = changedBits ? lineStemBranch(changedBits, position).branch : null;
    return {
      position,
      label: LINE_LABELS[index],
      yang: bit === 1,
      moving: moving.includes(position),
      kind: lineLabel(bit === 1, moving.includes(position)),
      stem,
      branch,
      element,
      kin: kinOf(element, palaceElement),
      god: GODS[(startIndex + index) % 6],
      shi: false,
      ying: false,
      changedBranch,
      changedElement: changedBranch ? branchElement(changedBranch) : null,
      changedKin: changedBranch ? kinOf(branchElement(changedBranch), palaceElement) : null,
    };
  });
}

function dayInfo(now: Date) {
  const eightChar = Solar.fromYmdHms(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()).getLunar().getEightChar();
  eightChar.setSect(2);
  const monthBranch = eightChar.getMonthZhi();
  const dayStem = eightChar.getDayGan();
  const dayBranch = eightChar.getDayZhi();
  return { monthBranch, dayStem, dayBranch, monthLabel: `${monthBranch}月`, dayLabel: `${dayStem}${dayBranch}日` };
}

function finishReading(method: CastMethod, yangBits: readonly number[], moving: number[], steps: string[], now: Date): LiuyaoReading {
  const primary = hexagramOfBits(yangBits);
  const changedBits = moving.length ? flipLines(yangBits, moving.map(position => position - 1)) : null;
  const changed = changedBits ? hexagramOfBits(changedBits) : null;
  const time = dayInfo(now);
  const lines = buildLines(yangBits, moving, changedBits, primary.palace.element, time.dayStem);
  lines.forEach(line => {
    line.shi = line.position === primary.shi;
    line.ying = line.position === primary.ying;
  });
  const shiLine = lines[primary.shi - 1];
  const yingLine = lines[primary.ying - 1];
  // 六沖卦：內外卦對應爻兩兩相沖；六合卦：兩兩相合。
  const clash = lines.slice(0, 3).every((line, index) => BRANCH_CLASH[line.branch] === lines[index + 3].branch);
  const harmony = lines.slice(0, 3).every((line, index) => BRANCH_HARMONY[line.branch] === lines[index + 3].branch);
  const calendarNote = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日，月建${time.monthBranch}（節氣分月）、日辰${time.dayLabel.slice(0, -1)}`;
  return {
    method,
    methodVersion: LIUYAO_METHOD_VERSION,
    steps: [...steps, `本卦：${primary.name}（${primary.palace.name}宮，第 ${primary.shi} 爻為世、第 ${primary.ying} 爻為應）`, changed ? `變卦：${changed.name}` : '無動爻，沒有變卦。'],
    primary,
    changed,
    lines,
    movingPositions: moving,
    palaceElement: primary.palace.element,
    monthBranch: time.monthBranch,
    monthLabel: time.monthLabel,
    dayStem: time.dayStem,
    dayBranch: time.dayBranch,
    dayLabel: time.dayLabel,
    shiYing: relationOf(shiLine.element, yingLine.element),
    clash,
    harmony,
    calendarNote,
  };
}

/**
 * 銅錢起卦：六次，由初爻到上爻。每次為三枚銅錢正面的枚數（0 至 3）。
 * 3 正為老陽（動）、2 正為少陽、1 正為少陰、0 正為老陰（動）。
 */
export function castByCoins(heads: readonly number[], now: Date): LiuyaoReading {
  if (heads.length !== 6 || heads.some(count => !Number.isInteger(count) || count < 0 || count > 3)) throw new RangeError('銅錢起卦需要六次結果，每次為 0 至 3 枚正面。');
  const bits: number[] = [];
  const moving: number[] = [];
  const steps: string[] = [];
  heads.forEach((count, index) => {
    const yang = count >= 2;
    const isMoving = count === 0 || count === 3;
    bits.push(yang ? 1 : 0);
    if (isMoving) moving.push(index + 1);
    const label = lineLabel(yang, isMoving);
    steps.push(`第 ${index + 1} 掷（${LINE_LABELS[index]}）：正 ${count} 枚 → ${label}${isMoving ? '（動爻）' : ''}`);
  });
  return finishReading('coins', bits, moving, steps, now);
}

/**
 * 報數起卦：一數時上下卦同取，動爻為該數取餘 6；兩數時依序為上卦、下卦，兩數相加取餘 6 為動爻。
 */
export function castByNumbers(numbers: readonly number[], now: Date): LiuyaoReading {
  if (numbers.length < 1 || numbers.length > 2) throw new RangeError('報數起卦請輸入一至兩個數字。');
  if (numbers.some(value => !Number.isInteger(value) || value < 0)) throw new RangeError('數字需為非負整數。');
  const [first, second] = numbers;
  const upperSeed = first;
  const lowerSeed = numbers.length === 2 ? second : first;
  const upper = trigramOf(upperSeed);
  const lower = trigramOf(lowerSeed);
  const movingPosition = movingLineOf(numbers.length === 2 ? first + second : first);
  const steps = numbers.length === 2
    ? [`上卦：${first} ÷ 8 取餘 ${first % 8 || 8} → ${upper.name}`, `下卦：${second} ÷ 8 取餘 ${second % 8 || 8} → ${lower.name}`, `動爻：(${first} + ${second}) ÷ 6 取餘 ${(first + second) % 6 || 6} → 第 ${movingPosition} 爻`]
    : [`上下卦：${first} ÷ 8 取餘 ${first % 8 || 8} → ${upper.name}`, `動爻：${first} ÷ 6 取餘 ${first % 6 || 6} → 第 ${movingPosition} 爻`];
  const bits = [...lower.bits, ...upper.bits];
  return finishReading('numbers', bits, [movingPosition], steps, now);
}

/** 依用神六親選擇爻：有動爻優先，其次持世，再取旺衰較強者。 */
export function selectYong(reading: LiuyaoReading, target: KinName | '世'): YongLine {
  const shiLine = reading.lines[reading.primary.shi - 1];
  if (target === '世') return { line: shiLine, target, element: shiLine.element, candidates: 1 };
  const candidates = reading.lines.filter(line => line.kin === target);
  if (!candidates.length) return { line: null, target, element: elementOfKin(target, reading.palaceElement), candidates: 0 };
  const rank = (line: LiuyaoLine) => (line.moving ? 3 : 0) + (line.shi ? 2 : 0) + ({ 旺: 4, 相: 3, 休: 2, 囚: 1, 死: 0 } as Record<Strength, number>)[strengthOf(line.element, reading.monthBranch)];
  const chosen = [...candidates].sort((a, b) => rank(b) - rank(a) || a.position - b.position)[0];
  return { line: chosen, target, element: chosen.element, candidates: candidates.length };
}

// 用神不上卦（伏藏）時，以六親對應的五行推定其元素，供旺衰與應期提示使用。
function elementOfKin(kin: KinName, palaceElement: Element): Element {
  const elements: Element[] = ['金', '木', '水', '火', '土'];
  return elements.find(element => kinOf(element, palaceElement) === kin) ?? palaceElement;
}

function levelOf(strength: Strength, monthBroken: boolean, dayRelation: Relation | null, dayBroken: boolean): Level {
  let score = ({ 旺: 2, 相: 1, 休: 0, 囚: -1, 死: -2 } as Record<Strength, number>)[strength];
  if (monthBroken) score -= 2;
  if (dayBroken) score -= 1;
  if (dayRelation === 'same' || dayRelation === 'generated') score += 1;
  if (dayRelation === 'controls') score -= 1;
  if (score >= 1) return 'strong';
  if (score <= -1) return 'weak';
  return 'moderate';
}

/** 用神分析：旺衰、月破日破、原忌神、動爻與應期。 */
export function analyzeYong(reading: LiuyaoReading, topic: Topic): YongAnalysis {
  const target = TOPIC_YONG[topic].yong;
  const yong = selectYong(reading, target);
  const element = yong.element;
  const monthStrength = strengthOf(element, reading.monthBranch);
  // 月破、日破：月建或日辰沖用神所在的地支。
  const monthBroken = yong.line ? BRANCH_CLASH[reading.monthBranch] === yong.line.branch : false;
  const dayBroken = yong.line ? BRANCH_CLASH[reading.dayBranch] === yong.line.branch : false;
  const dayRelation = relationOf(branchElement(reading.dayBranch), element);
  const level = levelOf(monthStrength, monthBroken, dayRelation, dayBroken);
  const lines = reading.lines;
  const supportLines = lines.filter(line => line !== yong.line && GENERATES[line.element] === element);
  const restrainLines = lines.filter(line => line !== yong.line && CONTROLS[line.element] === element);
  const moving = lines.filter(line => line.moving).map(line => {
    const isYong = line === yong.line;
    const relation = isYong ? null : relationOf(line.element, element);
    return {
      line,
      relation,
      clash: BRANCH_CLASH[line.branch] === yong.line?.branch,
      harmony: BRANCH_HARMONY[line.branch] === yong.line?.branch,
      isYong,
    };
  });
  // 伏藏（用神不上卦）時無法判斷方向，僅列出旺衰與應期。
  let direction: Direction | null = null;
  if (yong.line) {
    const favor = moving.filter(item => !item.isYong && (item.relation === 'generates' || item.relation === 'same' || item.harmony)).length;
    const caution = moving.filter(item => !item.isYong && (item.relation === 'controls' || item.clash)).length;
    const score = favor - caution + (level === 'strong' ? 1 : level === 'weak' ? -1 : 0);
    direction = score >= 1 ? 'favorable' : score <= -1 ? 'caution' : 'mixed';
  }
  return {
    topic,
    target,
    yong,
    monthStrength,
    monthBroken,
    dayBroken,
    dayRelation,
    level,
    supportLines,
    restrainLines,
    moving,
    direction,
    seasonBranches: elementBranches(element),
  };
}
