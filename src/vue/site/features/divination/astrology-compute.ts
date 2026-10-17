import { calculateAstrology, createAstrologyForecast, type AstrologyChart, type AstrologyForecast, type AstrologyForecastPeriod, type AstrologyInput } from './astrology';
import { createAnnualAstrologyForecast, type AnnualAstrologyForecast } from './astrology-annual';
import type { BirthPlace } from './locations';

// 整段占星計算（本命、行運、年度天象）集中在這裡，由 Worker 或主執行緒的動態匯入呼叫；頁面本身不再載入 ephemeris。
export interface AstrologyComputeRequest {
  input: AstrologyInput;
  returnPlace: BirthPlace;
  startMs: number;
}

export interface AstrologyComputeResult {
  chart: AstrologyChart;
  forecasts: AstrologyForecast[];
  annual: AnnualAstrologyForecast;
}

export function computeAstrology({ input, returnPlace, startMs }: AstrologyComputeRequest): AstrologyComputeResult {
  const chart = calculateAstrology(input);
  const start = new Date(startMs);
  const forecasts = (['day', 'month', 'year'] as AstrologyForecastPeriod[]).map(period => createAstrologyForecast(chart, period, start));
  return { chart, forecasts, annual: createAnnualAstrologyForecast(chart, returnPlace, start) };
}
