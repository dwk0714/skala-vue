<script setup>
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import hailWalkImage from '../../assets/images/walk/walk-hail.jpg'
import rainyWalkImage from '../../assets/images/walk/walk-rainy.jpg'
import snowWalkImage from '../../assets/images/walk/walk-snow.jpg'
import sunnyWalkImage from '../../assets/images/walk/walk-sunny.jpg'
import thunderWalkImage from '../../assets/images/walk/walk-thunder.jpg'
import BaseDashboardCard from '../../components/weather/shared/BaseDashboardCard.vue'
import IndexGrid from '../../components/weather/indices/IndexGrid.vue'
import PreparationPanel from '../../components/weather/recommendations/PreparationPanel.vue'
import WalkTimePanel from '../../components/weather/recommendations/WalkTimePanel.vue'
import WeatherMusicPanel from '../../components/weather/recommendations/WeatherMusicPanel.vue'
import { useTemperature } from '../../composables/useTemperature.js'
import { useWeatherStore } from '../../stores/weatherStore.js'
import { computeIndices } from '../../utils/indices/index.js'
import { getMusicRecommendations } from '../../utils/recommendations/music.js'
import { getOutingBriefing, getPreparationItems } from '../../utils/recommendations/preparation.js'
import { getWalkWeatherType, getWalkableHours } from '../../utils/recommendations/walkTimes.js'

/** 날씨 분류값과 번들 이미지의 단순 매핑. */
const WALK_IMAGES = {
  sunny: sunnyWalkImage,
  rain: rainyWalkImage,
  thunder: thunderWalkImage,
  snow: snowWalkImage,
  hail: hailWalkImage,
}

const store = useWeatherStore()
const { displayTemperature, unitSymbol } = useTemperature()
const { selectedCity, cityLoadStatus, loadStatus, error } = storeToRefs(store)

const indices = computed(() => (selectedCity.value ? computeIndices(selectedCity.value) : []))
const outdoorIndex = computed(() => indices.value.find((index) => index.id === 'outdoor-activity'))
const preparationItems = computed(() =>
  selectedCity.value ? getPreparationItems(selectedCity.value) : [],
)
const walkableHours = computed(() =>
  selectedCity.value ? getWalkableHours(selectedCity.value.hourly) : [],
)
/** 선택 도시의 수치를 오늘 바로 실행할 수 있는 한두 문장으로 요약한다. */
const outingBriefing = computed(() => {
  const city = selectedCity.value
  if (!city) return ''
  return `${city.name}은 현재 ${city.status}, 체감 ${displayTemperature(city.feelsLike)}${unitSymbol.value}예요. ${getOutingBriefing(city, walkableHours.value)}`
})
/** 현재·시간대별 예보에서 맑음, 비, 천둥, 눈, 우박 중 표시할 장면을 고른다. */
const walkWeatherType = computed(() => getWalkWeatherType(selectedCity.value))
/** 정적 이미지는 번들에 포함되어 날씨 분류가 바뀌면 네트워크 요청 없이 즉시 전환된다. */
const walkImage = computed(() => WALK_IMAGES[walkWeatherType.value])
/** 같은 도시·같은 날짜에는 순서가 유지되는 날씨별 음악 후보들. */
const musicRecommendations = computed(() =>
  selectedCity.value ? getMusicRecommendations(selectedCity.value) : [],
)
const detailStatus = computed(() => cityLoadStatus.value[selectedCity.value?.id] ?? 'idle')

watch(
  selectedCity,
  (city) => {
    if (city) store.ensureCityDetails(city.id)
  },
  { immediate: true },
)

onMounted(() => store.loadCities())
</script>

