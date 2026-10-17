// 奇門遁甲（時家拆補法）排盤。規則依 docs/plan/FORTUNE_HUB_PLAN.md §3.9：
// 節氣定陰陽遁與局數；甲己符頭的地支定上、中、下元，每五日輪轉一元；地盤三奇六儀自局數宮起戊，陽遁順布、陰遁逆布；
// 值符（旬首六儀所落宮的九星）轉到時干所在宮，值使（同宮的八門）轉到時支所在宮，八神自值符宮起布。
import { Solar } from 'lunar-javascript';
import { parseCivilDateTime } from '../fortune-core/civil-time';

export const QIMEN_METHOD_VERSION = 'qimen-chaibu-shijia-v1';

export type Polarity = '陽' | '陰';
export type Yuan = '上' | '中' | '下';
export type Verdict = '吉' | '中' | '凶';
export type Topic = 'general' | 'travel' | 'contract' | 'career' | 'wealth';

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
// 地盤九個符號：戊己庚辛壬癸為六儀，丁丙乙為三奇。局首落戊，依序布入九宮（含中五）。
const YI_SEQUENCE = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'] as const;
// 旬首六儀：甲子→戊、甲戌→己、甲申→庚、甲午→辛、甲辰→壬、甲寅→癸（甲遁於六儀之下）。
const XUN_YI = ['戊', '己', '庚', '辛', '壬', '癸'] as const;
// 洛書八宮環（不含中五）。天盤九星、人盤八門與八神都沿此環轉動。
const RING = [1, 8, 3, 4, 9, 2, 7, 6] as const;
const STAR_BY_PALACE: Record<number, string> = { 1: '天蓬', 2: '天芮', 3: '天冲', 4: '天輔', 5: '天禽', 6: '天心', 7: '天柱', 8: '天任', 9: '天英' };
const DOOR_BY_PALACE: Record<number, string> = { 1: '休', 2: '死', 3: '傷', 4: '杜', 6: '開', 7: '驚', 8: '生', 9: '景' };
const GODS = ['值符', '螣蛇', '太陰', '六合', '白虎', '玄武', '九地', '九天'] as const;
// 地支所在宮：子一、丑寅艮八、卯三、辰巳巽四、午九、未申坤二、酉七、戌亥乾六。
const BRANCH_PALACE = [1, 8, 8, 3, 4, 4, 9, 2, 2, 7, 6, 6] as const;

export const PALACE_NAMES: Record<number, { name: string; direction: string }> = {
  1: { name: '坎一宮', direction: '北' },
  2: { name: '坤二宮', direction: '西南' },
  3: { name: '震三宮', direction: '東' },
  4: { name: '巽四宮', direction: '東南' },
  5: { name: '中五宮', direction: '中央' },
  6: { name: '乾六宮', direction: '西北' },
  7: { name: '兌七宮', direction: '西' },
  8: { name: '艮八宮', direction: '東北' },
  9: { name: '離九宮', direction: '南' },
};

// 二十四節氣的局數，依《奇門遁甲統宗》拆補法，順序為上、中、下元。
// 小雪採 5-8-2（部分來源作 5-8-1，本模組依多數來源）。
const JU_TABLE: Record<string, { polarity: Polarity; ju: readonly [number, number, number] }> = {
  冬至: { polarity: '陽', ju: [1, 7, 4] }, 小寒: { polarity: '陽', ju: [2, 8, 5] }, 大寒: { polarity: '陽', ju: [3, 9, 6] },
  立春: { polarity: '陽', ju: [8, 5, 2] }, 雨水: { polarity: '陽', ju: [9, 6, 3] }, 驚蟄: { polarity: '陽', ju: [1, 7, 4] },
  春分: { polarity: '陽', ju: [3, 9, 6] }, 清明: { polarity: '陽', ju: [4, 1, 7] }, 穀雨: { polarity: '陽', ju: [5, 2, 8] },
  立夏: { polarity: '陽', ju: [4, 1, 7] }, 小滿: { polarity: '陽', ju: [5, 2, 8] }, 芒種: { polarity: '陽', ju: [6, 3, 9] },
  夏至: { polarity: '陰', ju: [9, 3, 6] }, 小暑: { polarity: '陰', ju: [8, 2, 5] }, 大暑: { polarity: '陰', ju: [7, 1, 4] },
  立秋: { polarity: '陰', ju: [2, 5, 8] }, 處暑: { polarity: '陰', ju: [1, 4, 7] }, 白露: { polarity: '陰', ju: [9, 3, 6] },
  秋分: { polarity: '陰', ju: [7, 1, 4] }, 寒露: { polarity: '陰', ju: [6, 9, 3] }, 霜降: { polarity: '陰', ju: [5, 8, 2] },
  立冬: { polarity: '陰', ju: [6, 9, 3] }, 小雪: { polarity: '陰', ju: [5, 8, 2] }, 大雪: { polarity: '陰', ju: [4, 7, 1] },
};

