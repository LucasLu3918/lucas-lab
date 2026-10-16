export type SearchKind = 'story' | 'game' | 'project' | 'tool';

export interface SearchImage {
  type: 'cover' | 'shot';
  src: string;
  small: string | null;
  alt: string;
  title?: string;
  subtitle?: string;
  series?: string;
}

export interface SearchItem {
  id: string;
  kind: SearchKind;
  title: string;
  description: string;
  category: string;
  searchText: string;
  href: string;
  external: boolean;
  status: string;
  statusLabel: string;
  trait: string;
  symbol: string;
  palette: string;
  image: SearchImage | null;
}

export interface ChapterSearchItem {
  t: string;
  s: string;
  u: string;
  x: string;
}

const SEARCH_KINDS = new Set<SearchKind>(['story', 'game', 'project', 'tool']);

export function normalizeSearchTerm(value: string): string {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, '');
}

function isText(value: unknown): value is string {
  return typeof value === 'string';
}

function isSearchItem(value: unknown, pageUrl: URL): value is SearchItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SearchItem>;
  if (!item.kind || !SEARCH_KINDS.has(item.kind) || !isText(item.href)) return false;
  if (![item.id, item.title, item.description, item.category, item.searchText, item.status, item.statusLabel, item.trait, item.symbol, item.palette].every(isText)) return false;
  if (typeof item.external !== 'boolean') return false;
  try {
    const url = new URL(item.href, pageUrl);
    if (item.kind === 'tool') return item.external && url.protocol === 'https:';
    return !item.external && url.origin === pageUrl.origin;
  } catch {
    return false;
  }
}

export function parseSearchItems(source: string, pageUrl: string): SearchItem[] {
  try {
    const parsed: unknown = JSON.parse(source);
    if (!Array.isArray(parsed)) return [];
    const base = new URL(pageUrl);
    return parsed.filter((item): item is SearchItem => isSearchItem(item, base));
  } catch {
    return [];
  }
}

function isChapterSearchItem(value: unknown): value is ChapterSearchItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ChapterSearchItem>;
  return [item.t, item.s, item.u, item.x].every(isText);
}

export function parseChapterSearchIndex(value: unknown): ChapterSearchItem[] {
  return Array.isArray(value) ? value.filter(isChapterSearchItem) : [];
}

export function searchChapterIndex(items: ChapterSearchItem[], query: string, pageUrl: string): ChapterSearchItem[] {
  const base = new URL(pageUrl);
  const needle = normalizeSearchTerm(query);
  return items.filter(item => {
    try {
      return new URL(item.u, base).origin === base.origin
        && normalizeSearchTerm(`${item.t} ${item.s} ${item.x}`).includes(needle);
    } catch {
      return false;
    }
  }).slice(0, 30);
}
