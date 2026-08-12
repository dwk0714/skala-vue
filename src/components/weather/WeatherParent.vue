<!--
  WeatherParent.vue — 대시보드 전체를 조립하는 부모 컴포넌트 (과제 3 요건 1)

  어떤 컴포넌트인가:
    이 화면의 "지휘자". 반응형 상태를 모두 보유하고, 계산 유틸을 호출해 결과를 만들고,
    그 결과를 자식들에게 props로 내려보내고, 자식이 올린 emit을 받아 스토어에 위임한다.
    자기 자신은 계산식을 갖지 않는다 — 지수·준비물·산책 시간은 전부 utils/의 순수 함수가 계산한다.

    이 파일만 스토어(useWeatherStore)에 직접 접근한다. 자식 컴포넌트는 스토어를 모르며
    props/emit으로만 소통하므로, 다른 화면으로 그대로 옮겨 붙일 수 있다.

  부모:  views/WeatherDashboardView.vue (라우트 진입점, <WeatherParent /> 한 줄만 있음)
  자식:  BaseDashboardCard / SearchBar / CitySearchResults / WeatherCard
         IndexGrid / PreparationPanel / WalkTimePanel / LogPanel

  화면 구성 (위→아래):
    히어로 → 검색 패널 → 지역별 날씨 카드 → 선택 도시 배너
    → 생활 지수 → 준비물·산책 2단 → 로그 패널 → 푸터
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import BaseDashboardCard from './BaseDashboardCard.vue'
import SearchBar from './SearchBar.vue'
import CitySearchResults from './CitySearchResults.vue'
import IndexGrid from './IndexGrid.vue'
import LogPanel from './LogPanel.vue'
import PreparationPanel from './PreparationPanel.vue'
import WalkTimePanel from './WalkTimePanel.vue'
import WeatherCard from './WeatherCard.vue'
import { useWeatherStore } from '../../stores/weatherStore.js'
import { computeIndices } from '../../utils/indices/index.js'
import { log } from '../../utils/logger.js'
import { getPreparationItems } from '../../utils/recommendations/preparation.js'
import { getWalkableHours } from '../../utils/recommendations/walkTimes.js'

const store = useWeatherStore()

