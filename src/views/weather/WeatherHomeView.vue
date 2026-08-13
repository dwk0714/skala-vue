<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import BaseDashboardCard from '../../components/weather/shared/BaseDashboardCard.vue'
import WeatherCard from '../../components/weather/shared/WeatherCard.vue'
import SearchBar from '../../components/weather/search/SearchBar.vue'
import CitySearchResults from '../../components/weather/search/CitySearchResults.vue'
import { useTemperature } from '../../composables/useTemperature.js'
import { useWeatherStore } from '../../stores/weatherStore.js'

const router = useRouter()
const store = useWeatherStore()
const { displayTemperature, unitSymbol } = useTemperature()
const {
  cities,
  selectedCityId,
  filteredCities,
  recentSearches,
  searchQuery,
  searchResults,
  searchStatus,
  loadStatus,
  error,
} = storeToRefs(store)

const selectionMessage = ref('도시 카드를 선택하면 생활 지수의 기준 도시가 바뀝니다.')
const now = ref(Date.now())
let clock

const showSearchResults = computed(() => Boolean(searchQuery.value.trim()))
/** 히어로에는 비교에 필요한 평균과 최고 기온만 간결하게 보여준다. */
const dashboardSummary = computed(() => {
  const count = cities.value.length
  const hottest = cities.value.reduce(
    (current, city) => (!current || city.temp > current.temp ? city : current),
    null,
  )

  return {
    avgTemp: count
      ? Math.round((cities.value.reduce((sum, city) => sum + city.temp, 0) / count) * 10) / 10
      : 0,
    hottest,
  }
})

watch(searchQuery, (query) => store.searchCities(query))

const handleSelectCity = (city) => {
  store.selectCity(city.id)
  router.push({ name: 'weather-indices' })
}

const handleDetail = (city) => router.push({ name: 'weather-detail', params: { cityId: city.id } })

const handleSearchSubmit = () => {
  store.addRecentSearch(searchQuery.value)
  const first = filteredCities.value[0]
  if (first) handleSelectCity(first)
}

const handleRecentSelect = (query) => {
  searchQuery.value = query
  store.addRecentSearch(query)
}

const handleSearchResult = async (location) => {
  const result = await store.addCityFromSearchResult(location)
  store.addRecentSearch(location.name)
  if (result.city)
    selectionMessage.value = result.added
      ? `${result.city.name}이(가) 추가되었습니다.`
      : `${result.city.name}은(는) 이미 추가된 도시입니다.`
  ElMessage({
    type: result.city ? (result.added ? 'success' : 'info') : 'error',
    message: result.city
      ? selectionMessage.value
      : error.value || '도시 날씨를 불러오지 못했습니다.',
  })
  store.clearSearch()
  if (result.city) handleSelectCity(result.city)
}

onMounted(() => {
  store.loadCities()
  clock = window.setInterval(() => (now.value = Date.now()), 60_000)
})

onBeforeUnmount(() => {
  window.clearInterval(clock)
  store.clearSearch()
})
</script>

<template>
  <main class="dashboard-page">
    <header class="hero">
      <div class="hero-copy">
        <span class="hero-kicker">REGIONAL WEATHER</span>
        <h1>오늘, 어느 도시의 날씨가 좋을까요?</h1>
        <p>국내 도시의 현재 날씨를 비교하고 원하는 도시의 상세 관측을 확인하세요.</p>
        <p class="hero-cheer">오늘 하루도 화이팅!</p>
        <div class="hero-summary">
          <span>평균 기온 {{ displayTemperature(dashboardSummary.avgTemp) }}{{ unitSymbol }}</span>
          <span v-if="dashboardSummary.hottest">
            최고 기온 {{ dashboardSummary.hottest.name }} ·
            {{ displayTemperature(dashboardSummary.hottest.temp) }}{{ unitSymbol }}
          </span>
        </div>
      </div>
      <!-- 이모지 대신 유리 질감과 그라디언트만으로 만든 날씨 오브. -->
      <div class="hero-weather-art" aria-hidden="true">
        <span class="weather-glow"></span>
        <span class="weather-sun"></span>
        <span class="weather-cloud weather-cloud-back"></span>
        <span class="weather-cloud weather-cloud-front"></span>
      </div>
    </header>

    <div class="search-shell">
      <SearchBar
        :model-value="searchQuery"
        :result-count="filteredCities.length"
        :recent-searches="recentSearches"
        @update-query="searchQuery = $event"
        @submit="handleSearchSubmit"
        @select-recent="handleRecentSelect"
        @remove-recent="store.removeRecentSearch"
      />
      <CitySearchResults
        :visible="showSearchResults"
        :results="searchResults"
        :status="searchStatus"
        @select="handleSearchResult"
      />
    </div>

    <section
      v-if="(loadStatus === 'idle' || loadStatus === 'loading') && !cities.length"
      class="page-state"
    >
      <ElSkeleton :rows="8" animated />
    </section>
    <ElResult
      v-else-if="loadStatus === 'error' && !cities.length"
      icon="error"
      title="날씨 데이터를 불러오지 못했어요"
      :sub-title="error"
    />

    <BaseDashboardCard
      v-else
      class="dashboard-section cities-panel"
      eyebrow="CITY WEATHER"
      title="지역별 날씨"
      title-id="cities-title"
    >
      <template #meta>
        <small class="section-meta">{{ selectionMessage }}</small>
      </template>

      <TransitionGroup
        v-if="filteredCities.length"
        name="weather-card"
        tag="div"
        class="weather-grid"
      >
        <WeatherCard
          v-for="city in filteredCities"
          :key="city.id"
          :city="city"
          :selected="city.id === selectedCityId"
          :now="now"
          @select-card="handleSelectCity"
          @click-detail="handleDetail"
          @toggle-favorite="store.toggleFavorite($event.id)"
        />
      </TransitionGroup>
      <ElEmpty v-else description="조건에 맞는 도시가 없어요. 다른 이름으로 검색해 보세요." />
    </BaseDashboardCard>

    <footer>Weather Walk · Regional weather dashboard</footer>
  </main>
