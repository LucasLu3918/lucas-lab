// 吠陀占星（Jyotish）排盤：Lahiri 恆星黃道、月宿與宿內分段、維姆歐塔里大運、九曜與整宮制上升。
// 規則依 docs/plan/FORTUNE_HUB_PLAN.md §3.11；天體位置沿用 fortune-core/ephemeris 的地心視黃道經度。
import * as Astronomy from 'astronomy-engine';
import { parseCivilDateTime, resolveCivilDateTime, type Disambiguation } from '../fortune-core/civil-time';
import { calculateAscendantAndMidheaven, geoEclipticLongitude, normalize } from '../fortune-core/ephemeris';
import { createMethodResult, type InputPrecision, type MethodResult } from '../fortune-core/result';
import { DASHA_ORDER, DASHA_TOTAL_YEARS, GRAHAS, NAKSHATRAS, RASHIS, type GrahaId, type NakshatraInfo } from './vedic-data';

export const VEDIC_METHOD_VERSION = 'vedic-lahiri-vimshottari-v1';
export const VEDIC_CONTENT_VERSION = 'vedic-copy-v1';

const DAY_MS = 86_400_000;
const JULIAN_UNIX_EPOCH = 2440587.5;
const J2000 = 2451545;
const DASHA_YEAR_MS = 365.25 * DAY_MS;
export const NAKSHATRA_SPAN = 360 / 27;
const PADA_SPAN = NAKSHATRA_SPAN / 4;
// 月亮距宿界不到此度數時提醒可能落在相鄰的宿（約 1.8 小時的月亮行程）。
const BOUNDARY_WARNING_DEGREES = 1;
const MAX_DASHA_PERIODS = 40;

const CLASSICAL_BODIES: Array<{ id: GrahaId; body: Astronomy.Body }> = [
  { id: 'sun', body: Astronomy.Body.Sun },
  { id: 'moon', body: Astronomy.Body.Moon },
  { id: 'mars', body: Astronomy.Body.Mars },
  { id: 'mercury', body: Astronomy.Body.Mercury },
  { id: 'jupiter', body: Astronomy.Body.Jupiter },
  { id: 'venus', body: Astronomy.Body.Venus },
  { id: 'saturn', body: Astronomy.Body.Saturn },
];
// 太陽與月亮不逆行；交點恆為平均運動的逆向，因此不標示逆行。
const CAN_RETROGRADE = new Set<GrahaId>(['mars', 'mercury', 'jupiter', 'venus', 'saturn']);

export interface VedicInput {
  birthDate: string;
  birthTime: string;
  timeZone: string;
  latitude: number;
  longitude: number;
  timeUnknown?: boolean;
  disambiguation?: Disambiguation;
}

export interface GrahaPlacement {
  id: GrahaId;
  name: string;
  longitude: number;
  sign: string;
  degree: number;
  house: number | null;
  retrograde: boolean;
}

export interface DashaPeriod {
  planet: GrahaId;
  startAt: string;
  endAt: string;
  years: number;
}

export interface VedicChart {
  birthInstant: string;
  timeZone: string;
  latitude: number;
  longitude: number;
  timeUnknown: boolean;
  asOf: string;
  ayanamsa: number;
  lagna: { sign: string; degree: number } | null;
  moon: {
    sign: string;
    degree: number;
    nakshatra: NakshatraInfo;
    pada: number;
    degreeInNakshatra: number;
    nearBoundary: boolean;
  };
  grahas: GrahaPlacement[];
  dasha: {
    birthLord: GrahaId;
    remainingYears: number;
    current: DashaPeriod;
    antardasha: DashaPeriod;
    antardashas: DashaPeriod[];
    upcoming: DashaPeriod[];
  };
}

export type VedicReport = MethodResult<VedicChart>;

export function julianDay(instant: Date): number {
  return instant.getTime() / DAY_MS + JULIAN_UNIX_EPOCH;
}

/** Lahiri 歲差值（度）：以 J2000.0 的 23°51′11″ 為起點，依 50.29″／年線性外推；長時間尺度會有數角分的近似誤差。 */
export function lahiriAyanamsa(instant: Date): number {
  const years = (julianDay(instant) - J2000) / 365.25;
  return 23.85306 + (50.290966 / 3600) * years;
}

