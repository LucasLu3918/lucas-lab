import { createAstrologyForecast, type AstrologyChart, type AstrologyForecast, type AstrologyForecastPeriod } from './astrology';
import { createAnnualAstrologyForecast, type AnnualAstrologyForecast } from './astrology-annual';
import type { BirthPlace } from './locations';

export interface AstrologyForecastRequest {
  chart: AstrologyChart;
  returnPlace: BirthPlace;
  startMs: number;
}

export interface AstrologyForecastResult {
  forecasts: AstrologyForecast[];
  annual: AnnualAstrologyForecast;
}

export function computeAstrologyForecasts({ chart, returnPlace, startMs }: AstrologyForecastRequest): AstrologyForecastResult {
  const start = new Date(startMs);
  const forecasts = (['day', 'month', 'year'] as AstrologyForecastPeriod[]).map(period => createAstrologyForecast(chart, period, start));
  return { forecasts, annual: createAnnualAstrologyForecast(chart, returnPlace, start) };
}
