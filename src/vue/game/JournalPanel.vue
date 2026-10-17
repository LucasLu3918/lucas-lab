<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import JournalChapterEntries from './JournalChapterEntries.vue';
import JournalClueBook from './JournalClueBook.vue';
import JournalCollection from './JournalCollection.vue';
import JournalMemories from './JournalMemories.vue';
import type { JournalSnapshot } from './journal';

const props = defineProps<{ snapshot: JournalSnapshot }>();
const emit = defineEmits<{ secretEpilogue: [] }>();
const selected = shallowRef(props.snapshot.initialSelection);

const selectedChapters = computed(() => selected.value === 'all'
  ? props.snapshot.chapters
  : props.snapshot.chapters.filter(chapter => String(chapter.index) === selected.value));
const selectedEntryCount = computed(() => selectedChapters.value
  .reduce((total, chapter) => total + chapter.entries.length, 0));

const summary = computed(() => {
  if (selected.value === 'clues') {
    return `推理簿收錄 ${props.snapshot.clueCount} / ${props.snapshot.clueTotal} 個線索詞。詞彙隨旅程收錄，開始新旅程時會清空。`;
  }
  if (selected.value === 'memories') {
    const found = props.snapshot.memories.filter(memory => memory.found).length;
    return `已收藏 ${found} / ${props.snapshot.memories.length} 段人物記憶。開始新旅程也會保留。`;
  }
  if (selected.value === 'collection') {
    return '碎片與成就會保留在此裝置，開始新旅程也不會遺失。';
  }
  return `已記錄 ${selectedEntryCount.value} 處線索。筆記只顯示妳已查看的內容。`;
});
</script>

<template>
  <div>
    <div class="journal-owner">
      <img :src="'assets/portraits/snow.webp'" alt="" width="56" height="56" decoding="async">
      <p><strong>白雪公主</strong><span>她一路留下的線索與記憶</span></p>
    </div>
    <div class="journal-controls">
      <label for="journal-chapter">查看章節</label>
      <select id="journal-chapter" v-model="selected">
        <option value="all">全部已解鎖章節</option>
        <option v-for="chapter in snapshot.chapters" :key="chapter.index" :value="String(chapter.index)">
          {{ chapter.chapter }} · {{ chapter.title }}
        </option>
        <option v-if="snapshot.memoriesAvailable" value="memories">人物記憶</option>
        <option value="clues">推理簿</option>
        <option value="collection">收藏</option>
      </select>
      <p id="journal-summary" class="modal-note" role="status">{{ summary }}</p>
    </div>
    <div id="journal-entries">
      <JournalChapterEntries v-if="selected === 'all' || selectedChapters.length" :chapters="selectedChapters" />
      <JournalMemories v-else-if="selected === 'memories'" :memories="snapshot.memories" />
      <JournalClueBook v-else-if="selected === 'clues'" :groups="snapshot.clues" />
      <JournalCollection
        v-else-if="selected === 'collection'"
        :shards="snapshot.shards"
        :achievements="snapshot.achievements"
        :closing-title="snapshot.closingTitle"
        :secret-title="snapshot.secretTitle"
        :can-read-secret-epilogue="snapshot.canReadSecretEpilogue"
        @secret-epilogue="emit('secretEpilogue')"
      />
    </div>
  </div>
</template>
