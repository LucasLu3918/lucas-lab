import { Solar, type EightChar } from 'lunar-javascript';
import { civilPartsAt, parseCivilDateTime, resolveCivilDateTime, type Disambiguation } from '../fortune-core/civil-time';

export const BAZI_METHOD_VERSION = 'bazi-local-v2';
const CHINA_TIME_ZONE = 'Asia/Shanghai';
const STEM_ELEMENTS: Record<string, string> = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
const BRANCH_ELEMENTS: Record<string, string> = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
const STEM_YIN: Record<string, boolean> = { 甲: false, 乙: true, 丙: false, 丁: true, 戊: false, 己: true, 庚: false, 辛: true, 壬: false, 癸: true };
const ELEMENTS = ['木', '火', '土', '金', '水'];
const GENERATES: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const CONTROLS: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const TEN_GODS: Record<string, string[]> = {
  比肩: ['自我主張、同儕合作與自主推進。', '適合穩定累積；合作時先談清責任與資源。'],
  劫財: ['互動與競合感提高，界線和分工值得留意。', '先協調資源，再決定共同投入的程度。'],
  食神: ['創作、表達與生活品質成為可投入的主題。', '把靈感轉成可持續的小步驟，避免只停在想法。'],
  傷官: ['創新與表達意願較強，溝通方式會影響合作。', '提出不同做法時，同時說明依據與可行方案。'],
  偏財: ['外部機會與彈性資源值得觀察，先核實條件。', '機會增加時仍要管理時間、成本與承諾。'],
  正財: ['穩定安排、實際資源與持續投入較受重視。', '適合檢視預算與進度，避免超出可負擔範圍。'],
  七殺: ['挑戰與責任感提高，清楚排序能減少被急事牽引。', '先處理可控風險，並為重要工作尋求合適支援。'],
  正官: ['規則、責任與長期承諾是整理方向的線索。', '遵循明確標準，也保留檢視規則是否合用的空間。'],
  偏印: ['研究、觀察與非典型解法可能帶來新視角。', '確認資訊來源，替思考安排落地和分享的時間。'],
  正印: ['學習、支持與知識整理有助於穩定判斷。', '吸收資訊後選出一項能實際運用的重點。'],
};
const CLASHES = new Set(['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥']);

export interface BaziInput {
  birthDate: string;
  birthTime: string;
  timeZone: string;
  timeUnknown?: boolean;
  disambiguation?: Disambiguation;
  longitude?: number;
  trueSolarTime?: boolean;
  daYunGender?: 0 | 1;
  daYunSchool?: 1 | 2;
}

export interface BaziPillar {
  label: string;
  value: string;
  element: string;
  tenGod: string;
  hiddenStems: string[];
  hiddenTenGods: string[];
}

export interface BaziChart {
  pillars: BaziPillar[];
  dayMaster: string;
  elementCounts: Record<string, number>;
  methodVersion: string;
  methodSummary: string;
  birthInstant: string;
  timeUnknown: boolean;
  solarTime: 'civil' | 'true';
  solarTimeCorrectionMinutes: number;
  strengthSignals: { label: string; evidence: string[] };
  daYun: {
    gender: 0 | 1;
    school: 1 | 2;
    startAge: { years: number; months: number; days: number; hours: number };
    startDate: string;
    cycles: Array<{ startYear: number; startAge: number; pillar: string }>;
  } | null;
}

function elementRelation(dayStem: string, otherStem: string): string {
  const self = STEM_ELEMENTS[dayStem];
  const other = STEM_ELEMENTS[otherStem];
  const samePolarity = STEM_YIN[dayStem] === STEM_YIN[otherStem];
  if (self === other) return samePolarity ? '比肩' : '劫財';
  if (GENERATES[self] === other) return samePolarity ? '食神' : '傷官';
  if (CONTROLS[self] === other) return samePolarity ? '偏財' : '正財';
  if (CONTROLS[other] === self) return samePolarity ? '七殺' : '正官';
  return samePolarity ? '偏印' : '正印';
}

function countElements(pillars: Array<{ stem: string; branch: string }>): Record<string, number> {
  const counts = Object.fromEntries(ELEMENTS.map(element => [element, 0]));
  for (const pillar of pillars) {
    counts[STEM_ELEMENTS[pillar.stem]]++;
    counts[BRANCH_ELEMENTS[pillar.branch]]++;
  }
  return counts;
}

function makeLocalLunar(parts: { year: number; month: number; day: number; hour: number; minute: number; second: number }): EightChar {
  const eightChar = Solar.fromYmdHms(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second).getLunar().getEightChar();
  // sect 2 keeps late Zi hour on the same day; the civil day changes at 00:00.
  eightChar.setSect(2);
  return eightChar;
}

