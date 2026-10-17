export type GalleryPanelId = 'A' | 'B' | 'C' | 'D';
export type GalleryThreadKind = 0 | 1;

export interface GalleryAlignAnchor {
  id: string;
  label: string;
  left: number;
  top: number;
  diameter: number;
  linked: boolean;
  notchSide: 'L' | 'R' | null;
  notchLeft: number | null;
  notchTop: number | null;
  notchWidth: number | null;
  notchHeight: number | null;
}

export interface GalleryAlignPanel {
  id: GalleryPanelId;
  name: string;
  art: string;
  left: number;
  top: number;
  width: number;
  height: number;
  borderWidth: number;
  layerWidth: number;
  layerHeight: number;
  zIndex: number;
  tray: boolean;
  zoomed: boolean;
  flipped: boolean;
  dragging: boolean;
  ariaLabel: string;
  anchors: GalleryAlignAnchor[];
  maskAnchor: { x: number; y: number } | null;
}

export interface GalleryAlignThread {
  kind: GalleryThreadKind;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GalleryAlignSnapshot {
  scale: number;
  zoomPanel: GalleryPanelId | null;
  markers: boolean;
  panels: GalleryAlignPanel[];
  threads: GalleryAlignThread[];
  live: { panel: GalleryPanelId; x1: number; y1: number; x2: number; y2: number; ok: boolean } | null;
  caption: string;
  status: string;
  tone: '' | 'ok';
  feedback: string;
  finished: boolean;
}

export type GalleryAlignAction =
  | { type: 'resize'; width: number }
  | { type: 'toggle-zoom'; panel: GalleryPanelId }
  | { type: 'flip'; panel: GalleryPanelId }
  | { type: 'toggle-markers' }
  | { type: 'home' }
  | { type: 'begin-drag'; panel: GalleryPanelId; x: number; y: number }
  | { type: 'move-panel'; panel: GalleryPanelId; x: number; y: number }
  | { type: 'drop-panel'; panel: GalleryPanelId }
  | { type: 'keyboard-move'; panel: GalleryPanelId; dx: number; dy: number }
  | { type: 'place'; from: string; to: string };

const PANELS: GalleryPanelId[] = ['A', 'B', 'C', 'D'];
const PANEL_NAMES = ['鏡廊', '陽台', '黑松林', '舞廳'];
const PANEL_ART = ['mirror-hall', 'balcony', 'black-pine-path', 'ballroom'];
const ANCHORS: Record<GalleryPanelId, string[]> = {
  A: ['moonL', 'moonR', 'door', 'doorMoon'],
  B: ['moon'],
  C: ['lantern'],
  D: ['chandelier', 'doorLamp', 'door', 'windowL', 'windowR'],
};
const MAX_STATUS = 240;
const MAX_FEEDBACK = 160;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPanelId(value: unknown): value is GalleryPanelId {
  return typeof value === 'string' && PANELS.includes(value as GalleryPanelId);
}

function isFiniteNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function parseAnchor(value: unknown, panel: GalleryPanelId): GalleryAlignAnchor | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !ANCHORS[panel].includes(value.id)
    || typeof value.label !== 'string' || value.label.length > 80
    || !isFiniteNumber(value.left, -20, 744) || !isFiniteNumber(value.top, -20, 548)
    || !isFiniteNumber(value.diameter, 18, 300) || typeof value.linked !== 'boolean'
    || (value.notchSide !== null && value.notchSide !== 'L' && value.notchSide !== 'R')) return null;
  const nullable = (entry: unknown, max: number) => entry === null || isFiniteNumber(entry, -300, max);
  if (!nullable(value.notchLeft, 744) || !nullable(value.notchTop, 548)
    || !nullable(value.notchWidth, 300) || !nullable(value.notchHeight, 200)) return null;
  return {
    id: value.id,
    label: value.label,
    left: value.left,
    top: value.top,
    diameter: value.diameter,
    linked: value.linked,
    notchSide: value.notchSide,
    notchLeft: value.notchLeft as number | null,
    notchTop: value.notchTop as number | null,
    notchWidth: value.notchWidth as number | null,
    notchHeight: value.notchHeight as number | null,
  };
}

