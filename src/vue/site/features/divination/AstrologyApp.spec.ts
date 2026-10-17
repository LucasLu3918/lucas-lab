import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import AstrologyApp from './AstrologyApp.vue';

// Mounts the island the way /astrology/ does. happy-dom has no Worker, so the calculation runs on the main thread (the fallback path).
describe('AstrologyApp', () => {
  it('shows the completion status, then flags the result as stale once the form changes', async () => {
    const wrapper = mount(AstrologyApp);
    await wrapper.find('input[type="date"]').setValue('1990-06-15');
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(wrapper.find('.results').exists()).toBe(true), { timeout: 15_000 });

    expect(wrapper.find('[role="status"]').text()).toContain('星盤已完成計算');
    expect(wrapper.find('.stale-note').exists()).toBe(false);
    expect(wrapper.find('.time-note').text()).toContain('Asia/Taipei');

    await wrapper.find('input[type="date"]').setValue('1991-06-15');
    expect(wrapper.find('.stale-note').exists()).toBe(true);
    expect(wrapper.find('.results').exists()).toBe(true);
  }, 20_000);

  it('keeps the place note on the calculated city after the place selector changes', async () => {
    const wrapper = mount(AstrologyApp);
    await wrapper.find('input[type="date"]').setValue('1990-06-15');
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(wrapper.find('.results').exists()).toBe(true), { timeout: 15_000 });
    const placeNote = () => wrapper.findAll('.method').find(item => item.text().includes('本命星盤計算方法'))?.text() ?? '';
    expect(placeNote()).toContain('出生位置：台灣・台北');
    await wrapper.findAll('select')[0].setValue('tokyo');
    expect(wrapper.find('.stale-note').exists()).toBe(true);
    expect(placeNote()).toContain('出生位置：台灣・台北');
    expect(placeNote()).not.toContain('日本・東京');
  }, 20_000);

  it('keeps the status line empty before any calculation', () => {
    const wrapper = mount(AstrologyApp);
    expect(wrapper.find('[role="status"]').text()).toBe('');
    expect(wrapper.find('.results').exists()).toBe(false);
  });
});
