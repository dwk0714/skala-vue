<script setup>
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import BaseDashboardCard from '../../components/weather/shared/BaseDashboardCard.vue'
import { useTemperature } from '../../composables/useTemperature.js'
import { useWeatherStore } from '../../stores/weatherStore.js'
import { getTodayForecast } from '../../utils/recommendations/walkTimes.js'
import { getPm10Level } from '../../utils/weatherModel.js'

const route = useRoute()
const store = useWeatherStore()
const { displayTemperature, unitSymbol } = useTemperature()
const { cities, cityLoadStatus, loadStatus, error } = storeToRefs(store)

const city = computed(() => cities.value.find((item) => item.id === route.params.cityId) ?? null)
const updatedText = computed(() =>
  city.value ? new Date(city.value.updatedAt).toLocaleString('ko-KR') : '',
)
/** 도시 현지 날짜의 03시부터 24시까지 고정된 예보 8칸만 화면에 제공한다. */
const todayForecast = computed(() =>
  city.value ? getTodayForecast(city.value.hourly, city.value.timezone) : null,
)
/** 일별 타임스탬프를 도시 현지 날짜와 요일로 표시한다. */
const formatDailyDate = (timestamp) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'UTC',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date((timestamp + city.value.timezone) * 1000))

/** 대표 날씨를 텍스트와 함께 빠르게 구분할 수 있는 아이콘으로 바꾼다. */
const weatherIcon = (status) => {
  if (status.includes('눈')) return '❄️'
  if (status.includes('뇌우')) return '⛈️'
  if (status.includes('비')) return '🌧️'
  if (status.includes('흐림')) return '☁️'
  if (status.includes('안개') || status.includes('연무')) return '🌫️'
  return '☀️'
}

/** 선택 필드가 빠진 응답에서도 잘못된 32°F가 표시되지 않도록 결측값을 구분한다. */
const formatDailyTemperature = (temperature) =>
  temperature === null || temperature === undefined
    ? '-'
    : `${displayTemperature(temperature)}${unitSymbol.value}`

/** OpenWeather가 제공한 날짜별 묶음 중 오늘부터 최대 5일만 보여준다. */
const dailyForecast = computed(() => city.value?.forecast.slice(0, 5) ?? [])
/** 소수 PM10을 반올림한 수치와 사람이 읽는 5단계 등급으로 함께 보여준다. */
const pm10Info = computed(() => getPm10Level(city.value?.pm10))
const detailStatus = computed(() => cityLoadStatus.value[city.value?.id] ?? 'idle')

watch(
  city,
  async (currentCity) => {
    if (currentCity) {
      store.selectCity(currentCity.id)
      await store.ensureCityDetails(currentCity.id)
    }
  },
  { immediate: true },
)

onMounted(() => store.loadCities())
</script>

