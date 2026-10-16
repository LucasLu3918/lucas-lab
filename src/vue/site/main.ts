import { createApp, type ComponentPublicInstance } from 'vue';
import '../shared/tokens.css';
import '../shared/base.css';
import SiteApp from './SiteApp.vue';
import { parseSearchItems } from './features/search/search';

export function mountSiteIsland(target: Element): ComponentPublicInstance {
  const island = target.getAttribute('data-vue-site-island');
  const searchItems = island === 'search'
    ? parseSearchItems(target.getAttribute('data-search-items') ?? '[]', window.location.href)
    : [];
  return createApp(SiteApp, {
    island,
    searchItems,
    searchIndexSrc: target.getAttribute('data-search-index-src') ?? '',
    initialSearchQuery: target.getAttribute('data-search-initial-query') ?? undefined,
    initialSearchCategory: target.getAttribute('data-search-initial-category') ?? 'all',
  }).mount(target);
}

document.querySelectorAll('[data-vue-site-island]').forEach(mountSiteIsland);
