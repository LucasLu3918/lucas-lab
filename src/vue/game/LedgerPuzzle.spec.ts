import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import LedgerPuzzle from './LedgerPuzzle.vue';
import { parseLedgerSnapshot, type LedgerSnapshot } from './ledger';

const snapshot: LedgerSnapshot = { tiles: [4, 0, 8, 2, 6, 1, 3, 7, 5] };

describe('LedgerPuzzle', () => {
  it('renders nine authored tile controls with selection and placement status', () => {
    const wrapper = mount(LedgerPuzzle, { props: { snapshot, onAction: vi.fn(() => snapshot) } });

    expect(wrapper.findAll('.ledger-board > button')).toHaveLength(9);
    expect(wrapper.get('[data-pos="1"]').attributes('aria-label')).toContain('帳頁標題左側');
    expect(wrapper.get('[data-pos="7"]').classes()).toContain('placed');
    expect(wrapper.get('.challenge-feedback').text()).toContain('1 / 9');
    expect(wrapper.get('[data-pos="0"] svg').attributes('viewBox')).toBe('100 100 100 100');
  });

  it('sends swaps and resets to the legacy controller, then renders its snapshots', async () => {
    const swapped: LedgerSnapshot = { tiles: [0, 4, 8, 2, 6, 1, 3, 7, 5] };
    const reset: LedgerSnapshot = { tiles: [8, 1, 5, 3, 0, 7, 4, 2, 6] };
    const onAction = vi.fn().mockReturnValueOnce(swapped).mockReturnValueOnce(reset);
    const wrapper = mount(LedgerPuzzle, { props: { snapshot, onAction } });

    await wrapper.get('[data-pos="0"]').trigger('click');
    expect(wrapper.get('[data-pos="0"]').attributes('aria-pressed')).toBe('true');
    await wrapper.get('[data-pos="1"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'swap', first: 0, second: 1 });
    expect(wrapper.get('[data-pos="0"]').attributes('aria-label')).toContain('帳頁標題左側');

    await wrapper.get('#ledger-reset').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'reset' });
    expect(wrapper.get('[data-pos="0"]').attributes('aria-label')).toContain('簽名欄右側');
    expect(wrapper.get('[data-pos="0"]').attributes('aria-pressed')).toBe('false');
  });

  it('moves focus across valid keyboard cells without wrapping rows', async () => {
    const wrapper = mount(LedgerPuzzle, { attachTo: document.body, props: { snapshot, onAction: vi.fn(() => snapshot) } });
    const first = wrapper.get('[data-pos="0"]');

    await first.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('data-pos')).toBe('1');
    (wrapper.get('[data-pos="2"]').element as HTMLButtonElement).focus();
    await wrapper.get('[data-pos="2"]').trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('data-pos')).toBe('2');
    wrapper.unmount();
  });
});

describe('parseLedgerSnapshot', () => {
  it('accepts a complete permutation and rejects malformed piece orders', () => {
    expect(parseLedgerSnapshot(snapshot)).toEqual(snapshot);
    expect(parseLedgerSnapshot({ tiles: [0, 1, 2] })).toBeNull();
    expect(parseLedgerSnapshot({ tiles: [0, 1, 2, 3, 4, 5, 6, 7, 7] })).toBeNull();
    expect(parseLedgerSnapshot({ tiles: [0, 1, 2, 3, 4, 5, 6, 7, 9] })).toBeNull();
  });
});
