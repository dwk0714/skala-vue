<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Flag } from '@element-plus/icons-vue'
import FortuneModal from '../../components/weather/game/FortuneModal.vue'
import BaseDashboardCard from '../../components/weather/shared/BaseDashboardCard.vue'
import { useTemperature } from '../../composables/useTemperature.js'
import { useWeatherStore } from '../../stores/weatherStore.js'
import { compareCities } from '../../utils/weatherBattle.js'

const store = useWeatherStore()
const { cities, cityLoadStatus, loadStatus, error } = storeToRefs(store)
const { displayTemperature, unitSymbol } = useTemperature()
const leftCityId = ref('kr-seoul')
const rightCityId = ref('kr-busan')
const fortuneOpen = ref(false)

const leftCity = computed(() => cities.value.find((city) => city.id === leftCityId.value) ?? null)
const rightCity = computed(() => cities.value.find((city) => city.id === rightCityId.value) ?? null)
const detailsReady = computed(
  () =>
    cityLoadStatus.value[leftCityId.value] === 'success' &&
    cityLoadStatus.value[rightCityId.value] === 'success',
)
const detailsLoading = computed(() =>
  [leftCityId.value, rightCityId.value].some((id) =>
    ['idle', 'loading'].includes(cityLoadStatus.value[id]),
  ),
)
const detailError = computed(() =>
  [leftCityId.value, rightCityId.value].some((id) => cityLoadStatus.value[id] === 'error'),
)
const result = computed(() =>
  detailsReady.value &&
  leftCity.value &&
  rightCity.value &&
  leftCity.value.id !== rightCity.value.id
    ? compareCities(leftCity.value, rightCity.value)
    : null,
)

const ensureSelections = () => {
  if (!leftCity.value) leftCityId.value = cities.value[0]?.id ?? ''
  if (!rightCity.value || rightCityId.value === leftCityId.value)
    rightCityId.value = cities.value.find((city) => city.id !== leftCityId.value)?.id ?? ''
}

watch(
  [leftCity, rightCity],
  async ([left, right]) => {
    const ids = [left?.id, right?.id].filter(Boolean)
    await Promise.all(ids.map((id) => store.ensureCityDetails(id)))
  },
  { immediate: true },
)

onMounted(async () => {
  await store.loadCities()
  ensureSelections()
})
</script>