// NOAA's compact fractional-year approximation for the equation of time.
// Longitude is east-positive; the result converts the instant to local apparent solar time.
function equationOfTimeMinutes(instant: Date): number {
  const yearStart = Date.UTC(instant.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate()) - yearStart) / 86_400_000) + 1;
  const leapYear = instant.getUTCFullYear() % 4 === 0 && (instant.getUTCFullYear() % 100 !== 0 || instant.getUTCFullYear() % 400 === 0);
  const decimalHour = instant.getUTCHours() + instant.getUTCMinutes() / 60 + instant.getUTCSeconds() / 3600;
  const gamma = (2 * Math.PI / (leapYear ? 366 : 365)) * (dayOfYear - 1 + (decimalHour - 12) / 24);
  return 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
}

function utcParts(date: Date) {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour: date.getUTCHours(), minute: date.getUTCMinutes(), second: date.getUTCSeconds() };
}

function getStrengthSignals(dayMaster: string, rows: Array<{ stem: string; branch: string; hidden: string[] }>) {
  const self = STEM_ELEMENTS[dayMaster];
  const monthBranch = rows[1].branch;
  const seasonElement = BRANCH_ELEMENTS[monthBranch];
  const inSeason = seasonElement === self || GENERATES[seasonElement] === self;
  const rooted = rows.some(row => row.hidden.some(stem => STEM_ELEMENTS[stem] === self));
  const helpedByStems = rows.some((row, index) => index !== 2 && (STEM_ELEMENTS[row.stem] === self || GENERATES[STEM_ELEMENTS[row.stem]] === self));
  const evidence = [
    `月令${monthBranch}（簡化五行：${seasonElement}）${inSeason ? '支持日主' : '未直接支持日主'}`,
    rooted ? '地支藏干中可見日主同五行根氣' : '地支藏干中未見日主同五行根氣',
    helpedByStems ? '其他天干有同五行或生助日主的訊號' : '其他天干未見同五行或生助日主的訊號',
  ];
  const supportCount = Number(inSeason) + Number(rooted) + Number(helpedByStems);
  const label = supportCount === 3 ? '支持訊號較多' : supportCount === 0 ? '支持訊號較少' : '支持線索部分成立';
  return { label, evidence };
}

