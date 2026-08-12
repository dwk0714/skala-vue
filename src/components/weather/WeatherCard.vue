<script setup>
import { computed } from 'vue'
import { formatRelativeTime } from '../../utils/formatRelativeTime.js'

const props = defineProps({
  city: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  now: { type: Number, required: true },
})

defineEmits(['select-card', 'click-detail', 'toggle-favorite'])

const weatherIcon = computed(() => {
  if (props.city.status.includes('비')) return '🌧️'
  if (props.city.status.includes('흐림') || props.city.status.includes('구름')) return '⛅'
  if (props.city.status.includes('바람')) return '🍃'
  return '☀️'
})
</script>

<template>
  <article
    class="weather-card"
    :class="{ selected }"
    role="button"
    tabindex="0"
    :aria-label="`${city.name} 날씨 선택`"
    @click="$emit('select-card', city)"
    @keydown.enter="$emit('select-card', city)"
    @keydown.space.prevent="$emit('select-card', city)"
  >
    <div class="card-top">
      <span class="weather-icon" aria-hidden="true">{{ weatherIcon }}</span>
      <button
        class="favorite"
        :class="{ active: city.isFavorite }"
        type="button"
        :aria-label="city.isFavorite ? `${city.name} 즐겨찾기 해제` : `${city.name} 즐겨찾기 추가`"
        @click.stop="$emit('toggle-favorite', city)"
        @keydown.stop
      >
        {{ city.isFavorite ? '★' : '☆' }}
      </button>
    </div>

    <div class="city-copy">
      <span>{{ city.state }}</span>
      <h3>{{ city.name }}</h3>
      <p>{{ city.status }} · 체감 {{ city.feelsLike }}℃</p>
    </div>

    <div class="temperature-row">
      <strong>{{ city.temp }}<small>℃</small></strong>
      <span v-if="city.temp >= 25" class="temp-badge hot">☀ 더움</span>
      <span v-else class="temp-badge cool">❄ 선선함</span>
    </div>

    <div class="card-meta">
      <span>강수 {{ Math.round(city.pop * 100) }}%</span>
      <span>미세먼지 {{ city.pm10 }}</span>
    </div>

    <div class="card-footer">
      <small>{{ formatRelativeTime(city.updatedAt, now) }} 업데이트</small>
      <button type="button" @click.stop="$emit('click-detail', city)" @keydown.stop>
        상세보기 →
      </button>
    </div>
  </article>
</template>

<style scoped>
.weather-card {
  display: flex;
  min-height: 285px;
  flex-direction: column;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 18px;
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
}

.weather-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-float);
}
.weather-card.selected {
  border-color: var(--primary-500);
  box-shadow:
    0 0 0 3px rgba(65, 145, 108, 0.14),
    var(--shadow-float);
}
.weather-card:focus-visible {
  outline: 3px solid rgba(65, 145, 108, 0.25);
  outline-offset: 3px;
}
.card-top,
.temperature-row,
.card-meta,
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.weather-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 14px;
  background: var(--sky-100);
  font-size: 1.45rem;
}
.favorite {
  border: 0;
  background: transparent;
  color: var(--ink-300);
  cursor: pointer;
  font-size: 1.45rem;
}
.favorite.active {
  color: #e3a526;
}
.city-copy {
  margin: 18px 0 12px;
}
.city-copy span {
  color: var(--ink-400);
  font-size: 0.7rem;
}
h3 {
  margin: 2px 0;
  color: var(--ink-900);
  font-size: 1.2rem;
}
.city-copy p {
  margin: 0;
  color: var(--ink-500);
  font-size: 0.78rem;
}
.temperature-row strong {
  color: var(--ink-900);
  font-size: 2.15rem;
  letter-spacing: -0.06em;
}
.temperature-row strong small {
  font-size: 1rem;
}
.temp-badge {
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 0.67rem;
  font-weight: 800;
}
.temp-badge.hot {
  background: #fff0e5;
  color: #c55b2d;
}
.temp-badge.cool {
  background: #e8f5ff;
  color: #3277a6;
}
.card-meta {
  gap: 8px;
  margin-top: 12px;
}
.card-meta span {
  flex: 1;
  border-radius: 10px;
  padding: 7px;
  background: var(--surface-muted);
  color: var(--ink-500);
  font-size: 0.68rem;
  text-align: center;
}
.card-footer {
  gap: 12px;
  margin-top: auto;
  padding-top: 15px;
}
.card-footer small {
  color: var(--ink-400);
  font-size: 0.65rem;
}
.card-footer button {
  border: 0;
  background: transparent;
  color: var(--primary-700);
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
}
</style>
