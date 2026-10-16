import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SiteApp from './SiteApp.vue';
import GameApp from '../game/GameApp.vue';

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
});