export function calculateBazi(input: BaziInput): BaziChart {
  const timeUnknown = Boolean(input.timeUnknown);
  if (input.trueSolarTime && timeUnknown) throw new RangeError('真太陽時需要可靠的出生時間。');
  if (input.daYunGender !== undefined && timeUnknown) throw new RangeError('計算大運需要可靠的出生時間。');
  if (input.trueSolarTime && (!Number.isFinite(input.longitude) || input.longitude! < -180 || input.longitude! > 180)) throw new RangeError('真太陽時需要 -180 至 180 度的出生地經度。');
  const birthCivil = parseCivilDateTime(input.birthDate, timeUnknown ? '12:00' : input.birthTime);
  const instant = resolveCivilDateTime(birthCivil, input.timeZone, input.disambiguation);
  const solarTermTime = civilPartsAt(instant, CHINA_TIME_ZONE);
  const termChart = makeLocalLunar(solarTermTime);
  // The UTC instant already includes the civil UTC offset. Correct it directly by
  // longitude and equation-of-time; this also removes seasonal clock changes.
  const trueSolarInstant = input.trueSolarTime
    ? new Date(instant.getTime() + (input.longitude! * 4 + equationOfTimeMinutes(instant)) * 60_000)
    : instant;
  const solarTimeCorrectionMinutes = input.trueSolarTime
    ? (trueSolarInstant.getTime() - Date.UTC(birthCivil.year, birthCivil.month - 1, birthCivil.day, birthCivil.hour, birthCivil.minute, birthCivil.second)) / 60_000
    : 0;
  const civilChart = makeLocalLunar(input.trueSolarTime ? utcParts(trueSolarInstant) : birthCivil);
  const dayMaster = civilChart.getDayGan();
  const rows = [
    { label: '年柱', value: termChart.getYear(), stem: termChart.getYearGan(), branch: termChart.getYearZhi(), element: termChart.getYearWuXing(), hidden: termChart.getYearHideGan() },
    { label: '月柱', value: termChart.getMonth(), stem: termChart.getMonthGan(), branch: termChart.getMonthZhi(), element: termChart.getMonthWuXing(), hidden: termChart.getMonthHideGan() },
    { label: '日柱', value: civilChart.getDay(), stem: dayMaster, branch: civilChart.getDayZhi(), element: civilChart.getDayWuXing(), hidden: civilChart.getDayHideGan() },
    ...(!timeUnknown ? [{ label: '時柱', value: civilChart.getTime(), stem: civilChart.getTimeGan(), branch: civilChart.getTimeZhi(), element: civilChart.getTimeWuXing(), hidden: civilChart.getTimeHideGan() }] : []),
  ];
  const pillars: BaziPillar[] = rows.map(row => ({
    label: row.label,
    value: row.value,
    element: row.element,
    tenGod: row.label === '日柱' ? '日主' : elementRelation(dayMaster, row.stem),
    hiddenStems: row.hidden,
    hiddenTenGods: row.hidden.map(stem => elementRelation(dayMaster, stem)),
  }));
  const strengthSignals = getStrengthSignals(dayMaster, rows);
  const daYun = input.daYunGender === undefined ? null : (() => {
    const school = input.daYunSchool ?? 1;
    const yun = termChart.getYun(input.daYunGender!, school);
    return {
      gender: input.daYunGender!, school,
      startAge: { years: yun.getStartYear(), months: yun.getStartMonth(), days: yun.getStartDay(), hours: yun.getStartHour() },
      startDate: yun.getStartSolar().toYmd(),
      cycles: yun.getDaYun().filter(item => item.getGanZhi()).map(item => ({ startYear: item.getStartYear(), startAge: item.getStartAge(), pillar: item.getGanZhi() })).slice(0, 9),
    };
  })();
  const solarNote = input.trueSolarTime
    ? `日柱與時柱以真太陽時換算（經度修正＋均時差，合計 ${Math.round(solarTimeCorrectionMinutes)} 分鐘；使用 ${input.longitude}°E/W）。`
    : '日柱與時柱依出生地民用日期時間。';
  return {
    pillars,
    dayMaster,
    elementCounts: countElements(rows),
    methodVersion: BAZI_METHOD_VERSION,
    methodSummary: `年柱採立春換年、月柱採節氣分月；節氣瞬間換算為東八區標準時間；${timeUnknown ? '出生時間未知，僅排三柱' : solarNote}晚子時日柱按當天，00:00 換日。大運與起運依 lunar-javascript ${daYun ? `流派${daYun.school}、${daYun.gender === 1 ? '男命' : '女命'}順逆規則` : '未計算（需提供出生時間並選擇傳統排盤參數）'}。`,
    birthInstant: instant.toISOString(),
    timeUnknown,
    solarTime: input.trueSolarTime ? 'true' : 'civil',
    solarTimeCorrectionMinutes,
    strengthSignals,
    daYun,
  };
}

export type ForecastPeriod = 'day' | 'month' | 'year';

export interface BaziForecast {
  periodLabel: string;
  periodPillar: string;
  tenGod: string;
  theme: string;
  text: string;
  evidence: string[];
  methodVersion: string;
}

export function createBaziForecast(chart: BaziChart, period: ForecastPeriod, onDate = new Date(), timeZone = 'Asia/Taipei'): BaziForecast {
  const local = civilPartsAt(onDate, timeZone);
  const localEightChar = makeLocalLunar(local);
  const china = civilPartsAt(onDate, CHINA_TIME_ZONE);
  const termEightChar = makeLocalLunar(china);
  const pillar = period === 'day' ? localEightChar.getDay() : period === 'month' ? termEightChar.getMonth() : termEightChar.getYear();
  const stem = pillar[0];
  const branch = pillar[1];
  const tenGod = elementRelation(chart.dayMaster, stem);
  const [theme, text] = TEN_GODS[tenGod];
  const branchClash = chart.pillars.some(item => CLASHES.has(item.value[1] + branch));
  const evidence = [`${period === 'day' ? '流日' : period === 'month' ? '流月' : '流年'}${pillar}：相對日主${chart.dayMaster}為${tenGod}`];
  if (branchClash) {
    evidence.push(`${branch}與本命地支出現六沖組合`);
  }
  const tail = branchClash ? '同時出現地支沖的象徵組合，適合把變化視為檢查安排與界線的提醒；這不代表事件必然發生。' : '這是傳統干支象徵的整理方式，不代表事件必然發生。';
  return {
    periodLabel: period === 'day' ? '今日' : period === 'month' ? '本月' : '今年',
    periodPillar: pillar,
    tenGod,
    theme,
    text: `${text} ${tail}`,
    evidence,
    methodVersion: BAZI_METHOD_VERSION,
  };
}
