import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import PipesPuzzle from './PipesPuzzle.vue';
import { parsePipesSnapshot, type PipesSnapshot } from './pipes';

const snapshot: PipesSnapshot = {
  tiles: [
    { at: 1, type: 'straight', rotation: 1, directions: ['下', '上'], flowing: false },
    { at: 2, type: 'elbow', rotation: 0, directions: ['上', '右'], flowing: false },
    { at: 5, type: 'elbow', rotation: 1, directions: ['右', '下'], flowing: false },
    { at: 4, type: 'elbow', rotation: 3, directions: ['左', '上'], flowing: false },
    { at: 7, type: 'elbow', rotation: 2, directions: ['下', '左'], flowing: false },
  ],
  flowingCells: [0],
  connectedPipes: 0,
  solved: false,
  leak: { at: 0, direction: '右' },
  status: '蒸汽已通過 0 / 5 段管件，城市尚未接通。',
  explanation: '第1排第1格的右側管口尚未接好。沿通汽管段檢查下一格。',
  hintText: '',
  hintCount: 0,
  hintLimit: 3,
  canUndo: false,
};

function changed(overrides: Partial<PipesSnapshot> = {}): PipesSnapshot {
  return { ...snapshot, ...overrides };
}

describe('PipesPuzzle', () => {
  it('renders nine cells, the five pipe controls, accessible labels and disabled actions', () => {
    const wrapper = mount(PipesPuzzle, { attachTo: document.body, props: { snapshot, onAction: vi.fn(() => snapshot) } });

    expect(wrapper.findAll('.pipes-board > *')).toHaveLength(9);
    expect(wrapper.findAll('.pipe-piece')).toHaveLength(5);
    expect(wrapper.get('.pipe-source').attributes('aria-label')).toBe('泉源，出汽口向右');
    expect(wrapper.get('[data-pipe="0"]').attributes('aria-label')).toContain('管口向下、上');
    expect(wrapper.get('#pipes-status').text()).toBe(snapshot.status);
    expect(wrapper.get('#pipes-undo').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#pipes-confirm').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#pipes-hint-text').text()).toBe('');
    wrapper.unmount();
  });

  it('routes rotation and action buttons to legacy state, then renders returned snapshots', async () => {
    const flowing = changed({
      tiles: snapshot.tiles.map((tile, index) => index === 0
        ? { ...tile, rotation: 2, directions: ['左', '右'], flowing: true }
        : tile),
      flowingCells: [0, 1],
      connectedPipes: 1,
      leak: { at: 1, direction: '下' },
      status: '蒸汽已通過 1 / 5 段管件，城市尚未接通。',
      canUndo: true,
    });
    const onAction = vi.fn()
      .mockReturnValueOnce(flowing)
      .mockReturnValueOnce(changed({ hintCount: 1, hintText: '從左上泉源開始。' }))
      .mockReturnValueOnce(changed({ solved: true, canUndo: true }));
    const wrapper = mount(PipesPuzzle, { attachTo: document.body, props: { snapshot, onAction } });

    await wrapper.get('[data-pipe="0"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'rotate', index: 0 });
    expect(wrapper.get('[data-pipe="0"]').classes()).toContain('rotation-2');
    expect(wrapper.get('[data-pipe="0"]').classes()).toContain('flowing');
    expect(wrapper.get('#pipes-undo').attributes('disabled')).toBeUndefined();
    expect(wrapper.get('#pipes-status').text()).toBe(flowing.status);

    await wrapper.get('#pipes-hint').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'hint' });
    expect(wrapper.get('#pipes-hint-text').text()).toBe('從左上泉源開始。');

    await wrapper.get('#pipes-reset').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(3, { type: 'reset' });
    wrapper.unmount();
  });

  it('moves keyboard focus to the next pipe and confirms only through the legacy callback', async () => {
    const solved = changed({ solved: true, leak: null, canUndo: true });
    const onAction = vi.fn(() => solved);
    const wrapper = mount(PipesPuzzle, { attachTo: document.body, props: { snapshot, onAction } });
    const first = wrapper.get('[data-pipe="0"]');

    await first.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('data-pipe')).toBe('1');

    await wrapper.get('[data-pipe="1"]').trigger('click');
    expect(wrapper.get('#pipes-confirm').attributes('disabled')).toBeUndefined();
    await wrapper.get('#pipes-confirm').trigger('click');
    expect(onAction).toHaveBeenCalledWith({ type: 'confirm' });
    wrapper.unmount();
  });
});

describe('parsePipesSnapshot', () => {
  it('accepts a valid 3x3 puzzle snapshot', () => {
    expect(parsePipesSnapshot(snapshot)).toEqual(snapshot);
  });

  it('rejects malformed tile positions, rotations and hint state', () => {
    expect(parsePipesSnapshot({ ...snapshot, tiles: [...snapshot.tiles, snapshot.tiles[0]] })).toBeNull();
    expect(parsePipesSnapshot({ ...snapshot, tiles: snapshot.tiles.map((tile, index) => index ? tile : { ...tile, rotation: -1 }) })).toBeNull();
    expect(parsePipesSnapshot({ ...snapshot, hintCount: 4 })).toBeNull();
    expect(parsePipesSnapshot({ ...snapshot, leak: { at: 9, direction: '右' } })).toBeNull();
  });
});
