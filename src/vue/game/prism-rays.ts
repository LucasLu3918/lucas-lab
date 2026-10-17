export interface PrismRaysPoint {
  x: number;
  y: number;
}

export interface PrismRaysMirror {
  index: number;
  x: number;
  y: number;
  orientation: '/' | '\\';
}

export interface PrismRaysSegment {
  mask: number;
  points: PrismRaysPoint[];
}

export interface PrismRaysSnapshot {
  mirrors: PrismRaysMirror[];
  beamSegments: PrismRaysSegment[];
  filter: { x: number; y: number; color: number };
  emitter: { x: number; color: number };
  target: { x: number; y: number; need: number; got: number };
  status: string;
  solved: boolean;
}

export type PrismRaysAction = { type: 'flip'; index: number };

const MIRROR_POSITIONS = [[6, 1], [3, 1], [5, 3]] as const;
const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 5;
const MAX_SEGMENTS = 12;
const MAX_POINTS = 80;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isBoundedInteger(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
}

function isPoint(value: unknown): value is PrismRaysPoint {
  if (!isRecord(value)) return false;
  return typeof value.x === 'number' && Number.isFinite(value.x)
    && value.x >= -1 && value.x <= BOARD_WIDTH + 1
    && typeof value.y === 'number' && Number.isFinite(value.y)
    && value.y >= -1.5 && value.y <= BOARD_HEIGHT + 0.5;
}

export function parsePrismRaysSnapshot(value: unknown): PrismRaysSnapshot | null {
  if (!isRecord(value)) return null;
  const snapshot = value as Partial<PrismRaysSnapshot>;
  if (!Array.isArray(snapshot.mirrors) || snapshot.mirrors.length !== MIRROR_POSITIONS.length
    || !Array.isArray(snapshot.beamSegments) || snapshot.beamSegments.length < 1
    || snapshot.beamSegments.length > MAX_SEGMENTS
    || typeof snapshot.status !== 'string' || snapshot.status.length > 240
    || typeof snapshot.solved !== 'boolean'
    || !isRecord(snapshot.filter) || !isRecord(snapshot.emitter) || !isRecord(snapshot.target)) return null;

  const filter = snapshot.filter;
  const emitter = snapshot.emitter;
  const target = snapshot.target;
  if (filter.x !== 5 || filter.y !== 1 || filter.color !== 1
    || emitter.x !== 6 || emitter.color !== 7
    || target.x !== 3 || target.y !== 2 || target.need !== 1
    || !isBoundedInteger(target.got, 0, 7)) return null;

  const mirrors: PrismRaysMirror[] = [];
  for (let index = 0; index < MIRROR_POSITIONS.length; index += 1) {
    const mirror = snapshot.mirrors[index];
    const [x, y] = MIRROR_POSITIONS[index];
    if (!isRecord(mirror) || mirror.index !== index || mirror.x !== x || mirror.y !== y
      || (mirror.orientation !== '/' && mirror.orientation !== '\\')) return null;
    mirrors.push({ index, x, y, orientation: mirror.orientation });
  }

  let pointCount = 0;
  const beamSegments: PrismRaysSegment[] = [];
  for (const value of snapshot.beamSegments) {
    if (!isRecord(value) || !isBoundedInteger(value.mask, 1, 7)
      || !Array.isArray(value.points) || value.points.length < 2 || value.points.length > 16
      || !value.points.every(isPoint)) return null;
    pointCount += value.points.length;
    if (pointCount > MAX_POINTS) return null;
    beamSegments.push({
      mask: value.mask,
      points: value.points.map(point => ({ x: point.x, y: point.y })),
    });
  }

  return {
    mirrors,
    beamSegments,
    filter: { x: filter.x as number, y: filter.y as number, color: filter.color as number },
    emitter: { x: emitter.x as number, color: emitter.color as number },
    target: { x: target.x as number, y: target.y as number, need: target.need as number, got: target.got as number },
    status: snapshot.status,
    solved: snapshot.solved,
  };
}
