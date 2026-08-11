<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import CitySearch from './components/weather/CitySearch.vue'
import CitySearchResults from './components/weather/CitySearchResults.vue'
import IndexGrid from './components/weather/IndexGrid.vue'
import PreparationPanel from './components/weather/PreparationPanel.vue'
import WalkTimePanel from './components/weather/WalkTimePanel.vue'
import WeatherCardList from './components/weather/WeatherCardList.vue'
import { useWeatherStore } from './stores/weatherStore.js'
import { computeIndices } from './utils/indices/index.js'
import { getPreparationItems } from './utils/recommendations/preparation.js'
import { getWalkableHours } from './utils/recommendations/walkTimes.js'

const store = useWeatherStore()
const {
  selectedCity,
  selectedCityId,
  filteredCities,
  recentSearches,
  searchQuery,
  searchResults,
  searchStatus,
  loadStatus,
  error,
} = storeToRefs(store)

const selectionMessage = ref('도시 카드를 선택하면 맞춤 추천이 바뀝니다.')
const now = ref(Date.now())
const walkImage = ''
const stayHomeImage = ''
let clock

const indices = computed(() => (selectedCity.value ? computeIndices(selectedCity.value) : []))
const outdoorIndex = computed(() => indices.value.find((index) => index.id === 'outdoor-activity'))
const preparationItems = computed(() =>
  selectedCity.value ? getPreparationItems(selectedCity.value) : [],
)
const walkableHours = computed(() =>
  selectedCity.value ? getWalkableHours(selectedCity.value.hourly) : [],
)
const showSearchResults = computed(() => Boolean(searchQuery.value.trim()))

watch(searchQuery, (query) => store.searchCities(query))

const handleSelectCity = (city) => {
  store.selectCity(city.id)
  selectionMessage.value = `${city.name}이(가) 선택되었습니다.`
}

