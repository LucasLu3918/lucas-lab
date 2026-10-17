import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ApothecaryTestimonyPuzzle from './ApothecaryTestimonyPuzzle.vue';
import type { ApothecaryTestimonyAction, ApothecaryTestimonySnapshot } from './apothecary-testimony';
import { parseApothecaryTestimonySnapshot } from './apothecary-testimony';

const snapshot: ApothecaryTestimonySnapshot = {
  apprentices: ['白芷', '遠志', '決明', '茯苓', '紫蘇', '杜仲', '甘松'],
  cardLines: Array(7).fill('證詞卡片'),
  testimonies: Array(7).fill('毒蘋果不在他手上。'),
  mirror: false,
  ruled: [],
  finished: false,
  message: '還沒有指認。',
  tone: '',
};

describe('parseApothecaryTestimonySnapshot', () => {
  it('accepts a complete seven-person snapshot and copies arrays', () => {
    const parsed = parseApothecaryTestimonySnapshot(snapshot);
    expect(parsed).toEqual(snapshot);
    expect(parsed?.apprentices).not.toBe(snapshot.apprentices);
  });

  it('rejects malformed names, duplicate strikes, and unknown tones', () => {
    expect(parseApothecaryTestimonySnapshot({ ...snapshot, apprentices: ['only one'] })).toBeNull();
    expect(parseApothecaryTestimonySnapshot({ ...snapshot, ruled: [2, 2] })).toBeNull();
    expect(parseApothecaryTestimonySnapshot({ ...snapshot, tone: 'warning' })).toBeNull();
  });
});

describe('ApothecaryTestimonyPuzzle', () => {
  it('renders seven cards and dispatches mirror, strike, and accusation actions', async () => {
    const onAction = vi.fn((action: ApothecaryTestimonyAction) => {
      if (action.type === 'toggle-mirror') return { ...snapshot, mirror: true };
      if (action.type === 'toggle-strike') return { ...snapshot, ruled: [action.index] };
      return { ...snapshot, message: '證詞說不通。', tone: 'bad' as const };
    });
    const wrapper = mount(ApothecaryTestimonyPuzzle, { props: { snapshot, onAction } });

    expect(wrapper.findAll('[data-card]')).toHaveLength(7);
    await wrapper.get('#apo-mirror').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'toggle-mirror' });
    expect(wrapper.get('#apo-mirror').attributes('aria-pressed')).toBe('true');

    await wrapper.get('[data-strike="3"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'toggle-strike', index: 3 });
    expect(wrapper.get('[data-card="3"]').classes()).toContain('struck');

    await wrapper.get('[data-accuse="0"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(3, { type: 'accuse', index: 0 });
    expect(wrapper.get('#bf-status').text()).toBe('證詞說不通。');
    expect(wrapper.get('#bf-status').attributes('data-tone')).toBe('bad');
  });
});
