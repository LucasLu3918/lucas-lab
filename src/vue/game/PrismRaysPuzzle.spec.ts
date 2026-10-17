import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import PrismRaysPuzzle from './PrismRaysPuzzle.vue';
import { parsePrismRaysSnapshot, type PrismRaysSnapshot } from './prism-rays';

const initial: PrismRaysSnapshot = {
  mirrors: [
    { index: 0, x: 6, y: 1, orientation: '\\' },
    { index: 1, x: 3, y: 1, orientation: '\\' },
    { index: 2, x: 5, y: 3, orientation: '/' },
  ],
  beamSegments: [
    { mask: 7, points: [{ x: 6, y: -0.6 }, { x: 6, y: 0 }, { x: 6, y: 1 }, { x: 7.5, y: 1 }] },
  ],
  filter: { x: 5, y: 1, color: 1 },
  emitter: { x: 6, color: 7 },
  target: { x: 3, y: 2, need: 1, got: 0 },
  status: '已亮起 0 / 1 個面具。還沒有面具亮起。',
  solved: false,
};

describe('PrismRaysPuzzle', () => {
  it('renders the authored 7x5 scene and accessible mirror controls', () => {
    const wrapper = mount(PrismRaysPuzzle, { props: { snapshot: initial, onAction: vi.fn(() => initial) } });

    expect(wrapper.findAll('.prism-cell')).toHaveLength(35);
    expect(wrapper.findAll('[data-mirror]')).toHaveLength(3);
    expect(wrapper.get('[data-mirror="0"]').attributes('role')).toBe('button');
    expect(wrapper.get('[data-mirror="0"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.find('.prism-tint').exists()).toBe(true);
    expect(wrapper.findAll('.prism-beams polyline')).toHaveLength(4);
    expect(wrapper.get('[role="status"]').text()).toBe(initial.status);
  });

  it('sends mirror flips to the legacy controller and renders its returned snapshot', async () => {
    const updated = {
      ...initial,
      mirrors: initial.mirrors.map(mirror => mirror.index === 0 ? { ...mirror, orientation: '/' as const } : mirror),
      beamSegments: [{ mask: 7, points: [{ x: 6, y: -0.6 }, { x: 6, y: 0 }, { x: 6, y: 1 }, { x: 5, y: 1 }] }],
      status: '白光穿過紅色濾鏡，正在尋找面具。',
    };
    const onAction = vi.fn(() => updated);
    const wrapper = mount(PrismRaysPuzzle, { props: { snapshot: initial, onAction } });

    await wrapper.get('[data-mirror="0"]').trigger('keydown', { key: 'Enter' });

    expect(onAction).toHaveBeenCalledWith({ type: 'flip', index: 0 });
    expect(wrapper.get('[data-mirror="0"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('[role="status"]').text()).toBe(updated.status);
  });

  it('leaves the current board intact when legacy rejects an action', async () => {
    const wrapper = mount(PrismRaysPuzzle, { props: { snapshot: initial, onAction: vi.fn(() => null) } });

    await wrapper.get('[data-mirror="1"]').trigger('click');

    expect(wrapper.get('[data-mirror="1"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('[role="status"]').text()).toBe(initial.status);
  });

  it('renders snapshots pushed by the legacy controller', async () => {
    const wrapper = mount(PrismRaysPuzzle, { props: { snapshot: initial, onAction: vi.fn(() => initial) } });
    const pushed = { ...initial, target: { ...initial.target, got: 1 }, status: '紅光穿過濾鏡，照亮了面具。', solved: true };

    await wrapper.setProps({ snapshot: pushed });

    expect(wrapper.get('[role="status"]').text()).toBe(pushed.status);
    expect(wrapper.get('[data-mirror="0"]').attributes('aria-disabled')).toBe('true');
  });
});

describe('parsePrismRaysSnapshot', () => {
  it('accepts the stage snapshot and returns independent nested values', () => {
    const parsed = parsePrismRaysSnapshot(initial);

    expect(parsed).toEqual(initial);
    expect(parsed).not.toBe(initial);
    expect(parsed?.beamSegments[0].points).not.toBe(initial.beamSegments[0].points);
  });

  it.each([
    null,
    { ...initial, mirrors: initial.mirrors.slice(1) },
    { ...initial, mirrors: initial.mirrors.map((mirror, index) => index ? mirror : { ...mirror, x: 5 }) },
    { ...initial, mirrors: initial.mirrors.map((mirror, index) => index ? mirror : { ...mirror, orientation: 'flat' }) },
    { ...initial, filter: { ...initial.filter, color: 7 } },
    { ...initial, beamSegments: [{ mask: 0, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }] },
    { ...initial, beamSegments: [{ mask: 1, points: [{ x: 0, y: 0 }, { x: 8.1, y: 1 }] }] },
    { ...initial, status: 5 },
  ])('rejects invalid snapshots', value => {
    expect(parsePrismRaysSnapshot(value)).toBeNull();
  });
});
