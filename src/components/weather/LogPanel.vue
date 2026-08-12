<script setup>
defineProps({
  logs: { type: Array, default: () => [] },
})
</script>

<template>
  <section class="log-panel" aria-labelledby="log-title">
    <div>
      <small>REACTIVITY LOG</small>
      <h2 id="log-title">반응형 상태 추적</h2>
    </div>
    <ol v-if="logs.length">
      <li v-for="entry in logs" :key="entry.id">{{ entry.text }}</li>
    </ol>
    <p v-else>상태가 변경되면 최근 로그가 여기에 표시됩니다.</p>
  </section>
</template>

<style scoped>
.log-panel {
  margin-top: 34px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  padding: 22px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-card);
}

small {
  color: var(--primary-700);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

h2 {
  margin: 3px 0 14px;
  color: var(--ink-900);
  font-size: 1.1rem;
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
