import { computeAstrology, type AstrologyComputeRequest, type AstrologyComputeResult } from './astrology-compute';

// 占星計算較耗時，放在 Worker 執行，避免按下按鈕時主執行緒停住。
export type AstrologyWorkerRequest = AstrologyComputeRequest & { id: number };
export type AstrologyWorkerResponse = { id: number; result: AstrologyComputeResult } | { id: number; error: string };

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<AstrologyWorkerRequest>) => void) | null;
  postMessage(message: AstrologyWorkerResponse): void;
};

workerScope.onmessage = event => {
  const { id, ...request } = event.data;
  try {
    workerScope.postMessage({ id, result: computeAstrology(request) });
  } catch (cause) {
    workerScope.postMessage({ id, error: cause instanceof Error ? cause.message : '無法計算占星結果。' });
  }
};
