import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { useSiteSearch } from './useSiteSearch';
import type { SearchItem } from './search';

const items: SearchItem[] = [
  { id: 'story:snow', kind: 'story', title: '白雪公主：血色魔鏡', description: '完整黑暗奇幻長篇', category: '黑暗童話', searchText: '白雪公主：血色魔鏡 完整黑暗奇幻長篇 黑暗童話', href: '/stories/snow/', external: false, status: 'complete', statusLabel: '完整作品', trait: '', symbol: '♛', palette: 'rose', image: null },
  { id: 'game:mirror', kind: 'game', title: '血色魔鏡', description: '可遊玩的解謎遊戲', category: '互動遊戲', searchText: '血色魔鏡 可遊玩的解謎遊戲 互動遊戲', href: '/games/mirror/', external: false, status: 'playable', statusLabel: '可遊玩', trait: '', symbol: '✦', palette: 'red', image: null },
];

function mountSearch() {
  let search!: ReturnType<typeof useSiteSearch>;
  const app = mount(defineComponent({
    setup() {
      search = useSiteSearch(items, '/search-index.json');
      return () => h('div');
    },
  }));
  return { app, search };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  window.history.replaceState({}, '', '/');
});

describe('useSiteSearch', () => {
  it('prefills a bounded query and derives categories and matches', () => {
    window.history.replaceState({}, '', '/search/?q=%E7%99%BD%E9%9B%AA');
    const { app, search } = mountSearch();

    expect(search.query.value).toBe('白雪');
    expect(search.categories.value).toEqual(['黑暗童話', '互動遊戲']);
    expect(search.resultCount.value).toBe(1);
    expect(search.groups.value[0].items[0].id).toBe('story:snow');
    expect(window.location.search).toBe('?q=%E7%99%BD%E9%9B%AA');
    app.unmount();
  });

  it('loads chapter results for an initial query when the lazy island mounts', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ t: '第二章', s: '白雪公主', u: '/stories/snow/chapters/02/', x: '鏡子' }],
    });
    vi.stubGlobal('fetch', fetch);
    let search!: ReturnType<typeof useSiteSearch>;
    const app = mount(defineComponent({
      setup() {
        search = useSiteSearch(items, '/search-index.json', '第二章');
        return () => h('div');
      },
    }));

    await vi.advanceTimersByTimeAsync(200);
    await flushPromises();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(search.chapterResults.value).toHaveLength(1);
    expect(search.chapterStatus.value).toContain('找到 1 個章節');
    app.unmount();
  });

  it('loads the chapter index only after a two-character query and retries a failed request', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, json: async () => [{ t: '第二章', s: '白雪', u: '/stories/snow/chapters/02/', x: '鏡子' }] });
    vi.stubGlobal('fetch', fetch);
    const { app, search } = mountSearch();

    search.query.value = '序章';
    expect(search.chapterSearchVisible.value).toBe(true);
    await vi.advanceTimersByTimeAsync(199);
    expect(fetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(search.chapterStatus.value).toContain('暫時無法載入');

    search.query.value = '第二章';
    await vi.advanceTimersByTimeAsync(200);
    await flushPromises();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(search.chapterResults.value).toHaveLength(1);
    expect(search.chapterStatus.value).toContain('找到 1 個章節');
    app.unmount();
  });
});
