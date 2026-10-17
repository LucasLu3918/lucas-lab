// Zi Wei Dou Shu (紫微斗數) chart engine using the standard placement rules: 寅宮起月, 紫微落宮 by bureau and day, 紫府 series, four transformations and decadal limits.
// Route B from docs/plan/FORTUNE_HUB_PLAN.md §3.5. iztro is used only as a test oracle (ziwei.iztro.spec.ts); the skill's simplified rules are not followed where they disagree with it.
import { toLunarDate, type LunarDate } from '../fortune-core/calendar';
import { parseCivilDateTime } from '../fortune-core/civil-time';
import { createMethodResult, type InputPrecision, type MethodResult } from '../fortune-core/result';

export const ZIWEI_METHOD_VERSION = 'ziwei-standard-v1';
export const ZIWEI_CONTENT_VERSION = '2026.10.17-1';

export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
/** Palace order starts at 命宮 and moves against the branch order (兄弟 is one branch back). */
export const PALACE_NAMES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '奴僕', '官祿', '田宅', '福德', '父母'] as const;

export type Gender = 'male' | 'female';
export type Mutagen = '祿' | '權' | '科' | '忌';
export type FiveElementBureau = 2 | 3 | 4 | 5 | 6;

export interface ZiweiInput {
  /** Solar (陽曆) birth date, YYYY-MM-DD. The chart is computed from its lunar equivalent. */
  birthDate: string;
  /** Birth hour as a branch index: 0 = 子時 (23:00–00:59) … 11 = 亥時 (21:00–22:59). */
  birthBranch: number;
  gender: Gender;
}

export interface PlacedStar {
  name: string;
  mutagen: Mutagen | null;
}

export interface ZiweiPalace {
  name: (typeof PALACE_NAMES)[number];
  branch: number;
  branchName: string;
  stem: string;
  isBody: boolean;
  majorStars: PlacedStar[];
  minorStars: PlacedStar[];
  decadal: { startAge: number; endAge: number };
}

export interface ZiweiChart {
  lunar: LunarDate;
  gender: Gender;
  yearStem: string;
  hourBranch: string;
  bureau: FiveElementBureau;
  fiveElementsClass: string;
  soulBranch: string;
  bodyBranch: string;
  decadalForward: boolean;
  palaces: ZiweiPalace[];
}

// Standard tables. Star names are kept in Traditional Chinese to match the site copy.
const ZIWEI_SERIES: ReadonlyArray<readonly [string, number]> = [
  ['紫微', 0],
  ['天機', -1],
  ['太陽', -3],
  ['武曲', -4],
  ['天同', -5],
  ['廉貞', -8],
];
const TIANFU_SERIES: ReadonlyArray<readonly [string, number]> = [
  ['天府', 0],
  ['太陰', 1],
  ['貪狼', 2],
  ['巨門', 3],
  ['天相', 4],
  ['天梁', 5],
  ['七殺', 6],
  ['破軍', 10],
];
const KUI_BY_STEM = [1, 0, 11, 11, 1, 0, 1, 6, 3, 3];
const YUE_BY_STEM = [7, 8, 9, 9, 7, 8, 7, 2, 5, 5];
/** Four transformations by year stem: 祿, 權, 科, 忌. */
const MUTAGEN_BY_STEM: ReadonlyArray<readonly [string, string, string, string]> = [
  ['廉貞', '破軍', '武曲', '太陽'],
  ['天機', '天梁', '紫微', '太陰'],
  ['天同', '天機', '文昌', '廉貞'],
  ['太陰', '天同', '天機', '巨門'],
  ['貪狼', '太陰', '右弼', '天機'],
  ['武曲', '貪狼', '天梁', '文曲'],
  ['太陽', '武曲', '太陰', '天同'],
  ['巨門', '太陽', '文曲', '文昌'],
  ['天梁', '紫微', '左輔', '武曲'],
  ['破軍', '巨門', '太陰', '貪狼'],
];
const MUTAGENS: readonly Mutagen[] = ['祿', '權', '科', '忌'];
/** 六十甲子納音, one entry per pair of adjacent jiazi (甲子・乙丑 share 海中金). */
const NAYIN = [
  '海中金', '爐中火', '大林木', '路旁土', '劍鋒金', '山頭火', '澗下水', '城頭土', '白蠟金', '楊柳木',
  '泉中水', '屋上土', '霹靂火', '松柏木', '長流水', '沙中金', '山下火', '平地木', '壁上土', '金箔金',
  '覆燈火', '天河水', '大驛土', '釵釧金', '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水',
];
const BUREAU_BY_ELEMENT: Record<string, FiveElementBureau> = { 水: 2, 木: 3, 金: 4, 土: 5, 火: 6 };

function mod12(value: number): number {
  return ((value % 12) + 12) % 12;
}

/**
 * Branch of 紫微 from the five-element bureau and the lunar day, with 寅 as the first step.
 * An exact multiple counts straight from 寅. Otherwise the gap G = bureau − remainder is added to the day,
 * and the result moves forward G steps when G is even or backward G steps when G is odd (奇進偶退 on the gap).
 * Verified against iztro for every bureau 2–6 and day 1–30 in ziwei.iztro.spec.ts.
 */
