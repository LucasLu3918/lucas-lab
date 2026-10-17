import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import JournalPanel from './JournalPanel.vue';
import type { JournalSnapshot } from './journal';

const snapshot: JournalSnapshot = {
  initialSelection: '0',
  chapters: [
    { index: 0, chapter: '序章', title: '黑鐘書庫', entries: [{ id: 'birth', label: '出生紀錄', text: '被封存的字跡。' }] },
    { index: 1, chapter: '第一幕', title: '銀骨礦坑', entries: [] },
  ],
  clues: [{ id: 'number', label: '數字與時間', words: ['第十三聲'] }],
  clueCount: 1,
  clueTotal: 4,
  memories: [
    { id: 'toby', chapter: '序章', title: '黑鐘書庫', found: true, label: '托比', text: '他記得那一夜。' },
    { id: 'hidden-memory', chapter: '第一幕', title: '銀骨礦坑', found: false, label: '伊萊第一次', text: '不應提前揭露的記憶。' },
  ],
  memoriesAvailable: true,
  shards: [
    { id: 'library', found: true, title: '黑鐘書庫' },
    { id: 'crypt', found: false, title: null },
  ],
  achievements: [
    { id: 'first', unlocked: true, title: '初見真相', text: '看見第一份真相。' },
    { id: 'secret', unlocked: false, title: null, text: null },
  ],
  closingTitle: null,
  secretTitle: '鏡子的最後一頁',
  canReadSecretEpilogue: false,
};

describe('JournalPanel', () => {
  it('defaults to the current chapter and renders only viewed entries', () => {
    const wrapper = mount(JournalPanel, { props: { snapshot } });

    expect((wrapper.get('#journal-chapter').element as HTMLSelectElement).value).toBe('0');
    expect(wrapper.findAll('.journal-entry').map(entry => entry.text())).toEqual([
      '出生紀錄被封存的字跡。',
    ]);
    expect(wrapper.get('#journal-summary').text()).toContain('已記錄 1 處線索');
  });

  it('filters unlocked chapters and reports the empty chapter state', async () => {
    const wrapper = mount(JournalPanel, { props: { snapshot } });
    await wrapper.get('#journal-chapter').setValue('1');

    expect(wrapper.findAll('.journal-entry')).toHaveLength(0);
    expect(wrapper.get('#journal-entries').text()).toContain('這裡還沒有線索');
    await wrapper.get('#journal-chapter').setValue('all');
    expect(wrapper.findAll('.journal-entry')).toHaveLength(1);
  });

  it('renders clue groups and collection status without revealing locked content', async () => {
    const wrapper = mount(JournalPanel, { props: { snapshot } });
    await wrapper.get('#journal-chapter').setValue('clues');
    expect(wrapper.get('#journal-entries').text()).toContain('第十三聲');
    expect(wrapper.get('#journal-summary').text()).toContain('1 / 4');

    await wrapper.get('#journal-chapter').setValue('memories');
    expect(wrapper.findAll('.memory-entry')).toHaveLength(2);
    expect(wrapper.get('#journal-entries').text()).not.toContain('第一幕 · 托比');
    expect(wrapper.get('#journal-entries').text()).not.toContain('伊萊第一次');
    expect(wrapper.get('#journal-entries').text()).not.toContain('不應提前揭露的記憶');

    await wrapper.get('#journal-chapter').setValue('collection');
    expect(wrapper.get('#journal-entries').text()).toContain('鏡之碎片 1 / 2');
    expect(wrapper.get('#journal-entries').text()).toContain('◆ 尚未發現');
    expect(wrapper.get('#journal-entries').text()).toContain('？？？');
    expect(wrapper.get('#secret-epilogue').attributes('disabled')).toBeDefined();
  });

  it('emits the secret epilogue request only through the enabled collection action', async () => {
    const openSecret = vi.fn();
    const readySnapshot = { ...snapshot, canReadSecretEpilogue: true };
    const wrapper = mount(JournalPanel, {
      props: { snapshot: readySnapshot, onSecretEpilogue: openSecret },
    });
    await wrapper.get('#journal-chapter').setValue('collection');
    await wrapper.get('#secret-epilogue').trigger('click');

    expect(wrapper.emitted('secretEpilogue')).toHaveLength(1);
    expect(openSecret).toHaveBeenCalledOnce();
  });

  it('shows the closing title only when the legacy snapshot marks it earned', async () => {
    const wrapper = mount(JournalPanel, { props: { snapshot } });
    await wrapper.get('#journal-chapter').setValue('collection');
    expect(wrapper.get('#journal-entries').text()).not.toContain('稱號');

    await wrapper.setProps({ snapshot: { ...snapshot, closingTitle: '帳冊守護者' } });
    expect(wrapper.get('#journal-entries').text()).toContain('帳冊守護者');
  });

  it('renders game text as escaped text instead of HTML', () => {
    const unsafe = {
      ...snapshot,
      chapters: [{
        ...snapshot.chapters[0]!,
        entries: [{ id: 'unsafe', label: '<img src=x>', text: '<script>bad()</script>' }],
      }],
    };
    const wrapper = mount(JournalPanel, { props: { snapshot: unsafe } });

    expect(wrapper.find('img[src="x"]').exists()).toBe(false);
    expect(wrapper.find('script').exists()).toBe(false);
    expect(wrapper.get('.journal-entry').text()).toContain('<script>bad()</script>');
  });
});
