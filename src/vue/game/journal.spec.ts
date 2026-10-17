import { describe, expect, it } from 'vitest';
import { parseJournalSnapshot } from './journal';

const payload = {
  initialSelection: '0',
  chapters: [{ index: 0, chapter: '序章', title: '黑鐘書庫', entries: [{ id: 'birth', label: '出生紀錄', text: '已查看的線索。' }] }],
  clues: [{ id: 'number', label: '數字與時間', words: ['第十三聲'] }],
  clueCount: 1,
  clueTotal: 40,
  memories: [{ id: 'toby', chapter: '序章', title: '黑鐘書庫', found: false, label: null, text: null }],
  memoriesAvailable: true,
  shards: [{ id: 'library', found: false, title: null }],
  achievements: [{ id: 'first', unlocked: false, title: null, text: null }],
  closingTitle: null,
  secretTitle: '祕密尾聲',
  canReadSecretEpilogue: false,
};

describe('Journal snapshot boundary', () => {
  it('accepts the explicit read-only presentation contract', () => {
    expect(parseJournalSnapshot(payload)).toEqual(payload);
  });

  it('rejects malformed chapter, entry, collection, and count payloads', () => {
    expect(parseJournalSnapshot({ ...payload, chapters: [{ ...payload.chapters[0], entries: [{ id: 'bad', label: '<b>', text: 2 }] }] })).toBeNull();
    expect(parseJournalSnapshot({ ...payload, shards: [{ id: 'bad', found: 'no', title: null }] })).toBeNull();
    expect(parseJournalSnapshot({ ...payload, clueCount: '1' })).toBeNull();
    expect(parseJournalSnapshot(null)).toBeNull();
  });

  it('returns copies of mutable collections instead of exposing input arrays', () => {
    const parsed = parseJournalSnapshot(payload);
    expect(parsed).not.toBeNull();
    expect(parsed?.chapters).not.toBe(payload.chapters);
    expect(parsed?.clues[0]?.words).not.toBe(payload.clues[0]?.words);
  });
});
