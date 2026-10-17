export type BoxThreadPanelId = 'A' | 'B' | 'C' | 'D';

export interface BoxThreadSnapshot {
  order: BoxThreadPanelId[];
  finished: boolean;
}

export type BoxThreadAction =
  | { type: 'choose-panel'; panel: BoxThreadPanelId }
  | { type: 'undo' };

const PANEL_IDS: BoxThreadPanelId[] = ['A', 'B', 'C', 'D'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPanelId(value: unknown): value is BoxThreadPanelId {
  return typeof value === 'string' && PANEL_IDS.includes(value as BoxThreadPanelId);
}

export function parseBoxThreadSnapshot(value: unknown): BoxThreadSnapshot | null {
  if (!isRecord(value) || !Array.isArray(value.order) || value.order.length > PANEL_IDS.length
    || !value.order.every(isPanelId) || new Set(value.order).size !== value.order.length
    || typeof value.finished !== 'boolean' || value.finished !== (value.order.length === PANEL_IDS.length)) return null;

  return { order: [...value.order] as BoxThreadPanelId[], finished: value.finished };
}
