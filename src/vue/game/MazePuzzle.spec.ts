import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MazePuzzle from './MazePuzzle.vue';

type MazeSnapshot = InstanceType<typeof MazePuzzle>['$props']['snapshot'];

const snapshot: MazeSnapshot = {
  rows: 5,
  columns: 7,
  cells: [
    'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor',
    'wall', 'wall', 'floor', 'wall', 'floor', 'wall', 'floor',
    'floor', 'floor', 'floor', 'gate', 'floor', 'wall', 'floor',
    'floor', 'wall', 'wall', 'wall', 'floor', 'floor', 'floor',
    'floor', 'floor', 'floor', 'floor', 'wall', 'exit', 'wall',
  ],
  position: [0, 0] as [number, number],
  steps: 0,
  message: '',
  gateOpen: false,
};

describe('MazePuzzle', () => {
  it('renders the 5x7 maze, accessible cell names and mirrored direction controls', () => {
    const wrapper = mount(MazePuzzle, { props: { snapshot, onAction: vi.fn(() => snapshot) } });

    expect(wrapper.findAll('.maze-cell')).toHaveLength(35);
    expect(wrapper.get('.maze-board').attributes('aria-label')).toContain('5列7行');
    expect(wrapper.get('.maze-cell.here').attributes('aria-label')).toContain('倒影在這裡');
    expect(wrapper.get('[data-walk="L"]').attributes('aria-label')).toContain('倒影向右');
    expect(wrapper.get('.maze-token').classes()).toContain('r0');
    expect(wrapper.get('.maze-token').classes()).toContain('c0');
  });

  it('sends move commands to legacy rules and renders their returned snapshot', async () => {
    const next = { ...snapshot, position: [0, 1] as [number, number], steps: 1 };
    const onAction = vi.fn(() => next);
    const wrapper = mount(MazePuzzle, { props: { snapshot, onAction } });

    await wrapper.get('[data-walk="L"]').trigger('click');

    expect(onAction).toHaveBeenCalledWith({ type: 'move', direction: 'L' });
    expect(wrapper.get('.maze-token').classes()).toContain('c1');
    expect(wrapper.get('#maze-status').text()).toBe('已走 1 步');
  });

  it('maps arrow keys and keeps the watch gate open when the reflection resets', async () => {
    const openGate = { ...snapshot, gateOpen: true, message: '鏡門退回到還沒關上的那一刻。' };
    const reset = { ...openGate, position: [0, 0] as [number, number], steps: 0, message: '' };
    const onAction = vi.fn()
      .mockReturnValueOnce(snapshot)
      .mockReturnValueOnce(openGate)
      .mockReturnValueOnce(reset);
    const wrapper = mount(MazePuzzle, { props: { snapshot, onAction } });

    await wrapper.get('.maze-puzzle').trigger('keydown', { key: 'ArrowRight' });
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'move', direction: 'R' });

    await wrapper.get('#maze-watch').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'watch' });
    expect(wrapper.get('#maze-watch').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#maze-status').text()).toBe(openGate.message);

    await wrapper.get('#maze-reset').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(3, { type: 'reset' });
    expect(wrapper.get('.maze-token').classes()).toContain('c0');
    expect(wrapper.get('#maze-watch').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#maze-status').text()).toBe('已走 0 步');
  });
});
