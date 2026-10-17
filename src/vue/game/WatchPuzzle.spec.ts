import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import WatchPuzzle from './WatchPuzzle.vue';
import { parseWatchSnapshot, type WatchSnapshot } from './watch';

const warmup: WatchSnapshot = {
  warm: true,
  gears: [5, 1, 0],
  turns: 0,
  angles: [300, 60, 0],
  animate: false,
  note: '',
};

describe('WatchPuzzle', () => {
  it('renders three accessible gear controls and warm-up status', () => {
    const wrapper = mount(WatchPuzzle, { props: { snapshot: warmup, onAction: vi.fn(() => warmup) } });

    expect(wrapper.findAll('.watch-board > button')).toHaveLength(3);
    expect(wrapper.get('[data-gear="0"]').attributes('aria-label')).toContain('時輪');
    expect(wrapper.get('[data-gear="2"]').attributes('aria-label')).toContain('已對準');
    expect(wrapper.findAll('.gear-spin svg')).toHaveLength(3);
    expect(wrapper.get('[role="status"]').text()).toContain('暖身 · 1 / 3');
    expect(wrapper.text()).toContain('先試一次');
  });

  it('sends turns and reset to legacy and renders the returned snapshots', async () => {
    const turned: WatchSnapshot = {
      warm: false,
      gears: [2, 4, 0],
      turns: 0,
      angles: [120, 240, 0],
      animate: false,
      note: '轉一枚，下一枚就倒退一格。錶芯真正的位置現在才露出來。',
    };
    const onAction = vi.fn().mockReturnValueOnce(turned).mockReturnValueOnce(warmup);
    const wrapper = mount(WatchPuzzle, { props: { snapshot: warmup, onAction } });

    await wrapper.get('[data-gear="0"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'turn', index: 0 });
    expect(wrapper.get('[role="status"]').text()).toBe(turned.note);
    expect(wrapper.get('.watch-puzzle .challenge-help').text()).toContain('三枚齒輪咬合');

    await wrapper.get('#watch-reset').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'reset' });
    expect(wrapper.get('[role="status"]').text()).toContain('暖身 · 1 / 3');
  });
});

describe('parseWatchSnapshot', () => {
  it('accepts and copies a valid legacy snapshot', () => {
    const parsed = parseWatchSnapshot(warmup);

    expect(parsed).toEqual(warmup);
    expect(parsed).not.toBe(warmup);
    expect(parsed?.gears).not.toBe(warmup.gears);
    expect(parsed?.angles).not.toBe(warmup.angles);
  });

  it.each([
    null,
    { ...warmup, gears: [5, 1] },
    { ...warmup, gears: [5, 1, 6] },
    { ...warmup, turns: -1 },
    { ...warmup, angles: [300, Number.POSITIVE_INFINITY, 0] },
    { ...warmup, animate: 'yes' },
    { ...warmup, note: 7 },
  ])('rejects malformed snapshots', value => {
    expect(parseWatchSnapshot(value)).toBeNull();
  });
});
