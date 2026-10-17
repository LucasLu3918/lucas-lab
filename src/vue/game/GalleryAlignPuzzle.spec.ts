import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import GalleryAlignPuzzle from './GalleryAlignPuzzle.vue';
import {
  parseGalleryAlignSnapshot,
  type GalleryAlignAction,
  type GalleryAlignSnapshot,
  type GalleryPanelId,
} from './gallery-align';

const anchorIds: Record<GalleryPanelId, string[]> = {
  A: ['moonL', 'moonR', 'door', 'doorMoon'],
  B: ['moon'],
  C: ['lantern'],
  D: ['chandelier', 'doorLamp', 'door', 'windowL', 'windowR'],
};
const names = ['鏡廊', '陽台', '黑松林', '舞廳'];
const art = ['mirror-hall', 'balcony', 'black-pine-path', 'ballroom'];

const snapshot: GalleryAlignSnapshot = {
  scale: 0.8,
  zoomPanel: null,
  markers: true,
  panels: (['A', 'B', 'C', 'D'] as GalleryPanelId[]).map((id, index) => ({
    id,
    name: names[index],
    art: art[index],
    left: [16, 376, 16, 376][index],
    top: [16, 16, 224, 224][index],
    width: 352,
    height: 200,
    borderWidth: 6,
    layerWidth: 340,
    layerHeight: 188,
    zIndex: 1,
    tray: false,
    zoomed: false,
    flipped: false,
    dragging: false,
    ariaLabel: `畫格：${names[index]}。拖曳疊到另一格；方向鍵移動；Enter 放大或縮小；F 翻面`,
    anchors: anchorIds[id].map(anchorId => ({
      id: anchorId,
      label: anchorId,
      left: 30,
      top: 30,
      diameter: 24,
      linked: false,
      notchSide: anchorId === 'door' ? (id === 'A' ? 'R' : 'L') : null,
      notchLeft: anchorId === 'door' ? 55 : null,
      notchTop: anchorId === 'door' ? 32 : null,
      notchWidth: anchorId === 'door' ? 30 : null,
      notchHeight: anchorId === 'door' ? 20 : null,
    })),
    maskAnchor: null,
  })),
  threads: [],
  live: null,
  caption: '把陽台月亮疊到鏡廊的月亮。',
  status: '兩條紅線都還沒接上。',
  tone: '',
  feedback: '',
  finished: false,
};

describe('GalleryAlignPuzzle', () => {
  it('renders the four accessible panels, alignment tools and no-drag placement path', () => {
    const wrapper = mount(GalleryAlignPuzzle, { props: { snapshot, onAction: () => snapshot } });

    expect(wrapper.findAll('[data-gal-panel]')).toHaveLength(4);
    expect(wrapper.get('[data-gal-panel="A"]').attributes('role')).toBe('button');
    expect(wrapper.get('[data-gal-panel="A"]').attributes('aria-label')).toContain('鏡廊');
    expect(wrapper.get('[aria-label="放大陽台"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('.gal-place summary').text()).toContain('不用拖曳');
    expect(wrapper.findAll('.gal-place select option')).toHaveLength(22);
    expect(wrapper.get('#bf-status').text()).toBe(snapshot.status);
  });

  it('sends keyboard, flip, zoom and accessible placement actions to legacy', async () => {
    const updated: GalleryAlignSnapshot = {
      ...snapshot,
      zoomPanel: 'B',
      panels: snapshot.panels.map(panel => panel.id === 'B' ? { ...panel, zoomed: true } : panel),
    };
    const onAction = vi.fn((action: GalleryAlignAction) => action.type === 'toggle-zoom' ? updated : snapshot);
    const wrapper = mount(GalleryAlignPuzzle, { props: { snapshot, onAction } });

    await wrapper.get('[data-gal-panel="B"]').trigger('keydown', { key: 'ArrowRight', shiftKey: true });
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'keyboard-move', panel: 'B', dx: 3, dy: 0 });

    await wrapper.get('[aria-label="翻面鏡廊"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'flip', panel: 'A' });

    await wrapper.get('[aria-label="放大陽台"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(3, { type: 'toggle-zoom', panel: 'B' });
    expect(wrapper.get('[aria-label="放大陽台"]').attributes('aria-pressed')).toBe('true');

    await wrapper.get('.gal-place button').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(4, { type: 'place', from: 'B.moon', to: 'A.moonL' });
  });

  it('disables panel keyboard focus after completion and displays status feedback', () => {
    const finished = { ...snapshot, finished: true, tone: 'ok' as const, status: '兩條紅線接上了。', feedback: '完成' };
    const wrapper = mount(GalleryAlignPuzzle, { props: { snapshot: finished, onAction: () => finished } });
    expect(wrapper.get('[data-gal-panel="A"]').attributes('tabindex')).toBe('-1');
    expect(wrapper.get('#bf-status').attributes('data-tone')).toBe('ok');
    expect(wrapper.get('#gal-feedback').text()).toBe('完成');
  });
});

describe('parseGalleryAlignSnapshot', () => {
  it('copies the bounded scene snapshot', () => {
    const parsed = parseGalleryAlignSnapshot(snapshot);
    expect(parsed).toEqual(snapshot);
    expect(parsed).not.toBe(snapshot);
    expect(parsed?.panels).not.toBe(snapshot.panels);
  });

  it.each([
    { ...snapshot, scale: 0 },
    { ...snapshot, zoomPanel: 'E' },
    { ...snapshot, panels: snapshot.panels.slice(1) },
    { ...snapshot, panels: snapshot.panels.map((panel, index) => index ? panel : { ...panel, art: '../x' }) },
    { ...snapshot, panels: snapshot.panels.map((panel, index) => index ? panel : { ...panel, anchors: [] }) },
    { ...snapshot, threads: [{ kind: 2, x1: 1, y1: 1, x2: 2, y2: 2 }] },
    { ...snapshot, live: { panel: 'A', x1: 0, y1: 0, x2: 800, y2: 2, ok: false } },
    { ...snapshot, status: 'x'.repeat(241) },
    null,
  ])('rejects malformed snapshots', value => {
    expect(parseGalleryAlignSnapshot(value)).toBeNull();
  });
});
