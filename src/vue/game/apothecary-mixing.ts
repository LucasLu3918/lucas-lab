export type MixingColor = [number, number, number];
export type ApothecaryMixingSnapshot = {
  drops: [number, number, number];
  mirror: boolean;
  recipeColor: MixingColor;
  mixedColor: MixingColor;
  recipeLabel: string;
  recipeAriaLabel: string;
  mixLabel: string;
  closeMessage: string;
  directionMessage: string;
  finished: boolean;
  message: string;
  tone: '' | 'ok';
};

export type ApothecaryMixingAction =
  | { type: 'toggle-mirror' }
  | { type: 'change-drops'; pigment: number; step: -1 | 1 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isColor(value: unknown): value is MixingColor {
  return Array.isArray(value)
    && value.length === 3
    && value.every((channel: unknown) => typeof channel === 'number' && Number.isFinite(channel) && channel >= 0 && channel <= 255);
}

export function parseApothecaryMixingSnapshot(value: unknown): ApothecaryMixingSnapshot | null {
  if (!isRecord(value)
    || !Array.isArray(value.drops) || value.drops.length !== 3
    || !value.drops.every((drops: unknown) => typeof drops === 'number' && Number.isInteger(drops) && drops >= 0 && drops <= 4)
    || typeof value.mirror !== 'boolean'
    || !isColor(value.recipeColor)
    || !isColor(value.mixedColor)
    || typeof value.recipeLabel !== 'string'
    || typeof value.recipeAriaLabel !== 'string'
    || typeof value.mixLabel !== 'string'
    || typeof value.closeMessage !== 'string'
    || typeof value.directionMessage !== 'string'
    || typeof value.finished !== 'boolean'
    || typeof value.message !== 'string'
    || (value.tone !== '' && value.tone !== 'ok')
    || value.finished !== (value.tone === 'ok')) return null;

  return {
    drops: [...value.drops] as [number, number, number],
    mirror: value.mirror,
    recipeColor: [...value.recipeColor] as MixingColor,
    mixedColor: [...value.mixedColor] as MixingColor,
    recipeLabel: value.recipeLabel,
    recipeAriaLabel: value.recipeAriaLabel,
    mixLabel: value.mixLabel,
    closeMessage: value.closeMessage,
    directionMessage: value.directionMessage,
    finished: value.finished,
    message: value.message,
    tone: value.tone,
  };
}
