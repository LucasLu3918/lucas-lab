import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SiteApp from './SiteApp.vue';
import GameApp from '../game/GameApp.vue';
import type { SearchItem } from './features/search/search';

describe('Vue scaffold roots', () => {
  it('mounts the site island root', () => {
    const wrapper = mount(SiteApp);

    expect(wrapper.get('[data-vue-scaffold="site"]').text()).toContain('LUCAS LAB');
    wrapper.unmount();
  });

  it('mounts the independent game app root', () => {
    const wrapper = mount(GameApp);

    expect(wrapper.get('[data-vue-scaffold="game"]').text()).toContain('game app');
    wrapper.unmount();
  });

  it('composes the search feature when the search island is selected', () => {
    const items: SearchItem[] = [{
      id: 'story:sample',
      kind: 'story',
      title: '示範故事',
      description: 'Vue 搜尋根元件測試',
      category: '原創示範',
      searchText: '示範故事 Vue 搜尋根元件測試 原創示範',
      href: '/stories/sample/',
      external: false,
      status: 'demo',
      statusLabel: '原創示範',
      trait: '',
      symbol: '✉',
      palette: 'teal',
      image: null,
    }];
    const wrapper = mount(SiteApp, {
      props: { island: 'search', searchItems: items, searchIndexSrc: '/search-index.json' },
    });

    expect(wrapper.get('.vue-search').text()).toContain('示範故事');
    wrapper.unmount();
  });
});