/*
  스토어 상태를 꺼낸다.
  storeToRefs를 쓰는 이유: 그냥 구조 분해하면 반응성이 끊겨 값이 갱신돼도 화면이 안 바뀐다.
  (액션은 반응성과 무관하므로 store.액션명() 형태로 직접 호출한다)

    cities         전체 도시 배열 (과제 문서의 weatherList)
    selectedCity   현재 선택된 도시 객체 (과제 문서의 selectedCityInfo)
    selectedCityId 선택된 도시의 id
    filteredCities 검색어로 걸러낸 도시 배열 (과제 문서의 filteredWeatherList)
    recentSearches 최근 검색어 최대 5개
    searchQuery    검색 입력값
    searchResults  카탈로그/Geocoding 검색 결과 (드롭다운용)
    searchStatus   검색 진행 상태 'idle' | 'loading' | 'success' | 'error'
    loadStatus     초기 로딩 상태. 화면 3분기(로딩/에러/본문)에 쓰인다
    error          에러 메시지 문자열
*/
const {
  cities,
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

/** 카드 헤더 우측에 뜨는 상태바 문구. 카드를 고르면 "{도시}이(가) 선택되었습니다."로 바뀐다 */
const selectionMessage = ref('도시 카드를 선택하면 맞춤 추천이 바뀝니다.')

/** 화면 로그 패널에 표시할 최근 로그. { id, text } 최대 20건, 최신이 앞 */
const logs = ref([])

/** 현재 시각(ms). 1분마다 갱신되며, 카드들의 "N분 전" 표기를 함께 최신화하는 단일 기준점 */
const now = ref(Date.now())

/** 산책 패널 일러스트 경로. 아직 이미지가 없어 빈 문자열이며, 준비되면 정적 import로 교체한다 */
const walkImage = ''
const stayHomeImage = ''

/** setInterval 핸들. onBeforeUnmount에서 정리하려고 보관한다 */
let clock

/** 선택 도시의 생활 지수 5종 결과 배열. 선택 도시가 없으면 빈 배열 → IndexGrid로 전달 */
const indices = computed(() => (selectedCity.value ? computeIndices(selectedCity.value) : []))

/** 위 배열에서 야외활동 지수만 뽑은 것. 선택 도시 배너의 "활동 N점"에 쓰인다 */
const outdoorIndex = computed(() => indices.value.find((index) => index.id === 'outdoor-activity'))

/** 선택 도시의 외출 준비물 목록 → PreparationPanel로 전달 */
const preparationItems = computed(() =>
  selectedCity.value ? getPreparationItems(selectedCity.value) : [],
)

/** 선택 도시의 걷기 좋은 시간대 → WalkTimePanel로 전달. 비어 있으면 danger 화면으로 전환된다 */
const walkableHours = computed(() =>
  selectedCity.value ? getWalkableHours(selectedCity.value.hourly) : [],
)

/** 검색 결과 드롭다운 노출 여부. 공백만 입력한 경우는 열지 않는다 */
const showSearchResults = computed(() => Boolean(searchQuery.value.trim()))

/**
 * 히어로 영역에 띄울 전체 도시 요약 지표. (과제 2 요건 5 — 본인 추가 computed)
 *
 * 입력: 없음 (cities를 읽는다)
 * 출력: { count, avgTemp, hottest, favoriteCount }
 *   - count        전체 도시 수
 *   - avgTemp      평균 기온, 소수 첫째 자리까지 반올림 (도시가 0개면 0)
 *   - hottest      최고 기온 도시 이름 (없으면 '-')
 *   - favoriteCount 즐겨찾기한 도시 수
 * 목적: 개별 카드를 훑지 않아도 전체 상황을 한 줄로 파악하게 한다.
 * 기능: reduce 한 번으로 최고 기온 도시를 찾고, 평균은 합계/개수로 계산한다.
 */
const dashboardSummary = computed(() => {
  const count = cities.value.length
  const hottest = cities.value.reduce(
    (current, city) => (!current || city.temp > current.temp ? city : current),
    null,
  )

  return {
    count,
    avgTemp: count
      ? Math.round((cities.value.reduce((sum, city) => sum + city.temp, 0) / count) * 10) / 10
      : 0,
    hottest: hottest?.name ?? '-',
    favoriteCount: cities.value.filter((city) => city.isFavorite).length,
  }
})
/**
 * 야외활동 지수가 가장 높은 도시. (과제 2 요건 5 — 본인 추가 computed)
 *
 * 입력: 없음 (cities를 읽는다)
 * 출력: {Object|null} 도시 객체. 도시가 하나도 없으면 null
 * 목적: "지금 어디가 제일 걷기 좋은가"를 히어로에 한 줄로 보여준다.
 * 기능: 모든 도시에 대해 지수를 계산해 야외활동 점수를 비교하고 최고점 도시를 고른다.
 *       computed라 결과가 캐시되며, cities가 바뀔 때만 다시 계산된다.
 */
const bestWalkCity = computed(() => {
  const winner = cities.value.reduce((best, city) => {
    const score = computeIndices(city).find((index) => index.id === 'outdoor-activity')?.score ?? 0
    return !best || score > best.score ? { city, score } : best
  }, null)

  return winner?.city ?? null
})

/**
 * 로그를 콘솔과 화면 패널에 동시에 남긴다.
 *
 * 입력: kind {string} 'watch' | 'watchEffect' | 'action' — 접두사 결정에 쓰인다
 *       message {string} 본문
 * 출력: 없음 (logs ref를 갱신하는 부수효과)
 * 목적: 콘솔을 열지 않고도 반응성이 언제 발화하는지 확인할 수 있게 한다.
 * 기능: logger.log()가 콘솔에 찍고 포맷된 문자열을 돌려주므로,
 *       그 문자열을 그대로 화면 배열에도 넣어 양쪽 내용이 항상 같게 유지한다.
 *       최신순으로 앞에 넣고 20건까지만 남긴다.
 */
const pushLog = (kind, message) => {
  logs.value = [{ id: Date.now() + Math.random(), text: log(kind, message) }, ...logs.value].slice(
    0,
    20,
  )
}

/* ────────────────────────────────────────────────────────────────
   감시자 6개.
   아래 첫 번째만 실제 동작(검색 실행)을 일으키고, 나머지 5개는 로그 전용이다.
   즉 2~6번을 모두 지워도 앱은 똑같이 동작한다.
   ──────────────────────────────────────────────────────────────── */

/** ① 유일한 기능성 watcher — 검색어가 바뀌면 스토어의 검색을 실행한다 (내부에서 300ms 디바운스) */
watch(searchQuery, (query) => store.searchCities(query))

/** ② 상태바 문구 감시 (과제 2 요건 3-a). 카드를 고르거나 도시를 추가할 때 발화한다 */
watch(selectionMessage, (newMessage) => {
  pushLog('watch', `상태 바 문구가 업데이트되었습니다 -> "${newMessage}"`)
})

/*
  ③ 검색어 감시 (과제 2 요건 3-b) — watchEffect
  감시 대상을 적지 않아도 콜백 안에서 읽은 searchQuery와 filteredCities가 자동 등록된다.
  watch와 달리 마운트 즉시 1회 실행되므로 페이지 진입 시점부터 로그가 남는다.
  queueMicrotask로 한 틱 미루는 이유: 이펙트 실행 중에 logs를 갱신하지 않기 위해서다.
*/
watchEffect(() => {
  const query = searchQuery.value
  const matchCount = filteredCities.value.length
  queueMicrotask(() =>
    pushLog(
      'watchEffect',
      `현재 검색어 '${query}'에 매칭되는 데이터를 필터링합니다. (${matchCount}건)`,
    ),
  )
})

/*
  ④ 도시 배열 깊은 감시 — { deep: true }
  배열 자체가 교체되지 않고 원소 안의 isFavorite만 바뀌는 경우가 있어 deep이 필요하다.
  deep 없이는 즐겨찾기 토글을 감지하지 못한다.
*/
watch(
  cities,
  (newCities) => {
    pushLog(
      'watch',
      `즐겨찾기 ${newCities.filter((city) => city.isFavorite).length}곳 / 총 ${newCities.length}개 도시`,
    )
  },
  { deep: true },
)

/*
  ⑤ 다중 소스 감시 — 배열로 두 값을 한 번에 본다.
  콜백 인자가 [새값들], [옛값들] 두 배열로 들어오는 것이 단일 감시와 다른 점이다.
  둘 중 하나만 바뀌어도 발화한다.
*/
watch([selectedCityId, searchQuery], ([newCityId, newQuery], [oldCityId, oldQuery]) => {
  pushLog(
    'watch',
    `[변경 감지] ${oldCityId ?? '없음'}(${oldQuery || '빈검색'}) ➡️ ${newCityId ?? '없음'}(${newQuery || '빈검색'})`,
  )
})

/*
  ⑥ getter 함수 소스 감시 — 산책 추천 1위가 바뀔 때만 발화
  객체 전체(bestWalkCity)를 감시하면 이전 값이 보존되지 않아 "어디서 어디로" 바뀌었는지 알 수 없다.
  id라는 원시값만 꺼내 감시하면 oldCityId가 제대로 남는다.
*/
watch(
  () => bestWalkCity.value?.id,
  (newCityId, oldCityId) => {
    const oldName = cities.value.find((city) => city.id === oldCityId)?.name ?? '없음'
    const newName = cities.value.find((city) => city.id === newCityId)?.name ?? '없음'
    pushLog('watch', `산책 추천 1위가 ${oldName}에서 ${newName}(으)로 변경되었습니다.`)
  },
)

/* ────────────────────────────────────────────────────────────────
   자식이 올린 emit을 받는 핸들러들
   ──────────────────────────────────────────────────────────────── */

/**
 * 카드 선택 처리. (WeatherCard의 select-card)
 *
 * 입력: city {Object} 클릭된 도시 객체
 * 출력: 없음 (스토어의 선택 도시와 상태바 문구를 바꾸는 부수효과)
 * 목적: 아래 지수·준비물·산책 패널이 이 도시 기준으로 다시 그려지게 한다.
 * 기능: 스토어에 선택을 위임하고, 상태바 문구를 갱신한다.
 *       문구 변경은 ②번 watcher를 발화시켜 로그로도 남는다.
 */
const handleSelectCity = (city) => {
  store.selectCity(city.id)
  selectionMessage.value = `${city.name}이(가) 선택되었습니다.`
}

/**
 * 상세보기 처리. (WeatherCard의 click-detail)
 *
 * 입력: city {Object} 상세보기를 누른 도시
 * 출력: 없음 (window.alert 표시)
 * 목적: 카드에 다 담지 못한 요약을 즉시 보여준다. (별도 상세 화면은 아직 없음)
 * 기능: 선택된 도시라면 이미 계산된 outdoorIndex를 재사용하고,
 *       다른 도시라면 그 도시만 즉석에서 계산한다. (전 도시 재계산을 피하기 위함)
 */
const handleDetail = (city) => {
  const score =
    city.id === selectedCityId.value
      ? (outdoorIndex.value?.score ?? 0)
      : (computeIndices(city).find((index) => index.id === 'outdoor-activity')?.score ?? 0)
  window.alert(
    `${city.name}의 현재 날씨는 ${city.status}, ${city.temp}℃입니다.\n야외활동 지수는 ${score}점입니다.`,
  )
}

/**
 * 검색 제출 처리. (SearchBar의 submit — 검색 버튼 또는 Enter)
 *
 * 입력: 없음 (searchQuery, filteredCities를 읽는다)
 * 출력: 없음
 * 목적: 이미 목록에 있는 도시를 검색했을 때 바로 그 도시로 이동시킨다.
 * 기능: 검색어를 최근 목록에 넣고, 필터 결과의 첫 도시를 선택한다. 결과가 없으면 아무 일도 안 한다.
 */
const handleSearchSubmit = () => {
  store.addRecentSearch(searchQuery.value)
  const first = filteredCities.value[0]
  if (first) handleSelectCity(first)
}

/**
 * 최근 검색어 태그 클릭 처리. (SearchBar의 select-recent)
 *
 * 입력: query {string} 클릭한 검색어
 * 출력: 없음
 * 기능: 검색창에 그 검색어를 다시 넣는다. searchQuery가 바뀌므로
 *       ①번 watcher가 검색을 실행하고 ③번 watchEffect가 로그를 남긴다.
 *       동시에 최근 목록의 맨 앞으로 다시 올린다.
 */
const handleRecentSelect = (query) => {
  searchQuery.value = query
  store.addRecentSearch(query)
}

/**
 * 검색 결과에서 도시 추가 처리. (CitySearchResults의 select)
 *
 * 입력: location {Object} 선택한 위치 { id, name, coords, ... }
 * 출력: {Promise<void>} 날씨 조회가 끝날 때까지 기다린다
 * 목적: 목록에 없던 도시를 대시보드에 새로 추가한다.
 * 기능: 스토어가 좌표로 중복을 판정해 이미 있으면 선택만 하고, 없으면 날씨를 받아 추가한다.
 *       결과에 따라 상태바 문구를 다르게 쓰고, 마지막에 검색 드롭다운을 닫는다.
 */
const handleSearchResult = async (location) => {
  const result = await store.addCityFromSearchResult(location)
  store.addRecentSearch(location.name)
  if (result.city)
    selectionMessage.value = result.added
      ? `${result.city.name}이(가) 추가되었습니다.`
      : `${result.city.name}은(는) 이미 추가된 도시입니다.`
  store.clearSearch()
}

/*
  마운트 시: 도시 목록을 불러오고, 1분짜리 시계를 켠다.
  시계가 now를 갱신하면 모든 WeatherCard의 "N분 전" 표기가 한꺼번에 최신화된다.
  (카드마다 타이머를 두지 않는 이유)
*/
onMounted(() => {
  store.loadCities()
  clock = window.setInterval(() => (now.value = Date.now()), 60_000)
})

/*
  언마운트 시: 타이머와 진행 중인 검색 요청을 정리한다.
  정리하지 않으면 화면을 떠난 뒤에도 타이머가 돌고 검색 응답이 뒤늦게 도착해 경고가 난다.
*/
onBeforeUnmount(() => {
  window.clearInterval(clock)
  store.clearSearch()
})
</script>

<template>
  <main class="dashboard-page">
    <!-- ① 히어로 — 페이지 최상단. 제목과 전체 요약 지표를 보여준다 -->
    <header class="hero">
      <div class="hero-copy">
        <span class="hero-kicker">WALKABLE WEATHER</span>
        <h1>오늘, 걷기 좋은 날인가요?</h1>
        <p>도시별 날씨를 비교하고 산책 시간부터 외출 준비까지 한 번에 확인하세요.</p>
        <div class="hero-tags">
          <span>국내 8개 도시</span><span>생활 지수 5종</span><span>Mock 데이터</span>
        </div>
        <div class="hero-summary">
          <span>전체 {{ dashboardSummary.count }}곳</span>
          <span>평균 {{ dashboardSummary.avgTemp }}℃</span>
          <span>최고 기온 {{ dashboardSummary.hottest }}</span>
          <span>즐겨찾기 {{ dashboardSummary.favoriteCount }}곳</span>
          <span>산책 1위 {{ bestWalkCity?.name ?? '-' }}</span>
        </div>
      </div>
      <div class="hero-orbit" aria-hidden="true"><span>☀️</span><i></i><b>🌿</b></div>
    </header>

    <!-- ② 검색 — 결과 드롭다운이 검색 패널 위로 겹쳐 뜨므로 position 기준을 잡는 래퍼로 감싼다.
         @update-query가 v-model을 대신한다 (과제 3에서 emit 이름이 바뀜) -->
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

    <!-- ③ 로딩 / 에러 / 본문 3분기. 로딩·에러일 때는 아래 내용을 전부 그리지 않는다 -->
    <section v-if="loadStatus === 'loading'" class="page-state">
      날씨 데이터를 준비하고 있어요…
    </section>
    <section v-else-if="loadStatus === 'error'" class="page-state error">{{ error }}</section>

    <template v-else>
      <!-- ④ 지역별 날씨 — 카드 격자.
           WeatherCard는 BaseDashboardCard의 슬롯 안에 있지만 여기 적혀 있으므로
           이 컴포넌트의 스코프에서 컴파일된다. 그래서 props/emit이 직접 연결된다. -->
      <BaseDashboardCard
        class="dashboard-section cities-panel"
        eyebrow="REGIONAL WEATHER"
        title="지역별 날씨"
        title-id="cities-title"
      >
        <!-- 헤더 우측: 현재 선택 상태 문구 -->
        <template #meta>
          <small class="section-meta">{{ selectionMessage }}</small>
        </template>

        <div v-if="filteredCities.length" class="weather-grid">
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
        </div>
        <div v-else class="empty-list">
          <span>🧭</span>
          <strong>조건에 맞는 도시가 없어요</strong>
          <p>다른 도시 이름으로 검색해 보세요.</p>
        </div>
      </BaseDashboardCard>

      <!-- 아래 세 블록은 선택된 도시가 있을 때만 그린다 -->
      <template v-if="selectedCity">
        <!-- ⑤ 선택 도시 배너 — 진초록 띠. 좌측 도시명 / 우측 핵심 수치 4개 -->
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

        <!-- ⑥ 생활 지수 — 지수 5종 카드 -->
        <BaseDashboardCard
          class="dashboard-section cities-panel"
          eyebrow="LIFE INDICES"
          :title="`${selectedCity.name} 생활 날씨 지수`"
          title-id="indices-title"
        >
          <template #meta>
            <small class="section-meta">날씨 데이터를 일상 언어로 바꿨어요.</small>
          </template>
          <IndexGrid :indices="indices" />
        </BaseDashboardCard>

        <!-- ⑦ 추천 2단 — 좌: 외출 준비물 / 우: 산책 시간 -->
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

    <!-- ⑧ 로그 패널 — 로딩/선택 여부와 무관하게 항상 보인다 -->
    <LogPanel :logs="logs" />
    <footer>Weather Walk · Mock data dashboard for Vue practice</footer>
  </main>
</template>

<style scoped>
/* ══════════ 페이지 골격 ══════════ */

/* 페이지 전체 — 최대 1240px, 화면 가운데 정렬. 좌우 16px씩 여백 확보 */
.dashboard-page {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 34px 0 44px;
}

/* ══════════ ① 히어로 (페이지 최상단) ══════════ */

/* 히어로 박스 — 좌: 문구 / 우: 장식 오브. 배경 민트→하늘 그라디언트 */
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

/* 히어로 우측 하단의 큰 흰 원 — 배경 장식. overflow:hidden으로 잘려 반원처럼 보인다 */
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

/* 히어로 좌측 문구 묶음 — 장식 위에 오도록 z-index:2 */
.hero-copy {
  position: relative;
  z-index: 2;
  max-width: 680px;
}

/* 섹션 라벨 3종 공통 — 히어로 kicker / 섹션 제목 위 라벨 / 배너 라벨. 진초록 소형 대문자 */
.hero-kicker,
.section-title span,
.selected-banner > div > span {
  color: var(--primary-700);
  font-size: 0.67rem;
  font-weight: 850;
  letter-spacing: 0.16em;
}

/* 메인 제목 "오늘, 걷기 좋은 날인가요?" — 히어로 좌측 상단, 화면 폭에 따라 크기 변함 */
h1 {
  margin: 8px 0 10px;
  color: var(--ink-900);
  font-size: clamp(2rem, 5vw, 3.7rem);
  line-height: 1.08;
  letter-spacing: -0.055em;
}

/* 히어로 설명 한 줄 — 제목 바로 아래 */
.hero-copy p {
  max-width: 620px;
  color: var(--ink-600);
  font-size: clamp(0.86rem, 1.8vw, 1.02rem);
}

/* 태그 줄 — 설명 아래 ("국내 8개 도시" 등 3개) */
.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

/* 태그 알약 — 반투명 흰 배경 + 진초록 글자 */
.hero-tags span {
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  padding: 7px 10px;
  background: rgba(255, 255, 255, 0.45);
  color: var(--primary-800);
  font-size: 0.7rem;
  font-weight: 750;
}

/* 요약 지표 줄 — 태그 아래. dashboardSummary와 bestWalkCity 값 5개 */
.hero-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  color: var(--ink-600);
  font-size: 0.72rem;
  font-weight: 700;
}

