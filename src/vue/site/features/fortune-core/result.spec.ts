import { describe, expect, it } from 'vitest';
import { DEFAULT_DISCLAIMER, createMethodResult } from './result';

describe('method result envelope', () => {
  it('stamps method, content version, precision and the default disclaimer', () => {
    const result = createMethodResult({
      module: 'bazi',
      methodVersion: 'bazi-local-v2',
      contentVersion: '2026.10.17-1',
      inputPrecision: 'approximate',
      data: { pillars: 3 },
    });
    expect(result).toEqual({
      module: 'bazi',
      methodVersion: 'bazi-local-v2',
      contentVersion: '2026.10.17-1',
      inputPrecision: 'approximate',
      disclaimer: DEFAULT_DISCLAIMER,
      data: { pillars: 3 },
    });
  });

  it('allows a module to supply its own disclaimer', () => {
    const result = createMethodResult({
      module: 'tarot', methodVersion: 'tarot-v1', contentVersion: '2026.10.17-1',
      inputPrecision: 'minimal', disclaimer: '自訂提醒', data: null,
    });
    expect(result.disclaimer).toBe('自訂提醒');
  });
});
