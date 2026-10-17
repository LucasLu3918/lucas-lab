import * as Astronomy from 'astronomy-engine';
import { civilPartsAt } from './timezone';
import type { BirthPlace } from './locations';
import type { AstrologyChart, PlanetPlacement } from './astrology';

const DAY_MS = 86_400_000;
const TROPICAL_YEAR_DAYS = 365.2422;
const SIGNS = ['牡羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座'];
const BODIES: Array<{ id: string; name: string; body: Astronomy.Body }> = [
  { id: 'sun', name: '太陽', body: Astronomy.Body.Sun }, { id: 'moon', name: '月亮', body: Astronomy.Body.Moon },
  { id: 'mercury', name: '水星', body: Astronomy.Body.Mercury }, { id: 'venus', name: '金星', body: Astronomy.Body.Venus },
  { id: 'mars', name: '火星', body: Astronomy.Body.Mars }, { id: 'jupiter', name: '木星', body: Astronomy.Body.Jupiter },
  { id: 'saturn', name: '土星', body: Astronomy.Body.Saturn }, { id: 'uranus', name: '天王星', body: Astronomy.Body.Uranus },
  { id: 'neptune', name: '海王星', body: Astronomy.Body.Neptune }, { id: 'pluto', name: '冥王星', body: Astronomy.Body.Pluto },
];
const STATION_BODIES = BODIES.filter(item => !['sun', 'moon'].includes(item.id));
const ASPECTS = [
  { name: '合相', angle: 0, orb: 2 }, { name: '六合', angle: 60, orb: 2 },
  { name: '四分相', angle: 90, orb: 2 }, { name: '三分相', angle: 120, orb: 2 },
  { name: '對分相', angle: 180, orb: 2 },
];
const RULERS = ['火星', '金星', '水星', '月亮', '太陽', '水星', '金星', '火星', '木星', '土星', '土星', '木星'];
const HOUSE_THEMES = [
  '自我定位、身體感受與主動選擇', '資源、收入與個人價值', '學習、溝通與日常往來', '居所、家庭與內在根基',
  '創作、興趣與自我表達', '工作流程、責任分配與生活習慣', '伴侶、合作與協議', '共享資源、信任與深層轉變',
  '進修、遠行與世界觀', '職涯方向、責任與公眾角色', '社群、人脈與長期願景', '休息、整理與告一段落',
];
const ASPECT_MEANINGS: Record<string, string> = {
  合相: '兩個象徵主題集中，留意如何整合。', 六合: '較容易運用的協調面向，仍需主動投入。',
  四分相: '呈現需要調整的張力，可化成具體問題。', 三分相: '較自然流動的面向，留意如何善用。',
  對分相: '呈現需要平衡的兩端，可透過對話整理。',
};

export interface AnnualSkyEvent {
  kind: 'moon-phase' | 'eclipse' | 'station';
  title: string;
  exactAt: string;
  sign: string;
  detail: string;
}

export interface AnnualAspect {
  first: string;
  second: string;
  aspect: string;
  orb: number;
  meaning: string;
}

export interface AnnualChartSummary {
  exactAt: string;
  location: string;
  ascendant: { sign: string; degree: number } | null;
  midheaven: { sign: string; degree: number } | null;
  planets: PlanetPlacement[];
}

export interface AnnualAstrologyForecast {
  label: string;
  events: AnnualSkyEvent[];
  solarReturn: AnnualChartSummary | null;
  progressedAt: string | null;
  progressedAge: number | null;
  progressedPlanets: PlanetPlacement[];
  progressedAspects: AnnualAspect[];
  profection: { age: number; house: number; sign: string; ruler: string; theme: string; from: string; through: string } | null;
  limits: string[];
}