// lunar-javascript 的節名為簡體；只有以下五個與繁體不同，其餘相同。
const TERM_NAME_TRADITIONAL: Record<string, string> = { 惊蛰: '驚蟄', 谷雨: '穀雨', 小满: '小滿', 芒种: '芒種', 处暑: '處暑' };

// 八門吉凶分數：生門大吉，死門大凶。
const DOOR_SCORE: Record<string, number> = { 生: 2, 休: 1, 開: 1, 景: 1, 杜: 0, 傷: -1, 驚: -1, 死: -2 };
const STAR_SCORE: Record<string, number> = { 天蓬: -1, 天芮: -1, 天冲: 1, 天輔: 1, 天心: 1, 天柱: -1, 天任: 1, 天英: -1, 天禽: 0 };
const GOD_SCORE: Record<string, number> = { 值符: 1, 六合: 1, 九天: 1, 九地: 1, 太陰: 0, 螣蛇: -1, 白虎: -1, 玄武: -1 };
// 吉門：三奇遇之為「三奇得使」。
const AUSPICIOUS_DOORS: readonly string[] = ['休', '生', '景', '開'];
const THREE_WONDERS: readonly string[] = ['乙', '丙', '丁'];

export const TOPIC_LABELS: Record<Topic, string> = { general: '一般', travel: '出行', contract: '合約洽談', career: '事業', wealth: '財運' };
const TOPIC_BONUS: Record<Topic, (palace: Pick<QimenPalace, 'door' | 'star' | 'god'>) => number> = {
  general: () => 0,
  travel: p => (['開', '休', '景'].includes(p.door) ? 1 : 0),
  contract: p => (p.god === '六合' ? 1 : 0),
  career: p => (p.god === '值符' || p.star === '天心' ? 1 : 0),
  wealth: p => (p.door === '生' || p.star === '天任' ? 1 : 0),
};

export interface QimenPalace {
  palace: number;
  name: string;
  direction: string;
  /** 地盤：三奇六儀。 */
  yi: string;
  /** 天盤：九星。 */
  star: string;
  /** 人盤：八門。 */
  door: string;
  /** 神盤：八神。 */
  god: string;
  score: number;
  verdict: Verdict;
}

export interface DialArrangement {
  polarity: Polarity;
  ju: number;
  /** 地盤九宮（含中五），宮號 → 三奇六儀。 */
  earth: Record<number, string>;
  /** 旬首六儀所落的地盤宮，即值符、值使的本宮。 */
  fuPalace: number;
  /** 時干所落的地盤宮，值符轉至此宮。 */
  hourPalace: number;
  /** 時支所落的宮，值使轉至此宮。 */
  shiPalace: number;
  valueStar: string;
  valueDoor: string;
  /** 天盤移位步數（0 為伏吟，4 為反吟）。 */
  starShift: number;
  doorShift: number;
  /** 八個有門的宮位，依宮號由小到大排列。 */
  palaces: QimenPalace[];
  center: { palace: 5; yi: string; note: string };
  patterns: string[];
}

export interface QimenChart extends DialArrangement {
  method: string;
  topic: Topic;
  topicLabel: string;
  /** 排盤時間，例如「2026年10月18日 10:00」。 */
  civil: string;
  term: string;
  termInstant: string;
  /** 符頭所屬的元。 */
  yuan: Yuan;
  dayGanzhi: string;
  hourGanzhi: string;
  xunHead: string;
  xunYi: string;
  hourYi: string;
  hourBranch: string;
  /** 符頭（甲或己日）的公曆日期與日干支，用於定元。 */
  fuDate: string;
  fuGanzhi: string;
  /** 距符頭的五日單元數（符頭當日為 0，可為負數）。 */
  block: number;
  steps: string[];
  best: QimenPalace;
  worst: QimenPalace;
}

const mod = (n: number, m: number): number => ((n % m) + m) % m;

// 公曆日的 Julian Day Number（格里曆）。
function julianDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// Julian Day Number 還原為公曆年月日（Fliegel–Van Flandern 反算）。
function civilOfJulianDay(jd: number): [number, number, number] {
  const a = jd + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return [year, month, day];
}

// 2026-10-18 為乙丑日（六十甲子序號 1）。由此推得甲子日的基準；與 lunar-javascript 日柱的對照見 qimen.spec.ts。
const DAY_REFERENCE = julianDay(2026, 10, 18) - 1;
const dayIndexOf = (jd: number): number => mod(jd - DAY_REFERENCE, 60);

