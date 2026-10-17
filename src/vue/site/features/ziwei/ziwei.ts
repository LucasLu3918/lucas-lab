// Zi Wei Dou Shu (紫微斗數) chart engine using the standard placement rules: 寅宮起月, 紫微落宮 by bureau and day, 紫府 series, four transformations and decadal limits.
// Route B from docs/plan/FORTUNE_HUB_PLAN.md §3.5. iztro is used only as a test oracle (ziwei.iztro.spec.ts); the skill's simplified rules are not followed where they disagree with it.
import { toLunarDate, type LunarDate } from '../fortune-core/calendar';
import { parseCivilDateTime } from '../fortune-core/civil-time';
import { createMethodResult, type InputPrecision, type MethodResult } from '../fortune-core/result';
import { minorStarPlacements } from './ziwei-stars';

export const ZIWEI_METHOD_VERSION = 'ziwei-standard-v2';
export const ZIWEI_CONTENT_VERSION = '2026.10.17-1';

export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
/** Palace order starts at 命宮 and moves against the branch order (兄弟 is one branch back). */
export const PALACE_NAMES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '奴僕', '官祿', '田宅', '福德', '父母'] as const;

export type PalaceName = (typeof PALACE_NAMES)[number];
export type Gender = 'male' | 'female';
export type Mutagen = '祿' | '權' | '科' | '忌';
export type FiveElementBureau = 2 | 3 | 4 | 5 | 6;

export interface ZiweiInput {
  /** Solar (陽曆) birth date, YYYY-MM-DD. The chart is computed from its lunar equivalent. */
  birthDate: string;
  /**
   * Birth hour as a branch index: 0 = 早子 (00:00–00:59) … 11 = 亥時 (21:00–22:59).
   * 12 = 晚子 (23:00–23:59): the same 命宮 and 身宮 as 子, but 紫微 is placed by the lunar day of the next civil date (iztro's convention).
   */
  birthBranch: number;
  gender: Gender;
}

export interface PlacedStar {
  name: string;
  mutagen: Mutagen | null;
}

export interface ZiweiPalace {
  name: PalaceName;
  branch: number;
  branchName: string;
  stem: string;
  isBody: boolean;
  majorStars: PlacedStar[];
  minorStars: PlacedStar[];
  /** 大限以虛歲計：startYear 為起運年，endYear 為該限最後一年（西曆）。 */
  decadal: { startAge: number; endAge: number; startYear: number; endYear: number };
}

