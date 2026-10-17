import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ZiweiApp from './ZiweiApp.vue';

// 1990-06-15 巳時 男 is 火六局 with 命宮丑 and 身宮亥 (matches iztro 2.6.3). The fixed clock makes the 大限 check deterministic.
async function calculateChart(wrapper: ReturnType<typeof mount>, date = '1990-06-15', hour = '5') {
  await wrapper.find('input[type="date"]').setValue(date);
  await wrapper.find('select').setValue(hour);
  await wrapper.find('form').trigger('submit');
}

describe('ZiweiApp', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows twelve palaces, the five-element class and the 身宮 after calculating', async () => {
    const wrapper = mount(ZiweiApp);
    await calculateChart(wrapper);
    expect(wrapper.findAll('.palace-cell')).toHaveLength(12);
    expect(wrapper.find('.chart-center').text()).toContain('火六局');
    expect(wrapper.find('.chart-center').text()).toContain('命宮在丑');
    expect(wrapper.find('.palace-cell.body').text()).toContain('身宮');
  });

  it('shows the derivation with the actual numbers, not a summary', async () => {
    const wrapper = mount(ZiweiApp);
    await calculateChart(wrapper);
    const steps = wrapper.findAll('.steps li').map(item => item.text());
    expect(steps).toHaveLength(6);
    expect(steps[0]).toContain('順數至農曆5月（午）');
    expect(steps[0]).toContain('再逆數 5 步（巳時）');
    expect(steps[0]).toContain('命宮在丑');
    expect(steps[1]).toContain('霹靂火');
    expect(steps[2]).toContain('依口訣定在辰');
  });

  it('lists the four transformations with the palace each one falls in', async () => {
    const wrapper = mount(ZiweiApp);
    await calculateChart(wrapper);
    const items = wrapper.findAll('.mutagen-list li').map(item => item.text());
    expect(items).toHaveLength(4);
    expect(items[0]).toContain('化祿');
    expect(items[0]).toContain('太陽 入 命宮');
  });

  it('lists all twelve 大限 with their years, in the order they start', async () => {
    const wrapper = mount(ZiweiApp);
    await calculateChart(wrapper);
    const rows = wrapper.findAll('.decadal-list li');
    expect(rows).toHaveLength(12);
    // Bureau 6 starts the first 大限 at 6 歲 (the birth year is 1), which is 命宮 for this chart.
    expect(rows[0].text()).toContain('第 1 限');
    expect(rows[0].text()).toContain('命宮（丑宮）');
    expect(rows[0].text()).toContain('6–15 歲');
    expect(rows[0].text()).toContain('1995–2004 年');
  });

  it('highlights the 大限 that the current year falls in', async () => {
    // 2030 is 虛歲 41 for a 1990 birth. That falls in the 36–45 歲 大限, which is 田宅 at 辰 for this chart.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-06-01T00:00:00+08:00'));
    const wrapper = mount(ZiweiApp);
    await calculateChart(wrapper);
    expect(wrapper.find('.chart-center').text()).toContain('2030 年（虛歲 41 歲）落在田宅大限');
    expect(wrapper.find('.palace-cell.current').text()).toContain('田宅');
    expect(wrapper.find('.decadal-list li.current').text()).toContain('田宅（辰宮）');
  });

  it('shows the 對宮 and 三合 of the selected palace, and its minor stars', async () => {
    const wrapper = mount(ZiweiApp);
    await calculateChart(wrapper);
    // 命宮 is selected by default: 丑 faces 未 and forms 三合 with 巳 and 酉.
    const triad = wrapper.find('.triad').text();
    expect(triad).toContain('對宮');
    expect(triad).toContain('（未宮）');
    expect(triad).toContain('（巳宮）');
    expect(triad).toContain('（酉宮）');
    expect(wrapper.find('.minor-line').text()).toContain('天魁');
  });

  it('asks for an hour before calculating', async () => {
    const wrapper = mount(ZiweiApp);
    await wrapper.find('input[type="date"]').setValue('1990-06-15');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('[role="alert"]').text()).toContain('請選擇出生時辰');
    expect(wrapper.find('.chart-wrap').exists()).toBe(false);
  });
});
