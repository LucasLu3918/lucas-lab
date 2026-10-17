import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import HintPanel from './HintPanel.vue';
import type { HintSnapshot } from './hints';

const snapshot: HintSnapshot = {
  stepName: '推理',
  list: ['讀取第一段線索。', '比較兩個數字。', '答案是第十三聲。'],
  count: 1,
};

describe('HintPanel', () => {
  it('shows only revealed tiers and requests the next one', async () => {
    const wrapper = mount(HintPanel, { props: { snapshot, count: 1 } });

    expect(wrapper.findAll('.hint-step').map(step => step.text())).toEqual(['01讀取第一段線索。']);
    expect(wrapper.text()).toContain('推理');
    expect(wrapper.text()).toContain('展開更明確的提示');

    await wrapper.get('#more-hint').trigger('click');
    expect(wrapper.emitted('revealNext')).toHaveLength(1);
    expect(wrapper.findAll('.hint-step')).toHaveLength(1);
  });

  it('disables the action and reports completion after all tiers are revealed', () => {
    const wrapper = mount(HintPanel, { props: { snapshot, count: snapshot.list.length } });

    expect(wrapper.findAll('.hint-step')).toHaveLength(3);
    expect(wrapper.get('#more-hint').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#more-hint').text()).toContain('所有提示已展開');
  });
});
