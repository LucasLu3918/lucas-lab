export interface PrismBallroomPoint {
  x: number;
  y: number;
}

export interface PrismBallroomMirror {
  index: number;
  x: number;
  y: number;
  orientation: '/' | '\\';
}

export interface PrismBallroomSegment {
  mask: number;
  points: PrismBallroomPoint[];
}

export interface PrismBallroomSnapshot {
  mirrors: PrismBallroomMirror[];
  beamSegments: PrismBallroomSegment[];
  emitters: Array<{ x: number; color: number }>;
  filter: { x: number; y: number; color: number };
  crystal: { x: number; y: number; direction: 'down'; received: number; emitted: number };
  dancers: Array<{ index: number; a: PrismBallroomPoint; b: PrismBallroomPoint; position: 0 | 1 }>;
  targets: Array<{ index: number; x: number; y: number; need: number; got: number }>;
  status: string;
  solved: boolean;
}

export type PrismBallroomAction = { type: 'flip'; index: number } | { type: 'move-dancer'; index: number };

const MIRROR_POSITIONS = [[3, 1], [1, 6], [5, 6], [8, 6], [0, 4], [4, 5], [3, 0]] as const;
const EMITTERS = [{ x: 8, color: 7 }, { x: 6, color: 2 }, { x: 5, color: 4 }] as const;
const FILTER = { x: 8, y: 4, color: 1 } as const;
const CRYSTAL = { x: 8, y: 3, direction: 'down' as const };
const DANCERS = [
  { a: { x: 6, y: 5 }, b: { x: 3, y: 3 } },
  { a: { x: 4, y: 4 }, b: { x: 6, y: 3 } },
] as const;
const TARGETS = [{ x: 8, y: 5, need: 1 }, { x: 1, y: 5, need: 4 }, { x: 6, y: 6, need: 3 }] as const;
const BOARD_WIDTH = 9;
const BOARD_HEIGHT = 7;
const MAX_SEGMENTS = 32;
const MAX_POINTS = 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isBoundedInteger(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
}

function bitCount(mask: number): number {
  return (mask & 1 ? 1 : 0) + (mask & 2 ? 1 : 0) + (mask & 4 ? 1 : 0);
}

function isPoint(value: unknown): value is PrismBallroomPoint {
  if (!isRecord(value)) return false;
  return typeof value.x === 'number' && Number.isFinite(value.x) && value.x >= -1 && value.x <= BOARD_WIDTH + 1
    && typeof value.y === 'number' && Number.isFinite(value.y) && value.y >= -1.5 && value.y <= BOARD_HEIGHT + 1.5;
}

function samePoint(value: unknown, expected: PrismBallroomPoint): value is PrismBallroomPoint {
  return isPoint(value) && value.x === expected.x && value.y === expected.y;
}

export function parsePrismBallroomSnapshot(value: unknown): PrismBallroomSnapshot | null {
  if (!isRecord(value)) return null;
  const snapshot = value as Partial<PrismBallroomSnapshot>;
  if (!Array.isArray(snapshot.mirrors) || snapshot.mirrors.length !== MIRROR_POSITIONS.length
    || !Array.isArray(snapshot.emitters) || snapshot.emitters.length !== EMITTERS.length
    || !Array.isArray(snapshot.beamSegments) || snapshot.beamSegments.length < 1
    || snapshot.beamSegments.length > MAX_SEGMENTS
    || !Array.isArray(snapshot.dancers) || snapshot.dancers.length !== DANCERS.length
    || !Array.isArray(snapshot.targets) || snapshot.targets.length !== TARGETS.length
    || !isRecord(snapshot.filter) || !isRecord(snapshot.crystal)
    || typeof snapshot.status !== 'string' || snapshot.status.length > 240
    || typeof snapshot.solved !== 'boolean') return null;

  for (let index = 0; index < EMITTERS.length; index += 1) {
    const emitter = snapshot.emitters[index];
    const expected = EMITTERS[index];
    if (!isRecord(emitter) || emitter.x !== expected.x || emitter.color !== expected.color) return null;
  }

  const filter = snapshot.filter;
  if (filter.x !== FILTER.x || filter.y !== FILTER.y || filter.color !== FILTER.color) return null;

  const crystal = snapshot.crystal;
  if (crystal.x !== CRYSTAL.x || crystal.y !== CRYSTAL.y || crystal.direction !== CRYSTAL.direction
    || !isBoundedInteger(crystal.received, 0, 7) || !isBoundedInteger(crystal.emitted, 0, 7)
    || crystal.emitted !== (bitCount(crystal.received as number) >= 2 ? crystal.received : 0)) return null;

  const mirrors: PrismBallroomMirror[] = [];
  for (let index = 0; index < MIRROR_POSITIONS.length; index += 1) {
    const mirror = snapshot.mirrors[index];
    const [x, y] = MIRROR_POSITIONS[index];
    if (!isRecord(mirror) || mirror.index !== index || mirror.x !== x || mirror.y !== y
      || (mirror.orientation !== '/' && mirror.orientation !== '\\')) return null;
    mirrors.push({ index, x, y, orientation: mirror.orientation });
  }

  const dancers: PrismBallroomSnapshot['dancers'] = [];
  for (let index = 0; index < DANCERS.length; index += 1) {
    const dancer = snapshot.dancers[index];
    const expected = DANCERS[index];
    if (!isRecord(dancer) || dancer.index !== index || !samePoint(dancer.a, expected.a) || !samePoint(dancer.b, expected.b)
      || !isBoundedInteger(dancer.position, 0, 1)) return null;
    dancers.push({ index, a: { ...expected.a }, b: { ...expected.b }, position: dancer.position as 0 | 1 });
  }

  const targets: PrismBallroomSnapshot['targets'] = [];
  for (let index = 0; index < TARGETS.length; index += 1) {
    const target = snapshot.targets[index];
    const expected = TARGETS[index];
    if (!isRecord(target) || target.index !== index || target.x !== expected.x || target.y !== expected.y
      || target.need !== expected.need || !isBoundedInteger(target.got, 0, 7)) return null;
    targets.push({ index, x: expected.x, y: expected.y, need: expected.need, got: target.got as number });
  }

  let pointCount = 0;
  const beamSegments: PrismBallroomSegment[] = [];
  for (const segment of snapshot.beamSegments) {
    if (!isRecord(segment) || !isBoundedInteger(segment.mask, 1, 7)
      || !Array.isArray(segment.points) || segment.points.length < 2 || segment.points.length > 128
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
    filter: { ...FILTER },
    crystal: {
      x: CRYSTAL.x,
      y: CRYSTAL.y,
      direction: CRYSTAL.direction,
      received: crystal.received as number,
      emitted: crystal.emitted as number,
    },
    dancers,
    targets,
    beamSegments,
    status: snapshot.status,
    solved: snapshot.solved,
  };
}