<template>
  <main class="detail-page">
    <section
      v-if="
        (!city && (loadStatus === 'idle' || loadStatus === 'loading')) ||
        (city && (detailStatus === 'idle' || detailStatus === 'loading'))
      "
      class="page-state"
    >
      <ElSkeleton :rows="8" animated />
    </section>
    <ElResult
      v-else-if="loadStatus === 'error' || detailStatus === 'error'"
      icon="error"
      title="도시 관측 데이터를 불러오지 못했어요"
      :sub-title="error"
    />

    <template v-else-if="city">
      <header class="detail-hero">
        <div>
          <span>CITY OBSERVATION</span>
          <h1>{{ city.name }}</h1>
          <p>{{ city.state }} · {{ city.status }} · {{ updatedText }} 기준</p>
        </div>
        <strong
          >{{ displayTemperature(city.temp) }}<small>{{ unitSymbol }}</small></strong
        >
      </header>

      <BaseDashboardCard
        class="observation-panel"
        eyebrow="CURRENT WEATHER"
        title="현재 기상 관측"
        title-id="observation-title"
      >
        <dl class="observation-grid">
          <div>
            <dt>현재 기온</dt>
            <dd>{{ displayTemperature(city.temp) }}{{ unitSymbol }}</dd>
          </div>
          <div>
            <dt>체감 기온</dt>
            <dd>{{ displayTemperature(city.feelsLike) }}{{ unitSymbol }}</dd>
          </div>
          <div>
            <dt>습도</dt>
            <dd>{{ city.humidity }}%</dd>
          </div>
          <div>
            <dt>풍속</dt>
            <dd>{{ city.windSpeed }}m/s</dd>
          </div>
          <div>
            <dt>강수확률</dt>
            <dd>{{ Math.round(city.pop * 100) }}%</dd>
          </div>
          <div>
            <dt>미세먼지 PM10</dt>
            <dd class="pm10-reading">
              {{ pm10Info.value }}㎍/㎥
              <span :data-level="pm10Info.level">{{ pm10Info.label }}</span>
            </dd>
          </div>
          <div>
            <dt>위도</dt>
            <dd>{{ city.coords.lat.toFixed(4) }}</dd>
          </div>
          <div>
            <dt>경도</dt>
            <dd>{{ city.coords.lon.toFixed(4) }}</dd>
          </div>
        </dl>
      </BaseDashboardCard>

      <BaseDashboardCard
        class="hourly-panel"
        eyebrow="HOURLY FORECAST"
        title="오늘 시간대별 예보"
        title-id="hourly-title"
      >
        <!-- 날짜를 카드 바로 위에 두어 여러 날의 같은 시각으로 오해하지 않게 한다. -->
        <div class="forecast-date">
          <strong>{{ todayForecast.dateLabel }}</strong>
          <span>오늘 · 3시간 간격</span>
        </div>
        <div class="hourly-list">
          <article
            v-for="slot in todayForecast.slots"
            :key="slot.hour"
            :class="{ unavailable: !slot.forecast }"
          >
            <strong>{{ slot.label }}</strong>
            <template v-if="slot.forecast">
              <span>{{ slot.forecast.status }}</span>
              <b class="hourly-temperature">
                온도 {{ displayTemperature(slot.forecast.temp) }}{{ unitSymbol }}
              </b>
              <small>강수 {{ Math.round(slot.forecast.pop * 100) }}%</small>
            </template>
            <!-- 이미 지난 시간처럼 API가 주지 않은 값은 임의로 만들지 않는다. -->
            <span v-else class="unavailable-message">예보 없음</span>
          </article>
        </div>
      </BaseDashboardCard>

      <BaseDashboardCard
        class="daily-panel"
        eyebrow="5-DAY FORECAST"
        title="5일 일별 예보"
        title-id="daily-title"
      >
        <!-- 날짜별 최저·최고 기온과 눈·비 여부만 간결하게 표시한다. -->
        <div class="daily-list">
          <article v-for="day in dailyForecast" :key="day.dt">
            <strong>{{ formatDailyDate(day.dt) }}</strong>
            <span class="daily-icon" aria-hidden="true">{{ weatherIcon(day.status) }}</span>
            <b>{{ day.status }}</b>
            <div class="temperature-range">
              <span>최저 {{ formatDailyTemperature(day.tempMin) }}</span>
              <strong>최고 {{ formatDailyTemperature(day.tempMax) }}</strong>
            </div>
          </article>
        </div>
      </BaseDashboardCard>

      <nav class="detail-actions" aria-label="도시 상세 이동">
        <RouterLink to="/weather">← 지역 날씨로 돌아가기</RouterLink>
        <RouterLink to="/indices">{{ city.name }} 생활 지수 보기 →</RouterLink>
      </nav>
    </template>

    <ElEmpty v-else description="해당 도시를 찾을 수 없어요.">
      <RouterLink to="/weather">지역 날씨로 돌아가기</RouterLink>
    </ElEmpty>
  </main>
</template>

<style scoped>
.detail-page {
  width: min(1060px, calc(100% - 32px));
  margin: 0 auto;
  padding: 34px 0 50px;
}

.detail-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 28px;
  border-radius: 28px;
  padding: clamp(28px, 5vw, 50px);
  border: 1px solid var(--border-soft);
  background: var(--hero-bg);
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--glass-blur);
}

.detail-hero span {
  color: var(--primary-700);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.16em;
}

h1 {
  margin: 6px 0;
  color: var(--ink-900);
}

.detail-hero h1 {
  font-size: clamp(2.2rem, 6vw, 4.6rem);
  letter-spacing: -0.06em;
}

.detail-hero p {
  margin: 0;
  color: var(--ink-500);
}

.detail-hero > strong {
  flex: 0 0 auto;
  color: var(--ink-900);
  font-size: clamp(3rem, 8vw, 6rem);
  letter-spacing: -0.08em;
}