/* 히어로 우측 장식 영역 — 해·잎사귀 이모지와 점선 원 */
.hero-orbit {
  position: relative;
  z-index: 2;
  flex: 0 0 190px;
  height: 160px;
}

/* 점선 원 — 장식 영역 가운데 */
.hero-orbit i {
  position: absolute;
  inset: 20px;
  border: 1px dashed rgba(50, 117, 82, 0.28);
  border-radius: 50%;
}

/* ☀️ — 장식 영역 우측 상단 */
.hero-orbit > span {
  position: absolute;
  top: 0;
  right: 20px;
  font-size: 3.4rem;
}

/* 🌿 — 장식 영역 좌측 하단 */
.hero-orbit b {
  position: absolute;
  bottom: 5px;
  left: 10px;
  font-size: 3rem;
}

/* ══════════ ② 검색 ══════════ */
/* 검색 래퍼 — 결과 드롭다운(absolute)의 위치 기준점 */
.search-shell {
  position: relative;
  margin-top: 20px;
}

/* ══════════ ③ 섹션 공통 ══════════ */
/* 섹션 사이 세로 간격 */
.dashboard-section {
  margin-top: 34px;
}

/* 지역별 날씨·생활 지수 패널의 헤더 스타일 — BaseDashboardCard 기본값을 덮는다
   (제목을 크게, eyebrow를 진초록 굵게, meta를 아래쪽 정렬) */
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