function normalize(value: number): number { return (value % 360 + 360) % 360; }
function signedDelta(a: number, b: number): number { return ((a - b + 540) % 360) - 180; }
function eclipticLongitude(body: Astronomy.Body, date: Date): number {
  return normalize(Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon);
}
function signAt(longitude: number): string { return SIGNS[Math.floor(normalize(longitude) / 30)]; }
function anglePoint(longitude: number) {
  return { longitude: normalize(longitude), sign: signAt(longitude), degree: normalize(longitude) % 30 };
}

function placementsAt(instant: Date, latitude: number, longitude: number, withHouses: boolean): {
  planets: PlanetPlacement[];
  ascendant: ReturnType<typeof anglePoint> | null;
  midheaven: ReturnType<typeof anglePoint> | null;
} {
  const angles = withHouses ? calculateAngles(instant, latitude, longitude) : null;
  const ascendant = angles ? anglePoint(angles.ascendant) : null;
  const midheaven = angles ? anglePoint(angles.midheaven) : null;
  const ascSign = ascendant ? Math.floor(ascendant.longitude / 30) : null;
  const planets = BODIES.map(item => {
    const longitudeValue = eclipticLongitude(item.body, instant);
    const signIndex = Math.floor(longitudeValue / 30);
    const previous = eclipticLongitude(item.body, new Date(instant.getTime() - DAY_MS));
    const next = eclipticLongitude(item.body, new Date(instant.getTime() + DAY_MS));
    return {
      id: item.id, name: item.name, longitude: longitudeValue, sign: SIGNS[signIndex], signIndex,
      degree: longitudeValue - signIndex * 30, element: ['火', '土', '風', '水'][signIndex % 4],
      house: ascSign === null ? null : (signIndex - ascSign + 12) % 12 + 1,
      retrograde: normalize(next - previous) > 180,
    };
  });
  return { planets, ascendant, midheaven };
}

function calculateAngles(instant: Date, latitude: number, longitude: number): { ascendant: number; midheaven: number } {
  const sidereal = normalize((Astronomy.SiderealTime(instant) + longitude / 15) * 15) * Math.PI / 180;
  const obliquity = Astronomy.e_tilt(new Astronomy.AstroTime(instant)).tobl * Math.PI / 180;
  const lat = latitude * Math.PI / 180;
  const ascendant = normalize(Math.atan2(-Math.cos(sidereal), Math.sin(sidereal) * Math.cos(obliquity) + Math.tan(lat) * Math.sin(obliquity)) * 180 / Math.PI + 180);
  const midheaven = normalize(Math.atan2(Math.sin(sidereal), Math.cos(sidereal) * Math.cos(obliquity)) * 180 / Math.PI);
  return { ascendant, midheaven };
}