export function ziweiBranch(bureau: number, day: number): number {
  const remainder = day % bureau;
  if (remainder === 0) return mod12(day / bureau + 1);
  const gap = bureau - remainder;
  const base = (day + gap) / bureau + 1;
  return mod12(gap % 2 === 0 ? base + gap : base - gap);
}

/** 命宮 by 寅宮起正月, counted forward to the birth month and backward by hour. */
export function mingBranch(lunarMonth: number, birthBranch: number): number {
  return mod12(2 + (lunarMonth - 1) - birthBranch);
}

/** 身宮 by 寅宮起正月, counted forward to the birth month and forward by hour. */
export function shenBranch(lunarMonth: number, birthBranch: number): number {
  return mod12(2 + (lunarMonth - 1) + birthBranch);
}

/** Stem of a palace branch under 五虎遁: the 寅 month stem comes from the year stem, then counts forward. */
export function palaceStem(yearStem: number, branch: number): number {
  const tigerStart = ((yearStem % 5) * 2 + 2) % 10;
  return (tigerStart + mod12(branch - 2)) % 10;
}

export function fiveElementBureau(stem: number, branch: number): { bureau: FiveElementBureau; className: string } {
  for (let index = 0; index < 60; index += 1) {
    if (index % 10 === stem && index % 12 === branch) {
      const element = NAYIN[Math.floor(index / 2)].slice(-1);
      const bureau = BUREAU_BY_ELEMENT[element];
      const names = ['二', '三', '四', '五', '六'];
      return { bureau, className: `${element}${names[bureau - 2]}局` };
    }
  }
  throw new RangeError('命宮干支不在六十甲子之中。');
}

function stemIndex(stem: string): number {
  const index = STEMS.indexOf(stem as (typeof STEMS)[number]);
  if (index < 0) throw new RangeError(`無法辨識天干：${stem}`);
  return index;
}

function validateBirthBranch(birthBranch: number): void {
  if (!Number.isInteger(birthBranch) || birthBranch < 0 || birthBranch > 11) {
    throw new RangeError('出生時辰需為 0（子時）至 11（亥時）之間的整數。');
  }
}

export function calculateZiwei(input: ZiweiInput): MethodResult<ZiweiChart> {
  validateBirthBranch(input.birthBranch);
  const { year, month, day } = parseCivilDateTime(input.birthDate, '00:00');
  const lunar = toLunarDate({ year, month, day });
  const yearStem = stemIndex(lunar.ganzhiYear.charAt(0));
  const hour = input.birthBranch;

  const ming = mingBranch(lunar.month, hour);
  const shen = shenBranch(lunar.month, hour);
  const { bureau, className } = fiveElementBureau(palaceStem(yearStem, ming), ming);

  // Star branches. Every placed star is recorded once so that transformations can point at it.
  const starBranch = new Map<string, number>();
  const minorStarNames = new Set<string>();
  const ziwei = ziweiBranch(bureau, lunar.day);
  for (const [name, offset] of ZIWEI_SERIES) starBranch.set(name, mod12(ziwei + offset));
  const tianfu = mod12(4 - ziwei);
  for (const [name, offset] of TIANFU_SERIES) starBranch.set(name, mod12(tianfu + offset));

  const auxiliary: Array<[string, number]> = [
    ['文昌', mod12(10 - hour)],
    ['文曲', mod12(4 + hour)],
    ['左輔', mod12(4 + (lunar.month - 1))],
    ['右弼', mod12(10 - (lunar.month - 1))],
    ['天魁', KUI_BY_STEM[yearStem]],
    ['天鉞', YUE_BY_STEM[yearStem]],
  ];
  for (const [name, branch] of auxiliary) {
    starBranch.set(name, branch);
    minorStarNames.add(name);
  }

  const mutagenByStar = new Map<string, Mutagen>();
  MUTAGEN_BY_STEM[yearStem].forEach((star, index) => mutagenByStar.set(star, MUTAGENS[index]));

  const forward = (yearStem % 2 === 0) === (input.gender === 'male');
  const palaces: ZiweiPalace[] = PALACE_NAMES.map((name, order) => {
    const branch = mod12(ming - order);
    const stars = [...starBranch.entries()].filter(([, starAt]) => starAt === branch).map(([starName]) => ({
      name: starName,
      mutagen: mutagenByStar.get(starName) ?? null,
    }));
    const decadalOrder = forward ? mod12(branch - ming) : mod12(ming - branch);
    const startAge = bureau + decadalOrder * 10;
    return {
      name,
      branch,
      branchName: BRANCHES[branch],
      stem: STEMS[palaceStem(yearStem, branch)],
      isBody: branch === shen,
      majorStars: stars.filter(star => !minorStarNames.has(star.name)),
      minorStars: stars.filter(star => minorStarNames.has(star.name)),
      decadal: { startAge, endAge: startAge + 9 },
    };
  });

  return createMethodResult({
    module: 'ziwei',
    methodVersion: ZIWEI_METHOD_VERSION,
    contentVersion: ZIWEI_CONTENT_VERSION,
    inputPrecision: 'full' satisfies InputPrecision,
    data: {
      lunar,
      gender: input.gender,
      yearStem: STEMS[yearStem],
      hourBranch: BRANCHES[hour],
      bureau,
      fiveElementsClass: className,
      soulBranch: BRANCHES[ming],
      bodyBranch: BRANCHES[shen],
      decadalForward: forward,
      palaces,
    },
  });
}
