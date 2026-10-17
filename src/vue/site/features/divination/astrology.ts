import * as Astronomy from 'astronomy-engine';
import { parseCivilDateTime, resolveCivilDateTime, type Disambiguation } from '../fortune-core/civil-time';
import { calculateAscendantAndMidheaven, geoEclipticLongitude, normalize } from '../fortune-core/ephemeris';
import type { InputPrecision } from '../fortune-core/result';
import { SIGNS, signDescription } from './astrology-signs';

export { signDescription, calculateAscendantAndMidheaven, geoEclipticLongitude, normalize };

export const ASTROLOGY_METHOD_VERSION = 'tropical-whole-sign-v3';
export const DAY_MS = 86_400_000;
export const BODY_LIST: Array<{ id: string; name: string; body: Astronomy.Body }> = [
  { id: 'sun', name: '太陽', body: Astronomy.Body.Sun },
  { id: 'moon', name: '月亮', body: Astronomy.Body.Moon },
  { id: 'mercury', name: '水星', body: Astronomy.Body.Mercury },
  { id: 'venus', name: '金星', body: Astronomy.Body.Venus },
  { id: 'mars', name: '火星', body: Astronomy.Body.Mars },
  { id: 'jupiter', name: '木星', body: Astronomy.Body.Jupiter },
  { id: 'saturn', name: '土星', body: Astronomy.Body.Saturn },
  { id: 'uranus', name: '天王星', body: Astronomy.Body.Uranus },
  { id: 'neptune', name: '海王星', body: Astronomy.Body.Neptune },
  { id: 'pluto', name: '冥王星', body: Astronomy.Body.Pluto },
];
const ASPECTS = [
  { name: '合相', angle: 0, orb: 7, text: '相關主題較集中，適合留意不同需求如何融合。' },
  { name: '六合', angle: 60, orb: 5, text: '象徵較容易運用的合作機會，仍需要主動投入。' },
  { name: '四分相', angle: 90, orb: 6, text: '可能帶來張力或調整動機，可把阻力轉成具體問題。' },
  { name: '三分相', angle: 120, orb: 6, text: '兩種傾向較容易流動，留意是否需要刻意使用這份優勢。' },
  { name: '對分相', angle: 180, orb: 7, text: '呈現需要平衡的兩端，對話與界線有助找到中間位置。' },
];

export interface AstrologyInput {
  birthDate: string;
  birthTime: string;
  timeZone: string;
  latitude: number;
  longitude: number;
  timeUnknown?: boolean;
  disambiguation?: Disambiguation;
}

export interface PlanetPlacement {
  id: string;
  name: string;
  longitude: number;
  sign: string;
  signIndex: number;
  degree: number;
  element: string;
  house: number | null;
  retrograde: boolean;
}

export interface AstrologyAspect {
  first: string;
  second: string;
  aspect: string;
  orb: number;
  meaning: string;
}

export interface AstrologyChart {
  planets: PlanetPlacement[];
  ascendant: { longitude: number; sign: string; degree: number } | null;
  midheaven: { longitude: number; sign: string; degree: number } | null;
  aspects: AstrologyAspect[];
  methodVersion: string;
  methodSummary: string;
  inputPrecision: InputPrecision;
  timeUnknown: boolean;
  birthInstant: string;
  timeZone: string;
  latitude: number;
  longitude: number;
}

function signInfo(longitude: number) {
  const signIndex = Math.floor(normalize(longitude) / 30);
  return { signIndex, sign: SIGNS[signIndex], degree: normalize(longitude) - signIndex * 30 };
}

export function angleDifference(first: number, second: number): number {
  const difference = Math.abs(normalize(first) - normalize(second));
  return Math.min(difference, 360 - difference);
}

/** 在容許度內，取與分離角最接近的主要相位；找不到時回傳 undefined。 */
export function findClosestAspect<T extends { angle: number; orb: number }>(separation: number, aspects: readonly T[]): { aspect: T; orb: number } | undefined {
  let closest: { aspect: T; orb: number } | undefined;
  for (const aspect of aspects) {
    const orb = Math.abs(separation - aspect.angle);
    if (orb <= aspect.orb && (!closest || orb < closest.orb)) closest = { aspect, orb };
  }
  return closest;
}

