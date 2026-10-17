import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ApothecaryVesselsPuzzle from './ApothecaryVesselsPuzzle.vue';
import {
  parseApothecaryVesselsSnapshot,
  type ApothecaryVesselsAction,
  type ApothecaryVesselsSnapshot,
} from './apothecary-vessels';

const snapshot: ApothecaryVesselsSnapshot = {
  amounts: [8, 0, 0],
  moveCount: 0,
  enabledTubes: [true, false, false],
  canUndo: false,
  canRestart: true,
  finished: false,
  message: 'A 8　B 0　C 0　目標：B 杯 = 4',
  tone: '',
};

describe('ApothecaryVesselsPuzzle', () => {
  it('renders the three capacities and accessible directed pour controls', () => {
    const wrapper = mount(ApothecaryVesselsPuzzle, {
      props: { snapshot, onAction: () => snapshot },
    });

    expect(wrapper.get('svg').attributes('role')).toBe('img');
    expect(wrapper.get('#apo-vessels-description').text()).toContain('A 杯容量 8');
    expect(wrapper.findAll('[data-vessel]')).toHaveLength(3);
    expect(wrapper.get('[data-vessel="A"] text:last-child').text()).toBe('8');
    expect(wrapper.get('#apo-tube-0').text()).toBe('倒 A 杯至 C 杯');
    expect(wrapper.get('#apo-tube-0').attributes('disabled')).toBeUndefined();
    expect(wrapper.get('#apo-tube-1').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#apo-undo').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#apo-moves').text()).toBe('已倒 0 次');
  });

  it('returns pour, undo and restart actions to the legacy controller', async () => {
    const next: ApothecaryVesselsSnapshot = {
      ...snapshot,
      amounts: [5, 0, 3],
      moveCount: 1,
      enabledTubes: [true, true, false],
      canUndo: true,
      message: 'A 5　B 0　C 3　目標：B 杯 = 4',
    };
    const onAction = vi.fn((_action: ApothecaryVesselsAction) => next);
    const wrapper = mount(ApothecaryVesselsPuzzle, { props: { snapshot, onAction } });

    await wrapper.get('#apo-tube-0').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'pour', tube: 0 });
    expect(wrapper.get('#apo-moves').text()).toBe('已倒 1 次');

    await wrapper.get('#apo-undo').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'undo' });

    await wrapper.get('#apo-restart').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(3, { type: 'restart' });
  });

  it('shows completion and disables further pours', () => {
    const finished = { ...snapshot, amounts: [4, 4, 0] as [number, number, number], finished: true, canUndo: false, canRestart: false, message: 'B 杯剛好 4：蘋果汁的原液取得了。', tone: 'ok' as const };
    const wrapper = mount(ApothecaryVesselsPuzzle, {
      props: { snapshot: finished, onAction: () => finished },
    });

    expect(wrapper.get('#bf-status').attributes('data-tone')).toBe('ok');
    expect(wrapper.get('#bf-status').text()).toContain('原液取得了');
    expect(wrapper.findAll('[data-tube]:disabled')).toHaveLength(3);
    expect(wrapper.get('#apo-restart').attributes('disabled')).toBeDefined();
  });
});

describe('parseApothecaryVesselsSnapshot', () => {
  it('copies valid transient state', () => {
    const parsed = parseApothecaryVesselsSnapshot(snapshot);
    expect(parsed).toEqual(snapshot);
    expect(parsed).not.toBe(snapshot);
    expect(parsed?.amounts).not.toBe(snapshot.amounts);
  });

  it.each([
    { ...snapshot, amounts: [9, 0, 0] },
    { ...snapshot, amounts: [8, 1, 0] },
    { ...snapshot, amounts: [4, 4] },
    { ...snapshot, moveCount: -1 },
    { ...snapshot, enabledTubes: [true, 'no', false] },
    { ...snapshot, message: null },
    null,
  ])('rejects malformed snapshots', value => {
    expect(parseApothecaryVesselsSnapshot(value)).toBeNull();
  });
});
