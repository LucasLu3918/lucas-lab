import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import PendulumPuzzle from './PendulumPuzzle.vue';
import { parsePendulumSnapshot, type PendulumSnapshot } from './pendulum';

const empty: PendulumSnapshot = {
  weights: [
    { id: 'a', length: 0.75, name: '輕', attached: false },
    { id: 'b', length: 2.25, name: '重', attached: false },
    { id: 'c', length: 1.5, name: '中', attached: false },
  ],
  reducedMotion: true,
  canRun: false,
};

describe('PendulumPuzzle', () => {
  it('renders three accessible weight toggles without changing the legacy rule owner', () => {
    const wrapper = mount(PendulumPuzzle, { props: { snapshot: empty, onAction: vi.fn(() => empty) } });

    expect(wrapper.findAll('#bf-weights > button')).toHaveLength(3);
    expect(wrapper.get('[data-weight="a"]').attributes('aria-label')).toContain('輕配重，0.75 格');
    expect(wrapper.get('[data-weight="b"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.find('#bf-run').exists()).toBe(false);
  });

  it('sends weight toggles to legacy and renders its returned snapshot', async () => {
    const selected: PendulumSnapshot = {
      ...empty,
      weights: empty.weights.map(weight => ({ ...weight, attached: weight.id !== 'c' })),
      canRun: true,
    };
    const onAction = vi.fn(() => selected);
    const wrapper = mount(PendulumPuzzle, { props: { snapshot: empty, onAction } });

    await wrapper.get('[data-weight="a"]').trigger('click');

    expect(onAction).toHaveBeenCalledWith({ type: 'toggle-weight', id: 'a' });
    expect(wrapper.get('[data-weight="a"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('[data-weight="c"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('#bf-run').text()).toContain('放開擺錘');
  });

  it('returns the reduced-motion run action to legacy', async () => {
    const onAction = vi.fn(() => empty);
    const wrapper = mount(PendulumPuzzle, { props: { snapshot: { ...empty, canRun: true }, onAction } });

    await wrapper.get('#bf-run').trigger('click');

    expect(onAction).toHaveBeenCalledWith({ type: 'run' });
  });
});

describe('parsePendulumSnapshot', () => {
  it('accepts and copies the fixed legacy weight snapshot', () => {
    const parsed = parsePendulumSnapshot(empty);

    expect(parsed).toEqual(empty);
    expect(parsed).not.toBe(empty);
    expect(parsed?.weights).not.toBe(empty.weights);
  });

  it.each([
    null,
    { ...empty, weights: empty.weights.slice(0, 2) },
    { ...empty, reducedMotion: 'yes' },
    { ...empty, canRun: true, reducedMotion: false },
    { ...empty, weights: [{ ...empty.weights[0], id: 'untrusted' }, ...empty.weights.slice(1)] },
    { ...empty, weights: [{ ...empty.weights[0], length: 4 }, ...empty.weights.slice(1)] },
    { ...empty, weights: [{ ...empty.weights[0], name: '<img>' }, ...empty.weights.slice(1)] },
    { ...empty, weights: [{ ...empty.weights[0], attached: 1 }, ...empty.weights.slice(1)] },
  ])('rejects malformed snapshots', value => {
    expect(parsePendulumSnapshot(value)).toBeNull();
  });
});
