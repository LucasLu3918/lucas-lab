import { describe, expect, it } from 'vitest';
import { localDayKey } from './civil-time';

describe('local day key', () => {
  it('uses the reader clock and zero-pads month and day', () => {
    expect(localDayKey(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
    expect(localDayKey(new Date(2026, 9, 17, 23, 59))).toBe('2026-10-17');
  });

  it('changes exactly at local midnight', () => {
    expect(localDayKey(new Date(2026, 9, 17, 23, 59, 59))).toBe('2026-10-17');
    expect(localDayKey(new Date(2026, 9, 18, 0, 0, 0))).toBe('2026-10-18');
  });
});
