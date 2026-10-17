import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';
import { CONTENT_PACK_SCHEMA, isContentPack } from '../fortune-core/content';
import { lintCopy } from '../fortune-core/ethics';
import pack from './content/ziwei-meanings.json';
import { MAJOR_STAR_NAMES, mutagenMeaning, palaceMeaning, starMeaning } from './meanings';
import { PALACE_NAMES } from './ziwei';

describe('ziwei meanings content pack', () => {
  it('validates against the shared content pack schema', () => {
    const ajv = new Ajv({ allErrors: true });
    expect(ajv.validate(CONTENT_PACK_SCHEMA, pack)).toBe(true);
    expect(isContentPack(pack)).toBe(true);
  });

  it('has an entry for every major star, palace and transformation', () => {
    for (const name of MAJOR_STAR_NAMES) expect(starMeaning(name).keyword.length).toBeGreaterThan(0);
    for (const name of PALACE_NAMES) expect(palaceMeaning(name).keyword.length).toBeGreaterThan(0);
    for (const mutagen of ['祿', '權', '科', '忌'] as const) {
      expect(mutagenMeaning(mutagen).keyword.length).toBeGreaterThan(0);
    }
  });

  it('passes the copy ethics linter in every field', () => {
    const texts = Object.values(pack.entries).flatMap(entry => [entry.keyword, entry.summary, entry.guidance]);
    for (const text of texts) {
      expect(lintCopy(text)).toEqual([]);
    }
  });
});
