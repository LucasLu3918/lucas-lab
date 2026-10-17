// 風水命理：八宅本命卦與八方吉凶，以及玄空飛星（九運、四正向）。規則依 docs/plan/FORTUNE_HUB_PLAN.md §3.10：
// 本命卦依出生年份與性別換算；八宅星依命卦固定排布；玄空以運星入中宮，山星與向星依坐向順逆飛布。
import { createMethodResult, type MethodResult } from '../fortune-core/result';

export const FENGSHUI_METHOD_VERSION = 'fengshui-bazhai-xuankong-v1';

export type Gender = 'male' | 'female';
export type Fortune = '吉' | '中' | '凶';
export type Star = '生氣' | '天醫' | '延年' | '伏位' | '絕命' | '五鬼' | '六煞' | '禍害';
export type Direction = '北' | '東北' | '東' | '東南' | '南' | '西南' | '西' | '西北';
export type Group = '東四命' | '西四命';

// 八方的固定順序，與八宅表的欄位順序一致。
export const DIRECTIONS: readonly Direction[] = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];

export const GUA_INFO: Record<number, { name: string; element: string; direction: Direction; group: Group }> = {
  1: { name: '坎', element: '水', direction: '北', group: '東四命' },
  2: { name: '坤', element: '土', direction: '西南', group: '西四命' },
  3: { name: '震', element: '木', direction: '東', group: '東四命' },
  4: { name: '巽', element: '木', direction: '東南', group: '東四命' },
  6: { name: '乾', element: '金', direction: '西北', group: '西四命' },
  7: { name: '兌', element: '金', direction: '西', group: '西四命' },
  8: { name: '艮', element: '土', direction: '東北', group: '西四命' },
  9: { name: '離', element: '火', direction: '南', group: '東四命' },
};

// 八宅表：每個命卦在八方的星，順序同 DIRECTIONS。每一列都是八星的排列，且東四命的吉星落在北、東、東南、南，
// 西四命的吉星落在西、西北、西南、東北。兌卦與巽卦依校正值（技能檔的表有重複與漏列，見 §3.10）。
const BA_ZHAI: Record<number, readonly Star[]> = {
  1: ['伏位', '五鬼', '天醫', '生氣', '延年', '絕命', '六煞', '禍害'],
  2: ['五鬼', '延年', '六煞', '禍害', '絕命', '生氣', '天醫', '伏位'],
  3: ['天醫', '六煞', '伏位', '延年', '生氣', '禍害', '絕命', '五鬼'],
  4: ['生氣', '禍害', '延年', '伏位', '天醫', '五鬼', '六煞', '絕命'],
  6: ['六煞', '天醫', '五鬼', '絕命', '禍害', '伏位', '延年', '生氣'],
  7: ['禍害', '延年', '絕命', '六煞', '五鬼', '天醫', '伏位', '生氣'],
  8: ['絕命', '伏位', '禍害', '五鬼', '六煞', '延年', '生氣', '天醫'],
  9: ['延年', '絕命', '生氣', '天醫', '伏位', '六煞', '禍害', '五鬼'],
};

export const STAR_FORTUNE: Record<Star, Fortune> = {
  生氣: '吉', 天醫: '吉', 延年: '吉', 伏位: '中', 絕命: '凶', 五鬼: '凶', 六煞: '凶', 禍害: '凶',
};

export const STAR_ORDER: readonly Star[] = ['生氣', '天醫', '延年', '伏位', '絕命', '五鬼', '六煞', '禍害'];

// 卦數 → 八宅表的列；每列都與 BA_ZHAI 一致。
export function eightMansions(gua: number): Array<{ direction: Direction; star: Star; fortune: Fortune }> {
  const row = BA_ZHAI[gua];
  if (!row) throw new Error('命卦數需為 1、2、3、4、6、7、8、9 其中之一');
  return DIRECTIONS.map((direction, index) => ({ direction, star: row[index], fortune: STAR_FORTUNE[row[index]] }));
}

// 數字根：反覆相加各位數，直到個位數。
function digitRoot(value: number): number {
  let current = value;
  while (current > 9) {
    current = String(current).split('').reduce((sum, digit) => sum + Number(digit), 0);
  }
  return current;
}

// 把任意整數化為 1 至 9，0 取 9（即 mod 9，餘 0 作 9）。
function toGuaNumber(value: number): number {
  const remainder = ((value % 9) + 9) % 9;
  return remainder === 0 ? 9 : remainder;
}

export interface NatalKua {
  gua: number;
  name: string;
  group: Group;
  steps: string[];
}

export const BIRTH_YEAR_RANGE = { min: 1900, max: 2100 } as const;

// 出生日期（YYYY-MM-DD）的格式與日期是否存在。農曆換算在 lunar.ts 進行，因此這裡不載入曆法套件。
export function parseBirthDate(birthDate: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) throw new Error('出生日期格式應為 YYYY-MM-DD');
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error('出生日期不存在，請重新確認');
  }
  return { year, month, day };
}