<template>
  <main class="battle-page">
    <header class="page-heading">
      <div>
        <!-- 공식 로고 대신 속도선을 활용한 WEATHER GP 고유 워드마크. -->
        <div class="race-brand">
          <i aria-hidden="true"></i>
          <b>WEATHER GP</b>
          <small>GRAND PRIX SERIES</small>
        </div>
        <h1>오늘의 도시 대결</h1>
        <p>두 도시가 5개의 생활 날씨 지수로 대결을 펼치는 오늘의 그랑프리.</p>
      </div>
      <ElButton
        class="fortune-trigger"
        type="primary"
        round
        :icon="Flag"
        @click="fortuneOpen = true"
        >피트월 운세</ElButton
      >
    </header>

    <ElResult
      v-if="loadStatus === 'error' || detailError"
      icon="error"
      title="날씨를 불러오지 못했어요"
      :sub-title="error"
    />
    <ElSkeleton
      v-else-if="
        ((loadStatus === 'idle' || loadStatus === 'loading') && (!leftCity || !rightCity)) ||
        (leftCity && rightCity && detailsLoading)
      "
      class="page-state"
      :rows="7"
      animated
    />
    <ElEmpty v-else-if="cities.length < 2" description="대결하려면 도시가 두 곳 이상 필요해요." />

    <template v-else-if="result">
      <BaseDashboardCard
        class="battle-arena"
        eyebrow="CHOOSE YOUR CITIES"
        title="도시 선택"
        title-id="battle-picker-title"
      >
        <div class="city-pickers">
          <article class="city-side left">
            <label for="left-city">첫 번째 도시</label>
            <ElSelect id="left-city" v-model="leftCityId" @change="ensureSelections">
              <ElOption
                v-for="city in cities"
                :key="city.id"
                :value="city.id"
                :label="city.name"
                :disabled="city.id === rightCityId"
              />
            </ElSelect>
            <strong>{{ leftCity.name }}</strong>
            <span
              >{{ leftCity.status }} · {{ displayTemperature(leftCity.temp) }}{{ unitSymbol }}</span
            >
            <b>종합 {{ result.leftTotal }}점</b>
            <!-- 선택을 바꾸지 않고 해당 도시의 관측 상세로 이동한다. -->
            <RouterLink
              class="city-detail"
              :to="{ name: 'weather-detail', params: { cityId: leftCity.id } }"
              >상세보기 →</RouterLink
            >
          </article>

          <div class="versus" aria-hidden="true">VS</div>

          <article class="city-side right">
            <label for="right-city">두 번째 도시</label>
            <ElSelect id="right-city" v-model="rightCityId" @change="ensureSelections">
              <ElOption
                v-for="city in cities"
                :key="city.id"
                :value="city.id"
                :label="city.name"
                :disabled="city.id === leftCityId"
              />
            </ElSelect>
            <strong>{{ rightCity.name }}</strong>
            <span
              >{{ rightCity.status }} · {{ displayTemperature(rightCity.temp)
              }}{{ unitSymbol }}</span
            >
            <b>종합 {{ result.rightTotal }}점</b>
            <!-- 양쪽 카드 모두 같은 위치와 동작을 사용해 비교 흐름을 유지한다. -->
            <RouterLink
              class="city-detail"
              :to="{ name: 'weather-detail', params: { cityId: rightCity.id } }"
              >상세보기 →</RouterLink
            >
          </article>
        </div>
      </BaseDashboardCard>

      <section class="winner-banner" :class="{ draw: !result.winner }" aria-live="polite">
        <span>{{ result.winner ? 'TODAY’S WINNER' : 'PERFECT DRAW' }}</span>
        <h2 v-if="result.winner">{{ result.winner.name }} 승리!</h2>
        <h2 v-else>오늘은 완벽한 무승부!</h2>
      </section>

      <BaseDashboardCard
        class="round-panel"
        eyebrow="FIVE ROUNDS"
        title="지수별 대결 결과"
        title-id="battle-rounds-title"
      >
        <div class="round-list">
          <article v-for="(round, roundIndex) in result.rounds" :key="round.id" class="round-card">
            <div class="round-heading">
              <em>R{{ roundIndex + 1 }}</em>
              <span aria-hidden="true">{{ round.icon }}</span>
              <strong>{{ round.label }}</strong>
            </div>
            <div class="score-line">
              <b :class="{ winner: round.winner?.id === leftCity.id }">{{ round.leftScore }}</b>
              <span>:</span>
              <b :class="{ winner: round.winner?.id === rightCity.id }">{{ round.rightScore }}</b>
            </div>
            <small v-if="round.winner">{{ round.winner.name }} 라운드 승리</small>
            <small v-else>라운드 무승부</small>
          </article>
        </div>
      </BaseDashboardCard>
    </template>

    <FortuneModal :open="fortuneOpen" @close="fortuneOpen = false" />
  </main>
</template>

<style scoped>
.battle-page {
  --race-red: #e10600;
  --race-red-dark: #8f0502;
  --ink-900: #f7f7f8;
  --ink-800: #e5e6e8;
  --ink-700: #c8cbd0;
  --ink-600: #a9adb5;
  --ink-500: #858b95;
  --ink-400: #676d76;
  --surface-card: rgba(24, 26, 30, 0.94);
  --surface-soft: rgba(255, 255, 255, 0.055);
  --surface-muted: rgba(255, 255, 255, 0.08);
  --border-soft: rgba(255, 255, 255, 0.12);
  --primary-700: #ff3933;
  --primary-800: #ff6b66;
  --accent-gradient: linear-gradient(120deg, var(--race-red), var(--race-red-dark));
  position: relative;
  isolation: isolate;
  width: min(1120px, calc(100% - 32px));
  min-height: calc(100vh - 74px);
  margin: 0 auto;
  padding: 44px 0 54px;
  color: var(--ink-700);
  font-family: 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif;
}

