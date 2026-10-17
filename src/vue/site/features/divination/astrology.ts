import * as Astronomy from 'astronomy-engine';
import { civilPartsAt, parseCivilDateTime, resolveCivilDateTime, type Disambiguation } from './timezone';

export const ASTROLOGY_METHOD_VERSION = 'tropical-whole-sign-v3';
const SIGNS = [
  { name: '牡羊座', element: '火', mode: '開創', text: '主動、直接，適合把想法化為清楚的第一步。' },
  { name: '金牛座', element: '土', mode: '固定', text: '重視穩定與感官經驗，適合用持續投入累積成果。' },
  { name: '雙子座', element: '風', mode: '變動', text: '好奇且善於連結資訊，適合交流、學習與保留彈性。' },
  { name: '巨蟹座', element: '水', mode: '開創', text: '重視情感安全與歸屬，適合照料重要關係和生活根基。' },
  { name: '獅子座', element: '火', mode: '固定', text: '以創造力和熱情展現自我，適合分享成果並尊重彼此空間。' },
  { name: '處女座', element: '土', mode: '變動', text: '擅長觀察細節和改善流程，適合讓實用判斷配合自我寬容。' },
  { name: '天秤座', element: '風', mode: '開創', text: '留意互惠、公平與美感，適合透過協商整理關係中的需要。' },
  { name: '天蠍座', element: '水', mode: '固定', text: '傾向深入理解情緒與信任，適合坦誠面對界線和轉變。' },
  { name: '射手座', element: '火', mode: '變動', text: '追求探索和意義，適合拓展視野並確認實際承諾。' },
  { name: '摩羯座', element: '土', mode: '開創', text: '重視長期目標與責任，適合拆解計畫並安排可持續進度。' },
  { name: '水瓶座', element: '風', mode: '固定', text: '重視理念、獨立與群體，適合提出新做法並保持互相理解。' },
  { name: '雙魚座', element: '水', mode: '變動', text: '想像力與同理心豐富，適合照料感受並建立清楚界線。' },
];
const BODY_LIST: Array<{ id: string; name: string; body: Astronomy.Body }> = [
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
  timeUnknown: boolean;
  birthInstant: string;
  timeZone: string;
  latitude: number;
  longitude: number;
}

function normalize(degrees: number): number {
  return (degrees % 360 + 360) % 360;
}

function signInfo(longitude: number) {
  const signIndex = Math.floor(normalize(longitude) / 30);
  return { signIndex, sign: SIGNS[signIndex], degree: normalize(longitude) - signIndex * 30 };
}

function geoEclipticLongitude(body: Astronomy.Body, instant: Date): number {
  const vector = Astronomy.GeoVector(body, instant, true);
  return normalize(Astronomy.Ecliptic(vector).elon);
}

function angleDifference(first: number, second: number): number {
  const difference = Math.abs(normalize(first) - normalize(second));
  return Math.min(difference, 360 - difference);
}

function calculateAscendantAndMidheaven(instant: Date, latitude: number, longitude: number) {
  const localSidereal = normalize((Astronomy.SiderealTime(instant) + longitude / 15) * 15) * Math.PI / 180;
  const obliquity = Astronomy.e_tilt(new Astronomy.AstroTime(instant)).tobl * Math.PI / 180;
  const latitudeRadians = latitude * Math.PI / 180;
  const x = Math.sin(localSidereal) * Math.cos(obliquity) + Math.tan(latitudeRadians) * Math.sin(obliquity);
  const y = -Math.cos(localSidereal);
  const ascendant = normalize(Math.atan2(y, x) * 180 / Math.PI + 180);
  const mc = normalize(Math.atan2(Math.sin(localSidereal), Math.cos(localSidereal) * Math.cos(obliquity)) * 180 / Math.PI);
  return { ascendant, midheaven: mc };
}

