<script setup>
import { computed } from 'vue'

const props = defineProps({ index: { type: Object, required: true } })
const rainMessage = computed(() => {
  if (!props.index.nextRain) return '비는 문제 없음!'
  const days = props.index.nextRain.daysFromNow
  const prefix = days === 0 ? '오늘' : days === 1 ? '내일' : `${days}일 뒤`
  return `${prefix} 비 예보 ${Math.round(props.index.nextRain.pop * 100)}%`
})
</script>

<template>
  <article class="index-card" :class="`level-${index.level}`">
    <div class="index-heading">
      <span class="index-icon">{{ index.icon }}</span>
      <span class="index-level">{{ index.level }}</span>
    </div>
    <h3>{{ index.label }}</h3>
    <div class="score-line">
      <strong>{{ index.score }}</strong
      ><span>/ 100</span>
    </div>
    <div class="score-track"><span :style="{ width: `${index.score}%` }"></span></div>
    <p>{{ index.message }}</p>
    <small v-if="index.id === 'car-wash'" :class="{ rain: index.nextRain }">{{
      rainMessage
    }}</small>
    <div v-if="index.activities" class="activity-list">
      <span v-for="activity in index.activities" :key="activity">{{ activity }}</span>
    </div>
  </article>
</template>

<style scoped>
.index-card {
  --level-color: var(--primary-600);
  min-height: 210px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 18px;
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
}
.index-card.level-mid {
  --level-color: #d39235;
}
.index-card.level-low {
  --level-color: #cf754e;
}
.index-card.level-none {
  --level-color: #84909d;
}
.index-heading,
.score-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.index-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--level-color) 13%, white);
  font-size: 1.2rem;
}
.index-level {
  border-radius: 999px;
  padding: 4px 8px;
  background: color-mix(in srgb, var(--level-color) 12%, white);
  color: var(--level-color);
  font-size: 0.62rem;
  font-weight: 850;
  text-transform: uppercase;
}
h3 {
  margin: 14px 0 5px;
  color: var(--ink-700);
  font-size: 0.88rem;
}
.score-line strong {
  color: var(--ink-900);
  font-size: 1.8rem;
}
.score-line span {
  color: var(--ink-400);
  font-size: 0.7rem;
}
.score-track {
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-muted);
}
.score-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--level-color);
  transition: width 0.35s ease;
}
p {
  min-height: 20px;
  margin: 11px 0 6px;
  color: var(--ink-600);
  font-size: 0.76rem;
  font-weight: 700;
}
small {
  color: var(--primary-700);
  font-size: 0.65rem;
}
small.rain {
  color: #c56746;
}
.activity-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 7px;
}
.activity-list span {
  border-radius: 999px;
  padding: 3px 7px;
  background: var(--primary-050);
  color: var(--primary-700);
  font-size: 0.6rem;
}
</style>
