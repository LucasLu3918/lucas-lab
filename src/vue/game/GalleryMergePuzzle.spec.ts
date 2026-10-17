import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import GalleryMergePuzzle from './GalleryMergePuzzle.vue';
import {
  parseGalleryMergeSnapshot,
  type GalleryMergeAction,
  type GalleryMergeSnapshot,
} from './gallery-merge';

const snapshot: GalleryMergeSnapshot = {
  mode: 'play',
  panels: [
    { id: 'A', name: '鏡廊', art: 'mirror-hall', flipped: false, door: { x: 51, y: 55, side: 'R' } },
    { id: 'B', name: '陽台', art: 'balcony', flipped: false, door: null },
    { id: 'C', name: '黑松林', art: 'black-pine-path', flipped: false, door: null },
    { id: 'D', name: '舞廳', art: 'ballroom', flipped: false, door: { x: 51, y: 48, side: 'L' } },
  ],
  threads: [
    { kind: 0, ends: ['陽台：陽台上的月亮', '鏡廊：左邊鏡子裡的月亮'] },
    { kind: 1, ends: ['黑松林：樹上的提燈', '舞廳：大吊燈'] },
  ],
  order: [],
  status: '還差一條紅線。',
  tone: '',
  feedback: '',
  finished: false,
};

describe('GalleryMergePuzzle', () => {
  it('renders the four panels, current thread clues and accessible door controls', () => {
    const wrapper = mount(GalleryMergePuzzle, { props: { snapshot, onAction: () => snapshot } });

    expect(wrapper.findAll('[data-gal-merge-panel]')).toHaveLength(4);
    expect(wrapper.get('[aria-label="翻面鏡廊"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('[aria-label="翻面舞廳"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('.gal-threads').text()).toContain('月亮');
    expect(wrapper.get('#bf-status').text()).toBe(snapshot.status);
  });

  it('dispatches flipping and door placement, then renders the legacy returned order state', async () => {
    const orderSnapshot: GalleryMergeSnapshot = {
      ...snapshot,
      mode: 'order',
      panels: snapshot.panels.map(panel => panel.id === 'A' ? { ...panel, flipped: true, door: { x: 49, y: 55, side: 'L' } } : panel),
      threads: [...snapshot.threads, { kind: 2, ends: ['鏡廊：盡頭的門', '舞廳：大門'] }],
      status: '三條紅線都接上了。',
      tone: 'ok',
    };
    const onAction = vi.fn((action: GalleryMergeAction) => action.type === 'place-doors' ? orderSnapshot : snapshot);
    const wrapper = mount(GalleryMergePuzzle, { props: { snapshot, onAction } });

    await wrapper.get('[aria-label="翻面鏡廊"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'flip', panel: 'A' });

    await wrapper.get('.gal-merge-place').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'place-doors' });
    expect(wrapper.findAll('.gal-slot')).toHaveLength(4);
    expect(wrapper.get('[data-order-slot="0"]').text()).toContain('第 1 格');
  });

  it('dispatches panel selection and slot removal in the ordering phase', async () => {
    const ordering: GalleryMergeSnapshot = {
      ...snapshot,
      mode: 'order',
      threads: [...snapshot.threads, { kind: 2, ends: ['鏡廊：盡頭的門', '舞廳：大門'] }],
      status: '三條紅線都接上了。',
      tone: 'ok',
    };
    const withPanel = { ...ordering, order: ['B'] as GalleryMergeSnapshot['order'] };
    const onAction = vi.fn((action: GalleryMergeAction) => {
      if (action.type === 'choose-panel') return withPanel;
      if (action.type === 'remove-from') return ordering;
      return ordering;
    });
    const wrapper = mount(GalleryMergePuzzle, { props: { snapshot: ordering, onAction } });

    await wrapper.get('[aria-label="陽台"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(1, { type: 'choose-panel', panel: 'B' });
    expect(wrapper.get('[data-order-slot="0"]').text()).toContain('陽台');

    await wrapper.get('[data-order-slot="0"]').trigger('click');
    expect(onAction).toHaveBeenNthCalledWith(2, { type: 'remove-from', index: 0 });
    expect(wrapper.get('[data-order-slot="0"]').text()).toContain('第 1 格');
  });

  it('shows the legacy completion state with its red line and ordered panel names', () => {
    const complete: GalleryMergeSnapshot = {
      ...snapshot,
      mode: 'complete',
      threads: [...snapshot.threads, { kind: 2, ends: ['鏡廊：盡頭的門', '舞廳：大門'] }],
      order: ['B', 'A', 'D', 'C'],
      status: '紅線連成一條直線：妳把這截紅線收進手心。',
      tone: 'ok',
      finished: true,
    };
    const wrapper = mount(GalleryMergePuzzle, { props: { snapshot: complete, onAction: () => complete } });

    expect(wrapper.get('[role="img"]').attributes('aria-label')).toContain('一條直線');
    expect(wrapper.get('#bf-status').text()).toContain('紅線連成一條直線');
    expect(wrapper.text()).toContain('陽台');
  });
});

describe('parseGalleryMergeSnapshot', () => {
  it('copies the bounded transient snapshot', () => {
    const parsed = parseGalleryMergeSnapshot(snapshot);
    expect(parsed).toEqual(snapshot);
    expect(parsed).not.toBe(snapshot);
    expect(parsed?.panels).not.toBe(snapshot.panels);
  });

  it.each([
    { ...snapshot, mode: 'other' },
    { ...snapshot, panels: snapshot.panels.slice(1) },
    { ...snapshot, panels: snapshot.panels.map((panel, index) => index ? panel : { ...panel, art: '../outside' }) },
    { ...snapshot, panels: snapshot.panels.map((panel, index) => index ? panel : { ...panel, door: { ...panel.door, side: 'X' } }) },
    { ...snapshot, threads: [{ kind: 3, ends: ['A', 'B'] }] },
    { ...snapshot, order: ['A', 'A'] },
    { ...snapshot, feedback: 'x'.repeat(181) },
    { ...snapshot, mode: 'complete', finished: false },
    null,
  ])('rejects malformed snapshots', value => {
    expect(parseGalleryMergeSnapshot(value)).toBeNull();
  });
});