/** 計算本命行星落點；`ascendantSignIndex` 為 null 時不推算宮位。 */
export function calculatePlacements(instant: Date, ascendantSignIndex: number | null): PlanetPlacement[] {
  return BODY_LIST.map(item => {
    const longitude = geoEclipticLongitude(item.body, instant);
    const sign = signInfo(longitude);
    const previous = geoEclipticLongitude(item.body, new Date(instant.getTime() - DAY_MS));
    const next = geoEclipticLongitude(item.body, new Date(instant.getTime() + DAY_MS));
    return {
      id: item.id,
      name: item.name,
      longitude,
      sign: sign.sign.name,
      signIndex: sign.signIndex,
      degree: sign.degree,
      element: sign.sign.element,
      house: ascendantSignIndex === null ? null : (sign.signIndex - ascendantSignIndex + 12) % 12 + 1,
      retrograde: normalize(next - previous) > 180,
    };
  });
}

function getAspects(placements: PlanetPlacement[]): AstrologyAspect[] {
  const found: AstrologyAspect[] = [];
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i];
      const b = placements[j];
      const closest = findClosestAspect(angleDifference(a.longitude, b.longitude), ASPECTS);
      if (closest) found.push({ first: a.name, second: b.name, aspect: closest.aspect.name, orb: closest.orb, meaning: closest.aspect.text });
    }
  }
  return found.sort((a, b) => a.orb - b.orb).slice(0, 24);
}

export function calculateAstrology(input: AstrologyInput): AstrologyChart {
  if (!Number.isFinite(input.latitude) || input.latitude < -66 || input.latitude > 66) throw new RangeError('本版上升點與宮位支援南北緯 66 度以內的位置。');
  if (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) throw new RangeError('經度需介於 -180 至 180 度。');
  const time = input.timeUnknown ? '12:00' : input.birthTime;
  const civil = parseCivilDateTime(input.birthDate, time);
  const instant = resolveCivilDateTime(civil, input.timeZone, input.disambiguation);
  const ascMc = input.timeUnknown ? null : calculateAscendantAndMidheaven(instant, input.latitude, input.longitude);
  const ascInfo = ascMc ? signInfo(ascMc.ascendant) : null;
  const placements = calculatePlacements(instant, ascInfo ? ascInfo.signIndex : null);
  const aspects = getAspects(placements);
  return {
    planets: placements,
    ascendant: ascMc && ascInfo ? { longitude: ascMc.ascendant, sign: ascInfo.sign.name, degree: ascInfo.degree } : null,
    midheaven: ascMc ? { longitude: ascMc.midheaven, sign: signInfo(ascMc.midheaven).sign.name, degree: signInfo(ascMc.midheaven).degree } : null,
    aspects,
    methodVersion: ASTROLOGY_METHOD_VERSION,
    methodSummary: 'Tropical zodiac、地心視黃道位置、Whole Sign 整宮制、五種主要相位；上升點與天頂依當地恆星時估算。未知出生時間以當地正午估算行星位置，並隱藏上升點、天頂與宮位。',
    inputPrecision: input.timeUnknown ? 'approximate' : 'full',
    timeUnknown: Boolean(input.timeUnknown),
    birthInstant: instant.toISOString(),
    timeZone: input.timeZone,
    latitude: input.latitude,
    longitude: input.longitude,
  };
}

export type AstrologyForecastPeriod = 'day' | 'month' | 'year';

export interface AstrologyForecast {
  periodLabel: string;
  text: string;
  events: AstrologyTransitEvent[];
  methodVersion: string;
}

export interface AstrologyTransitEvent {
  transit: string;
  natal: string;
  aspect: string;
  exactAt: string;
  orb: number;
  phase: string;
  meaning: string;
}

/**
 * 在單峰區間內以 Brent 方法搜尋最小值：拋物線插值能收斂時使用插值，否則退回黃金分割。收斂容許值為 5 秒，
 * 遠細於顯示的分鐘。以 424 個實際極小值與 60 輪黃金分割的基準比對：每個極小值約 14 次天體位置計算（原本固定 16 輪約 18 次），
 * 最大誤差約 5 秒（原本約 12 秒）。回傳最小值所在的毫秒時間點。
 */