/* 페이지 안에서만 적용되는 아스팔트와 붉은 레이싱 라인 배경. */
.battle-page::before {
  position: absolute;
  z-index: -1;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 100vw;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(110deg, transparent 0 64%, rgba(225, 6, 0, 0.13) 64% 68%, transparent 68%),
    repeating-linear-gradient(125deg, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 16px),
    radial-gradient(circle at 72% 8%, #363541 0, #1c1d23 38%, #101116 76%);
  content: '';
  transform: translateX(-50%);
}

.page-heading {
  position: relative;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  min-height: 310px;
  margin-bottom: 28px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-top: 3px solid var(--race-red);
  border-radius: 10px;
  padding: clamp(28px, 5vw, 52px);
  background:
    linear-gradient(
      90deg,
      rgba(12, 13, 18, 0.88) 0%,
      rgba(12, 13, 18, 0.66) 39%,
      rgba(10, 10, 15, 0.12) 70%,
      rgba(8, 8, 12, 0.02)
    ),
    url('../../assets/images/battle/weather-grand-prix.jpg') center / cover;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.34);
}

/* 작게 들어간 체커 패턴이 이 페이지가 미니게임임을 바로 보여준다. */
.page-heading::after {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 104px;
  height: 9px;
  background: conic-gradient(#f7f7f8 25%, #18191d 0 50%, #f7f7f8 0 75%, #18191d 0) 0 / 18px 18px;
  content: '';
}

.race-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-style: italic;
}

/* 세 개의 속도선은 이미지가 아니라 CSS로 그려 고유 워드마크를 만든다. */
.race-brand i {
  width: 42px;
  height: 4px;
  flex: 0 0 auto;
  background: var(--race-red);
  box-shadow:
    8px 8px 0 var(--race-red),
    16px 16px 0 var(--race-red);
  transform: skewX(-32deg) translateY(-8px);
}

.race-brand b {
  color: #fff;
  font-size: 1.05rem;
  font-weight: 950;
  letter-spacing: -0.04em;
}

.race-brand small {
  align-self: flex-start;
  color: #ff4b46;
  font-size: 0.5rem;
  font-weight: 850;
  letter-spacing: 0.12em;
}

h1 {
  max-width: 620px;
  margin: 32px 0 7px;
  color: #fff;
  font-size: clamp(2rem, 5vw, 3.4rem);
  font-style: italic;
  font-weight: 900;
  letter-spacing: -0.06em;
  text-transform: uppercase;
}

.page-heading p {
  max-width: 520px;
  margin: 0;
  color: #9da1aa;
}

