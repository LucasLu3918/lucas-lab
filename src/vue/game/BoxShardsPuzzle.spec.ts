import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import BoxShardsPuzzle from './BoxShardsPuzzle.vue';
import {
  parseBoxShardsSnapshot,
  type BoxShardsAction,
  type BoxShardsSnapshot,
} from './box-shards';

const library = { id: 'shard-library', act: 1, title: '黑鐘書庫' } as const;
const ballroom = { id: 'shard-ballroom', act: 2, title: '血色舞會' } as const;
const crypt = { id: 'shard-crypt', act: 5, title: '玻璃棺室' } as const;

const empty: BoxShardsSnapshot = { shards: [], placed: [], selected: null, finished: false };

describe('BoxShardsPuzzle', () => {
  it('renders seven act slots, collected shards and labelled gaps for missing shards', () => {
    const snapshot: BoxShardsSnapshot = {
      shards: [library, crypt],
      placed: [],
      selected: null,
      finished: false,
    };
    const wrapper = mount(BoxShardsPuzzle, { props: { snapshot, onAction: () => snapshot } });

    expect(wrapper.findAll('.box-slot')).toHaveLength(7);
    expect(wrapper.findAll('.box-shard').map(shard => shard.text())).toEqual(['◆黑鐘書庫', '◆玻璃棺室']);
    expect(wrapper.text()).toContain('妳收集了 2 / 7 片');
    expect(wrapper.get('[aria-label="第一幕的位置"]')).toBeTruthy();
    expect(wrapper.get('[aria-label="第二幕的位置（沒有收集到，來自血色舞會）"]')).toBeTruthy();
    expect(wrapper.get('[aria-label="第五幕的位置"]')).toBeTruthy();
    expect(wrapper.text()).toContain('缺：血色舞會');
  });

  it('sends selection and placement actions and renders the legacy snapshot response', async () => {
    const placed: BoxShardsSnapshot = {
      shards: [library, ballroom],
      placed: ['shard-library'],
      selected: null,
      finished: false,
    };
    const start: BoxShardsSnapshot = { ...placed, placed: [], selected: null };
    const onAction = vi.fn((action: BoxShardsAction) => {
      if (action.type === 'select-shard') return { ...start, selected: action.id };
      if (action.type === 'place-shard' && action.slotId === 'shard-library') return placed;
      return { ...placed, selected: 'shard-ballroom' as const };
    });
    const wrapper = mount(BoxShardsPuzzle, {
      props: { snapshot: start, onAction },
    });

    await wrapper.get('[aria-label="碎片：黑鐘書庫"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'select-shard', id: 'shard-library' });
    expect(wrapper.get('[aria-label="碎片：黑鐘書庫"]').attributes('aria-pressed')).toBe('true');

    await wrapper.get('[aria-label="第一幕的位置"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'place-shard', slotId: 'shard-library' });
    expect(wrapper.get('[aria-label="第一幕的位置（已嵌入）"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[aria-label="碎片：血色舞會"]').attributes('aria-pressed')).toBe('false');
  });

  it('offers the empty-face action only when no shards were collected', async () => {
    const complete: BoxShardsSnapshot = { ...empty, finished: true };
    const onAction = vi.fn(() => complete);
    const wrapper = mount(BoxShardsPuzzle, { props: { snapshot: empty, onAction } });

    expect(wrapper.findAll('.box-shard')).toHaveLength(0);
    expect(wrapper.findAll('.box-slot')).toHaveLength(7);
    await wrapper.get('button.primary-button').trigger('click');
    expect(onAction).toHaveBeenCalledWith({ type: 'skip-empty' });
    expect(wrapper.get('button.primary-button').attributes('disabled')).toBeDefined();

    const partial = mount(BoxShardsPuzzle, {
      props: { snapshot: { shards: [library], placed: [], selected: null, finished: false }, onAction: () => empty },
    });
    expect(partial.findAll('button.primary-button')).toHaveLength(0);
  });

  it('rejects malformed, duplicated, uncollected and inconsistent shard state', () => {
    expect(parseBoxShardsSnapshot(empty)).toEqual(empty);
    expect(parseBoxShardsSnapshot({ ...empty, shards: [library, library] })).toBeNull();
    expect(parseBoxShardsSnapshot({ ...empty, placed: ['shard-library'] })).toBeNull();
    expect(parseBoxShardsSnapshot({ ...empty, selected: 'shard-library' })).toBeNull();
    expect(parseBoxShardsSnapshot({ ...empty, shards: [{ ...library, act: 2 }] })).toBeNull();
    expect(parseBoxShardsSnapshot({ ...empty, shards: [library], finished: true })).toBeNull();
  });
});
