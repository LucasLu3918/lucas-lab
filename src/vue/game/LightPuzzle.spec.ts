import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import LightPuzzle from './LightPuzzle.vue';
import { parseLightPuzzleSnapshot, type LightPuzzleSnapshot } from './light';

const initial: LightPuzzleSnapshot = {
  mirrors: [
    { index: 0, row: 2, column: 1, orientation: 0 },
    { index: 1, row: 4, column: 1, orientation: 0 },
    { index: 2, row: 4, column: 4, orientation: 1 },
    { index: 3, row: 1, column: 4, orientation: 1 },
  ],
  beamCells: [{ row: 2, column: 0 }, { row: 2, column: 1 }, { row: 1, column: 1 }],
  status: '光線從上方逸出，沒有照到暗門。',
  doorOpen: false,
};

describe('LightPuzzle', () => {
  it('renders a 5x6 board and exposes four accessible mirror controls', () => {
    const wrapper = mount(LightPuzzle, { props: { snapshot: initial, onAction: vi.fn(() => initial) } });

    expect(wrapper.findAll('.light-cell')).toHaveLength(30);
    expect(wrapper.findAll('[data-mirror]')).toHaveLength(4);
    expect(wrapper.get('[data-mirror="0"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('[data-mirror="2"]').attributes('aria-label')).toContain('目前是「＼」');
    expect(wrapper.get('.light-door').attributes('aria-label')).toContain('第二列');
    expect(wrapper.get('[role="status"]').text()).toBe(initial.status);
    expect(wrapper.findAll('.light-cell.beam')).toHaveLength(3);
  });

  it('returns flip actions to legacy and renders the returned snapshot', async () => {
    const updated = { ...initial, mirrors: initial.mirrors.map(mirror => mirror.index === 0
      ? { ...mirror, orientation: 1 as const } : mirror), status: '月光正在反射。' };
    const onAction = vi.fn(() => updated);
    const wrapper = mount(LightPuzzle, { props: { snapshot: initial, onAction } });

    await wrapper.get('[data-mirror="0"]').trigger('click');

    expect(onAction).toHaveBeenCalledWith({ type: 'flip', index: 0 });
    expect(wrapper.get('[data-mirror="0"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('[role="status"]').text()).toBe('月光正在反射。');
  });

  it('returns reset to legacy and reflects the reset snapshot', async () => {
    const onAction = vi.fn(() => initial);
    const wrapper = mount(LightPuzzle, { props: { snapshot: initial, onAction } });

    await wrapper.get('#light-reset').trigger('click');

    expect(onAction).toHaveBeenCalledWith({ type: 'reset' });
    expect(wrapper.get('[data-mirror="2"]').attributes('aria-pressed')).toBe('true');
  });
});

describe('parseLightPuzzleSnapshot', () => {
  it('accepts the legacy four-mirror snapshot and returns a copy', () => {
    const parsed = parseLightPuzzleSnapshot(initial);

    expect(parsed).toEqual(initial);
    expect(parsed).not.toBe(initial);
    expect(parsed?.mirrors).not.toBe(initial.mirrors);
  });

  it.each([
    null,
    { ...initial, mirrors: initial.mirrors.slice(1) },
    { ...initial, mirrors: initial.mirrors.map((mirror, index) => index ? mirror : { ...mirror, index: 5 }) },
    { ...initial, mirrors: initial.mirrors.map((mirror, index) => index ? mirror : { ...mirror, orientation: 2 }) },
    { ...initial, mirrors: initial.mirrors.map((mirror, index) => index ? mirror : { ...mirror, row: 5 }) },
    { ...initial, beamCells: [{ row: 0, column: 6 }] },
    { ...initial, status: 5 },
  ])('rejects invalid snapshots', value => {
    expect(parseLightPuzzleSnapshot(value)).toBeNull();
  });
});
