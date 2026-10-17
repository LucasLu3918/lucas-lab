import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import PrismBlendPuzzle from './PrismBlendPuzzle.vue';
import { parsePrismBlendSnapshot, type PrismBlendSnapshot } from './prism-blend';

const initial: PrismBlendSnapshot = {
  mirrors: [
    { index: 0, x: 6, y: 1, orientation: '/' },
    { index: 1, x: 2, y: 0, orientation: '/' },
    { index: 2, x: 4, y: 2, orientation: '/' },
    { index: 3, x: 4, y: 1, orientation: '/' },
  ],
  beamSegments: [
    { mask: 1, points: [{ x: 5, y: -0.6 }, { x: 5, y: 0 }, { x: 5, y: 1 }] },
    { mask: 2, points: [{ x: 4, y: -0.6 }, { x: 4, y: 0 }, { x: 4, y: 1 }] },
    { mask: 3, points: [{ x: 5, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 2 }] },
  ],
  emitters: [{ x: 5, color: 1 }, { x: 4, color: 2 }],
  crystal: { x: 5, y: 1, direction: 'right', received: 3, emitted: 3 },
  target: { x: 6, y: 2, need: 3, got: 0 },
  status: '已亮起 0 / 1 個面具。還沒有面具亮起。',
  solved: false,
};

describe('PrismBlendPuzzle', () => {
  it('renders the authored board, both emitters, combiner crystal and accessible mirrors', () => {
    const wrapper = mount(PrismBlendPuzzle, { props: { snapshot: initial, onAction: vi.fn(() => initial) } });

    expect(wrapper.findAll('.prism-cell')).toHaveLength(35);
    expect(wrapper.findAll('[data-emitter]')).toHaveLength(2);
    expect(wrapper.find('[data-crystal="0"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-mirror]')).toHaveLength(4);
    expect(wrapper.get('[data-mirror="0"]').attributes('role')).toBe('button');
    expect(wrapper.get('[data-mirror="0"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.findAll('.prism-beams polyline')).toHaveLength(12);
    expect(wrapper.get('[role="status"]').text()).toBe(initial.status);
  });

  it('sends a mirror action to the legacy controller and applies its returned snapshot', async () => {
    const updated: PrismBlendSnapshot = {
      ...initial,
      mirrors: initial.mirrors.map(mirror => mirror.index === 1 ? { ...mirror, orientation: '\\' } : mirror),
      crystal: { ...initial.crystal, received: 0, emitted: 0 },
      target: { ...initial.target, got: 3 },
      status: '兩束光在水晶裡合成一束，黃色的面具亮了。',
      solved: true,
    };
    const onAction = vi.fn(() => updated);
    const wrapper = mount(PrismBlendPuzzle, { props: { snapshot: initial, onAction } });

    await wrapper.get('[data-mirror="1"]').trigger('keydown', { key: 'Enter' });

    expect(onAction).toHaveBeenCalledWith({ type: 'flip', index: 1 });
    expect(wrapper.get('[data-mirror="1"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('[data-mirror="1"]').attributes('aria-disabled')).toBe('true');
    expect(wrapper.get('[role="status"]').text()).toBe(updated.status);
  });

  it('keeps the current board when legacy rejects an action', async () => {
    const wrapper = mount(PrismBlendPuzzle, { props: { snapshot: initial, onAction: vi.fn(() => null) } });

    await wrapper.get('[data-mirror="2"]').trigger('click');

    expect(wrapper.get('[data-mirror="2"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('[role="status"]').text()).toBe(initial.status);
  });

  it('renders snapshots pushed by the legacy controller', async () => {
    const wrapper = mount(PrismBlendPuzzle, { props: { snapshot: initial, onAction: vi.fn(() => initial) } });
    const pushed = { ...initial, crystal: { ...initial.crystal, received: 1, emitted: 0 }, status: '水晶正在等待第二種顏色。' };

    await wrapper.setProps({ snapshot: pushed });

    expect(wrapper.get('[data-crystal="0"] text').text()).toContain('1 → 0');
    expect(wrapper.get('[role="status"]').text()).toBe(pushed.status);
  });
});

describe('parsePrismBlendSnapshot', () => {
  it('accepts the stage snapshot and returns independent nested values', () => {
    const parsed = parsePrismBlendSnapshot(initial);

    expect(parsed).toEqual(initial);
    expect(parsed).not.toBe(initial);
    expect(parsed?.beamSegments[0].points).not.toBe(initial.beamSegments[0].points);
    expect(parsed?.emitters).not.toBe(initial.emitters);
  });

  it.each([
    null,
    { ...initial, mirrors: initial.mirrors.slice(1) },
    { ...initial, mirrors: initial.mirrors.map((mirror, index) => index ? mirror : { ...mirror, x: 5 }) },
    { ...initial, mirrors: initial.mirrors.map((mirror, index) => index ? mirror : { ...mirror, orientation: 'flat' }) },
    { ...initial, emitters: [{ x: 5, color: 1 }] },
    { ...initial, emitters: [{ x: 4, color: 1 }, initial.emitters[1]] },
    { ...initial, crystal: { ...initial.crystal, emitted: 1 } },
    { ...initial, crystal: { ...initial.crystal, direction: 'left' } },
    { ...initial, beamSegments: [{ mask: 0, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }] },
    { ...initial, beamSegments: [{ mask: 1, points: [{ x: 0, y: 0 }, { x: 8.1, y: 1 }] }] },
    { ...initial, status: 5 },
  ])('rejects invalid snapshots', value => {
    expect(parsePrismBlendSnapshot(value)).toBeNull();
  });
});
