import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';
import { CONTENT_PACK_SCHEMA, isContentPack } from '../fortune-core/content';
import { lintCopy } from '../fortune-core/ethics';
import horoscopeJson from './content/horoscope-zh.json';
import { HOROSCOPE_DIMENSIONS } from './horoscope';

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings);
  return [];
}

describe('horoscope content pack', () => {
  it('matches the shared content pack schema in both the JSON schema and the runtime guard', () => {
    const ajv = new Ajv({ allErrors: true });
    expect(ajv.validate(CONTENT_PACK_SCHEMA, horoscopeJson)).toBe(true);
    expect(isContentPack(horoscopeJson)).toBe(true);
    expect(horoscopeJson.pack).toBe('horoscope-zh');
    expect(horoscopeJson.contentVersion).toBe('2026.10.17-1');
  });

  it('has the five dimensions, lucky guide and daily tips with enough variety to avoid repetition', () => {
    const { dimensions, luckyGuide, dailyTips } = horoscopeJson.entries;
    expect(Object.keys(dimensions).sort()).toEqual(HOROSCOPE_DIMENSIONS.map(dimension => dimension.id).sort());
    for (const { id } of HOROSCOPE_DIMENSIONS) {
      const copy = dimensions[id];
      expect(copy.situations.length).toBeGreaterThanOrEqual(4);
      expect(copy.actions.length).toBeGreaterThanOrEqual(4);
      expect(copy.tones.length).toBeGreaterThanOrEqual(4);
      expect(new Set([...copy.situations, ...copy.actions, ...copy.tones]).size).toBe(copy.situations.length + copy.actions.length + copy.tones.length);
    }
    expect(luckyGuide.colors.length).toBeGreaterThanOrEqual(6);
    expect(luckyGuide.times.length).toBeGreaterThanOrEqual(4);
    expect(dailyTips.length).toBeGreaterThanOrEqual(8);
  });

  it('passes the copy ethics linter for every string in the pack', () => {
    const findings = collectStrings(horoscopeJson.entries).flatMap(text => lintCopy(text).map(finding => ({ text, ...finding })));
    expect(findings).toEqual([]);
  });
});