.fortune-trigger {
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 5px;
  padding: 12px 17px;
  background: linear-gradient(110deg, var(--race-red), #a90502);
  box-shadow: 0 12px 30px rgba(225, 6, 0, 0.24);
  color: white;
  cursor: pointer;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.battle-arena,
.round-panel {
  --card-bg: rgba(14, 15, 18, 0.88);
  --card-eyebrow-color: #ff3933;
  --card-eyebrow-weight: 900;
  border-color: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  box-shadow: 0 20px 54px rgba(0, 0, 0, 0.34);
}

.city-pickers {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: stretch;
  gap: 18px;
}

.city-side {
  position: relative;
  display: grid;
  min-width: 0;
  gap: 5px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 28px 24px 22px;
  background: linear-gradient(145deg, #22242a, #111216 70%);
}

.city-side.left {
  border-top: 4px solid var(--race-red);
}

.city-side.right {
  border-top: 4px solid #f0f1f3;
  text-align: right;
}

.city-side::before {
  position: absolute;
  top: 9px;
  color: #ff3933;
  font-size: 0.55rem;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.16em;
}

.city-side.left::before {
  left: 24px;
  content: 'GRID 01';
}

.city-side.right::before {
  right: 24px;
  color: #d9dce1;
  content: 'GRID 02';
}

.city-side label {
  color: var(--ink-400);
  font-size: 0.66rem;
  font-weight: 800;
}

.el-select {
  width: 100%;
  margin: 6px 0 16px;
}

:deep(.city-side .el-select__wrapper) {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: #0c0d10;
  box-shadow: none;
}

:deep(.city-side .el-select__selected-item),
:deep(.city-side .el-select__placeholder) {
  color: #f2f3f5;
}

.city-side strong {
  color: var(--ink-900);
  font-size: 1.7rem;
}

.city-side span {
  color: var(--ink-500);
  font-size: 0.76rem;
}

.city-side b {
  margin-top: 14px;
  color: var(--primary-800);
  font-size: 1.35rem;
}

/* 두 도시 카드의 우측 하단 상세 이동 버튼. */
.city-detail {
  justify-self: end;
  margin-top: 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 4px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #f2f3f5;
  font-size: 0.7rem;
  font-weight: 850;
  text-decoration: none;
  transition:
    transform 160ms ease,
    background 160ms ease;
}

.city-detail:hover {
  border-color: var(--race-red);
  background: rgba(225, 6, 0, 0.16);
  transform: translateY(-1px);
}

.versus {
  display: grid;
  width: 60px;
  height: 52px;
  align-self: center;
  place-items: center;
  background: linear-gradient(120deg, #f01b15, #9f0300);
  box-shadow: 0 12px 28px rgba(225, 6, 0, 0.3);
  clip-path: polygon(12% 0, 100% 0, 88% 100%, 0 100%);
  color: white;
  font-size: 0.86rem;
  font-style: italic;
  font-weight: 900;
}

.winner-banner {
  position: relative;
  overflow: hidden;
  margin-top: 20px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  padding: 34px 28px 28px;
  background: linear-gradient(115deg, #8f0502, #e10600 42%, #310404 100%);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.42);
  color: white;
  text-align: center;
}

.winner-banner::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 10px;
  background: conic-gradient(#fff 25%, #15161a 0 50%, #fff 0 75%, #15161a 0) 0 / 20px 20px;
  content: '';
}

.winner-banner.draw {
  background: linear-gradient(115deg, #292c31, #555b64, #17191c);
}

.winner-banner span {
  font-size: 0.64rem;
  font-weight: 850;
  letter-spacing: 0.18em;
}

.winner-banner h2 {
  margin: 5px 0 2px;
  font-size: clamp(1.7rem, 4vw, 2.5rem);
  font-style: italic;
  font-weight: 900;
}

.round-panel {
  margin-top: 20px;
}

.round-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.round-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 7px;
  padding: 16px;
  background: linear-gradient(160deg, #22242a, #101115);
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.round-card:hover {
  border-color: rgba(225, 6, 0, 0.7);
  transform: translateY(-2px);
}

.round-heading {
  display: grid;
  gap: 7px;
}

.round-heading em {
  color: #ff3933;
  font-size: 0.58rem;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.round-heading span {
  font-size: 1.25rem;
}

.round-heading strong {
  color: var(--ink-700);
  font-size: 0.78rem;
}

.score-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0 8px;
  color: var(--ink-400);
}

.score-line b {
  color: var(--ink-500);
  font-size: 1.35rem;
}

.score-line b.winner {
  color: #ff3933;
  text-shadow: 0 0 18px rgba(225, 6, 0, 0.36);
}

.round-card small {
  color: var(--ink-700);
  font-size: 0.62rem;
}

.page-state {
  display: grid;
  min-height: 55vh;
  place-items: center;
  color: var(--ink-500);
}

.page-state.error {
  color: #c04f45;
}

@media (max-width: 900px) {
  .round-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 660px) {
  .battle-page {
    width: min(100% - 20px, 1120px);
    padding-top: 28px;
  }

  .page-heading {
    align-items: start;
    flex-direction: column;
    min-height: 360px;
    background-position: 62% center;
  }

  .race-brand small {
    display: none;
  }

  .city-pickers {
    grid-template-columns: 1fr;
  }

  .versus {
    margin: -2px auto;
  }

  .city-side.right {
    text-align: left;
  }

  .round-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .round-list {
    grid-template-columns: 1fr;
  }
}
</style>