export function parseGalleryAlignSnapshot(value: unknown): GalleryAlignSnapshot | null {
  if (!isRecord(value) || !isFiniteNumber(value.scale, 0.25, 1)
    || (value.zoomPanel !== null && !isPanelId(value.zoomPanel))
    || typeof value.markers !== 'boolean' || !Array.isArray(value.panels) || value.panels.length !== 4
    || !Array.isArray(value.threads) || value.threads.length > 2
    || (value.live !== null && !isRecord(value.live))
    || typeof value.caption !== 'string' || value.caption.length > MAX_STATUS
    || typeof value.status !== 'string' || value.status.length > MAX_STATUS
    || (value.tone !== '' && value.tone !== 'ok')
    || typeof value.feedback !== 'string' || value.feedback.length > MAX_FEEDBACK
    || typeof value.finished !== 'boolean') return null;

  const panels: GalleryAlignPanel[] = [];
  for (let index = 0; index < PANELS.length; index += 1) {
    const raw = value.panels[index];
    const id = PANELS[index];
    if (!isRecord(raw) || raw.id !== id || raw.name !== PANEL_NAMES[index] || raw.art !== PANEL_ART[index]
      || !isFiniteNumber(raw.left, -200, 900) || !isFiniteNumber(raw.top, -100, 700)
      || !isFiniteNumber(raw.width, 100, 750) || !isFiniteNumber(raw.height, 100, 750)
      || !isFiniteNumber(raw.borderWidth, 1, 20) || !isFiniteNumber(raw.layerWidth, 100, 750)
      || !isFiniteNumber(raw.layerHeight, 100, 750) || !isFiniteNumber(raw.zIndex, 0, 20)
      || typeof raw.tray !== 'boolean' || typeof raw.zoomed !== 'boolean'
      || typeof raw.flipped !== 'boolean' || typeof raw.dragging !== 'boolean'
      || typeof raw.ariaLabel !== 'string' || raw.ariaLabel.length > MAX_STATUS
      || !Array.isArray(raw.anchors) || raw.anchors.length !== ANCHORS[id].length
      || (raw.maskAnchor !== null && (!isRecord(raw.maskAnchor)
        || !isFiniteNumber(raw.maskAnchor.x, 0, 400) || !isFiniteNumber(raw.maskAnchor.y, 0, 250)))) return null;
    const anchors = raw.anchors.map(anchor => parseAnchor(anchor, id));
    if (anchors.some(anchor => anchor === null)) return null;
    panels.push({
      id, name: raw.name, art: raw.art, left: raw.left, top: raw.top, width: raw.width, height: raw.height,
      borderWidth: raw.borderWidth, layerWidth: raw.layerWidth, layerHeight: raw.layerHeight, zIndex: raw.zIndex,
      tray: raw.tray, zoomed: raw.zoomed, flipped: raw.flipped, dragging: raw.dragging,
      ariaLabel: raw.ariaLabel, anchors: anchors as GalleryAlignAnchor[],
      maskAnchor: raw.maskAnchor as { x: number; y: number } | null,
    });
  }

  const threads: GalleryAlignThread[] = [];
  for (let index = 0; index < value.threads.length; index += 1) {
    const raw = value.threads[index];
    if (!isRecord(raw) || raw.kind !== index || !isFiniteNumber(raw.x1, 0, 744)
      || !isFiniteNumber(raw.y1, 0, 548) || !isFiniteNumber(raw.x2, 0, 744)
      || !isFiniteNumber(raw.y2, 0, 548)) return null;
    threads.push({ kind: raw.kind as GalleryThreadKind, x1: raw.x1, y1: raw.y1, x2: raw.x2, y2: raw.y2 });
  }

  let live: GalleryAlignSnapshot['live'] = null;
  if (value.live !== null) {
    const raw = value.live as Record<string, unknown>;
    if (!isPanelId(raw.panel) || !isFiniteNumber(raw.x1, 0, 744) || !isFiniteNumber(raw.y1, 0, 548)
      || !isFiniteNumber(raw.x2, 0, 744) || !isFiniteNumber(raw.y2, 0, 548) || typeof raw.ok !== 'boolean') return null;
    live = { panel: raw.panel, x1: raw.x1, y1: raw.y1, x2: raw.x2, y2: raw.y2, ok: raw.ok };
  }

  return {
    scale: value.scale,
    zoomPanel: value.zoomPanel as GalleryPanelId | null,
    markers: value.markers,
    panels,
    threads,
    live,
    caption: value.caption,
    status: value.status,
    tone: value.tone,
    feedback: value.feedback,
    finished: value.finished,
  };
}
