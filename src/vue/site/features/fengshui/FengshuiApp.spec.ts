import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FengshuiApp from './FengshuiApp.vue';

// Mounts the island the way /fengshui/ does: the form submits a birth year and gender, and the results render.
describe('FengshuiApp', () => {
  it('calculates the natal gua and the eight-direction table from year and gender', async () => {
    const wrapper = mount(FengshuiApp);
    await wrapper.find('input[type="number"]').setValue(1985);
    await wrapper.find('select').setValue('male');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.find('.summary-line').text()).toContain('乾卦（6）');
    expect(wrapper.findAll('.direction-table tbody tr')).toHaveLength(8);
    expect(wrapper.find('.steps').text()).toContain('乾卦');
    expect(wrapper.find('#fengshui-flying').exists()).toBe(false);
  });

  it('shows the 玄空飛星 grid only when a sitting is chosen', async () => {
    const wrapper = mount(FengshuiApp);
    await wrapper.find('input[type="number"]').setValue(1985);
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('.flying-grid').exists()).toBe(false);
    const selects = wrapper.findAll('select');
    await selects[1].setValue('south');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.findAll('.palace-cell')).toHaveLength(9);
    expect(wrapper.find('#fengshui-flying').text()).toContain('子山午向');
  });

  it('shows an error and no results for a year outside the supported range', async () => {
    const wrapper = mount(FengshuiApp);
    await wrapper.find('input[type="number"]').setValue(1800);
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('[role="alert"]').text()).toContain('1900');
    expect(wrapper.find('.results').exists()).toBe(false);
  });

  it('keeps the last result and shows a stale notice after the form changes', async () => {
    const wrapper = mount(FengshuiApp);
    await wrapper.find('input[type="number"]').setValue(1985);
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('.stale-notice').exists()).toBe(false);
    await wrapper.find('select').setValue('female');
    expect(wrapper.find('.stale-notice').exists()).toBe(true);
    expect(wrapper.find('.summary-line').text()).toContain('乾卦（6）');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('.summary-line').text()).toContain('離卦（9）');
    expect(wrapper.find('.stale-notice').exists()).toBe(false);
  });
});
