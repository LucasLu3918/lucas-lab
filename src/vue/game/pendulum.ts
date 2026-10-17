export const PENDULUM_WEIGHTS = [
  { id: 'a', length: 0.75, name: '輕' },
  { id: 'b', length: 2.25, name: '重' },
  { id: 'c', length: 1.5, name: '中' },
] as const;

export type PendulumWeightId = typeof PENDULUM_WEIGHTS[number]['id'];

export interface PendulumWeight {
  id: PendulumWeightId;
  length: number;
  name: string;
  attached: boolean;
}

export interface PendulumSnapshot {
  weights: PendulumWeight[];
  reducedMotion: boolean;
  canRun: boolean;
}

export type PendulumAction =
  | { type: 'toggle-weight'; id: PendulumWeightId }
  | { type: 'run' };

export function parsePendulumSnapshot(value: unknown): PendulumSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Partial<PendulumSnapshot>;
  if (!Array.isArray(snapshot.weights) || snapshot.weights.length !== PENDULUM_WEIGHTS.length
    || typeof snapshot.reducedMotion !== 'boolean' || typeof snapshot.canRun !== 'boolean'
    || (snapshot.canRun && !snapshot.reducedMotion)) return null;

  const weights = snapshot.weights.map((weight, index) => {
    const expected = PENDULUM_WEIGHTS[index];
    if (!weight || weight.id !== expected.id || weight.name !== expected.name
      || weight.length !== expected.length || typeof weight.attached !== 'boolean') return null;
    return { ...expected, attached: weight.attached };
  });
  if (weights.some(weight => weight === null)) return null;

  return {
    weights: weights as PendulumWeight[],
    reducedMotion: snapshot.reducedMotion,
    canRun: snapshot.canRun,
  };
}
