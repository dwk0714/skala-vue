<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import BaseDashboardCard from '../../components/weather/shared/BaseDashboardCard.vue'
import WeatherCard from '../../components/weather/shared/WeatherCard.vue'
import { useWeatherStore } from '../../stores/weatherStore.js'

const router = useRouter()
const store = useWeatherStore()
const { favoriteCities, selectedCityId, loadStatus, error } = storeToRefs(store)
const now = ref(Date.now())
let clock

const openDetail = (city) => {
  store.selectCity(city.id)
  router.push({ name: 'weather-detail', params: { cityId: city.id } })
}

onMounted(() => {
  store.loadCities()
  clock = window.setInterval(() => (now.value = Date.now()), 60_000)
})

onBeforeUnmount(() => window.clearInterval(clock))
</script>

<template>
  <main class="favorites-page">
    <header class="page-heading">
      <span>FAVORITE CITIES</span>
      <h1>즐겨찾는 도시 목록</h1>
      <p>자주 확인하는 도시의 날씨를 한곳에서 살펴보세요.</p>
    </header>

    <section
      v-if="(loadStatus === 'idle' || loadStatus === 'loading') && !favoriteCities.length"
      class="page-state"
    >
      <ElSkeleton :rows="7" animated />
    </section>
    <ElResult
      v-else-if="loadStatus === 'error' && !favoriteCities.length"
      icon="error"
      title="즐겨찾기를 불러오지 못했어요"
      :sub-title="error"
    />

    <BaseDashboardCard
      v-else
      class="favorites-panel"
      eyebrow="SAVED WEATHER"
      :title="`즐겨찾기 ${favoriteCities.length}곳`"
      title-id="favorites-title"
    >
      <TransitionGroup v-if="favoriteCities.length" name="favorite" tag="div" class="weather-grid">
        <WeatherCard
          v-for="city in favoriteCities"
          :key="city.id"
          :city="city"
          :selected="city.id === selectedCityId"
          :now="now"
          @select-card="openDetail"
          @click-detail="openDetail"
          @toggle-favorite="store.toggleFavorite($event.id)"
        />
      </TransitionGroup>
      <ElEmpty v-else description="아직 즐겨찾기한 도시가 없어요.">
        <RouterLink to="/weather">지역 날씨에서 추가하기 →</RouterLink>
      </ElEmpty>
    </BaseDashboardCard>
  </main>
</template>

<style scoped>
.favorites-page {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 44px 0 50px;
}

.page-heading {
  margin-bottom: 24px;
}

.page-heading span {
  color: var(--primary-700);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.16em;
}

h1 {
  margin: 6px 0;
  color: var(--ink-900);
  font-size: clamp(2rem, 5vw, 3.4rem);
  letter-spacing: -0.05em;
}

.page-heading p {
  margin: 0;
  color: var(--ink-500);
}

.favorites-panel {
  --card-heading-margin: 18px;
  --card-eyebrow-color: var(--primary-700);
  --card-eyebrow-weight: 800;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.page-state {
  display: grid;
  min-height: 320px;
  place-content: center;
  gap: 8px;
  color: var(--ink-500);
  text-align: center;
}

:deep(.el-empty) a {
  margin-top: 8px;
  color: var(--primary-700);
  font-size: 0.8rem;
  font-weight: 800;
  text-decoration: none;
}

.favorite-enter-active,
.favorite-leave-active,
.favorite-move {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.favorite-enter-from,
.favorite-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.page-state.error {
  color: #a04f40;
}

@media (max-width: 1050px) {
  .weather-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 580px) {
  .favorites-page {
    width: min(100% - 20px, 1240px);
    padding-top: 28px;
  }

  .weather-grid {
    grid-template-columns: 1fr;
  }
}
</style>