function collectAnnualEvents(start: Date, end: Date): AnnualSkyEvent[] {
  const events: AnnualSkyEvent[] = [];
  let quarter = Astronomy.SearchMoonQuarter(start);
  while (quarter.time.date <= end) {
    const labels = ['新月', '上弦月', '滿月', '下弦月'];
    const phaseLongitude = [0, 90, 180, 270][quarter.quarter];
    const sign = signAt(eclipticLongitude(Astronomy.Body.Moon, quarter.time.date));
    events.push({ kind: 'moon-phase', title: labels[quarter.quarter], exactAt: quarter.time.date.toISOString(), sign, detail: `月相黃經差 ${phaseLongitude}°；象徵週期節點，並非事件保證。` });
    quarter = Astronomy.NextMoonQuarter(quarter);
  }

  let solarCursor = start;
  for (let count = 0; count < 4; count++) {
    const eclipse = Astronomy.SearchGlobalSolarEclipse(solarCursor);
    if (eclipse.peak.date > end) break;
    const sign = signAt(eclipticLongitude(Astronomy.Body.Sun, eclipse.peak.date));
    events.push({ kind: 'eclipse', title: `日食（${eclipse.kind}）`, exactAt: eclipse.peak.date.toISOString(), sign, detail: eclipse.obscuration === undefined ? '全球日食事件；此處不推算特定地點是否可見。' : `全球最大遮蔽比例約 ${(eclipse.obscuration * 100).toFixed(0)}%；實際可見範圍依地點而異。` });
    solarCursor = new Date(eclipse.peak.date.getTime() + 2 * DAY_MS);
  }

  let lunarCursor = start;
  for (let count = 0; count < 4; count++) {
    const eclipse = Astronomy.SearchLunarEclipse(lunarCursor);
    if (eclipse.peak.date > end) break;
    const sign = signAt(eclipticLongitude(Astronomy.Body.Moon, eclipse.peak.date));
    events.push({ kind: 'eclipse', title: `月食（${eclipse.kind}）`, exactAt: eclipse.peak.date.toISOString(), sign, detail: `全球月食，月面遮蔽指標 ${(eclipse.obscuration * 100).toFixed(0)}%；占星象徵不代表必然事件。` });
    lunarCursor = new Date(eclipse.peak.date.getTime() + 2 * DAY_MS);
  }

  const speed = (body: Astronomy.Body, time: number) => {
    const halfDay = DAY_MS / 4;
    return signedDelta(eclipticLongitude(body, new Date(time + halfDay)), eclipticLongitude(body, new Date(time - halfDay))) * 2;
  };
  for (const item of STATION_BODIES) {
    let leftTime = start.getTime();
    let leftSpeed = speed(item.body, leftTime);
    for (let rightTime = leftTime + DAY_MS; rightTime <= end.getTime(); rightTime += DAY_MS) {
      const rightSpeed = speed(item.body, rightTime);
      if (leftSpeed === 0 || rightSpeed === 0 || leftSpeed * rightSpeed < 0) {
        let low = leftTime;
        let high = rightTime;
        let lowSpeed = leftSpeed;
        for (let step = 0; step < 30; step++) {
          const middle = (low + high) / 2;
          const middleSpeed = speed(item.body, middle);
          if (Math.sign(middleSpeed) === Math.sign(lowSpeed)) { low = middle; lowSpeed = middleSpeed; }
          else high = middle;
        }
        const time = (low + high) / 2;
        const direction = leftSpeed > 0 ? '開始逆行' : '恢復順行';
        events.push({ kind: 'station', title: `${item.name}${direction}`, exactAt: new Date(time).toISOString(), sign: signAt(eclipticLongitude(item.body, new Date(time))), detail: '行星視運動速度轉向附近；逆行是地心視運動現象。' });
      }
      leftTime = rightTime;
      leftSpeed = rightSpeed;
    }
  }
  return events.sort((a, b) => a.exactAt.localeCompare(b.exactAt));
}

function createSolarReturn(chart: AstrologyChart, location: BirthPlace, start: Date): AnnualChartSummary | null {
  const natalSun = chart.planets.find(item => item.id === 'sun');
  if (!natalSun) return null;
  const birth = new Date(chart.birthInstant);
  const birthParts = civilPartsAt(birth, chart.timeZone);
  const startParts = civilPartsAt(start, chart.timeZone);
  let years = startParts.year - birthParts.year;
  let approximate = birth.getTime() + years * TROPICAL_YEAR_DAYS * DAY_MS;
  if (approximate < start.getTime() - 3 * DAY_MS) {
    years++;
    approximate = birth.getTime() + years * TROPICAL_YEAR_DAYS * DAY_MS;
  }
  let exact = Astronomy.SearchSunLongitude(natalSun.longitude, new Date(approximate - 3 * DAY_MS), 7);
  if (!exact || exact.date.getTime() < start.getTime()) {
    approximate += TROPICAL_YEAR_DAYS * DAY_MS;
    exact = Astronomy.SearchSunLongitude(natalSun.longitude, new Date(approximate - 3 * DAY_MS), 7);
  }
  if (!exact) return null;
  const localChart = placementsAt(exact.date, location.latitude, location.longitude, !chart.timeUnknown);
  return { exactAt: exact.date.toISOString(), location: location.label, ascendant: localChart.ascendant, midheaven: localChart.midheaven, planets: localChart.planets };
}