// 本命卦：2000 年（含）以前與以後的公式不同，男女各一組。餘數 5 時，男為坤、女為艮。
// 只給年份時以國曆年換算；給了農曆年（lunarYear，由 lunarYearOf 換算）時以農曆年計算。
export function natalKua(year: number, gender: Gender, lunarYear?: number): NatalKua {
  if (!Number.isInteger(year) || year < BIRTH_YEAR_RANGE.min || year > BIRTH_YEAR_RANGE.max) {
    throw new Error(`請輸入 ${BIRTH_YEAR_RANGE.min} 至 ${BIRTH_YEAR_RANGE.max} 之間的出生年份`);
  }
  if (gender !== 'male' && gender !== 'female') throw new Error('請選擇性別');

  const lunar = lunarYear ?? year;
  const last2 = lunar % 100;
  const root = digitRoot(last2);
  const early = lunar <= 2000;
  const genderLabel = gender === 'male' ? '男' : '女';
  const steps = [`${lunar} 年：後兩位 ${String(last2).padStart(2, '0')}，數字根 ${root}`];
  if (lunar !== year) steps.unshift(`生於農曆新年前，依農曆 ${lunar} 年換算`);
  let raw: number;
  if (early) {
    raw = gender === 'male' ? 10 - root : root + 5;
    steps.push(gender === 'male'
      ? `2000 年（含）以前、男性：10 − ${root} = ${raw}`
      : `2000 年（含）以前、女性：${root} + 5 = ${raw}`);
  } else {
    raw = gender === 'male' ? 9 - root : root + 6;
    steps.push(gender === 'male'
      ? `2000 年以後、男性：9 − ${root} = ${raw}`
      : `2000 年以後、女性：${root} + 6 = ${raw}`);
  }
  let gua = toGuaNumber(raw);
  if (gua === 5) {
    gua = gender === 'male' ? 2 : 8;
    steps.push(`餘數為 5，${genderLabel}性取${gender === 'male' ? '坤（2）' : '艮（8）'}`);
  } else {
    steps.push(`取 ${raw} 的餘數，得 ${gua}`);
  }
  const info = GUA_INFO[gua];
  steps.push(`命卦：${info.name}卦（${gua}），${info.group}`);
  return { gua, name: info.name, group: info.group, steps };
}

// 玄空飛星：目前只收錄九運（2024–2043）與四正向。運星為九紫，山星與向星依表排布。
export const RUNNING_PERIOD = 9;

export type FacingId = 'south' | 'north' | 'east' | 'west';

export interface Facing {
  id: FacingId;
  label: string;
  sitting: string;
  /** 向首所在的方位，即房屋面對的方向。 */
  toward: Direction;
  mountain: { star: number; forward: boolean };
  facing: { star: number; forward: boolean };
}

// 九運四正向：山星與向星的數值與順逆，依技能檔 calculation-rules 的九運坐向表（子山午向、午山子向、卯山酉向、酉山卯向）。
export const FACINGS: readonly Facing[] = [
  { id: 'south', label: '坐北朝南', sitting: '子山午向', toward: '南', mountain: { star: 1, forward: false }, facing: { star: 9, forward: true } },
  { id: 'north', label: '坐南朝北', sitting: '午山子向', toward: '北', mountain: { star: 9, forward: true }, facing: { star: 1, forward: false } },
  { id: 'east', label: '坐東朝西', sitting: '卯山酉向', toward: '西', mountain: { star: 3, forward: true }, facing: { star: 7, forward: false } },
  { id: 'west', label: '坐西朝東', sitting: '酉山卯向', toward: '東', mountain: { star: 7, forward: false }, facing: { star: 3, forward: true } },
];

// 九宮飛布的路徑（宮號），順飛依此順序，逆飛反向。中五在起點。
const FLIGHT_PATH = [5, 6, 7, 8, 9, 1, 2, 3, 4] as const;

// 宮號對應的方位（中五不列）。
export const PALACE_DIRECTION: Record<number, Direction> = { 1: '北', 2: '西南', 3: '東', 4: '東南', 6: '西北', 7: '西', 8: '東北', 9: '南' };

function wrapStar(value: number): number {
  return ((((value - 1) % 9) + 9) % 9) + 1;
}

// 從中宮起飛：第 i 步星數加 i（順）或減 i（逆），宮位依路徑前進。回傳宮號對應的星。
export function flyStars(start: number, forward: boolean): Record<number, number> {
  const stars: Record<number, number> = {};
  FLIGHT_PATH.forEach((_, step) => {
    const palace = forward ? FLIGHT_PATH[step] : FLIGHT_PATH[(9 - step) % 9];
    stars[palace] = wrapStar(forward ? start + step : start - step);
  });
  return stars;
}

