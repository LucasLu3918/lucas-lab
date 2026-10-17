import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import BoxThreadPuzzle from './BoxThreadPuzzle.vue';
import { parseBoxThreadSnapshot, type BoxThreadAction, type BoxThreadSnapshot } from './box-thread';

const empty: BoxThreadSnapshot = { order: [], finished: false };

function harness(initial: BoxThreadSnapshot = empty) {
  let state = initial;
  const onAction = vi.fn((action: BoxThreadAction) => {
    if (action.type === 'undo') state = empty;
    else state = { order: [...state.order, action.panel], finished: action.panel === 'C' && state.order.length === 3 };
    return state;
  });
  const wrapper = mount(BoxThreadPuzzle, { props: { snapshot: initial, onAction } });
  return { wrapper, onAction };
}

describe('BoxThreadPuzzle', () => {
  it('shows the four panels in the existing clue-free order and emits a panel selection', async () => {
    const { wrapper, onAction } = harness();

    expect(wrapper.findAll('.box-hole').map(button => button.text())).toEqual(['舞廳', '陽台', '黑松林', '鏡廊']);
    await wrapper.get('button[aria-label="陽台"]').trigger('click');

    expect(onAction).toHaveBeenCalledWith({ type: 'choose-panel', panel: 'B' });
    expect(wrapper.find('.box-chip').text()).toBe('陽台');
    expect(wrapper.get('button[aria-label="陽台（紅線已穿過）"]').attributes('disabled')).toBeDefined();
  });

  it('offers the legacy clear-line undo and reflects the returned snapshot', async () => {
    const { wrapper, onAction } = harness({ order: ['B', 'A'], finished: false });

    await wrapper.get('button.text-button').trigger('click');

    expect(onAction).toHaveBeenCalledWith({ type: 'undo' });
    expect(wrapper.text()).toContain('尚未穿過任何一格');
    expect(wrapper.find('.box-row').exists()).toBe(false);
  });

  it('does not change the view when the legacy adapter rejects an action', async () => {
    const onAction = vi.fn(() => null);
    const wrapper = mount(BoxThreadPuzzle, { props: { snapshot: empty, onAction } });

    await wrapper.get('button[aria-label="陽台"]').trigger('click');

    expect(onAction).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain('尚未穿過任何一格');
  });

  it('disables panel choices after the legacy engine reports completion', () => {
    const wrapper = mount(BoxThreadPuzzle, {
      props: { snapshot: { order: ['B', 'A', 'D', 'C'], finished: true }, onAction: () => null },
    });

    expect(wrapper.findAll('.box-hole').every(button => button.attributes('disabled') !== undefined)).toBe(true);
    expect(wrapper.find('.box-row .text-button').exists()).toBe(false);
  });
});

describe('parseBoxThreadSnapshot', () => {
  it('accepts ordered unique panel ids up to four entries', () => {
    expect(parseBoxThreadSnapshot({ order: ['B', 'A'], finished: false })).toEqual({ order: ['B', 'A'], finished: false });
  });

  it('rejects duplicates, unknown ids and inconsistent completion', () => {
    expect(parseBoxThreadSnapshot({ order: ['B', 'B'], finished: false })).toBeNull();
    expect(parseBoxThreadSnapshot({ order: ['X'], finished: false })).toBeNull();
    expect(parseBoxThreadSnapshot({ order: ['B', 'A', 'D', 'C'], finished: false })).toBeNull();
    expect(parseBoxThreadSnapshot({ order: ['B'], finished: true })).toBeNull();
  });
});
