import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ApothecaryMixingPuzzle from './ApothecaryMixingPuzzle.vue';
import {
  parseApothecaryMixingSnapshot,
  type ApothecaryMixingAction,
  type ApothecaryMixingSnapshot,
} from './apothecary-mixing';

const snapshot: ApothecaryMixingSnapshot = {
  drops: [0, 0, 0],
  mirror: false,
  recipeColor: [80, 90, 120],
  mixedColor: [16, 16, 24],
  recipeLabel: '配方色（隔著綠玻璃）',
  recipeAriaLabel: '配方色：偏紫的藍灰，偏暗',
  mixLabel: '你的瓶子',
  closeMessage: '還沒有加色精。',
  directionMessage: '',
  finished: false,
  message: '調色中……',
  tone: '',
};

describe('ApothecaryMixingPuzzle', () => {
  it('renders accessible color swatches, mirror control and pigment bounds', () => {
    const wrapper = mount(ApothecaryMixingPuzzle, {
      props: { snapshot, onAction: () => snapshot },
    });

    expect(wrapper.get('#apo-ref').attributes('role')).toBe('img');
    expect(wrapper.get('#apo-ref').attributes('aria-label')).toContain('配方色');
    expect(wrapper.get('#apo-ref').classes()).toContain('glass');
    expect(wrapper.get('#apo-mirror').attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('[aria-label="紅減一滴"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[aria-label="紅加一滴"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.get('.apo-count').text()).toBe('0 滴');
  });

  it('returns mirror and pigment actions to the legacy controller', async () => {
    const mirrored: ApothecaryMixingSnapshot = {
      ...snapshot,
      mirror: true,
      recipeLabel: '配方色（手持鏡裡的真色）：偏紫的藍灰，偏暗',
    };
    const mixed: ApothecaryMixingSnapshot = {
      ...mirrored,
      drops: [1, 0, 0],
      mixedColor: [210, 43, 43],
      closeMessage: '還差很多。',
      directionMessage: '藍的成分還不夠。',
    };
    const onAction = vi.fn((action: ApothecaryMixingAction) => action.type === 'toggle-mirror' ? mirrored : mixed);
    const wrapper = mount(ApothecaryMixingPuzzle, { props: { snapshot, onAction } });

    await wrapper.get('#apo-mirror').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'toggle-mirror' });
    expect(wrapper.get('#apo-mirror').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('#apo-ref').classes()).not.toContain('glass');

    await wrapper.get('[aria-label="紅加一滴"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'change-drops', pigment: 0, step: 1 });
    expect(wrapper.get('.apo-count').text()).toBe('1 滴');
    expect(wrapper.get('#apo-dir').text()).toContain('藍');
  });

  it('disables controls at drop limits and after completion', () => {
    const atMaximum = { ...snapshot, drops: [4, 0, 0] as [number, number, number] };
    const wrapper = mount(ApothecaryMixingPuzzle, { props: { snapshot: atMaximum, onAction: () => atMaximum } });
    expect(wrapper.get('[aria-label="紅加一滴"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[aria-label="紅減一滴"]').attributes('disabled')).toBeUndefined();

    const finished = { ...snapshot, drops: [1, 1, 4] as [number, number, number], finished: true, tone: 'ok' as const, message: '顏色吻合：回魂藥調好了。' };
    const finishedWrapper = mount(ApothecaryMixingPuzzle, { props: { snapshot: finished, onAction: () => finished } });
    expect(finishedWrapper.get('#apo-mix').classes()).toContain('lit');
    expect(finishedWrapper.get('#bf-status').attributes('data-tone')).toBe('ok');
    expect(finishedWrapper.findAll('.apo-drop button:not(:disabled)')).toHaveLength(0);
  });
});

describe('parseApothecaryMixingSnapshot', () => {
  it('copies valid transient state', () => {
    const parsed = parseApothecaryMixingSnapshot(snapshot);
    expect(parsed).toEqual(snapshot);
    expect(parsed).not.toBe(snapshot);
    expect(parsed?.drops).not.toBe(snapshot.drops);
    expect(parsed?.recipeColor).not.toBe(snapshot.recipeColor);
  });

  it.each([
    { ...snapshot, drops: [5, 0, 0] },
    { ...snapshot, drops: [0, -1, 0] },
    { ...snapshot, drops: [0, 0] },
    { ...snapshot, mirror: 'yes' },
    { ...snapshot, recipeColor: [256, 0, 0] },
    { ...snapshot, mixedColor: [0, Number.NaN, 0] },
    { ...snapshot, closeMessage: null },
    { ...snapshot, tone: 'bad' },
    { ...snapshot, finished: true },
    null,
  ])('rejects malformed snapshots', value => {
    expect(parseApothecaryMixingSnapshot(value)).toBeNull();
  });
});
