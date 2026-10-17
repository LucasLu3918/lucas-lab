import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';
import { CONTENT_PACK_SCHEMA, isContentPack } from './content';

const validPack = {
  schemaVersion: 1,
  pack: 'horoscope-zh',
  contentVersion: '2026.10.17-1',
  entries: { love: ['先照顧關係中的節奏。'] },
};

describe('content pack schema', () => {
  it('accepts a well-formed pack in both the JSON schema and the runtime guard', () => {
    const ajv = new Ajv({ allErrors: true });
    expect(ajv.validate(CONTENT_PACK_SCHEMA, validPack)).toBe(true);
    expect(isContentPack(validPack)).toBe(true);
  });

  it('rejects unknown schema versions, bad versions and extra fields', () => {
    const ajv = new Ajv({ allErrors: true });
    const invalid = [
      { ...validPack, schemaVersion: 2 },
      { ...validPack, contentVersion: 'v1' },
      { ...validPack, pack: 'Horoscope Zh' },
      { ...validPack, extra: true },
    ];
    for (const value of invalid) {
      expect(ajv.validate(CONTENT_PACK_SCHEMA, value)).toBe(false);
      expect(isContentPack(value)).toBe(false);
    }
  });

  it('rejects non-object input in the runtime guard', () => {
    expect(isContentPack(null)).toBe(false);
    expect(isContentPack('pack')).toBe(false);
  });
});