/** 平均月交點（黃經，度）：Meeus 的多項式式；羅睺為北交點，計都為其對點。 */
export function meanNorthNode(instant: Date): number {
  const t = (julianDay(instant) - J2000) / 36525;
  return normalize(125.04452 - 1934.136261 * t + 0.0020708 * t * t + (t * t * t) / 450000);
}

/** 月宿與宿內分段：每宿 13°20′，每宿分四個 3°20′ 的段（pada）。 */
export function nakshatraAt(siderealMoon: number) {
  const index = Math.min(NAKSHATRAS.length - 1, Math.floor(siderealMoon / NAKSHATRA_SPAN));
  const degreeInNakshatra = siderealMoon - index * NAKSHATRA_SPAN;
  return {
    index,
    info: NAKSHATRAS[index],
    pada: Math.min(4, Math.floor(degreeInNakshatra / PADA_SPAN) + 1),
    degreeInNakshatra,
    nearBoundary: Math.min(degreeInNakshatra, NAKSHATRA_SPAN - degreeInNakshatra) < BOUNDARY_WARNING_DEGREES,
  };
}

function addYears(milliseconds: number, years: number): number {
  return milliseconds + years * DASHA_YEAR_MS;
}

function period(planet: GrahaId, startMs: number, years: number): DashaPeriod {
  return { planet, startAt: new Date(startMs).toISOString(), endAt: new Date(addYears(startMs, years)).toISOString(), years };
}

/**
 * 大運序列。出生時月亮已走過宿內的比例，因此第一段大運的起點是出生前的「虛擬起點」，
 * 其長度為完整年數、扣除已走過的部分，使出生後的剩餘年數等於 (1 − 已走比例) × 年數。
 */
export function mahadashaSequence(birth: Date, siderealMoon: number, asOf: Date): { periods: DashaPeriod[]; birthLord: GrahaId; remainingYears: number } {
  const { info, degreeInNakshatra } = nakshatraAt(siderealMoon);
  const birthLord = info.lord;
  const elapsed = degreeInNakshatra / NAKSHATRA_SPAN;
  const remainingYears = (1 - elapsed) * GRAHAS[birthLord].years;
  let startMs = birth.getTime() - elapsed * GRAHAS[birthLord].years * DASHA_YEAR_MS;
  const periods: DashaPeriod[] = [];
  const lordIndex = DASHA_ORDER.indexOf(birthLord);
  // 排到含有 asOf 的那一段，再多排四段作為「接下來」的大運。
  let currentIndex = -1;
  for (let n = 0; n < MAX_DASHA_PERIODS; n++) {
    const planet = DASHA_ORDER[(lordIndex + n) % DASHA_ORDER.length];
    const item = period(planet, startMs, GRAHAS[planet].years);
    periods.push(item);
    if (currentIndex < 0 && Date.parse(item.endAt) > asOf.getTime()) currentIndex = periods.length - 1;
    if (currentIndex >= 0 && periods.length >= currentIndex + 5) break;
    startMs = Date.parse(item.endAt);
  }
  return { periods, birthLord, remainingYears };
}

/** 某段大運內的次限（antardasha）：長度為大運年數 × 次限主星年數 ÷ 120，依同一循環順序排列，從大運主星自己開始。 */
export function antardashasOf(mahadasha: DashaPeriod): DashaPeriod[] {
  const startIndex = DASHA_ORDER.indexOf(mahadasha.planet);
  let startMs = Date.parse(mahadasha.startAt);
  return DASHA_ORDER.map((_, k) => {
    const planet = DASHA_ORDER[(startIndex + k) % DASHA_ORDER.length];
    const years = mahadasha.years * GRAHAS[planet].years / DASHA_TOTAL_YEARS;
    const item = period(planet, startMs, years);
    startMs = Date.parse(item.endAt);
    return item;
  });
}

function containing(periods: readonly DashaPeriod[], asOf: Date): DashaPeriod | undefined {
  return periods.find(item => Date.parse(item.startAt) <= asOf.getTime() && asOf.getTime() < Date.parse(item.endAt));
}