function hourIndexOf(ganzhi: string): number {
  for (let index = 0; index < 60; index += 1) {
    if (STEMS[index % 10] === ganzhi[0] && BRANCHES[index % 12] === ganzhi[1]) return index;
  }
  throw new RangeError(`無效的時干支：${ganzhi}`);
}

// 符頭地支定元起點：子午卯酉為上元，寅申巳亥為中元，辰戌丑未為下元。
function firstYuanIndexOf(branchIndex: number): number {
  if ([0, 3, 6, 9].includes(branchIndex)) return 0;
  if ([2, 5, 8, 11].includes(branchIndex)) return 1;
  return 2;
}

const formatDate = (year: number, month: number, day: number): string => `${year}年${month}月${day}日`;
const formatTime = (hour: number, minute: number): string => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

// 地盤、天盤、人盤、神盤的落位與評分。陰陽遁、局數與時干支已定時，這一步為純計算。
export function arrangeDial(polarity: Polarity, ju: number, hourGanzhi: string, topic: Topic = 'general'): DialArrangement {
  const hourIndex = hourIndexOf(hourGanzhi);
  const hourStem = hourIndex % 10;
  const hourBranch = hourIndex % 12;
  const xunStart = hourIndex - hourStem;
  const xunYi = XUN_YI[xunStart / 10];
  const hourYi = hourStem === 0 ? xunYi : STEMS[hourStem];

  const earth: Record<number, string> = {};
  YI_SEQUENCE.forEach((symbol, step) => {
    const palace = polarity === '陽' ? mod(ju - 1 + step, 9) + 1 : mod(ju - 1 - step, 9) + 1;
    earth[palace] = symbol;
  });
  const palaceOf = (symbol: string): number => {
    const found = Object.keys(earth).find(key => earth[Number(key)] === symbol);
    if (!found) throw new RangeError(`地盤缺少符號：${symbol}`);
    return Number(found);
  };
  const fuPalace = palaceOf(xunYi);
  const hourPalace = palaceOf(hourYi);
  const shiPalace = BRANCH_PALACE[hourBranch];

  // 中五無星門：天禽寄於陽遁坤二、陰遁艮八，轉動時以寄宮代中五的環位。
  const jiPalace = polarity === '陽' ? 2 : 8;
  const ringPos = (palace: number): number => RING.indexOf((palace === 5 ? jiPalace : palace) as (typeof RING)[number]);
  const starShift = mod(ringPos(hourPalace) - ringPos(fuPalace), 8);
  const doorShift = mod(ringPos(shiPalace) - ringPos(fuPalace), 8);
  const direction = polarity === '陽' ? 1 : -1;

  const palaces: QimenPalace[] = [];
  for (const palace of [1, 2, 3, 4, 6, 7, 8, 9]) {
    const pos = ringPos(palace);
    const star = STAR_BY_PALACE[RING[mod(pos - starShift, 8)]];
    const door = DOOR_BY_PALACE[RING[mod(pos - doorShift, 8)]];
    const god = GODS[mod(direction * (pos - ringPos(hourPalace)), 8)];
    const yi = earth[palace];
    const score = STAR_SCORE[star] + DOOR_SCORE[door] + GOD_SCORE[god]
      + (THREE_WONDERS.includes(yi) ? 1 : 0)
      + (THREE_WONDERS.includes(yi) && AUSPICIOUS_DOORS.includes(door) ? 1 : 0)
      + TOPIC_BONUS[topic]({ door, star, god });
    const verdict: Verdict = score >= 3 ? '吉' : score <= -1 ? '凶' : '中';
    palaces.push({ palace, name: PALACE_NAMES[palace].name, direction: PALACE_NAMES[palace].direction, yi, star, door, god, score, verdict });
  }

  // 值符星與值使門是旬首所落宮的本宮星、本宮門（中五時取寄宮）。
  const valueStar = STAR_BY_PALACE[RING[ringPos(fuPalace)]];
  const valueDoor = DOOR_BY_PALACE[RING[ringPos(fuPalace)]];

  const patterns: string[] = [];
  for (const palace of palaces) {
    if (THREE_WONDERS.includes(palace.yi) && AUSPICIOUS_DOORS.includes(palace.door)) {
      patterns.push(`三奇得使：${palace.yi}奇遇${palace.door}門（${palace.name}）`);
    }
  }
  if (starShift === 0) patterns.push('伏吟：值符未離本宮，事多重複，宜守不宜動');
  if (starShift === 4) patterns.push('反吟：值符與本宮相對，變動多，宜審慎');
  if (doorShift === 0) patterns.push('門伏吟：值使未離本宮，宜守舊事、少開新局');

  return {
    polarity,
    ju,
    earth,
    fuPalace,
    hourPalace,
    shiPalace,
    valueStar,
    valueDoor,
    starShift,
    doorShift,
    palaces,
    center: { palace: 5, yi: earth[5], note: `天禽寄${PALACE_NAMES[jiPalace].name}` },
    patterns,
  };
}