export function brentMinimum(valueAt: (milliseconds: number) => number, left: number, right: number): number {
  const GOLDEN = (3 - Math.sqrt(5)) / 2;
  const TOLERANCE_MS = 5_000;
  // 以區間起點為原點，讓插值在較小的數值範圍內進行，避免大數的精度損失。
  const evaluate = (offset: number) => valueAt(left + offset);
  let a = 0;
  let b = right - left;
  let x = a + GOLDEN * (b - a);
  let w = x;
  let v = x;
  let fx = evaluate(x);
  let fw = fx;
  let fv = fx;
  let d = 0;
  let e = 0;
  for (let iteration = 0; iteration < 100; iteration++) {
    const middle = (a + b) / 2;
    if (Math.abs(x - middle) <= 2 * TOLERANCE_MS - (b - a) / 2) break;
    if (Math.abs(e) > TOLERANCE_MS) {
      const r = (x - w) * (fx - fv);
      let q = (x - v) * (fx - fw);
      let p = (x - v) * q - (x - w) * r;
      q = 2 * (q - r);
      if (q > 0) p = -p;
      q = Math.abs(q);
      const previousStep = e;
      e = d;
      if (Math.abs(p) < Math.abs(q * previousStep / 2) && p > q * (a - x) && p < q * (b - x)) {
        d = p / q;
        if (x + d - a < 2 * TOLERANCE_MS || b - (x + d) < 2 * TOLERANCE_MS) d = x < middle ? TOLERANCE_MS : -TOLERANCE_MS;
      } else {
        e = x >= middle ? a - x : b - x;
        d = GOLDEN * e;
      }
    } else {
      e = x >= middle ? a - x : b - x;
      d = GOLDEN * e;
    }
    const u = x + (Math.abs(d) >= TOLERANCE_MS ? d : d >= 0 ? TOLERANCE_MS : -TOLERANCE_MS);
    const fu = evaluate(u);
    if (fu <= fx) {
      if (u >= x) a = x;
      else b = x;
      v = w;
      fv = fw;
      w = x;
      fw = fx;
      x = u;
      fx = fu;
    } else {
      if (u < x) a = u;
      else b = u;
      if (fu <= fw || w === x) {
        v = w;
        fv = fw;
        w = u;
        fw = fu;
      } else if (fu <= fv || v === x || v === w) {
        v = u;
        fv = fu;
      }
    }
  }
  return left + x;
}

/** 行運掃描的一組配對（行星 × 本命點 × 相位）；取樣容許度存在陣列中，避免為每個樣本建立物件。 */
interface TransitCombo {
  bodyIndex: number;
  natal: { name: string; longitude: number };
  aspect: (typeof ASPECTS)[number];
  orbs: Float64Array;
  exactTimes: number[];
}

/** 精確時刻距離期間起訖不到此值，視為落在期間之外（極小值搜尋會收斂到邊界）。 */
const BOUNDARY_TOLERANCE_MS = 60_000;
/**
 * 行運取樣間距。月亮約每日行進 13°（最快約 15°），半日約 7.5°，小於最窄的六合容許帶（±5°，共 10°），
 * 因此每個相位窗口至少會落在一個取樣點內；若逐日取樣，月亮的六合、四分等窗口會被跳過。
 */
const SAMPLE_MS = DAY_MS / 2;

/** 容許度取樣陣列中的局部極小值索引；只有一個取樣點時，只看該點。 */
function sampledMinima(orbs: Float64Array, limit: number): number[] {
  const last = orbs.length - 1;
  if (last === 0) return orbs[0] <= limit ? [0] : [];
  const minima: number[] = [];
  if (orbs[0] <= limit && orbs[0] < orbs[1]) minima.push(0);
  for (let index = 1; index < last; index++) {
    const current = orbs[index];
    if (current <= limit && current <= orbs[index - 1] && current <= orbs[index + 1]) minima.push(index);
  }
  if (orbs[last] <= limit && orbs[last] < orbs[last - 1]) minima.push(last);
  return minima;
}

