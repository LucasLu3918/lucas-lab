import { computeAstrologyForecasts, type AstrologyForecastRequest, type AstrologyForecastResult } from './astrology-forecasts';

// 行運與年度天象計算較耗時，放在 Worker 執行，避免按下按鈕時主執行緒停住。
export type AstrologyWorkerRequest = AstrologyForecastRequest & { id: number };
export type AstrologyWorkerResponse = { id: number; result: AstrologyForecastResult } | { id: number; error: string };

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<AstrologyWorkerRequest>) => void) | null;
  postMessage(message: AstrologyWorkerResponse): void;
};

workerScope.onmessage = event => {
  const { id, ...request } = event.data;
  try {
    workerScope.postMessage({ id, result: computeAstrologyForecasts(request) });
  } catch (cause) {
    workerScope.postMessage({ id, error: cause instanceof Error ? cause.message : '無法計算行運與年度天象。' });
  }
};
