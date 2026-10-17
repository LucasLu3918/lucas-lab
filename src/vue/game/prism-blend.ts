export interface PrismBlendPoint {
  x: number;
  y: number;
}

export interface PrismBlendMirror {
  index: number;
  x: number;
  y: number;
  orientation: '/' | '\\';
}

export interface PrismBlendSegment {
  mask: number;
  points: PrismBlendPoint[];
}

export interface PrismBlendSnapshot {
  mirrors: PrismBlendMirror[];
  beamSegments: PrismBlendSegment[];
  emitters: Array<{ x: number; color: number }>;
  crystal: { x: number; y: number; direction: 'right'; received: number; emitted: number };
  target: { x: number; y: number; need: number; got: number };
  status: string;
  solved: boolean;
}

export type PrismBlendAction = { type: 'flip'; index: number };

const MIRROR_POSITIONS = [[6, 1], [2, 0], [4, 2], [4, 1]] as const;
const EMITTERS = [{ x: 5, color: 1 }, { x: 4, color: 2 }] as const;
const CRYSTAL = { x: 5, y: 1, direction: 'right' as const };
const TARGET = { x: 6, y: 2, need: 3 } as const;
const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 5;
const MAX_SEGMENTS = 24;
const MAX_POINTS = 240;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isBoundedInteger(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
}

function bitCount(mask: number): number {
  return (mask & 1 ? 1 : 0) + (mask & 2 ? 1 : 0) + (mask & 4 ? 1 : 0);
}

function isPoint(value: unknown): value is PrismBlendPoint {
  if (!isRecord(value)) return false;
  return typeof value.x === 'number' && Number.isFinite(value.x)
    && value.x >= -1 && value.x <= BOARD_WIDTH + 1
    && typeof value.y === 'number' && Number.isFinite(value.y)
    && value.y >= -1.5 && value.y <= BOARD_HEIGHT + 0.5;
}

export function parsePrismBlendSnapshot(value: unknown): PrismBlendSnapshot | null {
  if (!isRecord(value)) return null;
  const snapshot = value as Partial<PrismBlendSnapshot>;
  if (!Array.isArray(snapshot.mirrors) || snapshot.mirrors.length !== MIRROR_POSITIONS.length
    || !Array.isArray(snapshot.emitters) || snapshot.emitters.length !== EMITTERS.length
    || !Array.isArray(snapshot.beamSegments) || snapshot.beamSegments.length < 1
    || snapshot.beamSegments.length > MAX_SEGMENTS
    || typeof snapshot.status !== 'string' || snapshot.status.length > 240
    || typeof snapshot.solved !== 'boolean'
    || !isRecord(snapshot.crystal) || !isRecord(snapshot.target)) return null;

  for (let index = 0; index < EMITTERS.length; index += 1) {
    const emitter = snapshot.emitters[index];
    const expected = EMITTERS[index];
    if (!isRecord(emitter) || emitter.x !== expected.x || emitter.color !== expected.color) return null;
  }

  const crystal = snapshot.crystal;
  const target = snapshot.target;
  if (crystal.x !== CRYSTAL.x || crystal.y !== CRYSTAL.y || crystal.direction !== CRYSTAL.direction
    || !isBoundedInteger(crystal.received, 0, 7) || !isBoundedInteger(crystal.emitted, 0, 7)
    || crystal.emitted !== (bitCount(crystal.received as number) >= 2 ? crystal.received : 0)
    || target.x !== TARGET.x || target.y !== TARGET.y || target.need !== TARGET.need
    || !isBoundedInteger(target.got, 0, 7)) return null;

  const mirrors: PrismBlendMirror[] = [];
  for (let index = 0; index < MIRROR_POSITIONS.length; index += 1) {
    const mirror = snapshot.mirrors[index];
    const [x, y] = MIRROR_POSITIONS[index];
    if (!isRecord(mirror) || mirror.index !== index || mirror.x !== x || mirror.y !== y
      || (mirror.orientation !== '/' && mirror.orientation !== '\\')) return null;
    mirrors.push({ index, x, y, orientation: mirror.orientation });
  }

  let pointCount = 0;
  const beamSegments: PrismBlendSegment[] = [];
  for (const segment of snapshot.beamSegments) {
    if (!isRecord(segment) || !isBoundedInteger(segment.mask, 1, 7)
      || !Array.isArray(segment.points) || segment.points.length < 2 || segment.points.length > 32
      || !segment.points.every(isPoint)) return null;
    pointCount += segment.points.length;
    if (pointCount > MAX_POINTS) return null;
    beamSegments.push({
      mask: segment.mask,
      points: segment.points.map(point => ({ x: point.x, y: point.y })),
    });
  }

  return {
    mirrors,
    emitters: EMITTERS.map(emitter => ({ ...emitter })),
    crystal: {
      x: crystal.x as number,
      y: crystal.y as number,
      direction: CRYSTAL.direction,
      received: crystal.received as number,
      emitted: crystal.emitted as number,
    },
    beamSegments,
    target: { x: target.x as number, y: target.y as number, need: target.need as number, got: target.got as number },
    status: snapshot.status,
    solved: snapshot.solved,
  };
}
