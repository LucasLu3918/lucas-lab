import { computed, shallowRef } from 'vue';

export interface GalleryPreview {
  group: string;
  src: string;
  thumbnailSrc: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  description: string;
  href: string;
  hrefLabel: string;
  trigger: HTMLButtonElement;
}

function positiveDimension(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readGalleryTile(button: HTMLButtonElement): GalleryPreview | null {
  const { group = '', fullSrc = '', title = '' } = button.dataset;
  if (!group || !fullSrc || !title) return null;
  const thumbnail = button.querySelector('img');
  return {
    group,
    src: fullSrc,
    thumbnailSrc: thumbnail?.currentSrc || thumbnail?.getAttribute('src') || '',
    width: positiveDimension(button.dataset.fullW, 900),
    height: positiveDimension(button.dataset.fullH, 1350),
    alt: button.dataset.fullAlt || title,
    title,
    description: button.dataset.description || '',
    href: button.dataset.href || '',
    hrefLabel: button.dataset.hrefLabel || '',
    trigger: button,
  };
}

export function readGalleryGroup(trigger: HTMLButtonElement, candidates: Iterable<Element>): GalleryPreview[] {
  const group = trigger.dataset.group;
  if (!group) return [];
  return Array.from(candidates)
    .filter((candidate): candidate is HTMLButtonElement => candidate instanceof HTMLButtonElement && candidate.dataset.group === group)
    .map(readGalleryTile)
    .filter((item): item is GalleryPreview => item !== null);
}

export function useGalleryPreview() {
  const items = shallowRef<GalleryPreview[]>([]);
  const position = shallowRef(0);
  const isOpen = shallowRef(false);
  const current = computed(() => items.value[position.value] ?? null);
  const isSingle = computed(() => items.value.length < 2);
  const count = computed(() => isSingle.value ? '' : `${position.value + 1} / ${items.value.length}`);

  function open(nextItems: GalleryPreview[], initialPosition: number): void {
    if (!nextItems.length) return;
    items.value = nextItems;
    position.value = Math.max(0, Math.min(initialPosition, nextItems.length - 1));
    isOpen.value = true;
  }

  function step(direction: -1 | 1): void {
    if (items.value.length < 2) return;
    position.value = (position.value + direction + items.value.length) % items.value.length;
  }

  function close(): void {
    isOpen.value = false;
  }

  return { items, position, current, isOpen, isSingle, count, open, step, close };
}