function getProfection(chart: AstrologyChart, start: Date): AnnualAstrologyForecast['profection'] {
  if (!chart.ascendant) return null;
  const birth = new Date(chart.birthInstant);
  const age = Math.max(0, Math.floor((start.getTime() - birth.getTime()) / (TROPICAL_YEAR_DAYS * DAY_MS)));
  const house = age % 12 + 1;
  const natalAscSign = Math.floor(chart.ascendant.longitude / 30);
  const sign = SIGNS[(natalAscSign + house - 1) % 12];
  const yearStart = new Date(birth.getTime() + age * TROPICAL_YEAR_DAYS * DAY_MS);
  const yearEnd = new Date(birth.getTime() + (age + 1) * TROPICAL_YEAR_DAYS * DAY_MS);
  return {
    age, house, sign, ruler: RULERS[(natalAscSign + house - 1) % 12], theme: HOUSE_THEMES[house - 1],
    from: yearStart.toISOString(), through: yearEnd.toISOString(),
  };
}

function getSecondaryProgressions(chart: AstrologyChart, start: Date): Pick<AnnualAstrologyForecast, 'progressedAt' | 'progressedAge' | 'progressedPlanets' | 'progressedAspects'> {
  const birth = new Date(chart.birthInstant);
  const age = Math.max(0, (start.getTime() - birth.getTime()) / (TROPICAL_YEAR_DAYS * DAY_MS));
  const progressedAt = new Date(birth.getTime() + age * DAY_MS);
  const progressed = placementsAt(progressedAt, chart.latitude, chart.longitude, !chart.timeUnknown).planets;
  const aspects: AnnualAspect[] = [];
  for (const first of progressed) for (const second of chart.planets) {
    const separation = Math.min(Math.abs(first.longitude - second.longitude), 360 - Math.abs(first.longitude - second.longitude));
    const closest = ASPECTS.map(aspect => ({ aspect, orb: Math.abs(separation - aspect.angle) }))
      .filter(item => item.orb <= item.aspect.orb).sort((a, b) => a.orb - b.orb)[0];
    if (closest) aspects.push({
      first: `推運${first.name}`, second: `本命${second.name}`, aspect: closest.aspect.name,
      orb: closest.orb, meaning: ASPECT_MEANINGS[closest.aspect.name],
    });
  }
  return {
    progressedAt: progressedAt.toISOString(), progressedAge: age,
    progressedPlanets: progressed,
    progressedAspects: aspects.sort((a, b) => a.orb - b.orb).slice(0, 12),
  };
}

export function createAnnualAstrologyForecast(chart: AstrologyChart, returnLocation: BirthPlace, start = new Date()): AnnualAstrologyForecast {
  const end = new Date(start.getTime() + TROPICAL_YEAR_DAYS * DAY_MS);
  const timeDependentAvailable = !chart.timeUnknown;
  return {
    label: '未來 12 個月・年度預測組合',
    events: collectAnnualEvents(start, end),
    solarReturn: createSolarReturn(chart, returnLocation, start),
    ...getSecondaryProgressions(chart, start),
    profection: getProfection(chart, start),
    limits: [
      '採用熱帶黃道、地心視位置與 Whole Sign 整宮制；不同占星派別會使用不同參數與解讀。',
      '日食列全球事件，並不計算指定地點的可見性；日月食與行運只提供占星象徵，不能保證事件。',
      '次限推運採出生後一日對應一歲的常見日弧法；年限以整宮上升星座逐年推進。',
      timeDependentAvailable ? '太陽回歸盤角度使用所選地點；目前預設出生地，可選清單地點。' : '出生時間未知：隱藏依賴角度的宮位與年限判讀；太陽回歸盤不顯示角度。',
    ],
  };
}