/** The steps behind the chart, so that the page can show the actual numbers instead of a summary. */
export interface ZiweiDerivation {
  /** 命宮計算所用的農曆月；閏月十六日（含）以後算作下一個月，與 iztro 預設的閏月處理一致。 */
  palaceMonth: number;
  leapAdjusted: boolean;
  monthBranch: string;
  hourIndex: number;
  hourBranch: string;
  /** 晚子時: 紫微落宮以次日計，ziweiDay 為已加一的日數。 */
  lateZi: boolean;
  mingStem: string;
  nayin: string;
  ziweiDay: number;
  ziweiBranch: string;
  tianfuBranch: string;
  lucunBranch: string;
  mutagens: Array<{ mutagen: Mutagen; star: string; branch: string; palace: PalaceName }>;
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
  derivation: ZiweiDerivation;
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
/** 祿存 by year stem: 甲寅 乙卯 丙戊巳 丁己午 庚申 辛酉 壬亥 癸子. 擎羊 sits one branch after it, 陀羅 one branch before. */
const LUCUN_BY_STEM = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
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

/** 祿存 branch for a year stem; 擎羊 is this branch + 1 and 陀羅 is this branch − 1. */
export function lucunBranch(yearStem: number): number {
  return LUCUN_BY_STEM[yearStem];
}

/** The 六十甲子 index whose stem and branch both match. Each index maps to exactly one pair of stem and branch. */
function sexagenaryIndex(stem: number, branch: number): number {
  for (let index = 0; index < 60; index += 1) {
    if (index % 10 === stem && index % 12 === branch) return index;
  }
  throw new RangeError('命宮干支不在六十甲子之中。');
}

/** 納音 of a stem and branch pair, for example 癸未 → 楊柳木. */
export function nayinOf(stem: number, branch: number): string {
  return NAYIN[Math.floor(sexagenaryIndex(stem, branch) / 2)];
}

export function fiveElementBureau(stem: number, branch: number): { bureau: FiveElementBureau; className: string } {
  const element = nayinOf(stem, branch).slice(-1);
  const bureau = BUREAU_BY_ELEMENT[element];
  const names = ['二', '三', '四', '五', '六'];
  return { bureau, className: `${element}${names[bureau - 2]}局` };
}

/**
 * 三方四正 for a palace branch: the opposite palace and the two 三合 palaces. Pure index arithmetic on branches.
 */
export function sanFangSiZheng(branch: number): { opposite: number; trines: [number, number] } {
  return { opposite: mod12(branch + 6), trines: [mod12(branch + 4), mod12(branch + 8)] };
}

/** The 大限 that contains a Gregorian year (虛歲: the birth year is age 1). Returns null before the first 大限 starts. */
export function decadalPalaceAt(chart: ZiweiChart, year: number): ZiweiPalace | null {
  return chart.palaces.find(palace => year >= palace.decadal.startYear && year <= palace.decadal.endYear) ?? null;
}

function stemIndex(stem: string): number {
  const index = STEMS.indexOf(stem as (typeof STEMS)[number]);
  if (index < 0) throw new RangeError(`無法辨識天干：${stem}`);
  return index;
}

function validateBirthBranch(birthBranch: number): void {
  if (!Number.isInteger(birthBranch) || birthBranch < 0 || birthBranch > 12) {
    throw new RangeError('出生時辰需為 0（早子）至 11（亥時）或 12（晚子）之間的整數。');
  }
}

export function calculateZiwei(input: ZiweiInput): MethodResult<ZiweiChart> {
  validateBirthBranch(input.birthBranch);
  const { year, month, day } = parseCivilDateTime(input.birthDate, '00:00');
  const lunar = toLunarDate({ year, month, day });
  const yearStem = stemIndex(lunar.ganzhiYear.charAt(0));
  // 晚子時 shares the 子 branch for 命宮 and 身宮, and only shifts the day used for 紫微落宮.
  const lateZi = input.birthBranch === 12;
  const hour = lateZi ? 0 : input.birthBranch;
  // 晚子時 takes the lunar day of the next civil date, so a month end gives day 1 (matches iztro on every day of 2024).
  const nextCivil = new Date(Date.UTC(year, month - 1, day + 1));
  const placementDay = lateZi
    ? toLunarDate({ year: nextCivil.getUTCFullYear(), month: nextCivil.getUTCMonth() + 1, day: nextCivil.getUTCDate() }).day
    : lunar.day;
  // 閏月前半月（十五日及以前）仍算本月，後半月算下月；只影響月數，不影響紫微落宮所用的日數。
  // iztro skips this rule for 晚子時 (timeIndex 12), so the late-zi chart keeps the leap month.
  const leapAdjusted = !lateZi && lunar.isLeapMonth && lunar.day > 15;
  const palaceMonth = leapAdjusted ? lunar.month + 1 : lunar.month;

  const ming = mingBranch(palaceMonth, hour);
  const shen = shenBranch(palaceMonth, hour);
  const mingStem = palaceStem(yearStem, ming);
  const { bureau, className } = fiveElementBureau(mingStem, ming);

  // Star branches. Every placed star is recorded once so that transformations can point at it.
  const starBranch = new Map<string, number>();
  const minorStarNames = new Set<string>();
  const ziwei = ziweiBranch(bureau, placementDay);
  for (const [name, offset] of ZIWEI_SERIES) starBranch.set(name, mod12(ziwei + offset));
  const tianfu = mod12(4 - ziwei);
  for (const [name, offset] of TIANFU_SERIES) starBranch.set(name, mod12(tianfu + offset));

  const lucun = lucunBranch(yearStem);
  const auxiliary: Array<[string, number]> = [
    ['文昌', mod12(10 - hour)],
    ['文曲', mod12(4 + hour)],
    ['左輔', mod12(4 + (palaceMonth - 1))],
    ['右弼', mod12(10 - (palaceMonth - 1))],
    ['天魁', KUI_BY_STEM[yearStem]],
    ['天鉞', YUE_BY_STEM[yearStem]],
    ['祿存', lucun],
    ['擎羊', mod12(lucun + 1)],
    ['陀羅', mod12(lucun - 1)],
  ];
  // 煞星與雜曜（ziwei-stars.ts）。晚子時的日數同 iztro：早子取日數減一，晚子取日數本身。
  const yearBranch = BRANCHES.indexOf(lunar.ganzhiYear.charAt(1) as (typeof BRANCHES)[number]);
  const minor = minorStarPlacements({
    yearStem,
    yearBranch,
    ming,
    shen,
    month: palaceMonth - 1,
    hour,
    dayIndex: lateZi ? lunar.day : lunar.day - 1,
  });
  for (const [name, branch] of [...auxiliary, ...minor]) {
    starBranch.set(name, branch);
    minorStarNames.add(name);
  }

  // Each transformation names a star that is always placed above (the four stars of the year stem are all in starBranch).
  const mutagens = MUTAGEN_BY_STEM[yearStem].map((star, index) => {
    const branch = starBranch.get(star) as number;
    return { mutagen: MUTAGENS[index], star, branch, palace: PALACE_NAMES[mod12(ming - branch)] };
  });
  const mutagenByStar = new Map<string, Mutagen>(mutagens.map(item => [item.star, item.mutagen]));

  const forward = (yearStem % 2 === 0) === (input.gender === 'male');
  const palaces: ZiweiPalace[] = PALACE_NAMES.map((name, order) => {
    const branch = mod12(ming - order);
    const stars = [...starBranch.entries()].filter(([, starAt]) => starAt === branch).map(([starName]) => ({
      name: starName,
      mutagen: mutagenByStar.get(starName) ?? null,
    }));
    const decadalOrder = forward ? mod12(branch - ming) : mod12(ming - branch);
    const startAge = bureau + decadalOrder * 10;
    const endAge = startAge + 9;
    return {
      name,
      branch,
      branchName: BRANCHES[branch],
      stem: STEMS[palaceStem(yearStem, branch)],
      isBody: branch === shen,
      majorStars: stars.filter(star => !minorStarNames.has(star.name)),
      minorStars: stars.filter(star => minorStarNames.has(star.name)),
      decadal: { startAge, endAge, startYear: lunar.year + startAge - 1, endYear: lunar.year + endAge - 1 },
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
      derivation: {
        palaceMonth,
        leapAdjusted,
        monthBranch: BRANCHES[mod12(2 + (palaceMonth - 1))],
        hourIndex: hour,
        hourBranch: BRANCHES[hour],
        lateZi,
        mingStem: STEMS[mingStem],
        nayin: nayinOf(mingStem, ming),
        ziweiDay: placementDay,
        ziweiBranch: BRANCHES[ziwei],
        tianfuBranch: BRANCHES[tianfu],
        lucunBranch: BRANCHES[lucun],
        mutagens: mutagens.map(item => ({ mutagen: item.mutagen, star: item.star, branch: BRANCHES[item.branch], palace: item.palace })),
      },
    },
  });
}
