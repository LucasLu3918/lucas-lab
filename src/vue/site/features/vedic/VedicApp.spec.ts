import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VedicApp from './VedicApp.vue';

// Mounts the island the way /vedic/ does. The calculation is synchronous and needs no worker.
describe('VedicApp', () => {
  it('renders the nakshatra, dasha and graha sections after a calculation, then flags the result as stale once the form changes', async () => {
    const wrapper = mount(VedicApp);
    await wrapper.find('input[type="date"]').setValue('1990-06-15');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('.results').exists()).toBe(true);
    expect(wrapper.find('#nakshatra').text()).toContain('Shatabhisha');
    expect(wrapper.find('#dasha').text()).toContain('土星');
    expect(wrapper.find('#grahas').text()).toContain('九曜落座');
    expect(wrapper.find('.stale-note').exists()).toBe(false);

    await wrapper.find('input[type="date"]').setValue('1991-06-15');
    expect(wrapper.find('.stale-note').exists()).toBe(true);
    expect(wrapper.find('.results').exists()).toBe(true);
  });

  it('disables the birth time and drops the ascendant when the time is unknown', async () => {
    const wrapper = mount(VedicApp);
    await wrapper.find('input[type="date"]').setValue('1990-06-15');
    await wrapper.find('input[name="vedic-precision"][value="true"]').trigger('change');
    expect(wrapper.find('input[type="time"]').attributes('disabled')).toBeDefined();
    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('.results').exists()).toBe(true);
    expect(wrapper.text()).toContain('出生時間未知');
    expect(wrapper.text()).not.toContain('上升（Lagna）');
  });

  it('shows an error and no results when the date is impossible', async () => {
    const wrapper = mount(VedicApp);
    await wrapper.find('input[type="date"]').setValue('1990-02-30');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.find('.results').exists()).toBe(false);
  });

  it('keeps the page free of results before any calculation', () => {
    const wrapper = mount(VedicApp);
    expect(wrapper.find('.results').exists()).toBe(false);
    expect(wrapper.find('h1').text()).toBe('印度占星');
  });
});
