import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LiuyaoApp from './LiuyaoApp.vue';

// Mounts the island the way /liuyao/ does, so the form, the casting table, the 用神 analysis and the topic selector run together.
describe('LiuyaoApp', () => {
  it('casts by two numbers and shows the hexagram, the moving line and the 世應 marks', async () => {
    const wrapper = mount(LiuyaoApp);
    await wrapper.find('input[name="liuyao-method"][value="numbers"]').setValue(true);
    await wrapper.find('input[type="text"]').setValue('7 3');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.find('.summary-line').text()).toContain('山火賁');
    expect(wrapper.find('.summary-line').text()).toContain('變卦 離為火');
    const rows = wrapper.findAll('.hexagram-table tbody tr');
    expect(rows).toHaveLength(6);
    // 表格由上爻到初爻排列，第 4 爻為第三列。
    expect(rows[2].classes()).toContain('moving');
    expect(rows[2].text()).toContain('老陰');
    expect(wrapper.text()).toContain('世');
    expect(wrapper.text()).toContain('應');
  });

  it('updates the 用神 analysis when the topic changes, without casting again', async () => {
    const wrapper = mount(LiuyaoApp);
    await wrapper.find('input[name="liuyao-method"][value="numbers"]').setValue(true);
    await wrapper.find('input[type="text"]').setValue('7 3');
    await wrapper.find('form').trigger('submit');
    const hexagramBefore = wrapper.find('.hexagram-table').html();
    await wrapper.find('select').setValue('career');
    expect(wrapper.find('.hexagram-table').html()).toBe(hexagramBefore);
    expect(wrapper.find('.summary-line').text()).toContain('用神：官鬼');
    expect(wrapper.text()).toContain('官鬼代表職位');
  });

  it('casts six coin throws from the random source and shows the calculation steps', async () => {
    const wrapper = mount(LiuyaoApp);
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.findAll('.hexagram-table tbody tr')).toHaveLength(6);
    const steps = wrapper.findAll('.steps li').map(item => item.text());
    expect(steps.slice(0, 6).every(step => step.includes('正 '))).toBe(true);
    expect(wrapper.find('.summary-line').text()).toContain('用神');
  });

  it('rejects more than two numbers and non-digit input', async () => {
    const wrapper = mount(LiuyaoApp);
    await wrapper.find('input[name="liuyao-method"][value="numbers"]').setValue(true);
    await wrapper.find('input[type="text"]').setValue('1 2 3');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('[role="alert"]').text()).toContain('一至兩個數字');
    expect(wrapper.find('.hexagram-table').exists()).toBe(false);
    await wrapper.find('input[type="text"]').setValue('7a');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('[role="alert"]').text()).toContain('只能包含 0 至 9');
  });
});