const handleDetail = (city) => {
  const score = computeIndices(city).find((index) => index.id === 'outdoor-activity')?.score ?? 0
  window.alert(
    `${city.name}의 현재 날씨는 ${city.status}, ${city.temp}℃입니다.\n야외활동 지수는 ${score}점입니다.`,
  )
}

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
  store.clearSearch()
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
        <span class="hero-kicker">WALKABLE WEATHER</span>
        <h1>오늘, 걷기 좋은 날인가요?</h1>
        <p>도시별 날씨를 비교하고 산책 시간부터 외출 준비까지 한 번에 확인하세요.</p>
        <div class="hero-tags">
          <span>국내 8개 도시</span><span>생활 지수 5종</span><span>Mock 데이터</span>
        </div>
      </div>
      <div class="hero-orbit" aria-hidden="true"><span>☀️</span><i></i><b>🌿</b></div>
    </header>

    <div class="search-shell">
      <CitySearch
        v-model="searchQuery"
        :result-count="filteredCities.length"
        :recent-searches="recentSearches"
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

    <section v-if="loadStatus === 'loading'" class="page-state">
      날씨 데이터를 준비하고 있어요…
    </section>
    <section v-else-if="loadStatus === 'error'" class="page-state error">{{ error }}</section>

    <template v-else>
      <section class="dashboard-section" aria-labelledby="cities-title">
        <div class="section-title">
          <div>
            <span>REGIONAL WEATHER</span>
            <h2 id="cities-title">지역별 날씨</h2>
          </div>
          <small>{{ selectionMessage }}</small>
        </div>
        <WeatherCardList
          :cities="filteredCities"
          :selected-city-id="selectedCityId"
          :now="now"
          @select="handleSelectCity"
          @show-detail="handleDetail"
          @toggle-favorite="store.toggleFavorite($event.id)"
        />
      </section>

      <template v-if="selectedCity">
        <section class="selected-banner">
          <div>
            <span>SELECTED CITY</span>
            <h2>{{ selectedCity.name }}</h2>
            <p>{{ selectedCity.state }} · {{ selectedCity.status }}</p>
          </div>
          <div class="selected-stats">
            <span
              ><small>현재</small><strong>{{ selectedCity.temp }}℃</strong></span
            >
            <span
              ><small>체감</small><strong>{{ selectedCity.feelsLike }}℃</strong></span
            >
            <span
              ><small>습도</small><strong>{{ selectedCity.humidity }}%</strong></span
            >
            <span
              ><small>활동</small><strong>{{ outdoorIndex?.score }}점</strong></span
            >
          </div>
        </section>

        <section class="dashboard-section" aria-labelledby="indices-title">
          <div class="section-title">
            <div>
              <span>LIFE INDICES</span>
              <h2 id="indices-title">{{ selectedCity.name }} 생활 날씨 지수</h2>
            </div>
            <small>날씨 데이터를 일상 언어로 바꿨어요.</small>
          </div>
          <IndexGrid :indices="indices" />
        </section>

        <section class="recommendation-grid">
          <PreparationPanel :city-name="selectedCity.name" :items="preparationItems" />
          <WalkTimePanel
            :city="selectedCity"
            :available-hours="walkableHours"
            :walk-image="walkImage"
            :stay-home-image="stayHomeImage"
          />
        </section>
      </template>
    </template>

    <footer>Weather Walk · Mock data dashboard for Vue practice</footer>
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
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 30px;
  padding: clamp(28px, 5vw, 58px);
  background: linear-gradient(120deg, rgba(216, 240, 225, 0.94), rgba(219, 239, 250, 0.9));
  box-shadow: var(--shadow-card);
}
.hero::after {
  position: absolute;
  right: -80px;
  bottom: -130px;
  width: 360px;
  height: 260px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  content: '';
}
.hero-copy {
  position: relative;
  z-index: 2;
  max-width: 680px;
}
.hero-kicker,
.section-title span,
.selected-banner > div > span {
  color: var(--primary-700);
  font-size: 0.67rem;
  font-weight: 850;
  letter-spacing: 0.16em;
}
h1 {
  margin: 8px 0 10px;
  color: var(--ink-900);
  font-size: clamp(2rem, 5vw, 3.7rem);
  line-height: 1.08;
  letter-spacing: -0.055em;
}
.hero-copy p {
  max-width: 620px;
  color: var(--ink-600);
  font-size: clamp(0.86rem, 1.8vw, 1.02rem);
}
.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}
.hero-tags span {
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  padding: 7px 10px;
  background: rgba(255, 255, 255, 0.45);
  color: var(--primary-800);
  font-size: 0.7rem;
  font-weight: 750;
}
.hero-orbit {
  position: relative;
  z-index: 2;
  flex: 0 0 190px;
  height: 160px;
}
.hero-orbit i {
  position: absolute;
  inset: 20px;
  border: 1px dashed rgba(50, 117, 82, 0.28);
  border-radius: 50%;
}
.hero-orbit > span {
  position: absolute;
  top: 0;
  right: 20px;
  font-size: 3.4rem;
}
.hero-orbit b {
  position: absolute;
  bottom: 5px;
  left: 10px;
  font-size: 3rem;
}
.search-shell {
  position: relative;
  margin-top: 20px;
}
.dashboard-section {
  margin-top: 34px;
}
.section-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 14px;
}
.section-title h2 {
  margin-top: 3px;
  color: var(--ink-900);
  font-size: 1.35rem;
}
.section-title small {
  color: var(--ink-500);
  font-size: 0.72rem;
  text-align: right;
}
.selected-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  margin-top: 34px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  padding: 24px 28px;
  background: linear-gradient(115deg, rgba(43, 112, 78, 0.96), rgba(67, 137, 107, 0.9));
  box-shadow: var(--shadow-float);
  color: white;
}
.selected-banner > div > span {
  color: rgba(255, 255, 255, 0.65);
}
.selected-banner h2 {
  margin: 3px 0 0;
  font-size: 1.75rem;
}
.selected-banner p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.76rem;
}
.selected-stats {
  display: grid;
  min-width: 500px;
  grid-template-columns: repeat(4, 1fr);
}
.selected-stats span {
  display: grid;
  border-left: 1px solid rgba(255, 255, 255, 0.17);
  padding: 5px 22px;
}
.selected-stats small {
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.65rem;
}
.selected-stats strong {
  margin-top: 2px;
  font-size: 1.1rem;
}
.recommendation-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 16px;
  margin-top: 34px;
}
.page-state {
  display: grid;
  min-height: 300px;
  place-items: center;
  color: var(--ink-500);
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
@media (max-width: 900px) {
  .hero-orbit {
    display: none;
  }
  .selected-banner {
    align-items: stretch;
    flex-direction: column;
  }
  .selected-stats {
    min-width: 0;
  }
  .recommendation-grid {
    grid-template-columns: 1fr;
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
  .section-title {
    align-items: start;
    flex-direction: column;
    gap: 4px;
  }
  .section-title small {
    text-align: left;
  }
  .selected-banner {
    padding: 22px;
  }
  .selected-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 0;
  }
}
</style>
