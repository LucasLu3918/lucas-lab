import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
  normalizeSearchTerm,
  parseChapterSearchIndex,
  searchChapterIndex,
  type ChapterSearchItem,
  type SearchItem,
  type SearchKind,
} from './search';

const GROUPS: Array<{ kind: SearchKind; label: string; gridClass: string }> = [
  { kind: 'story', label: '故事', gridClass: 'cards bookgrid' },
  { kind: 'game', label: '互動遊戲', gridClass: 'cards' },
  { kind: 'project', label: '軟體作品', gridClass: 'cards' },
  { kind: 'tool', label: '工具', gridClass: 'cards' },
];

export interface SearchGroup {
  kind: SearchKind;
  label: string;
  gridClass: string;
  items: SearchItem[];
}

const INITIAL_CHAPTER_STATUS = '依章節標題、所屬作品與開頭摘要搜尋。';

function initialQuery(search: string): string {
  const params = new URLSearchParams(search);
  return params.has('q') ? (params.get('q') ?? '').slice(0, 80) : '';
}

export function useSiteSearch(items: SearchItem[], indexSrc: string, initialQueryValue?: string, initialCategoryValue = 'all') {
  const query = ref(initialQueryValue === undefined ? initialQuery(window.location.search) : initialQueryValue.slice(0, 80));
  const categories = computed(() => [...new Set(items.map(item => item.category))]);
  const activeCategory = ref(initialCategoryValue === 'all' || categories.value.includes(initialCategoryValue) ? initialCategoryValue : 'all');
  const normalizedQuery = computed(() => normalizeSearchTerm(query.value));
  const groups = computed<SearchGroup[]>(() => GROUPS.map(group => ({
    ...group,
    items: items.filter(item => item.kind === group.kind
      && (activeCategory.value === 'all' || item.category === activeCategory.value)
      && normalizeSearchTerm(item.searchText).includes(normalizedQuery.value)),
  })).filter(group => group.items.length > 0));
  const resultCount = computed(() => groups.value.reduce((count, group) => count + group.items.length, 0));
  const chapterResults = ref<ChapterSearchItem[]>([]);
  const chapterStatus = ref(INITIAL_CHAPTER_STATUS);
  const chapterSearchVisible = computed(() => normalizedQuery.value.length >= 2);
  let indexRequest: Promise<ChapterSearchItem[]> | undefined;
  let timer: ReturnType<typeof window.setTimeout> | undefined;
  let requestVersion = 0;

  const loadIndex = () => {
    if (!indexRequest) {
      indexRequest = fetch(indexSrc, { credentials: 'same-origin' }).then(async response => {
        if (!response.ok) throw new Error(`Chapter index request failed: ${response.status}`);
        return parseChapterSearchIndex(await response.json());
      }).catch(error => {
        indexRequest = undefined;
        throw error;
      });
    }
    return indexRequest;
  };

  watch(normalizedQuery, value => {
    if (timer !== undefined) window.clearTimeout(timer);
    const version = ++requestVersion;
    chapterResults.value = [];
    if (value.length < 2) {
      chapterStatus.value = INITIAL_CHAPTER_STATUS;
      return;
    }
    timer = window.setTimeout(async () => {
      chapterStatus.value = '正在搜尋章節…';
      try {
        const index = await loadIndex();
        if (version !== requestVersion) return;
        chapterResults.value = searchChapterIndex(index, value, window.location.href);
        const count = chapterResults.value.length;
        chapterStatus.value = count
          ? `找到 ${count} 個章節${count === 30 ? '（僅顯示前 30 筆）' : ''}`
          : '沒有符合的章節，請換個關鍵字。';
      } catch {
        if (version === requestVersion) chapterStatus.value = '章節索引暫時無法載入，請稍後再試。';
      }
    }, 200);
  }, { immediate: true });

  onBeforeUnmount(() => {
    if (timer !== undefined) window.clearTimeout(timer);
    requestVersion++;
  });

  return { query, activeCategory, categories, groups, resultCount, chapterResults, chapterStatus, chapterSearchVisible };
}
