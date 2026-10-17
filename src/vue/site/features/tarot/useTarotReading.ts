import { computed, onMounted, shallowRef } from 'vue';
import {
  clearTarotHistory,
  exportTarotHistory,
  readTarotHistory,
  saveTarotHistory,
  updateTarotNote,
  type TarotHistoryEntry,
} from './TarotHistoryRepository';
import { localDayKey } from '../fortune-core/civil-time';
import { drawCards, findTarotCard, tarotSpreadCount, type TarotCard, type TarotOrientation, type TarotSpreadId } from './tarot';

export interface DrawnTarotCard {
  card: TarotCard;
  orientation: TarotOrientation;
}

export function useTarotReading() {
  const spread = shallowRef<TarotSpreadId>('single');
  const readingSpread = shallowRef<TarotSpreadId>('single');
  const allowReversed = shallowRef(true);
  const drawnCards = shallowRef<DrawnTarotCard[]>([]);
  const revealedIndexes = shallowRef<number[]>([]);
  const history = shallowRef<TarotHistoryEntry[]>([]);
  const journalNote = shallowRef('');
  const currentEntryId = shallowRef('');
  const status = shallowRef('選擇牌陣，準備好時開始抽牌。');
  const readingComplete = computed(() => drawnCards.value.length > 0
    && revealedIndexes.value.length === drawnCards.value.length);

  onMounted(() => {
    history.value = readTarotHistory();
  });

  function startReading(): void {
    try {
      const count = tarotSpreadCount(spread.value);
      readingSpread.value = spread.value;
      journalNote.value = '';
      currentEntryId.value = '';
      if (readingSpread.value === 'daily') {
        const localDay = localDayKey();
        const existing = history.value.find(entry => entry.spread === 'daily' && entry.localDay === localDay);
        if (existing) {
          const card = findTarotCard(existing.cards[0]?.cardId ?? '');
          if (!card) throw new Error('找不到今日已保存的牌卡，請清除本機紀錄後再試。');
          drawnCards.value = [{ card, orientation: existing.cards[0].orientation }];
          revealedIndexes.value = [0];
          currentEntryId.value = existing.id;
          journalNote.value = existing.note ?? '';
          status.value = '今日已完成抽牌，重新整理仍會顯示同一張牌。';
          return;
        }
      }
      drawnCards.value = drawCards(count, allowReversed.value);
      revealedIndexes.value = [];
      status.value = count === 1 ? '牌已展開，揭開卡牌閱讀當下指引。' : `${count} 張牌已展開，依序揭牌看見故事脈絡。`;
      if (readingSpread.value === 'daily') {
        const now = new Date();
        const entry: TarotHistoryEntry = {
          id: `${Date.now()}-${drawnCards.value[0].card.id}`,
          createdAt: now.toISOString(),
          localDay: localDayKey(now),
          spread: 'daily',
          cards: drawnCards.value.map(({ card, orientation }) => ({ cardId: card.id, orientation })),
        };
        history.value = saveTarotHistory(entry);
        currentEntryId.value = entry.id;
        status.value = history.value.some(item => item.id === entry.id)
          ? '今日牌卡已固定在本機；翻牌後可留下反思筆記。'
          : '本機儲存未啟用，今日牌卡只在目前頁面有效。';
      }
    } catch (error) {
      status.value = error instanceof Error ? error.message : '目前無法抽牌，請稍後再試。';
      drawnCards.value = [];
      revealedIndexes.value = [];
    }
  }

  function revealCard(index: number): void {
    if (index < 0 || index >= drawnCards.value.length || revealedIndexes.value.includes(index)) return;
    revealedIndexes.value = [...revealedIndexes.value, index];
    if (revealedIndexes.value.length === drawnCards.value.length) {
      if (readingSpread.value === 'daily') {
        status.value = '今日牌卡已揭開，紀錄只保存在這個瀏覽器。';
        return;
      }
      const entry: TarotHistoryEntry = {
        id: `${Date.now()}-${drawnCards.value.map(({ card }) => card.id).join('-')}`,
        createdAt: new Date().toISOString(),
        spread: readingSpread.value,
        cards: drawnCards.value.map(({ card, orientation }) => ({ cardId: card.id, orientation })),
      };
      try {
        history.value = saveTarotHistory(entry);
        currentEntryId.value = entry.id;
        status.value = '本次牌陣已完成，閱讀紀錄只保存在這個瀏覽器。';
      } catch {
        status.value = '本次牌陣已完成；瀏覽器未允許儲存，因此沒有留下本機紀錄。';
      }
    }
  }

  function saveJournalNote(): void {
    if (!currentEntryId.value) return;
    try {
      history.value = updateTarotNote(currentEntryId.value, journalNote.value);
      journalNote.value = history.value.find(entry => entry.id === currentEntryId.value)?.note ?? '';
      status.value = '反思筆記已保存在此瀏覽器。';
    } catch {
      status.value = '瀏覽器未允許儲存筆記，內容未保存。';
    }
  }

  function clearHistory(): void {
    try {
      clearTarotHistory();
      history.value = [];
      currentEntryId.value = '';
      journalNote.value = '';
      status.value = '已清除此瀏覽器中的塔羅閱讀紀錄。';
    } catch {
      status.value = '瀏覽器未允許清除本機紀錄。';
    }
  }

  function exportHistory(): void {
    if (history.value.length === 0) {
      status.value = '目前沒有可匯出的塔羅紀錄。';
      return;
    }
    try {
      const url = URL.createObjectURL(new Blob([exportTarotHistory()], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tarot-history.json';
      link.click();
      URL.revokeObjectURL(url);
      status.value = '已匯出塔羅紀錄（JSON）；檔案只包含牌卡、時間與筆記。';
    } catch {
      status.value = '目前無法匯出紀錄，請稍後再試。';
    }
  }

  return {
    spread,
    readingSpread,
    allowReversed,
    drawnCards,
    revealedIndexes,
    history,
    journalNote,
    status,
    readingComplete,
    startReading,
    revealCard,
    saveJournalNote,
    clearHistory,
    exportHistory,
  };
}
