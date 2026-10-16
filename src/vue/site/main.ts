import { createApp, type ComponentPublicInstance } from 'vue';
import '../shared/tokens.css';
import '../shared/base.css';
import SiteApp from './SiteApp.vue';

export function mountSiteIsland(target: Element): ComponentPublicInstance {
  return createApp(SiteApp).mount(target);
}

document.querySelectorAll('[data-vue-site-island]').forEach(mountSiteIsland);