function grahaLongitudes(instant: Date, ayanamsa: number): Record<GrahaId, { longitude: number; retrograde: boolean }> {
  const result = {} as Record<GrahaId, { longitude: number; retrograde: boolean }>;
  for (const { id, body } of CLASSICAL_BODIES) {
    const longitude = normalize(geoEclipticLongitude(body, instant) - ayanamsa);
    const previous = geoEclipticLongitude(body, new Date(instant.getTime() - DAY_MS));
    const next = geoEclipticLongitude(body, new Date(instant.getTime() + DAY_MS));
    result[id] = { longitude, retrograde: CAN_RETROGRADE.has(id) && normalize(next - previous) > 180 };
  }
  const rahu = normalize(meanNorthNode(instant) - ayanamsa);
  result.rahu = { longitude: rahu, retrograde: false };
  result.ketu = { longitude: normalize(rahu + 180), retrograde: false };
  return result;
}

function signOf(longitude: number): { sign: string; signIndex: number; degree: number } {
  const signIndex = Math.floor(longitude / 30);
  return { sign: `${RASHIS[signIndex].name}（${RASHIS[signIndex].chinese}）`, signIndex, degree: longitude - signIndex * 30 };
}

function validate(input: VedicInput, unknownTime: boolean): void {
  if (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) throw new RangeError('經度需介於 -180 至 180 度。');
  if (!unknownTime && (!Number.isFinite(input.latitude) || input.latitude < -66 || input.latitude > 66)) {
    throw new RangeError('上升星座支援南北緯 66 度以內的位置。');
  }
}

/** 排出吠陀星盤。`asOf` 決定目前的大運，測試時可固定。 */
export function calculateVedicReport(input: VedicInput, asOf: Date = new Date()): VedicReport {
  const unknownTime = Boolean(input.timeUnknown);
  validate(input, unknownTime);
  const civil = parseCivilDateTime(input.birthDate, unknownTime ? '12:00' : input.birthTime);
  const birth = resolveCivilDateTime(civil, input.timeZone, input.disambiguation);
  const ayanamsa = lahiriAyanamsa(birth);
  const longitudes = grahaLongitudes(birth, ayanamsa);

  const moonSidereal = longitudes.moon.longitude;
  const moonNakshatra = nakshatraAt(moonSidereal);
  const moonSign = signOf(moonSidereal);

  const lagnaSidereal = unknownTime ? null : normalize(calculateAscendantAndMidheaven(birth, input.latitude, input.longitude).ascendant - ayanamsa);
  const lagnaSign = lagnaSidereal === null ? null : signOf(lagnaSidereal);

  const grahas: GrahaPlacement[] = (Object.keys(GRAHAS) as GrahaId[]).map(id => {
    const { longitude, retrograde } = longitudes[id];
    const placed = signOf(longitude);
    return {
      id,
      name: GRAHAS[id].name,
      longitude,
      sign: placed.sign,
      degree: placed.degree,
      house: lagnaSign === null ? null : (placed.signIndex - lagnaSign.signIndex + 12) % 12 + 1,
      retrograde,
    };
  });

  const sequence = mahadashaSequence(birth, moonSidereal, asOf);
  const current = containing(sequence.periods, asOf) ?? sequence.periods[0];
  const antardashas = antardashasOf(current);
  const antardasha = containing(antardashas, asOf) ?? antardashas[0];
  const currentIndex = sequence.periods.indexOf(current);

  const chart: VedicChart = {
    birthInstant: birth.toISOString(),
    timeZone: input.timeZone,
    latitude: input.latitude,
    longitude: input.longitude,
    timeUnknown: unknownTime,
    asOf: asOf.toISOString(),
    ayanamsa,
    lagna: lagnaSign ? { sign: lagnaSign.sign, degree: lagnaSign.degree } : null,
    moon: {
      sign: moonSign.sign,
      degree: moonSign.degree,
      nakshatra: moonNakshatra.info,
      pada: moonNakshatra.pada,
      degreeInNakshatra: moonNakshatra.degreeInNakshatra,
      nearBoundary: moonNakshatra.nearBoundary,
    },
    grahas,
    dasha: {
      birthLord: sequence.birthLord,
      remainingYears: sequence.remainingYears,
      current,
      antardasha,
      antardashas,
      upcoming: sequence.periods.slice(currentIndex + 1, currentIndex + 5),
    },
  };
  const inputPrecision: InputPrecision = unknownTime ? 'approximate' : 'full';
  return createMethodResult({ module: 'vedic', methodVersion: VEDIC_METHOD_VERSION, contentVersion: VEDIC_CONTENT_VERSION, inputPrecision, data: chart });
}
