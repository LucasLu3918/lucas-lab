// 吠陀占星的斷語為固定規則組句：以月宿的特質、大運主題與九曜關鍵字組合，語氣為「傾向」「適合」「可能」，不做命定或恐嚇的表達。
// 文案須通過 fortune-core/ethics 檢查（見 vedic.spec.ts）。
import { GRAHAS, type GrahaId } from './vedic-data';
import type { DashaPeriod, VedicChart } from './vedic';

const SHORT_YEAR = new Intl.DateTimeFormat('zh-TW', { year: 'numeric' });

export function dashaRange(period: DashaPeriod): string {
  return `${SHORT_YEAR.format(new Date(period.startAt))} 至 ${SHORT_YEAR.format(new Date(period.endAt))}`;
}

export function nakshatraParagraph(chart: VedicChart): string {
  const { nakshatra, pada, nearBoundary } = chart.moon;
  const lord = GRAHAS[nakshatra.lord];
  const boundary = nearBoundary ? '月亮接近宿界，若出生時間有誤差，月宿也可能落在相鄰的宿。' : '';
  return `${nakshatra.name}（${nakshatra.meaning}）是月亮所在的宿，${nakshatra.essence} 主星為${lord.name}，帶有${lord.keywords}的色彩。月亮位於第 ${pada} 段。${boundary}`;
}

export function dashaParagraph(chart: VedicChart): string {
  const { current, antardasha } = chart.dasha;
  const main = GRAHAS[current.planet];
  const sub = GRAHAS[antardasha.planet];
  return `目前處於${main.name}大運（${dashaRange(current)}）：${main.theme} 其中的次限為${sub.name}（${dashaRange(antardasha)}），${sub.keywords}的主題會在這段時間特別清楚。`;
}

export function integrationParagraph(chart: VedicChart): string {
  const birthLord: GrahaId = chart.moon.nakshatra.lord;
  const current = chart.dasha.current.planet;
  if (birthLord === current) {
    return `月宿主星與目前的大運主星同為${GRAHAS[current].name}，同一主題在這段期間會更明顯，適合把注意力放在它的正面面向上。`;
  }
  return `月宿主星為${GRAHAS[birthLord].name}，目前大運主星為${GRAHAS[current].name}，兩者的主題可以互相補足：前者是出生時帶來的底色，後者是此刻的課題。`;
}

export function ascendantParagraph(chart: VedicChart): string {
  if (!chart.lagna) return '出生時間未知，因此不計算上升星座與整宮制宮位；月宿與大運仍可估算，但月亮的位置可能因時間誤差而不同。';
  return `上升（Lagna）為${chart.lagna.sign}。整宮制以上升所在的星座為第一宮，九曜的宮位即由此推算；上升只影響宮位的劃分，不改變各星的星座位置。`;
}

export function upcomingLine(chart: VedicChart): string {
  if (chart.dasha.upcoming.length === 0) return '';
  const parts = chart.dasha.upcoming.map(item => `${GRAHAS[item.planet].name}（${SHORT_YEAR.format(new Date(item.startAt))} 起）`);
  return `接下來的大運依序為${parts.join('、')}。大運的年數是傳統的慣例，實際生活的節奏仍取決於自己的選擇。`;
}

/** 全部斷語段落，供測試檢查文案是否通過 ethics 規則。 */
export function chartParagraphs(chart: VedicChart): string[] {
  return [
    nakshatraParagraph(chart),
    ascendantParagraph(chart),
    dashaParagraph(chart),
    integrationParagraph(chart),
    upcomingLine(chart),
  ];
}