/* 헤더 우측 보조 문구(상태바) — 흐린 회녹색, 우측 정렬 */
.section-meta {
  color: var(--ink-500);
  font-size: 0.72rem;
  text-align: right;
}

/* ══════════ ④ 도시 카드 격자 ══════════ */
/* 데스크톱 4열 */
.weather-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

/* 검색 결과 0건 안내 — 카드 격자 자리에 대신 뜨는 점선 박스 */
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

/* 🧭 이모지 — 박스 가운데 */
.empty-list span {
  font-size: 2rem;
}

/* "조건에 맞는 도시가 없어요" — 이모지 아래 */
.empty-list strong {
  margin-top: 8px;
  color: var(--ink-700);
}

/* 재검색 안내 — 가장 아래 */
.empty-list p {
  margin: 2px 0 0;
  font-size: 0.8rem;
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

/* ══════════ ⑤ 선택 도시 배너 ══════════ */
/* 진초록 가로 띠 — 좌: 도시명 / 우: 수치 4칸. 이 페이지에서 유일하게 어두운 블록 */
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

/* 선택 도시명 — 배너 좌측, 흰 글자 */
.selected-banner h2 {
  margin: 3px 0 0;
  font-size: 1.75rem;
}

/* 행정구역 · 날씨 — 도시명 아래, 반투명 흰색 */
.selected-banner p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.76rem;
}

