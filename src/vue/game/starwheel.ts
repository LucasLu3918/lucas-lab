export const STARWHEEL_NOTCHES = 13;
export const STARWHEEL_CENTER = 160;
export const STARWHEEL_RADIUS = 116;

export const STARWHEEL_NUMERALS = [
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二',
] as const;

export interface StarwheelNotch {
  index: number;
  numeral: string;
  ruby: boolean;
}

export interface StarwheelSnapshot {
  notches: StarwheelNotch[];
  lit: boolean;
  step: number;
  running: boolean;
  solved: boolean;
  reducedMotion: boolean;
  hammerAngle: number;
  toll: string;
  status: string;
  tone: '' | 'ok' | 'bad';
}

export type StarwheelAction =
  | { type: 'toggle-candle' }
  | { type: 'adjust-step'; delta: -1 | 1 }
  | { type: 'run' };

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const boundedText = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length <= max;

export function starwheelPoint(index: number, radius: number): [number, number] {
  const angle = index * Math.PI * 2 / STARWHEEL_NOTCHES;
  return [
    STARWHEEL_CENTER + Math.sin(angle) * radius,
    STARWHEEL_CENTER - Math.cos(angle) * radius,
  ];
}

export function parseStarwheelSnapshot(value: unknown): StarwheelSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Partial<StarwheelSnapshot>;
  if (!Array.isArray(snapshot.notches) || snapshot.notches.length !== STARWHEEL_NOTCHES
    || typeof snapshot.lit !== 'boolean' || !Number.isInteger(snapshot.step)
    || (snapshot.step as number) < 1 || (snapshot.step as number) >= STARWHEEL_NOTCHES
    || typeof snapshot.running !== 'boolean' || typeof snapshot.solved !== 'boolean'
    || typeof snapshot.reducedMotion !== 'boolean' || !finite(snapshot.hammerAngle)
    || Math.abs(snapshot.hammerAngle) > 1_000_000_000
    || !boundedText(snapshot.toll, 3)
    || (snapshot.toll !== '' && !STARWHEEL_NUMERALS.includes(snapshot.toll as typeof STARWHEEL_NUMERALS[number]))
    || !boundedText(snapshot.status, 220)
    || !['', 'ok', 'bad'].includes(snapshot.tone ?? '')) return null;

  const labels = new Set<string>();
  const notches = snapshot.notches.map((notch, index) => {
    if (!notch || notch.index !== index || typeof notch.ruby !== 'boolean'
      || notch.ruby !== (index === 0)
      || !boundedText(notch.numeral, 4)
      || (index === 0 ? notch.numeral !== '' : !STARWHEEL_NUMERALS.includes(notch.numeral as typeof STARWHEEL_NUMERALS[number])
        || labels.has(notch.numeral))) {
      return null;
    }
    if (index > 0) labels.add(notch.numeral);
    return { index, numeral: notch.numeral, ruby: notch.ruby };
  });
  if (notches.some(notch => notch === null) || labels.size !== STARWHEEL_NUMERALS.length) return null;

  return {
    notches: notches as StarwheelNotch[],
    lit: snapshot.lit,
    step: snapshot.step as number,
    running: snapshot.running,
    solved: snapshot.solved,
    reducedMotion: snapshot.reducedMotion,
    hammerAngle: snapshot.hammerAngle,
    toll: snapshot.toll,
    status: snapshot.status,
    tone: snapshot.tone as StarwheelSnapshot['tone'],
  };
}