// 排盤主流程。date 為 YYYY-MM-DD，time 為 HH:mm，以台北時間（與節氣表一致）換算。
export function chartAt(date: string, time: string, topic: Topic = 'general'): QimenChart {
  const civil = parseCivilDateTime(date, time);
  const lunar = Solar.fromYmdHms(civil.year, civil.month, civil.day, civil.hour, civil.minute, 0).getLunar();
  const eight = lunar.getEightChar();

  // 1. 節氣：最近一個已過的節氣定陰陽遁與局數表。lunar-javascript 回傳簡體節名，這裡轉為本站的繁體。
  const jie = lunar.getPrevJieQi(false);
  const term = TERM_NAME_TRADITIONAL[jie.getName()] ?? jie.getName();
  const termSolar = jie.getSolar();
  const table = JU_TABLE[term];
  if (!table) throw new RangeError(`未收錄的節氣：${term}`);

  // 2. 符頭：節氣日起第一個甲或己日（六十甲子序號為 5 的倍數）；每五日換一符頭，元依上、中、下輪轉。
  const dayJd = julianDay(civil.year, civil.month, civil.day);
  let fuJd = julianDay(termSolar.getYear(), termSolar.getMonth(), termSolar.getDay());
  while (dayIndexOf(fuJd) % 5 !== 0) fuJd += 1;
  const fuIndex = dayIndexOf(fuJd);
  const block = Math.floor((dayJd - fuJd) / 5);
  const yuanIndex = mod(firstYuanIndexOf(fuIndex % 12) + block, 3);
  const yuan = (['上', '中', '下'] as const)[yuanIndex];
  const ju = table.ju[yuanIndex];

  // 3. 排盤落位。
  const hourGanzhi = eight.getTime();
  const arranged = arrangeDial(table.polarity, ju, hourGanzhi, topic);
  const hourIndex = hourIndexOf(hourGanzhi);
  const xunStart = hourIndex - (hourIndex % 10);
  const xunHead = `甲${BRANCHES[xunStart % 12]}旬`;
  const xunYi = XUN_YI[xunStart / 10];
  const hourBranch = BRANCHES[hourIndex % 12];
  const hourYi = arranged.earth[arranged.hourPalace];
  const fuCivil = civilOfJulianDay(fuJd);
  const best = arranged.palaces.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = arranged.palaces.reduce((a, b) => (b.score < a.score ? b : a));
  const direction = table.polarity === '陽' ? '順' : '逆';

  const steps = [
    `節氣：${term}（${formatDate(termSolar.getYear(), termSolar.getMonth(), termSolar.getDay())} ${formatTime(termSolar.getHour(), termSolar.getMinute())} 交節），${table.polarity}遁`,
    `符頭：${formatDate(...fuCivil)}（${STEMS[fuIndex % 10]}${BRANCHES[fuIndex % 12]}日），距符頭 ${block} 個五日單元，屬${yuan}元`,
    `局數：${table.polarity}遁${ju}局（${term}${yuan}元）`,
    `時辰：${hourGanzhi} 時，${xunHead}，六儀為${xunYi}，落地盤${arranged.fuPalace}宮`,
    `時干：${hourGanzhi[0]}（地盤${hourYi}）落地盤${arranged.hourPalace}宮；時支${hourBranch} 落${arranged.shiPalace}宮`,
    `值符：${arranged.valueStar}（${arranged.fuPalace}宮本位星）轉至${arranged.hourPalace}宮，移位 ${arranged.starShift} 步`,
    `值使：${arranged.valueDoor}（${arranged.fuPalace}宮本位門）轉至${arranged.shiPalace}宮，移位 ${arranged.doorShift} 步`,
    `八神：值符神落${arranged.hourPalace}宮，陽順陰逆，${table.polarity}遁${direction}布`,
  ];

  return {
    ...arranged,
    method: QIMEN_METHOD_VERSION,
    topic,
    topicLabel: TOPIC_LABELS[topic],
    civil: `${formatDate(civil.year, civil.month, civil.day)} ${formatTime(civil.hour, civil.minute)}`,
    term,
    termInstant: `${formatDate(termSolar.getYear(), termSolar.getMonth(), termSolar.getDay())} ${formatTime(termSolar.getHour(), termSolar.getMinute())}`,
    yuan,
    dayGanzhi: eight.getDay(),
    hourGanzhi,
    xunHead,
    xunYi,
    hourYi,
    hourBranch,
    fuDate: formatDate(...fuCivil),
    fuGanzhi: `${STEMS[fuIndex % 10]}${BRANCHES[fuIndex % 12]}`,
    block,
    steps,
    best,
    worst,
  };
}
