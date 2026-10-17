<script setup lang="ts">
import { computed } from 'vue';
import type { JournalAchievement, JournalShard } from './journal';

const props = defineProps<{
  shards: JournalShard[];
  achievements: JournalAchievement[];
  closingTitle: string | null;
  secretTitle: string;
  canReadSecretEpilogue: boolean;
}>();

const emit = defineEmits<{ secretEpilogue: [] }>();
const foundShardCount = computed(() => props.shards.filter(shard => shard.found).length);
const unlockedAchievementCount = computed(() => props.achievements.filter(item => item.unlocked).length);
</script>

<template>
  <div>
    <h3>鏡之碎片 {{ foundShardCount }} / {{ shards.length }}</h3>
    <ul class="shard-list">
      <li v-for="shard in shards" :key="shard.id" :class="{ found: shard.found }">
        {{ shard.found ? `◇ ${shard.title} · 已收藏` : '◆ 尚未發現' }}
      </li>
    </ul>
    <h3>成就 {{ unlockedAchievementCount }} / {{ achievements.length }}</h3>
    <ul class="achievement-list">
      <li v-for="achievement in achievements" :key="achievement.id" :class="achievement.unlocked ? 'unlocked' : 'locked'">
        <strong>{{ achievement.unlocked ? achievement.title : '？？？' }}</strong>
        <span>{{ achievement.unlocked ? achievement.text : '尚未達成。' }}</span>
      </li>
    </ul>
    <template v-if="closingTitle">
      <h3>稱號</h3>
      <ul class="achievement-list">
        <li class="unlocked">
          <strong>{{ closingTitle }}</strong>
          <span>翻到帳冊的最後一頁，名字被留了下來。</span>
        </li>
      </ul>
    </template>
    <button
      id="secret-epilogue"
      type="button"
      class="primary-button"
      :disabled="!canReadSecretEpilogue"
      @click="emit('secretEpilogue')"
    >
      {{ canReadSecretEpilogue ? `${secretTitle} · 閱讀祕密尾聲 ⟶` : '集滿碎片後解鎖祕密尾聲' }}
    </button>
  </div>
</template>
