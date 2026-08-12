<script setup>
import BaseDashboardCard from './BaseDashboardCard.vue'

defineProps({
  modelValue: { type: String, default: '' },
  resultCount: { type: Number, default: 0 },
  recentSearches: { type: Array, default: () => [] },
})

const emit = defineEmits(['update-query', 'submit', 'select-recent', 'remove-recent'])
</script>

<template>
  <BaseDashboardCard
    eyebrow="CITY FINDER"
    title="오늘 걸을 도시를 찾아보세요"
    title-id="city-search-title"
  >
    <template #meta>
      <span class="result-count">{{ resultCount }}개 도시</span>
    </template>

    <form class="search-form" @submit.prevent="emit('submit')">
      <span aria-hidden="true">⌕</span>
      <input
        :value="modelValue"
        type="search"
        autocomplete="off"
        placeholder="서울, 울산, 제주처럼 입력해 보세요"
        aria-label="도시 검색"
        @input="emit('update-query', $event.target.value)"
      />
      <button type="submit">검색</button>
    </form>

    <div v-if="recentSearches.length" class="recent-row">
      <span>최근 검색</span>
      <div v-for="item in recentSearches" :key="item" class="recent-tag">
        <button type="button" @click="emit('select-recent', item)">{{ item }}</button>
        <button
          type="button"
          :aria-label="`${item} 최근 검색어 삭제`"
          @click="emit('remove-recent', item)"
        >
          ×
        </button>
      </div>
    </div>
  </BaseDashboardCard>
</template>

<style scoped>
.dashboard-card {
  --card-heading-gap: 20px;
  --card-heading-margin: 18px;
  --card-eyebrow-color: var(--primary-700);
  --card-eyebrow-size: 0.68rem;
  --card-eyebrow-weight: 800;
  --card-eyebrow-spacing: 0.14em;
  --card-title-margin: 4px 0 0;
  --card-title-size: clamp(1.15rem, 2vw, 1.45rem);
  position: relative;
  z-index: 5;
  padding: 24px;
  backdrop-filter: blur(18px);
}

.recent-row,
.search-form {
  display: flex;
  align-items: center;
}

.result-count {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 7px 11px;
  background: var(--primary-100);
  color: var(--primary-800);
  font-size: 0.76rem;
  font-weight: 750;
}

.search-form {
  gap: 10px;
  border: 1px solid var(--border-strong);
  border-radius: 15px;
  padding: 7px 8px 7px 15px;
  background: rgba(255, 255, 255, 0.82);
  transition:
    box-shadow 0.2s,
    border-color 0.2s;
}

.search-form:focus-within {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(57, 132, 99, 0.12);
}

input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  padding: 8px 0;
  background: transparent;
  color: var(--ink-900);
  font: inherit;
}

.search-form > button {
  border: 0;
  border-radius: 11px;
  padding: 10px 17px;
  background: var(--primary-700);
  color: white;
  cursor: pointer;
  font: inherit;
  font-weight: 750;
}

.recent-row {
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  color: var(--ink-500);
  font-size: 0.76rem;
}

.recent-tag {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  background: var(--surface-muted);
}

.recent-tag button {
  border: 0;
  padding: 6px 9px;
  background: transparent;
  color: var(--ink-700);
  cursor: pointer;
  font: inherit;
}

.recent-tag button:last-child {
  padding-left: 2px;
  color: var(--ink-400);
}

@media (max-width: 540px) {
  .dashboard-card {
    padding: 18px;
  }
  .result-count {
    display: none;
  }
}
</style>