export function createAstrologyForecast(chart: AstrologyChart, period: AstrologyForecastPeriod, start = new Date()): AstrologyForecast {
  // 「今日」掃描未來 24 小時的相位窗口；舊版只檢查計算當下的容許度，會把當下時刻誤當成相位發生時間。
  const spanDays = period === 'day' ? 1 : period === 'month' ? 30 : 365;
  const startMs = start.getTime();
  const windowEndMs = startMs + spanDays * DAY_MS;
  const natalTargets = chart.planets.map(item => ({ name: item.name, longitude: item.longitude }));
  if (chart.ascendant) natalTargets.push({ name: '上升點', longitude: chart.ascendant.longitude });
  if (chart.midheaven) natalTargets.push({ name: '天頂', longitude: chart.midheaven.longitude });

  const sampleCount = spanDays * (DAY_MS / SAMPLE_MS) + 1;
  const combos: TransitCombo[] = [];
  for (let bodyIndex = 0; bodyIndex < BODY_LIST.length; bodyIndex++) for (const natal of natalTargets) for (const aspect of ASPECTS) {
    combos.push({ bodyIndex, natal, aspect, orbs: new Float64Array(sampleCount), exactTimes: [] });
  }
  for (let index = 0; index < sampleCount; index++) {
    const instant = new Date(startMs + index * SAMPLE_MS);
    const longitudes = BODY_LIST.map(body => geoEclipticLongitude(body.body, instant));
    for (const combo of combos) {
      combo.orbs[index] = Math.abs(angleDifference(longitudes[combo.bodyIndex], combo.natal.longitude) - combo.aspect.angle);
    }
  }

  const events: AstrologyTransitEvent[] = [];
  for (const combo of combos) {
    const body = BODY_LIST[combo.bodyIndex];
    const { natal, aspect } = combo;
    const orbAt = (milliseconds: number) => Math.abs(angleDifference(geoEclipticLongitude(body.body, new Date(milliseconds)), natal.longitude) - aspect.angle);
    const timeDelta = period === 'day' ? 6 * 3_600_000 : 12 * 3_600_000;
    for (const index of sampledMinima(combo.orbs, aspect.orb)) {
      const left = Math.max(startMs, startMs + (index - 1) * SAMPLE_MS);
      const right = Math.min(windowEndMs, startMs + (index + 1) * SAMPLE_MS);
      const exactMs = new Date(brentMinimum(orbAt, left, right)).getTime();
      if (exactMs - startMs < BOUNDARY_TOLERANCE_MS || windowEndMs - exactMs < BOUNDARY_TOLERANCE_MS) continue;
      const orb = orbAt(exactMs);
      if (combo.exactTimes.some(time => Math.abs(time - exactMs) < 2 * DAY_MS)) continue;
      const beforeOrb = orbAt(exactMs - timeDelta);
      const afterOrb = orbAt(exactMs + timeDelta);
      const phase = orb <= 0.05 ? '精確相位' : beforeOrb > afterOrb ? '接近中' : '分離中';
      combo.exactTimes.push(exactMs);
      events.push({ transit: body.name, natal: natal.name, aspect: aspect.name, exactAt: new Date(exactMs).toISOString(), orb, phase, meaning: aspect.text });
    }
  }
  const orderedEvents = events.sort((left, right) => left.exactAt.localeCompare(right.exactAt) || left.orb - right.orb);
  const label = period === 'day' ? '今日' : period === 'month' ? '未來一個月' : '未來一年';
  const scanNote = period === 'day' ? '未來 24 小時' : `未來 ${spanDays} 天`;
  const text = orderedEvents.length
    ? `${scanNote}每 12 小時掃描並細化，找到 ${orderedEvents.length} 個主要行運相位窗口，依精確時刻排序完整列出。可把這些象徵主題當作整理節奏與需求的提示，並以實際情況作判斷。`
    : `${scanNote}未找到設定容許度內的主要行運相位；這不代表沒有值得留意的事。`;
  return { periodLabel: label, text, events: orderedEvents, methodVersion: ASTROLOGY_METHOD_VERSION };
}


export const ASTROLOGY_ASPECTS = ASPECTS;
export const ASTROLOGY_SIGNS = SIGNS.map(sign => sign.name);