// 三星組合：兩星同宮時的吉凶，依技能檔的飛星組合表。
export const STAR_PAIRS: ReadonlyArray<{ pair: readonly [number, number]; score: number; meaning: string }> = [
  { pair: [1, 6], score: 1, meaning: '文昌利考，升職有望' },
  { pair: [1, 4], score: 1, meaning: '文昌旺盛，利學業與文書' },
  { pair: [6, 8], score: 2, meaning: '財旺，利置業與置產' },
  { pair: [8, 9], score: 1, meaning: '旺財旺丁，九運最當令' },
  { pair: [2, 5], score: -2, meaning: '病符星聚集，宜留意健康' },
  { pair: [2, 3], score: -1, meaning: '斗牛煞，宜留意口舌爭執' },
  { pair: [3, 7], score: -1, meaning: '宜留意損耗與口舌' },
  { pair: [5, 7], score: -1, meaning: '五黃遇破軍，宜謹慎行事' },
  { pair: [1, 2], score: -1, meaning: '宜留意情感與女性健康' },
  { pair: [6, 9], score: -1, meaning: '宜留意官事口舌或長輩健康' },
];

export interface FlyingPalace {
  palace: number;
  run: number;
  mountain: number;
  facing: number;
  matches: Array<{ pair: readonly [number, number]; meaning: string; score: number }>;
  score: number;
  verdict: Fortune;
}

export interface FlyingChart {
  facing: Facing;
  palaces: FlyingPalace[];
  steps: string[];
}

function verdictFor(score: number): Fortune {
  if (score >= 1) return '吉';
  if (score <= -1) return '凶';
  return '中';
}

// 玄空飛星盤：運盤以九紫入中宮順飛；山星與向星依坐向表飛布。每宮列出三星與同宮組合。
export function flyingStarChart(facingId: FacingId, period: number = RUNNING_PERIOD): FlyingChart {
  if (period !== RUNNING_PERIOD) throw new Error('目前收錄的玄空飛星僅限九運（2024–2043）');
  const facing = FACINGS.find(item => item.id === facingId);
  if (!facing) throw new Error('請選擇坐向');

  const run = flyStars(period, true);
  const mountain = flyStars(facing.mountain.star, facing.mountain.forward);
  const toward = flyStars(facing.facing.star, facing.facing.forward);

  const palaces: FlyingPalace[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(palace => {
    const stars = [run[palace], mountain[palace], toward[palace]];
    const matches: FlyingPalace['matches'] = [];
    for (let a = 0; a < stars.length; a += 1) {
      for (let b = a + 1; b < stars.length; b += 1) {
        const low = Math.min(stars[a], stars[b]);
        const high = Math.max(stars[a], stars[b]);
        const rule = STAR_PAIRS.find(item => item.pair[0] === low && item.pair[1] === high);
        if (rule) matches.push({ pair: rule.pair, meaning: rule.meaning, score: rule.score });
      }
    }
    const score = matches.reduce((sum, match) => sum + match.score, 0);
    return { palace, run: run[palace], mountain: mountain[palace], facing: toward[palace], matches, score, verdict: verdictFor(score) };
  });

  const steps = [
    `運盤：九紫入中宮，順飛（${FLIGHT_PATH.map(p => (p === 5 ? '中' : String(p))).join('→')}）`,
    `山星：${facing.sitting}，山星 ${facing.mountain.star} 入中宮，${facing.mountain.forward ? '順' : '逆'}飛`,
    `向星：${facing.sitting}的向首，向星 ${facing.facing.star} 入中宮，${facing.facing.forward ? '順' : '逆'}飛`,
    '每宮取運星、山星、向星三星，兩兩同宮時依組合表加減分；總分 1 以上為吉，−1 以下為凶，其餘為中',
  ];
  return { facing, palaces, steps };
}

export interface FengshuiData {
  natal: NatalKua;
  mansions: ReturnType<typeof eightMansions>;
  flying: FlyingChart | null;
}

export type FengshuiReport = MethodResult<FengshuiData>;

export function buildFengshuiReport(input: { year: number; gender: Gender; lunarYear?: number; facing?: FacingId }): FengshuiReport {
  const natal = natalKua(input.year, input.gender, input.lunarYear);
  const flying = input.facing ? flyingStarChart(input.facing) : null;
  return createMethodResult({
    module: 'fengshui',
    methodVersion: FENGSHUI_METHOD_VERSION,
    contentVersion: 'fengshui-copy-v1',
    // 只有年份與性別時，農曆新年前後出生的命卦無法判斷，因此標為近似；給出生日期後才依農曆新年換算。
    inputPrecision: input.lunarYear === undefined ? 'approximate' : 'full',
    data: { natal, mansions: eightMansions(natal.gua), flying },
  });
}
