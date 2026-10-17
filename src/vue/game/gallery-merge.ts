export type GalleryMergePanelId = 'A' | 'B' | 'C' | 'D';
export type GalleryMergeMode = 'play' | 'order' | 'complete';

export interface GalleryMergePanel {
  id: GalleryMergePanelId;
  name: string;
  art: string;
  flipped: boolean;
  door: { x: number; y: number; side: 'L' | 'R' } | null;
}

export interface GalleryMergeThread {
  kind: 0 | 1 | 2;
  ends: [string, string];
}

export interface GalleryMergeSnapshot {
  mode: GalleryMergeMode;
  panels: GalleryMergePanel[];
  threads: GalleryMergeThread[];
  order: GalleryMergePanelId[];
  status: string;
  tone: '' | 'ok';
  feedback: string;
  finished: boolean;
}

export type GalleryMergeAction =
  | { type: 'flip'; panel: GalleryMergePanelId }
  | { type: 'place-doors' }
  | { type: 'choose-panel'; panel: GalleryMergePanelId }
  | { type: 'remove-from'; index: number };

const PANEL_IDS: GalleryMergePanelId[] = ['A', 'B', 'C', 'D'];
const PANEL_NAMES = ['鏡廊', '陽台', '黑松林', '舞廳'];
const PANEL_ART = ['mirror-hall', 'balcony', 'black-pine-path', 'ballroom'];
const MAX_STATUS = 240;
const MAX_FEEDBACK = 180;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPanelId(value: unknown): value is GalleryMergePanelId {
  return typeof value === 'string' && PANEL_IDS.includes(value as GalleryMergePanelId);
}

function parsePanel(value: unknown, index: number): GalleryMergePanel | null {
  if (!isRecord(value) || value.id !== PANEL_IDS[index] || value.name !== PANEL_NAMES[index]
    || value.art !== PANEL_ART[index] || typeof value.flipped !== 'boolean') return null;

  let door: GalleryMergePanel['door'] = null;
  if (value.door !== null) {
    if (!isRecord(value.door) || typeof value.door.x !== 'number' || !Number.isFinite(value.door.x)
      || value.door.x < 0 || value.door.x > 100 || typeof value.door.y !== 'number'
      || !Number.isFinite(value.door.y) || value.door.y < 0 || value.door.y > 100
      || (value.door.side !== 'L' && value.door.side !== 'R')) return null;
    door = { x: value.door.x, y: value.door.y, side: value.door.side };
  }
  if ((index === 0 || index === 3) !== Boolean(door)) return null;
  return { id: PANEL_IDS[index], name: PANEL_NAMES[index], art: PANEL_ART[index], flipped: value.flipped, door };
}

function parseThread(value: unknown, index: number): GalleryMergeThread | null {
  if (!isRecord(value) || value.kind !== index || !Array.isArray(value.ends) || value.ends.length !== 2
    || !value.ends.every(end => typeof end === 'string' && end.length > 0 && end.length <= 100)) return null;
  return { kind: index as GalleryMergeThread['kind'], ends: [value.ends[0] as string, value.ends[1] as string] };
}

export function parseGalleryMergeSnapshot(value: unknown): GalleryMergeSnapshot | null {
  if (!isRecord(value) || (value.mode !== 'play' && value.mode !== 'order' && value.mode !== 'complete')
    || !Array.isArray(value.panels) || value.panels.length !== PANEL_IDS.length
    || !Array.isArray(value.threads) || value.threads.length !== (value.mode === 'play' ? 2 : 3)
    || !Array.isArray(value.order) || value.order.length > PANEL_IDS.length
    || !value.order.every(isPanelId) || new Set(value.order).size !== value.order.length
    || typeof value.status !== 'string' || value.status.length > MAX_STATUS
    || (value.tone !== '' && value.tone !== 'ok')
    || typeof value.feedback !== 'string' || value.feedback.length > MAX_FEEDBACK
    || typeof value.finished !== 'boolean' || value.finished !== (value.mode === 'complete')) return null;

  const panels = value.panels.map(parsePanel);
  const threads = value.threads.map(parseThread);
  if (panels.some(panel => panel === null) || threads.some(thread => thread === null)) return null;
  if (value.mode === 'play' && value.order.length !== 0) return null;
  if (value.mode === 'complete' && value.order.length !== PANEL_IDS.length) return null;

  return {
    mode: value.mode,
    panels: panels as GalleryMergePanel[],
    threads: threads as GalleryMergeThread[],
    order: [...value.order] as GalleryMergePanelId[],
    status: value.status,
    tone: value.tone,
    feedback: value.feedback,
    finished: value.finished,
  };
}