function getAspects(placements: PlanetPlacement[]): AstrologyAspect[] {
  const found: AstrologyAspect[] = [];
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i];
      const b = placements[j];
      const separation = angleDifference(a.longitude, b.longitude);
      const nearest = ASPECTS.map(aspect => ({ aspect, orb: Math.abs(separation - aspect.angle) }))
        .filter(item => item.orb <= item.aspect.orb)
        .sort((left, right) => left.orb - right.orb)[0];
      if (nearest) found.push({ first: a.name, second: b.name, aspect: nearest.aspect.name, orb: nearest.orb, meaning: nearest.aspect.text });
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
  const placements = BODY_LIST.map(item => {
    const longitude = geoEclipticLongitude(item.body, instant);
    const sign = signInfo(longitude);
    const previous = geoEclipticLongitude(item.body, new Date(instant.getTime() - 86_400_000));
    const next = geoEclipticLongitude(item.body, new Date(instant.getTime() + 86_400_000));
    const motion = normalize(next - previous);
    const retrograde = motion > 180;
    return {
      id: item.id,
      name: item.name,
      longitude,
      sign: sign.sign.name,
      signIndex: sign.signIndex,
      degree: sign.degree,
      element: sign.sign.element,
      house: ascInfo ? (sign.signIndex - ascInfo.signIndex + 12) % 12 + 1 : null,
      retrograde,
    };
  });
  const sun = placements.find(item => item.id === 'sun')!;
  const moon = placements.find(item => item.id === 'moon')!;
  const aspects = getAspects(placements);
  return {
    planets: placements,
    ascendant: ascMc && ascInfo ? { longitude: ascMc.ascendant, sign: ascInfo.sign.name, degree: ascInfo.degree } : null,
    midheaven: ascMc ? { longitude: ascMc.midheaven, sign: signInfo(ascMc.midheaven).sign.name, degree: signInfo(ascMc.midheaven).degree } : null,
    aspects,
    methodVersion: ASTROLOGY_METHOD_VERSION,
    methodSummary: 'Tropical zodiac、地心視黃道位置、Whole Sign 整宮制、五種主要相位；上升點與天頂依當地恆星時估算。未知出生時間以當地正午估算行星位置，並隱藏上升點、天頂與宮位。',
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
  evidence: string[];
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

export function createAstrologyForecast(chart: AstrologyChart, period: AstrologyForecastPeriod, start = new Date()): AstrologyForecast {
  const spanDays = period === 'day' ? 0 : period === 'month' ? 30 : 365;
  const natalTargets: Array<{ id: string; name: string; longitude: number }> = chart.planets
    .map(item => ({ id: item.id, name: item.name, longitude: item.longitude }));
  if (chart.ascendant) natalTargets.push({ id: 'ascendant', name: '上升點', longitude: chart.ascendant.longitude });
  if (chart.midheaven) natalTargets.push({ id: 'midheaven', name: '天頂', longitude: chart.midheaven.longitude });
  const bodyTargets = BODY_LIST;
  const transitData = new Map<string, { transit: string; natal: string; aspect: typeof ASPECTS[number]; samples: Array<{ at: Date; orb: number }> }>();
  const sampleCount = spanDays + 1;
  for (let index = 0; index < sampleCount; index++) {
    const instant = new Date(start.getTime() + index * 86_400_000);
    const transitPositions = bodyTargets.map(body => ({ ...body, longitude: geoEclipticLongitude(body.body, instant) }));
    for (const transit of transitPositions) for (const natal of natalTargets) {
      const separation = angleDifference(transit.longitude, natal.longitude);
      for (const aspect of ASPECTS) {
        const key = `${transit.id}-${aspect.name}-${natal.id}`;
        const item = transitData.get(key) ?? { transit: transit.name, natal: natal.name, aspect, samples: [] };
        item.samples.push({ at: instant, orb: Math.abs(separation - aspect.angle) });
        transitData.set(key, item);
      }
    }
  }

  const events: AstrologyTransitEvent[] = [];
  for (const item of transitData.values()) {
    const minima: Array<{ at: Date; orb: number }> = [];
    if (period === 'day') {
      const sample = item.samples[0];
      if (sample.orb <= item.aspect.orb) minima.push(sample);
    } else {
      for (let index = 1; index < item.samples.length - 1; index++) {
        const previous = item.samples[index - 1];
        const current = item.samples[index];
        const next = item.samples[index + 1];
        if (current.orb <= item.aspect.orb && current.orb <= previous.orb && current.orb <= next.orb) minima.push(current);
      }
      if (item.samples[0].orb <= item.aspect.orb && item.samples[0].orb < item.samples[1].orb) minima.unshift(item.samples[0]);
      if (item.samples.at(-1)!.orb <= item.aspect.orb && item.samples.at(-1)!.orb < item.samples.at(-2)!.orb) minima.push(item.samples.at(-1)!);
    }
    const transitBody = bodyTargets.find(body => body.name === item.transit)!;
    const natalTarget = natalTargets.find(target => target.name === item.natal)!;
    for (const candidate of minima) {
      let exactAt = candidate.at;
      let orb = candidate.orb;
      if (period !== 'day') {
        let left = Math.max(start.getTime(), candidate.at.getTime() - 86_400_000);
        let right = Math.min(start.getTime() + spanDays * 86_400_000, candidate.at.getTime() + 86_400_000);
        const orbAt = (milliseconds: number) => Math.abs(angleDifference(geoEclipticLongitude(transitBody.body, new Date(milliseconds)), natalTarget.longitude) - item.aspect.angle);
        for (let pass = 0; pass < 26; pass++) {
          const first = left + (right - left) / 3;
          const second = right - (right - left) / 3;
          if (orbAt(first) <= orbAt(second)) right = second;
          else left = first;
        }
        exactAt = new Date((left + right) / 2);
        orb = orbAt(exactAt.getTime());
      }
      const timeDelta = period === 'day' ? 6 * 3_600_000 : 12 * 3_600_000;
      const beforeOrb = Math.abs(angleDifference(geoEclipticLongitude(transitBody.body, new Date(exactAt.getTime() - timeDelta)), natalTarget.longitude) - item.aspect.angle);
      const afterOrb = Math.abs(angleDifference(geoEclipticLongitude(transitBody.body, new Date(exactAt.getTime() + timeDelta)), natalTarget.longitude) - item.aspect.angle);
      const phase = orb <= 0.05 ? '精確相位' : beforeOrb > afterOrb ? '接近中' : '分離中';
      if (events.some(event => event.transit === item.transit && event.natal === item.natal && event.aspect === item.aspect.name && Math.abs(new Date(event.exactAt).getTime() - exactAt.getTime()) < 2 * 86_400_000)) continue;
      events.push({ transit: item.transit, natal: item.natal, aspect: item.aspect.name, exactAt: exactAt.toISOString(), orb, phase, meaning: item.aspect.text });
    }
  }
  const orderedEvents = events.sort((left, right) => left.exactAt.localeCompare(right.exactAt) || left.orb - right.orb);
  const evidence = orderedEvents.map(event => `${event.transit}與本命${event.natal}${event.aspect}（${new Date(event.exactAt).toLocaleDateString('zh-TW')}附近，${event.phase}，殘餘容許度 ${event.orb.toFixed(2)}°）`);
  const label = period === 'day' ? '今日' : period === 'month' ? '未來一個月' : '未來一年';
  const text = evidence.length
    ? `${spanDays === 0 ? '目前' : `未來 ${spanDays} 天逐日掃描並細化`}找到 ${evidence.length} 個主要行運相位窗口，依精確時刻排序完整列出。可把這些象徵主題當作整理節奏與需求的提示，並以實際情況作判斷。`
    : '這段期間未找到設定容許度內的主要行運相位；這不代表沒有值得留意的事。';
  return { periodLabel: label, text, evidence, events: orderedEvents, methodVersion: ASTROLOGY_METHOD_VERSION };
}

export function signDescription(signName: string, role: 'sun' | 'moon' | 'rising'): string {
  const sign = SIGNS.find(item => item.name === signName);
  if (!sign) return '';
  const roleText = role === 'sun' ? '核心動機與自我表達' : role === 'moon' ? '情緒需求與安全感' : '初次互動與面對環境的風格';
  return `${roleText}可參考${sign.name}的象徵特質。${sign.text}元素：${sign.element}；模式：${sign.mode}。`;
}

export const ASTROLOGY_ASPECTS = ASPECTS;
export const ASTROLOGY_SIGNS = SIGNS.map(sign => sign.name);
