import { computed, ref } from 'vue';
import { OfflineBooksRepository } from './OfflineBooksRepository';

export function useOfflineBooks(slug: string, manifestUrl: string, repository: OfflineBooksRepository | null) {
  const busy = ref(false);
  const message = ref('把整本書保存在此瀏覽器，之後沒有網路也能閱讀。');
  const savedRecord = ref(repository?.load()[slug] ?? null);
  const saved = computed(() => savedRecord.value);
  const available = Boolean(repository);
  const buttonText = computed(() => saved.value ? '移除離線版本' : '離線保存全書');

  async function toggle(): Promise<void> {
    if (!repository || busy.value) return;
    busy.value = true;
    try {
      if (saved.value) {
        await repository.removeBook(slug);
        savedRecord.value = null;
        message.value = '把整本書保存在此瀏覽器，之後沒有網路也能閱讀。';
      } else {
        message.value = '正在取得全書清單…';
        const record = await repository.saveBook(manifestUrl, (index, total) => {
          message.value = `保存中 ${index} / ${total} 個頁面與圖片…`;
        });
        savedRecord.value = record;
        message.value = `已離線保存 ${record.count} 個頁面與圖片，沒有網路時也能閱讀。`;
        try {
          const estimate = await navigator.storage?.estimate?.();
          if (estimate?.usage) message.value += ` 瀏覽器目前使用 ${(estimate.usage / 1048576).toFixed(1)} MB。`;
        } catch { /* storage estimate is optional */ }
      }
    } catch {
      message.value = '離線保存沒有完成，請確認網路後再試。已取得的部分會保留，重試時會補齊。';
    } finally {
      busy.value = false;
    }
  }

  return { available, busy, saved, message, buttonText, toggle };
}
