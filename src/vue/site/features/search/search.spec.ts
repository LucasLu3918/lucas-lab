import { describe, expect, it } from 'vitest';
import { normalizeSearchTerm, parseChapterSearchIndex, parseSearchItems, searchChapterIndex } from './search';

describe('search data helpers', () => {
  it('normalizes compatibility width, case and whitespace', () => {
    expect(normalizeSearchTerm(' Ｖｕｅ　白雪 公主 ')).toBe('vue白雪公主');
  });

  it('accepts only same-origin catalog links and HTTPS tool links', () => {
    const base = { id: 'item', title: '作品', description: '說明', category: '故事', searchText: '作品 說明 故事', status: 'complete', statusLabel: '完整作品', trait: '', symbol: '✦', palette: 'blue', image: null };
    const items = [
      { ...base, kind: 'story', href: '/stories/work/' , external: false },
      { ...base, id: 'external-story', kind: 'story', href: 'https://outside.example/story/', external: false },
      { ...base, id: 'tool', kind: 'tool', href: 'https://tools.example/', external: true },
      { ...base, id: 'unsafe-tool', kind: 'tool', href: 'javascript:alert(1)', external: true },
    ];

    expect(parseSearchItems(JSON.stringify(items), 'https://lucas-lab.example/search/').map(item => item.id)).toEqual(['item', 'tool']);
    expect(parseSearchItems('{broken', 'https://lucas-lab.example/search/')).toEqual([]);
  });

  it('parses only chapter entries with text fields and returns at most 30 same-origin matches', () => {
    const source: unknown[] = Array.from({ length: 35 }, (_, index) => ({ t: `序章 ${index}`, s: '白雪', u: `/stories/snow/chapters/${index}/`, x: '銀鏡' }));
    source.push({ t: '序章 outside', s: '白雪', u: 'https://outside.example/chapter', x: '銀鏡' });
    source.push({ t: 'invalid', s: null, u: '/stories/snow/', x: '銀鏡' });

    const matches = searchChapterIndex(parseChapterSearchIndex(source), '序章', 'https://lucas-lab.example/search/');
    expect(matches).toHaveLength(30);
    expect(matches[0].u).toMatch(/^\/stories\//);
  });
});
