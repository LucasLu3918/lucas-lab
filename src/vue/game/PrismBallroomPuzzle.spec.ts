import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import PrismBallroomPuzzle from './PrismBallroomPuzzle.vue';
import { parsePrismBallroomSnapshot, type PrismBallroomSnapshot } from './prism-ballroom';

const initial: PrismBallroomSnapshot = {
  mirrors: [
    { index: 0, x: 3, y: 1, orientation: '/' },
    { index: 1, x: 1, y: 6, orientation: '/' },
    { index: 2, x: 5, y: 6, orientation: '\\' },
    { index: 3, x: 8, y: 6, orientation: '\\' },
    { index: 4, x: 0, y: 4, orientation: '/' },
    { index: 5, x: 4, y: 5, orientation: '\\' },
    { index: 6, x: 3, y: 0, orientation: '/' },
  ],
  beamSegments: [
    { mask: 7, points: [{ x: 8, y: -0.6 }, { x: 8, y: 0 }, { x: 8, y: 3 }] },
    { mask: 1, points: [{ x: 8, y: 3 }, { x: 8, y: 5 }] },
    { mask: 2, points: [{ x: 6, y: -0.6 }, { x: 6, y: 0 }, { x: 5, y: 1 }] },
    { mask: 4, points: [{ x: 5, y: -0.6 }, { x: 5, y: 0 }, { x: 4, y: 1 }] },
  ],
  emitters: [{ x: 8, color: 7 }, { x: 6, color: 2 }, { x: 5, color: 4 }],
  filter: { x: 8, y: 4, color: 1 },
  crystal: { x: 8, y: 3, direction: 'down', received: 3, emitted: 3 },
  dancers: [
    { index: 0, a: { x: 6, y: 5 }, b: { x: 3, y: 3 }, position: 0 },
    { index: 1, a: { x: 4, y: 4 }, b: { x: 6, y: 3 }, position: 1 },
  ],
  targets: [
    { index: 0, x: 8, y: 5, need: 1, got: 1 },
    { index: 1, x: 1, y: 5, need: 4, got: 0 },
    { index: 2, x: 6, y: 6, need: 3, got: 0 },
  ],
  status: '已亮起 1 / 3 個面具。',
  solved: false,
};

describe('parsePrismBallroomSnapshot', () => {
  it('accepts a bounded ballroom scene and copies mutable collections', () => {
    const parsed = parsePrismBallroomSnapshot(initial);
    expect(parsed).toEqual(initial);
    expect(parsed).not.toBe(initial);
    expect(parsed?.mirrors).not.toBe(initial.mirrors);
    expect(parsed?.dancers).not.toBe(initial.dancers);
  });

  it('rejects snapshots with moved stage pieces, invalid colors, or oversized beams', () => {
    const wrongMirror = structuredClone(initial);
    wrongMirror.mirrors[0].x = 4;
    expect(parsePrismBallroomSnapshot(wrongMirror)).toBeNull();

    const wrongDancer = structuredClone(initial);
    wrongDancer.dancers[0].a.x = 7;
    expect(parsePrismBallroomSnapshot(wrongDancer)).toBeNull();

    const invalidCrystal = structuredClone(initial);
    invalidCrystal.crystal.emitted = 1;
    expect(parsePrismBallroomSnapshot(invalidCrystal)).toBeNull();

    const oversized = structuredClone(initial);
    oversized.beamSegments = Array.from({ length: 33 }, () => initial.beamSegments[0]);
    expect(parsePrismBallroomSnapshot(oversized)).toBeNull();
  });
});

describe('PrismBallroomPuzzle', () => {
  it('renders the ballroom board and returns typed mirror and dancer actions', async () => {
    const next = structuredClone(initial);
    next.mirrors[0].orientation = '\\';
    next.dancers[0].position = 1;
    const onAction = vi.fn(() => next);
    const wrapper = mount(PrismBallroomPuzzle, { props: { snapshot: initial, onAction } });

    expect(wrapper.findAll('.prism-cell')).toHaveLength(63);
    expect(wrapper.findAll('[data-emitter]')).toHaveLength(3);
    expect(wrapper.findAll('[data-mirror]')).toHaveLength(7);
    expect(wrapper.findAll('[data-dancer]')).toHaveLength(2);
    expect(wrapper.findAll('[data-ghost]')).toHaveLength(2);
    expect(wrapper.findAll('[data-mask]')).toHaveLength(3);
    expect(wrapper.findAll('[data-filter]')).toHaveLength(1);
    expect(wrapper.findAll('[data-crystal]')).toHaveLength(1);
    expect(wrapper.find('[data-mirror="0"]').attributes('role')).toBe('button');
    expect(wrapper.find('[data-dancer="0"]').attributes('role')).toBe('button');
    expect(wrapper.find('#bf-status').attributes('role')).toBe('status');
    expect(wrapper.find('[style]').exists()).toBe(false);

    await wrapper.find('[data-mirror="0"]').trigger('keydown', { key: 'Enter' });
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'flip', index: 0 });
    expect(wrapper.find('[data-mirror="0"]').attributes('aria-pressed')).toBe('true');

    await wrapper.find('[data-dancer="0"]').trigger('keydown', { key: 'Enter' });
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'move-dancer', index: 0 });
    expect(wrapper.find('[data-dancer="0"]').attributes('aria-pressed')).toBe('true');
    wrapper.unmount();
  });
});
