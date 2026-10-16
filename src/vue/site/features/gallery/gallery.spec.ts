import { describe, expect, it } from 'vitest';
import { readGalleryGroup, useGalleryPreview } from './useGalleryPreview';

function tile(group: string, title: string, src: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.dataset.group = group;
  button.dataset.title = title;
  button.dataset.fullSrc = src;
  button.dataset.fullW = '1600';
  button.dataset.fullH = '1000';
  button.innerHTML = '<img src="thumb.webp" alt="thumbnail">';
  return button;
}

describe('Gallery preview', () => {
  it('reads only valid tiles from the active gallery group', () => {
    const first = tile('scenes', 'First scene', '/first.webp');
    const second = tile('scenes', 'Second scene', '/second.webp');
    const otherGroup = tile('portraits', 'Portrait', '/portrait.webp');
    const invalid = tile('scenes', '', '/invalid.webp');

    const items = readGalleryGroup(first, [first, second, otherGroup, invalid]);

    expect(items.map(item => item.title)).toEqual(['First scene', 'Second scene']);
    expect(items[0].thumbnailSrc).toContain('thumb.webp');
    expect(items[0].width).toBe(1600);
  });

  it('opens at the selected tile, wraps in both directions and retains the active tile on close', () => {
    const first = tile('covers', 'First cover', '/first.webp');
    const second = tile('covers', 'Second cover', '/second.webp');
    const items = readGalleryGroup(first, [first, second]);
    const preview = useGalleryPreview();

    preview.open(items, 1);
    expect(preview.current.value?.title).toBe('Second cover');
    expect(preview.count.value).toBe('2 / 2');

    preview.step(1);
    expect(preview.current.value?.title).toBe('First cover');
    preview.step(-1);
    expect(preview.current.value?.title).toBe('Second cover');

    preview.close();
    expect(preview.isOpen.value).toBe(false);
    expect(preview.current.value?.trigger).toBe(second);
  });
});
