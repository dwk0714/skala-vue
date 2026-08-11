<script setup>
defineProps({
  results: { type: Array, default: () => [] },
  status: { type: String, default: 'idle' },
  visible: { type: Boolean, default: false },
})

defineEmits(['select'])
</script>

<template>
  <div v-if="visible" class="results-panel">
    <p v-if="status === 'loading'" class="result-state">도시를 찾고 있어요…</p>
    <template v-else-if="results.length">
      <button v-for="city in results" :key="city.id" type="button" @click="$emit('select', city)">
        <span
          ><strong>{{ city.name }}</strong> · {{ city.state }}</span
        >
        <small>{{ city.coords.lat.toFixed(4) }}, {{ city.coords.lon.toFixed(4) }}</small>
      </button>
    </template>
    <p v-else class="result-state">일치하는 국내 도시가 없습니다.</p>
  </div>
</template>

<style scoped>
.results-panel {
  position: absolute;
  z-index: 20;
  right: 24px;
  left: 24px;
  margin-top: -8px;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--shadow-float);
}

button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 0;
  border-bottom: 1px solid var(--border-soft);
  padding: 12px 14px;
  background: transparent;
  color: var(--ink-700);
  cursor: pointer;
  font: inherit;
  text-align: left;
}

button:hover,
button:focus-visible {
  background: var(--primary-050);
}
button:last-child {
  border-bottom: 0;
}
small {
  color: var(--ink-400);
}
.result-state {
  margin: 0;
  padding: 16px;
  color: var(--ink-500);
  text-align: center;
}
</style>
