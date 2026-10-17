import { describe, expect, it } from 'vitest';
import { drawCards, TAROT_DECK, TAROT_POSITIONS, tarotSpreadCount } from './tarot';

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

  it('offers quick, daily, and five-card deep paths with matching positions', () => {
    expect(tarotSpreadCount('single')).toBe(1);
    expect(tarotSpreadCount('daily')).toBe(1);
    expect(tarotSpreadCount('deep-five')).toBe(5);
    expect(TAROT_POSITIONS['deep-five']).toEqual(['核心主題', '內在影響', '外在情境', '可運用的資源', '下一步方向']);
    expect(drawCards(tarotSpreadCount('deep-five'), true, () => 0)).toHaveLength(5);
  });
});
