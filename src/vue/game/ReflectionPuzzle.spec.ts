import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ReflectionPuzzle from './ReflectionPuzzle.vue';

const left = [true, false, false, true, true, true, false, true];
const right = [false, false, true, false, false, false, false, true];

describe('ReflectionPuzzle', () => {
  it('renders a fixed manuscript half and an interactive mirror half', async () => {
    const onChange = vi.fn();
    const wrapper = mount(ReflectionPuzzle, { props: { left, right, onChange } });

    expect(wrapper.findAll('.reflection-cell')).toHaveLength(16);
    expect(wrapper.findAll('.reflection-cell:disabled')).toHaveLength(8);
    expect(wrapper.get('[data-reflection="1"]').attributes('aria-pressed')).toBe('false');

    await wrapper.get('[data-reflection="1"]').trigger('click');

    expect(wrapper.get('[data-reflection="1"]').attributes('aria-pressed')).toBe('true');
    expect(onChange).toHaveBeenLastCalledWith([false, true, true, false, false, false, false, true]);
  });

  it('announces how many rows currently mirror', async () => {
    const wrapper = mount(ReflectionPuzzle, { props: { left, right, onChange: vi.fn() } });

    expect(wrapper.get('[role="status"]').text()).toContain('已映照 1 / 4 列');
    for (const index of [1, 4, 5, 6, 7]) {
      await wrapper.get(`[data-reflection="${index}"]`).trigger('click');
    }

    expect(wrapper.get('[role="status"]').text()).toContain('已映照 4 / 4 列');
  });
});
