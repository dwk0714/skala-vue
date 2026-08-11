<script setup>
import WeatherCard from './WeatherCard.vue'

defineProps({
  cities: { type: Array, default: () => [] },
  selectedCityId: { type: String, default: null },
  now: { type: Number, required: true },
})

defineEmits(['select', 'show-detail', 'toggle-favorite'])
</script>

<template>
  <div v-if="cities.length" class="weather-grid">
    <WeatherCard
      v-for="city in cities"
      :key="city.id"
      :city="city"
      :selected="city.id === selectedCityId"
      :now="now"
      @select="$emit('select', $event)"
      @show-detail="$emit('show-detail', $event)"
      @toggle-favorite="$emit('toggle-favorite', $event)"
    />
  </div>
  <div v-else class="empty-list">
    <span>🧭</span>
    <strong>조건에 맞는 도시가 없어요</strong>
    <p>다른 도시 이름으로 검색해 보세요.</p>
  </div>
</template>

<style scoped>
.weather-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.empty-list {
  display: grid;
  min-height: 230px;
  place-items: center;
  align-content: center;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-xl);
  color: var(--ink-500);
  text-align: center;
}
.empty-list span {
  font-size: 2rem;
}
.empty-list strong {
  margin-top: 8px;
  color: var(--ink-700);
}
.empty-list p {
  margin: 2px 0 0;
  font-size: 0.8rem;
}
@media (max-width: 1050px) {
  .weather-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 580px) {
  .weather-grid {
    grid-template-columns: 1fr;
  }
}
</style>
