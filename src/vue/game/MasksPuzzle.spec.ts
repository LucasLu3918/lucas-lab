import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MasksPuzzle from './MasksPuzzle.vue';
import { parseMasksSnapshot, type MasksAction, type MasksSnapshot } from './masks';

const snapshot: MasksSnapshot = {
  maskNames: ['銀狐', '黑天鵝', '白鹿', '紅玫瑰', '烏鴉', '金蝶'],
  guests: ['公爵夫人', '伊萊', '奧瑞恩王子', '薇菈王后', '外國使節', '宮廷總管'],
  guestOrder: [3, 0, 5, 2, 4, 1],
  clues: ['第一則證詞', '第二則證詞', '第三則證詞', '第四則證詞', '第五則證詞'],
  picks: [-1, -1, -1, -1, -1, -1],
  message: '',
};

describe('MasksPuzzle', () => {
  it('renders six accessible native selectors in the legacy guest order', () => {
    const wrapper = mount(MasksPuzzle, {
      props: { snapshot, onAction: (action: MasksAction) => snapshot },
    });

    expect(wrapper.findAll('[data-mask]')).toHaveLength(6);
    expect(wrapper.get('[data-mask="0"]').attributes('aria-label')).toBe('從左數第1張面具「銀狐」是誰');
    expect(wrapper.get('[data-mask="0"]').findAll('option').map(option => option.text())).toEqual([
      '未選擇', '薇菈王后', '公爵夫人', '宮廷總管', '奧瑞恩王子', '外國使節', '伊萊',
    ]);
    expect(wrapper.findAll('.mask-clues li').map(clue => clue.text())).toEqual(snapshot.clues);
  });

  it('returns select, confirm and reset actions to the legacy controller', async () => {
    const onAction = vi.fn((action: MasksAction) => ({
      ...snapshot,
      picks: action.type === 'select' ? [action.guest, ...snapshot.picks.slice(1)] : snapshot.picks,
      message: action.type === 'confirm' ? '還有面具沒有選人。' : '',
    }));
    const wrapper = mount(MasksPuzzle, { props: { snapshot, onAction } });

    await wrapper.get('[data-mask="0"]').setValue('1');
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'select', index: 0, guest: 1 });
    expect((wrapper.get('[data-mask="0"]').element as HTMLSelectElement).value).toBe('1');

    await wrapper.get('#masks-confirm').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'confirm' });
    expect(wrapper.get('[role="status"]').text()).toBe('還有面具沒有選人。');

    await wrapper.get('#masks-reset').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(3, { type: 'reset' });
  });
});

describe('parseMasksSnapshot', () => {
  it('copies complete, valid snapshots', () => {
    const parsed = parseMasksSnapshot(snapshot);
    expect(parsed).toEqual(snapshot);
    expect(parsed).not.toBe(snapshot);
    expect(parsed?.picks).not.toBe(snapshot.picks);
  });

  it.each([
    { ...snapshot, maskNames: ['only one'] },
    { ...snapshot, guestOrder: [0, 0, 1, 2, 3, 4] },
    { ...snapshot, clues: ['not enough clues'] },
    { ...snapshot, picks: [-1, -1, -1, -1, -1, 6] },
    { ...snapshot, message: null },
    null,
  ])('rejects malformed values', value => {
    expect(parseMasksSnapshot(value)).toBeNull();
  });
});