<template>
  <main class="indices-page">
    <header class="page-heading">
      <div>
        <span>LIFE INDICES</span>
        <h1>생활 날씨 지수</h1>
      </div>
      <RouterLink to="/weather">지역 날씨에서 도시 변경 →</RouterLink>
    </header>

    <section
      v-if="
        (!selectedCity && (loadStatus === 'idle' || loadStatus === 'loading')) ||
        (selectedCity && (detailStatus === 'idle' || detailStatus === 'loading'))
      "
      class="page-state"
    >
      <ElSkeleton :rows="8" animated />
    </section>
    <ElResult
      v-else-if="loadStatus === 'error' || detailStatus === 'error'"
      icon="error"
      title="생활 지수를 계산하지 못했어요"
      :sub-title="error"
    />

    <template v-else-if="selectedCity">
      <section class="selected-banner">
        <div>
          <span>SELECTED CITY</span>
          <h2>{{ selectedCity.name }}</h2>
          <p>{{ selectedCity.state }} · {{ selectedCity.status }}</p>
        </div>
        <div class="selected-stats">
          <span
            ><small>현재</small
            ><strong>{{ displayTemperature(selectedCity.temp) }}{{ unitSymbol }}</strong></span
          >
          <span
            ><small>체감</small
            ><strong>{{ displayTemperature(selectedCity.feelsLike) }}{{ unitSymbol }}</strong></span
          >
          <span
            ><small>습도</small><strong>{{ selectedCity.humidity }}%</strong></span
          >
          <span
            ><small>활동</small><strong>{{ outdoorIndex?.score }}점</strong></span
          >
        </div>
      </section>

      <BaseDashboardCard
        class="indices-panel"
        eyebrow="DAILY SCORES"
        :title="`${selectedCity.name} 생활 날씨 지수`"
        title-id="indices-title"
      >
        <!-- 생활 지수 제목 바로 아래에서 오늘의 핵심 행동을 먼저 안내한다. -->
        <section class="outing-briefing" aria-labelledby="outing-briefing-title">
          <strong id="outing-briefing-title">☀️ 오늘의 외출 브리핑</strong>
          <p>{{ outingBriefing }}</p>
        </section>
        <WeatherMusicPanel :recommendations="musicRecommendations" />
        <IndexGrid :indices="indices" />
      </BaseDashboardCard>

      <section class="recommendation-grid">
        <PreparationPanel :city-name="selectedCity.name" :items="preparationItems" />
        <WalkTimePanel
          :city="selectedCity"
          :available-hours="walkableHours"
          :image="walkImage"
          :weather-type="walkWeatherType"
        />
      </section>
    </template>
  </main>
</template>

<style scoped>
.indices-page {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 44px 0 50px;
}

.page-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.page-heading span,
.selected-banner > div > span {
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

.page-heading a {
  flex: 0 0 auto;
  color: var(--primary-700);
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: none;
}

.selected-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  padding: 24px 28px;
  background: linear-gradient(135deg, #3879c9 0%, #285fa8 48%, #1b467f 100%);
  box-shadow: var(--shadow-float);
  color: var(--text-on-accent);
  text-shadow: 0 1px 2px rgba(3, 24, 49, 0.24);
}

.selected-banner > div > span {
  color: rgba(255, 255, 255, 0.9);
}

.selected-banner h2 {
  margin: 3px 0 0;
  color: #fff;
  font-size: 1.75rem;
}

.selected-banner p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.76rem;
}

.selected-stats {
  display: grid;
  min-width: 500px;
  grid-template-columns: repeat(4, 1fr);
}

.selected-stats span {
  display: grid;
  border-left: 1px solid rgba(255, 255, 255, 0.34);
  padding: 5px 22px;
}

.selected-stats small {
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.65rem;
}

.selected-stats strong {
  margin-top: 2px;
  color: #fff;
  font-size: 1.1rem;
}

.indices-panel {
  --card-heading-align: end;
  --card-heading-gap: 18px;
  --card-heading-margin: 18px;
  --card-eyebrow-color: var(--primary-700);
  --card-eyebrow-weight: 850;
  --card-title-size: 1.35rem;
  margin-top: 24px;
}

/* 지수 숫자를 보기 전에 오늘 필요한 행동을 읽을 수 있는 짧은 요약 영역. */
.outing-briefing {
  margin-bottom: 16px;
  border: 1px solid color-mix(in srgb, var(--primary-500) 20%, var(--border-soft));
  border-radius: 16px;
  padding: 14px 16px;
  background: linear-gradient(135deg, var(--surface-soft), rgba(87, 176, 255, 0.14));
}

.outing-briefing strong {
  color: var(--primary-800);
  font-size: 0.82rem;
}

.outing-briefing p {
  margin: 5px 0 0;
  color: var(--ink-700);
  font-size: 0.78rem;
  line-height: 1.65;
}

.recommendation-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 16px;
  margin-top: 24px;
}

.page-state {
  display: grid;
  min-height: 55vh;
  place-items: center;
  color: var(--ink-500);
}

.page-state.error {
  color: #a04f40;
}

@media (max-width: 900px) {
  .page-heading,
  .selected-banner {
    align-items: start;
    flex-direction: column;
  }

  .selected-stats {
    width: 100%;
    min-width: 0;
  }

  .recommendation-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 580px) {
  .indices-page {
    width: min(100% - 20px, 1240px);
    padding-top: 28px;
  }

  .selected-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 0;
  }

  .indices-panel {
    --card-heading-align: start;
    --card-heading-direction: column;
    --card-heading-gap: 4px;
    --card-meta-margin-left: 0;
  }
}
</style>
