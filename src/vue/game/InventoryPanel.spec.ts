import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import InventoryPanel from './InventoryPanel.vue';
import type { InventoryItemView } from './inventory';

const items: InventoryItemView[] = [
  { id: 'watch', name: '黃金懷錶', iconMarkup: '<svg aria-hidden="true"></svg>', keepsake: false },
  { id: 'glove', name: '伊萊的黑手套', iconMarkup: '<svg aria-hidden="true"></svg>', keepsake: true },
];

describe('InventoryPanel', () => {
  it('shows each collected item as a labeled button and emits its ID', async () => {
    const wrapper = mount(InventoryPanel, { props: { items } });

    expect(wrapper.findAll('button').map(button => button.attributes('aria-label'))).toEqual([
      '檢視黃金懷錶',
      '檢視伊萊的黑手套',
    ]);
    expect(wrapper.findAll('[data-item]')).toHaveLength(2);
    await wrapper.get('[data-item="watch"]').trigger('click');
    expect(wrapper.emitted('select')).toEqual([['watch']]);
  });

  it('shows the established empty inventory message', () => {
    const wrapper = mount(InventoryPanel, { props: { items: [] } });

    expect(wrapper.find('.inventory-empty').text()).toContain('等待第一條線索');
    expect(wrapper.find('button').exists()).toBe(false);
  });
});
