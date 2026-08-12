<script setup>
import BaseDashboardCard from './BaseDashboardCard.vue'

defineProps({
  logs: { type: Array, default: () => [] },
})
</script>

<template>
  <BaseDashboardCard
    class="log-panel"
    title="반응형 상태 추적"
    title-id="log-title"
    eyebrow="REACTIVITY LOG"
  >
    <ol v-if="logs.length">
      <li v-for="entry in logs" :key="entry.id">{{ entry.text }}</li>
    </ol>
    <p v-else>상태가 변경되면 최근 로그가 여기에 표시됩니다.</p>
  </BaseDashboardCard>
</template>

<style scoped>
.log-panel {
  --card-heading-margin: 14px;
  --card-eyebrow-color: var(--primary-700);
  --card-eyebrow-weight: 800;
  --card-eyebrow-spacing: 0.12em;
  --card-title-margin: 3px 0 0;
  margin-top: 34px;
}

ol {
  display: grid;
  max-height: 260px;
  gap: 7px;
  overflow-y: auto;
  padding: 0;
  list-style: none;
}

li,
p {
  margin: 0;
  border-radius: 10px;
  padding: 9px 11px;
  background: rgba(231, 242, 236, 0.7);
  color: var(--ink-600);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
}
</style>
