import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import QimenApp from './QimenApp.vue';
import { interpret, DOOR_MEANING, GOD_MEANING, STAR_MEANING } from './interpretation';
import { chartAt, TOPIC_LABELS, type Topic } from './qimen';
import { lintCopy } from '../fortune-core/ethics';

// Mounts the island the way /qimen/ does: the form submits a fixed civil time, and the grid and steps render.
describe('QimenApp', () => {
  it('casts a fixed date and time and shows the nine-palace grid and the 推導過程', async () => {
    const wrapper = mount(QimenApp);
    await wrapper.find('input[type="date"]').setValue('2026-10-18');
    await wrapper.find('input[type="time"]').setValue('10:00');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.find('.summary-line').text()).toContain('值符');
    expect(wrapper.findAll('.palace-cell')).toHaveLength(9);
    expect(wrapper.find('.steps').text()).toContain('陰遁6局');
    expect(wrapper.text()).toContain('寒露');
  });

  it('updates the topic copy without casting again', async () => {
    const wrapper = mount(QimenApp);
    await wrapper.find('input[type="date"]').setValue('2026-10-18');
    await wrapper.find('input[type="time"]').setValue('10:00');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('一般事項可依最吉方位');
    await wrapper.find('select').setValue('travel');
    expect(wrapper.text()).toContain('出行宜選開、休、景門');
    expect(wrapper.find('.steps').text()).toContain('陰遁6局');
  });

  it('shows an error and no results for an invalid civil date', async () => {
    const wrapper = mount(QimenApp);
    await wrapper.find('input[type="date"]').setValue('2026-02-30');
    await wrapper.find('input[type="time"]').setValue('10:00');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.find('.palace-cell').exists()).toBe(false);
  });
});

// Copy must pass the shared ethics linter for every topic and for a spread of charts.
describe('qimen copy', () => {
  it('passes the ethics linter for every topic and a spread of charts', () => {
    const topics = Object.keys(TOPIC_LABELS) as Topic[];
    const dates = ['2026-10-18', '2026-02-04', '2026-06-21', '2026-12-22', '2027-03-20', '2027-09-07'];
    for (const date of dates) {
      for (const topic of topics) {
        const copy = interpret(chartAt(date, '09:30', topic));
        const text = [copy.headline, copy.valueLine, ...copy.patternLines, copy.timingLine, copy.bestLine, copy.worstLine, copy.fitLine, copy.caution].join('\n');
        expect(lintCopy(text)).toEqual([]);
      }
    }
  });

  it('has a meaning for every door, star and god that a chart can show', () => {
    for (const door of Object.keys(DOOR_MEANING)) expect(DOOR_MEANING[door]).toBeTruthy();
    for (const star of ['天蓬', '天芮', '天冲', '天輔', '天心', '天柱', '天任', '天英']) expect(STAR_MEANING[star]).toBeTruthy();
    for (const god of ['值符', '螣蛇', '太陰', '六合', '白虎', '玄武', '九地', '九天']) expect(GOD_MEANING[god]).toBeTruthy();
  });
});
