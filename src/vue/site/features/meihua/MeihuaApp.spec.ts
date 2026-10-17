import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MeihuaApp from './MeihuaApp.vue';

// Mounts the island the way /meihua/ does, so the form, the result table and the topic selector are exercised together.
describe('MeihuaApp', () => {
  it('casts by numbers, shows the three hexagrams and the moving line', async () => {
    const wrapper = mount(MeihuaApp);
    await wrapper.find('input[name="meihua-method"][value="numbers"]').setValue(true);
    await wrapper.find('input[type="text"]').setValue('7 3');
    await wrapper.find('form').trigger('submit');
    const table = wrapper.find('.hexagram-table').text();
    expect(table).toContain('山火賁');
    expect(wrapper.find('.summary-line').text()).toContain('第 4 爻');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('updates the topic notes without casting again', async () => {
    const wrapper = mount(MeihuaApp);
    await wrapper.find('input[name="meihua-method"][value="numbers"]').setValue(true);
    await wrapper.find('input[type="text"]').setValue('7 3');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).not.toContain('事業（事業象）');
    await wrapper.find('select').setValue('career');
    expect(wrapper.text()).toContain('事業（事業象）');
    expect(wrapper.find('.hexagram-table').text()).toContain('山火賁');
  });

  it('explains an unknown character instead of casting', async () => {
    const wrapper = mount(MeihuaApp);
    await wrapper.find('input[name="meihua-method"][value="text"]').setValue(true);
    await wrapper.find('input[type="text"]').setValue('龘');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('[role="alert"]').text()).toContain('尚未收錄筆畫');
    expect(wrapper.find('.hexagram-table').exists()).toBe(false);
  });

  it('rejects number input that is not digits and separators', async () => {
    const wrapper = mount(MeihuaApp);
    await wrapper.find('input[name="meihua-method"][value="numbers"]').setValue(true);
    await wrapper.find('input[type="text"]').setValue('7a');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('[role="alert"]').text()).toContain('只能包含 0 至 9');
  });

  it('casts by the current time and shows the lunar label', async () => {
    const wrapper = mount(MeihuaApp);
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('.meta').text()).toContain('農曆');
    expect(wrapper.find('.summary-line').text()).toContain('動爻：第');
  });
});