.detail-hero > strong small {
  font-size: 0.38em;
}

.observation-panel,
.hourly-panel,
.daily-panel {
  --card-heading-margin: 20px;
  --card-eyebrow-color: var(--primary-700);
  --card-eyebrow-weight: 800;
  margin-top: 24px;
}

.observation-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.observation-grid div,
.hourly-list article,
.daily-list article {
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  padding: 15px;
  background: var(--surface-soft);
}

.observation-grid dt {
  color: var(--ink-400);
  font-size: 0.68rem;
}

.observation-grid dd {
  margin: 5px 0 0;
  color: var(--ink-800);
  font-size: 1rem;
  font-weight: 800;
}

/* 미세먼지 등급은 숫자 옆 색상 배지로 한눈에 구분한다. */
.pm10-reading span {
  display: inline-block;
  margin-left: 5px;
  border-radius: 999px;
  padding: 3px 7px;
  background: var(--surface-muted);
  font-size: 0.62rem;
  vertical-align: middle;
}

.pm10-reading span[data-level='very-good'] {
  background: color-mix(in srgb, #35a8ff 18%, var(--surface-card));
  color: #1476bd;
}

.pm10-reading span[data-level='good'] {
  background: color-mix(in srgb, #36b878 18%, var(--surface-card));
  color: #18794e;
}

.pm10-reading span[data-level='normal'] {
  background: color-mix(in srgb, #f0b429 20%, var(--surface-card));
  color: #946200;
}

.pm10-reading span[data-level='bad'] {
  background: color-mix(in srgb, #f07d32 20%, var(--surface-card));
  color: #b44c14;
}

.pm10-reading span[data-level='very-bad'] {
  background: color-mix(in srgb, #d94b64 20%, var(--surface-card));
  color: #a3273f;
}

.hourly-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

/* 오늘 날짜와 데이터 간격을 시간 카드 바로 위에서 설명한다. */
.forecast-date {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--ink-700);
}

.forecast-date strong {
  font-size: 0.95rem;
}

.forecast-date span {
  color: var(--ink-400);
  font-size: 0.68rem;
}

.hourly-list article {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 10px;
}

.hourly-list strong,
.hourly-list b {
  color: var(--ink-800);
}

.hourly-list span,
.hourly-list small {
  color: var(--ink-500);
  font-size: 0.7rem;
}

.hourly-list small {
  text-align: right;
}

/* 기온은 카드의 두 번째 줄 왼쪽에 고정해 강수확률과 바로 비교할 수 있게 한다. */
.hourly-list .hourly-temperature {
  text-align: left;
}

/* 지난 시간처럼 API 응답에 없는 슬롯은 흐리게 구분한다. */
.hourly-list article.unavailable {
  align-content: center;
  min-height: 76px;
  opacity: 0.58;
}

.hourly-list .unavailable-message {
  grid-column: 1 / -1;
}

/* 5일 예보는 한 날짜가 한 칸이 되도록 데스크톱에서 5열로 배치한다. */
.daily-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.daily-list article {
  display: grid;
  place-items: center;
  gap: 8px;
  text-align: center;
}

.daily-list > article > strong,
.daily-list > article > b {
  color: var(--ink-800);
  font-size: 0.8rem;
}

.daily-icon {
  font-size: 1.65rem;
}

.temperature-range {
  display: grid;
  gap: 3px;
  color: var(--ink-400);
  font-size: 0.67rem;
}

.temperature-range strong {
  color: var(--primary-700);
}

.detail-actions {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-top: 24px;
}

.detail-actions a,
:deep(.el-empty) a {
  color: var(--primary-700);
  font-size: 0.8rem;
  font-weight: 800;
  text-decoration: none;
}

.page-state {
  display: grid;
  min-height: 60vh;
  place-content: center;
  gap: 10px;
  color: var(--ink-500);
  text-align: center;
}

.page-state.error {
  color: #a04f40;
}

@media (max-width: 760px) {
  .detail-hero {
    align-items: start;
    flex-direction: column;
  }

  .observation-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hourly-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .daily-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .observation-grid {
    grid-template-columns: 1fr;
  }

  .forecast-date {
    align-items: start;
    flex-direction: column;
    gap: 3px;
  }

  .daily-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-actions {
    align-items: start;
    flex-direction: column;
  }
}
</style>
