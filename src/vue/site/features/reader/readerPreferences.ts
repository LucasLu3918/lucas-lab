export const READER_PREFERENCES_KEY = 'lucaslab.reader.preferences';

export type ReaderTheme = 'paper' | 'night';

export interface ReaderPreferences {
  theme: ReaderTheme;
  font: number;
}

export const DEFAULT_READER_PREFERENCES: Readonly<ReaderPreferences> = Object.freeze({
  theme: 'paper',
  font: 18,
});

export type ReaderPreferenceChange =
  | { type: 'set-theme'; theme: unknown }
  | { type: 'change-font'; delta: number };

export function normalizeReaderPreferences(value: unknown): ReaderPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_READER_PREFERENCES };
  }

  const saved = value as Partial<ReaderPreferences>;
  return {
    theme: saved.theme === 'night' ? 'night' : 'paper',
    font: typeof saved.font === 'number' && Number.isFinite(saved.font)
      ? Math.max(16, Math.min(24, saved.font))
      : DEFAULT_READER_PREFERENCES.font,
  };
}

export class UpdateReaderPreferences {
  execute(current: ReaderPreferences, change: ReaderPreferenceChange): ReaderPreferences {
    if (change.type === 'set-theme') {
      return { ...current, theme: change.theme === 'night' ? 'night' : 'paper' };
    }

    const delta = Number.isFinite(change.delta) ? change.delta : 0;
    return { ...current, font: Math.max(16, Math.min(24, current.font + delta)) };
  }
}
