// 煞星與雜曜（不含四化）的安星法。所有地支以子=0 … 亥=11 表示，宮位以 mod 12 運算。
// 規則依傳統安星法，以 iztro 2.6.3 的預設演算法作差異測試對照（ziwei.iztro.spec.ts）。
// 未收錄：天傷、天使（需依宮位表與性別對換）；劫煞、大耗、截空、龍德（僅中州派）。

const mod12 = (value: number): number => ((value % 12) + 12) % 12;

export interface MinorStarContext {
  /** 年干 0 = 甲 … 9 = 癸。 */
  yearStem: number;
  /** 年支 0 = 子 … 11 = 亥。 */
  yearBranch: number;
  /** 命宮與身宮的地支。 */
  ming: number;
  shen: number;
  /** 命盤用的農曆月，寅起正月為 0（閏月規則已套用）。 */
  month: number;
  /** 出生時辰 0 = 子 … 11 = 亥；晚子時傳入 0。 */
  hour: number;
  /** 日數索引（0 起算），供三台、八座、恩光、天貴使用；晚子時的計算方式見 ziwei.ts。 */
  dayIndex: number;
}

// 查表依年支所屬的三合組：0 寅午戌、1 申子辰、2 巳酉丑、3 亥卯未（組內的值見傳統安星法）。
const HUA_GAI = [10, 4, 1, 7];
const XIAN_CHI = [3, 9, 6, 0];
const TIAN_MA = [8, 2, 11, 5];
const HUO_STAR = [1, 2, 3, 9];
const LING_STAR = [3, 10, 10, 10];
// 孤辰、寡宿依年支（寅卯辰、巳午未、申酉戌、亥子丑）四組，以年支序號直接查表。
const GU_CHEN_BY_YEAR = [2, 2, 5, 5, 5, 8, 8, 8, 11, 11, 11, 2];
const GUA_SU_BY_YEAR = [10, 10, 1, 1, 1, 4, 4, 4, 7, 7, 7, 10];

/** 年支 → 三合組（0 寅午戌、1 申子辰、2 巳酉丑、3 亥卯未）。 */
function triadGroup(yearBranch: number): number {
  if (yearBranch === 2 || yearBranch === 6 || yearBranch === 10) return 0;
  if (yearBranch === 8 || yearBranch === 0 || yearBranch === 4) return 1;
  if (yearBranch === 5 || yearBranch === 9 || yearBranch === 1) return 2;
  return 3;
}

/** 煞星與雜曜的地支，依命盤條件計算。回傳 [名稱, 地支]。 */
export function minorStarPlacements(ctx: MinorStarContext): Array<[string, number]> {
  const { yearStem: stem, yearBranch: yr, ming, shen, month: m, hour: h, dayIndex: d } = ctx;
  const group = triadGroup(yr);
  const zuo = mod12(4 + m);
  const you = mod12(10 - m);
  const chang = mod12(10 - h);
  const qu = mod12(4 + h);
  const hongluan = mod12(3 - yr);
  const xunkong = (() => {
    const value = mod12(yr + 10 - stem);
    return (yr % 2) !== (value % 2) ? mod12(value + 1) : value;
  })();
  const placements: Array<[string, number]> = [
    // 煞星：按時辰與年支三合組。
    ['火星', mod12(HUO_STAR[group] + h)],
    ['鈴星', mod12(LING_STAR[group] + h)],
    ['地空', mod12(11 - h)],
    ['地劫', mod12(11 + h)],
    ['天馬', TIAN_MA[group]],
    // 時辰輔星。
    ['台輔', mod12(6 + h)],
    ['封誥', mod12(2 + h)],
    // 月份雜曜。
    ['解神', [8, 10, 0, 2, 4, 6][Math.floor(m / 2)]],
    ['天姚', mod12(1 + m)],
    ['天刑', mod12(9 + m)],
    ['陰煞', [2, 0, 10, 8, 6, 4][m % 6]],
    ['天月', [10, 5, 4, 2, 7, 3, 11, 7, 2, 6, 10, 2][m]],
    ['天巫', [5, 8, 2, 11][m % 4]],
    // 日數雜曜：三台、八座自左右輔起算，恩光、天貴自昌曲起算。
    ['三台', mod12(zuo + d)],
    ['八座', mod12(you - d)],
    ['恩光', mod12(chang + d - 1)],
    ['天貴', mod12(qu + d - 1)],
    // 年支雜曜。
    ['紅鸞', hongluan],
    ['天喜', mod12(hongluan + 6)],
    ['華蓋', HUA_GAI[group]],
    ['咸池', XIAN_CHI[group]],
    ['孤辰', GU_CHEN_BY_YEAR[yr]],
    ['寡宿', GUA_SU_BY_YEAR[yr]],
    ['龍池', mod12(4 + yr)],
    ['鳳閣', mod12(10 - yr)],
    ['天哭', mod12(6 - yr)],
    ['天虛', mod12(6 + yr)],
    ['年解', [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11][yr]],
    ['蜚廉', [8, 9, 10, 5, 6, 7, 2, 3, 4, 11, 0, 1][yr]],
    ['破碎', [5, 1, 9][yr % 3]],
    ['天空', mod12(yr + 1)],
    ['旬空', xunkong],
    ['截路', [8, 6, 4, 2, 0][stem % 5]],
    ['空亡', [9, 7, 5, 3, 1][stem % 5]],
    ['天德', mod12(9 + yr)],
    ['月德', mod12(5 + yr)],
    ['天才', mod12(ming + yr)],
    ['天壽', mod12(shen + yr)],
    // 年干雜曜。
    ['天官', [7, 4, 5, 2, 3, 9, 11, 9, 10, 6][stem]],
    ['天福', [9, 8, 0, 11, 3, 2, 6, 5, 6, 5][stem]],
    ['天廚', [5, 6, 0, 5, 6, 8, 2, 6, 9, 11][stem]],
  ];
  return placements;
}

/** 本模組收錄的煞星與雜曜名稱，供測試與顯示使用。 */
export const MINOR_STAR_NAMES: readonly string[] = [
  '火星', '鈴星', '地空', '地劫', '天馬', '台輔', '封誥', '解神', '天姚', '天刑', '陰煞', '天月', '天巫',
  '三台', '八座', '恩光', '天貴', '紅鸞', '天喜', '華蓋', '咸池', '孤辰', '寡宿', '龍池', '鳳閣', '天哭', '天虛',
  '年解', '蜚廉', '破碎', '天空', '旬空', '截路', '空亡', '天德', '月德', '天才', '天壽', '天官', '天福', '天廚',
];