</template>

<style scoped>
.dashboard-page {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 34px 0 44px;
}

.hero {
  position: relative;
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 30px;
  padding: clamp(28px, 5vw, 58px);
  background: var(--hero-bg);
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--glass-blur);
}

.hero::after {
  position: absolute;
  right: -80px;
  bottom: -130px;
  width: 360px;
  height: 260px;
  border-radius: 50%;
  background: var(--surface-soft);
  content: '';
}

.hero-copy {
  position: relative;
  z-index: 2;
  max-width: 830px;
}

.hero-kicker {
  color: var(--primary-700);
  font-size: 0.67rem;
  font-weight: 850;
  letter-spacing: 0.16em;
}

h1 {
  margin: 8px 0 10px;
  color: var(--ink-900);
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.08;
  letter-spacing: -0.055em;
  word-spacing: 0.1em;
  white-space: nowrap;
}

.hero-copy p {
  max-width: 620px;
  color: var(--ink-600);
  font-size: clamp(0.86rem, 1.8vw, 1.02rem);
}

.hero-summary {
  display: flex;
  flex-wrap: wrap;
}

/* 기능 태그 대신 짧은 응원 문구 하나만 강조한다. */
.hero-copy .hero-cheer {
  margin: 18px 0 0;
  color: var(--primary-800);
  font-size: 0.82rem;
  font-weight: 850;
}

.hero-summary {
  gap: 8px 18px;
  margin-top: 10px;
  color: var(--ink-600);
  font-size: 0.72rem;
  font-weight: 700;
}

/* 날씨 오브 — 점선과 이모지를 제거하고 빛·구름의 깊이만 남긴 장식이다. */
.hero-weather-art {
  position: relative;
  z-index: 2;
  width: 230px;
  height: 190px;
  flex: 0 0 230px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 42px;
  background:
    linear-gradient(150deg, rgba(255, 255, 255, 0.44), rgba(116, 188, 255, 0.12)),
    var(--surface-soft);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 24px 54px rgba(50, 106, 163, 0.18);
  backdrop-filter: blur(22px) saturate(150%);
  transform: rotate(2deg);
}

.weather-glow {
  position: absolute;
  top: -54px;
  right: -38px;
  width: 176px;
  height: 176px;
  border-radius: 50%;
  background: rgba(255, 194, 75, 0.24);
  filter: blur(24px);
}

.weather-sun {
  position: absolute;
  top: 35px;
  right: 38px;
  width: 78px;
  height: 78px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #fff4ad 0 8%, #ffd75f 40%, #ffab3d 100%);
  box-shadow:
    0 0 0 14px rgba(255, 207, 91, 0.1),
    0 16px 34px rgba(241, 163, 41, 0.26);
}

.weather-cloud {
  position: absolute;
  height: 44px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(225, 239, 251, 0.82));
  box-shadow: 0 15px 30px rgba(55, 98, 137, 0.16);
}

.weather-cloud::before,
.weather-cloud::after {
  position: absolute;
  bottom: 0;
  border-radius: 50%;
  background: inherit;
  content: '';
}

.weather-cloud::before {
  left: 22px;
  width: 62px;
  height: 62px;
}

.weather-cloud::after {
  right: 20px;
  width: 48px;
  height: 48px;
}

.weather-cloud-back {
  right: 18px;
  bottom: 48px;
  width: 142px;
  opacity: 0.58;
  transform: scale(0.78);
}

.weather-cloud-front {
  bottom: 30px;
  left: 24px;
  width: 164px;
}

.search-shell {
  position: relative;
  margin-top: 20px;
}

.dashboard-section {
  margin-top: 34px;
}

.cities-panel {
  --card-heading-align: end;
  --card-heading-gap: 18px;
  --card-heading-margin: 14px;
  --card-eyebrow-color: var(--primary-700);
  --card-eyebrow-size: 0.67rem;
  --card-eyebrow-weight: 850;
  --card-eyebrow-spacing: 0.16em;
  --card-title-margin: 3px 0 0;
  --card-title-size: 1.35rem;
}

.section-meta {
  color: var(--ink-500);
  font-size: 0.72rem;
  text-align: right;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.page-state {
  display: grid;
  min-height: 300px;
  place-items: center;
  color: var(--ink-500);
}

.weather-card-enter-active,
.weather-card-leave-active,
.weather-card-move {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.weather-card-enter-from,
.weather-card-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.page-state.error {
  color: #a04f40;
}

footer {
  margin-top: 34px;
  color: var(--ink-400);
  font-size: 0.67rem;
  text-align: center;
}

@media (max-width: 1050px) {
  .weather-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .hero-weather-art {
    display: none;
  }
}

@media (max-width: 700px) {
  h1 {
    text-wrap: balance;
    white-space: normal;
    word-break: keep-all;
  }
}

@media (max-width: 580px) {
  .dashboard-page {
    width: min(100% - 20px, 1240px);
    padding-top: 10px;
  }

  .hero {
    min-height: 240px;
    border-radius: 22px;
    padding: 26px 22px;
  }

  .cities-panel {
    --card-heading-align: start;
    --card-heading-direction: column;
    --card-heading-gap: 4px;
    --card-meta-margin-left: 0;
  }

  .section-meta {
    text-align: left;
  }

  .weather-grid {
    grid-template-columns: 1fr;
  }
}
</style>