/* 수치 4칸 — 배너 우측. 현재/체감/습도/활동 */
.selected-stats {
  display: grid;
  min-width: 500px;
  grid-template-columns: repeat(4, 1fr);
}

/* 수치 한 칸 — 좌측에 얇은 구분선 */
.selected-stats span {
  display: grid;
  border-left: 1px solid rgba(255, 255, 255, 0.17);
  padding: 5px 22px;
}

/* 항목 이름(현재/체감…) — 칸 윗줄, 흐린 흰색 */
.selected-stats small {
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.65rem;
}

/* 수치 값 — 칸 아랫줄, 흰색 굵게 */
.selected-stats strong {
  margin-top: 2px;
  font-size: 1.1rem;
}

/* ══════════ ⑦ 추천 2단 ══════════ */
/* 좌: 준비물(1fr) / 우: 산책(1.15fr) — 오른쪽을 조금 넓게 */
.recommendation-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 16px;
  margin-top: 34px;
}

/* ══════════ 로딩 / 에러 ══════════ */
/* 본문 자리에 대신 뜨는 안내 — 세로 가운데 정렬 */
.page-state {
  display: grid;
  min-height: 300px;
  place-items: center;
  color: var(--ink-500);
}

/* 에러일 때만 벽돌색 글자 */
.page-state.error {
  color: #a04f40;
}

/* 페이지 최하단 저작 표기 — 가운데 정렬, 가장 흐린 글자 */
footer {
  margin-top: 34px;
  color: var(--ink-400);
  font-size: 0.67rem;
  text-align: center;
}
/* ══════════ 반응형 ══════════ */
/* 태블릿 — 히어로 장식 숨김, 배너·추천을 세로로 */
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
@media (max-width: 1050px) {
  .weather-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
/* 모바일 — 여백 축소, 섹션 헤더를 세로로 */
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
  .selected-banner {
    padding: 22px;
  }
  .selected-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 0;
  }
}
</style>
