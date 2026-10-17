<script setup lang="ts">
import type { JournalClueGroup } from './journal';

defineProps<{ groups: JournalClueGroup[] }>();
</script>

<template>
  <div>
    <section v-for="group in groups" :key="group.id" class="journal-chapter">
      <h3>{{ group.label }}</h3>
      <ul class="clue-book">
        <li v-for="word in group.words" :key="word">{{ word }}</li>
      </ul>
    </section>
    <p v-if="groups.length === 0" class="modal-text">
      推理簿還是空的。回到場景檢視線索，詞彙會自動收錄。
    </p>
  </div>
</template>
