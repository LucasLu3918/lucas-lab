import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';
import { CONTENT_PACK_SCHEMA, isContentPack } from '../fortune-core/content';
import { lintCopy } from '../fortune-core/ethics';
import pack from './content/number-meanings.json';
import { meaningFor, REACHABLE_NUMBERS } from './meanings';

describe('number meanings content pack', () => {
  it('validates against the shared content pack schema', () => {
    const ajv = new Ajv({ allErrors: true });
    expect(ajv.validate(CONTENT_PACK_SCHEMA, pack)).toBe(true);
    expect(isContentPack(pack)).toBe(true);
  });

  it('has an entry for every number the engine can produce', () => {
    for (const value of REACHABLE_NUMBERS) {
      expect(meaningFor(value).keyword.length).toBeGreaterThan(0);
    }
  });

  it('passes the copy ethics linter in every field', () => {
    const texts = Object.values(pack.entries).flatMap(entry => [entry.keyword, entry.summary, entry.guidance]);
    for (const text of texts) {
      expect(lintCopy(text)).toEqual([]);
    }
  });
});
