import { describe, expect, it } from 'vitest';
import { drawCards, TAROT_DECK } from './tarot';

describe('tarot deck and drawing', () => {
  it('contains the 22 major and 56 minor cards in one unique 78-card deck', () => {
    expect(TAROT_DECK).toHaveLength(78);
    expect(TAROT_DECK.filter(card => card.arcana === 'major')).toHaveLength(22);
    expect(TAROT_DECK.filter(card => card.arcana === 'minor')).toHaveLength(56);
    expect(new Set(TAROT_DECK.map(card => card.id)).size).toBe(78);
    expect(TAROT_DECK.every(card => card.name && card.meanings.upright && card.meanings.reversed)).toBe(true);
  });

  it('draws unique cards and does not return reversed cards when reversals are disabled', () => {
    const reading = drawCards(3, false, () => 0);

    expect(reading).toHaveLength(3);
    expect(new Set(reading.map(item => item.card.id)).size).toBe(3);
    expect(reading.every(item => item.orientation === 'upright')).toBe(true);
  });

  it('rejects invalid draw sizes before touching the random source', () => {
    const random = () => { throw new Error('random source should not run'); };

    expect(() => drawCards(0, false, random)).toThrow(RangeError);
    expect(() => drawCards(79, false, random)).toThrow(RangeError);
  });
});
