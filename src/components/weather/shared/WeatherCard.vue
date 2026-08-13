<!--
  WeatherCard.vue — 도시 한 곳의 날씨 카드

  어떤 컴포넌트인가:
    도시 객체 하나를 받아 그리기만 하는 프레젠테이션 컴포넌트.
    스토어를 import 하지 않으며 계산 로직도 없다. 데이터는 전부 props로 받고,
    사용자 동작은 전부 emit으로 부모에 넘긴다. 그래서 어느 화면에든 그대로 붙일 수 있다.

  부모:
    날씨 View — 도시 배열을 v-for로 돌며 이 카드를 렌더한다.
    (화면상으로는 BaseDashboardCard 테두리 안에 있지만, 슬롯 콘텐츠는 부모 스코프에서
     컴파일되므로 props/emit 상대는 BaseDashboardCard가 아니라 해당 View다.)

  자식:
    없음.

  이벤트 설계:
    카드 전체가 클릭 가능(role="button")한데 내부에 버튼이 두 개 있다.
    내부 버튼에 .stop을 붙이지 않으면 클릭이 카드까지 버블링되어
    "즐겨찾기만 눌렀는데 카드까지 선택되는" 문제가 생긴다. (과제 1 요건)
-->
<script setup>
import { computed } from 'vue'
import { useTemperature } from '../../../composables/useTemperature.js'
import { formatRelativeTime } from '../../../utils/formatRelativeTime.js'
import { getPm10Level } from '../../../utils/weatherModel.js'

/**
 * props
 *
 * @property {Object} city      화면에 그릴 도시 날씨 객체.
 *                              name·state·status·temp·feelsLike·pop·pm10·isFavorite·updatedAt 사용
 * @property {boolean} selected 이 카드가 현재 선택된 도시인지. true면 초록 테두리 강조
 * @property {number} now       부모가 1분마다 갱신해 내려주는 현재 시각(ms).
 *                              카드마다 타이머를 두지 않고 이 값 하나로 상대 시간을 함께 갱신한다
 */
const props = defineProps({
  city: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  now: { type: Number, required: true },
})

/**
 * emits — 모두 city 객체를 그대로 실어 보낸다. 실제 처리는 부모가 한다.
 *
 * select-card     카드 본문 클릭/Enter/Space → 부모가 선택 도시를 바꾼다
 * click-detail    [상세보기] 클릭 → 부모 View가 상세 라우트로 이동한다
 * toggle-favorite [★] 클릭 → 부모가 스토어의 즐겨찾기를 토글한다
 */
defineEmits(['select-card', 'click-detail', 'toggle-favorite'])

const { displayTemperature, unitSymbol } = useTemperature()
/** 상세 데이터를 받은 카드에서도 PM10 숫자만 단독으로 노출하지 않는다. */
const pm10Info = computed(() => getPm10Level(props.city.pm10))

/**
 * 날씨 문자열을 이모지로 변환한다.
 *
 * 목적: API가 주는 한글 상태 텍스트("비", "구름 많음"…)를 시각 기호로 바꿔
 *       카드를 훑을 때 글자를 읽지 않아도 날씨를 파악하게 한다.
 * 입력: 없음 (props.city.status를 읽는다)
 * 출력: {string} 이모지 한 글자
 * 기능: 포함 문자열을 순서대로 검사하고, 어디에도 걸리지 않으면 맑음으로 간주한다.
 */
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
    <!-- 카드 최상단: 좌측 날씨 아이콘 / 우측 즐겨찾기 별 -->
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

    <!-- 도시 이름 영역: 행정구역 / 도시명 / 날씨·체감 -->
    <div class="city-copy">
      <span>{{ city.state }}</span>
      <h3>{{ city.name }}</h3>
      <p>{{ city.status }} · 체감 {{ displayTemperature(city.feelsLike) }}{{ unitSymbol }}</p>
    </div>

    <!-- 기온 줄: 좌측 큰 숫자 / 우측 25℃ 기준 더움·선선함 뱃지 (과제 1 요건: v-if 분기) -->
    <div class="temperature-row">
      <strong
        >{{ displayTemperature(city.temp) }}<small>{{ unitSymbol }}</small></strong
      >
      <span v-if="city.temp >= 25" class="temp-badge hot">☀ 더움</span>
      <span v-else class="temp-badge cool">❄ 선선함</span>
    </div>

    <!-- 보조 지표 두 칸: 강수확률 / 미세먼지 -->
    <div class="card-meta">
      <template v-if="city.hourly?.length">
        <span>강수 {{ Math.round(city.pop * 100) }}%</span>
        <span>미세먼지 {{ pm10Info.value }} · {{ pm10Info.label }}</span>
      </template>
      <span v-else>강수·미세먼지는 상세에서 확인</span>
    </div>

    <!-- 카드 바닥: 좌측 상대 시간 / 우측 상세보기 (버블링 차단 필수) -->
    <div class="card-footer">
      <small>{{ formatRelativeTime(city.updatedAt, now) }} 업데이트</small>
      <button type="button" @click.stop="$emit('click-detail', city)" @keydown.stop>
        상세보기 →
      </button>
    </div>
  </article>
</template>

<style scoped>
/*
  카드 본체 — "지역별 날씨" 패널 안 그리드의 한 칸 (데스크톱 4열)
  배경: 반투명 흰색(--surface-card) / 테두리: 옅은 청록 헤어라인
  세로 flex라 카드 높이가 달라도 바닥 영역이 아래로 정렬된다
*/
.weather-card {
  display: flex;
  min-height: 285px;
  flex-direction: column;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 18px;
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(18px) saturate(135%);
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
}

/* 마우스 올리면 살짝 떠오른다 */
.weather-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-float);
}

/* 선택된 카드 — 초록 테두리(--primary-500) + 연초록 링 */
.weather-card.selected {
  border-color: var(--primary-500);
  box-shadow:
    0 0 0 3px var(--focus-ring),
    var(--shadow-float);
}

/* 키보드 포커스 — 연초록 외곽선 */
.weather-card:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 3px;
}

/* 카드 안의 가로 4줄(최상단/기온/지표/바닥)은 모두 좌우 양끝 정렬 */
.card-top,
.temperature-row,
.card-meta,
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 날씨 아이콘 칩 — 카드 좌측 상단 44×44. 배경 연하늘색(--sky-100) */
.weather-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 14px;
  background: var(--sky-100);
  font-size: 1.45rem;
}

/* 즐겨찾기 별 — 카드 우측 상단. 기본 회색(--ink-300) */
.favorite {
  border: 0;
  background: transparent;
  color: var(--ink-300);
  cursor: pointer;
  font-size: 1.45rem;
}

/* 즐겨찾기 켜짐 — 노란빛 금색 */
.favorite.active {
  color: #e3a526;
}

/* 도시 이름 블록 — 아이콘 줄 아래, 카드 좌측 정렬 */
.city-copy {
  margin: 18px 0 12px;
}

/* 행정구역(예: 서울특별시) — 흐린 회녹색 소형 텍스트 */
.city-copy span {
  color: var(--ink-400);
  font-size: 0.7rem;
}

/* 도시명 — 짙은 먹색(--ink-900) */
h3 {
  margin: 2px 0;
  color: var(--ink-900);
  font-size: 1.2rem;
}

/* 날씨·체감 한 줄 — 중간 회녹색 */
.city-copy p {
  margin: 0;
  color: var(--ink-500);
  font-size: 0.78rem;
}

/* 기온 숫자 — 카드 중앙 좌측의 가장 큰 글자 */
.temperature-row strong {
  color: var(--ink-900);
  font-size: 2.15rem;
  letter-spacing: -0.06em;
}

/* 기온 뒤 ℃ 기호 — 숫자보다 작게 */
.temperature-row strong small {
  font-size: 1rem;
}

/* 더움/선선함 알약 뱃지 — 기온 줄 우측 끝 */
.temp-badge {
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 0.67rem;
  font-weight: 800;
}

/* 25℃ 이상 — 살구빛 배경 + 주황 글자 */
.temp-badge.hot {
  background: color-mix(in srgb, #ff9b52 22%, var(--surface-card));
  color: color-mix(in srgb, #ed7e2b 78%, var(--ink-900));
}

/* 25℃ 미만 — 연하늘 배경 + 파란 글자 */
.temp-badge.cool {
  background: color-mix(in srgb, #59b7ff 20%, var(--surface-card));
  color: color-mix(in srgb, #2993e7 76%, var(--ink-900));
}

/* 보조 지표 줄 — 기온 줄 아래 */
.card-meta {
  gap: 8px;
  margin-top: 12px;
}

/* 강수·미세먼지 칸 — 반반씩 나눠 갖는 연회색(--surface-muted) 알약 */
.card-meta span {
  flex: 1;
  border-radius: 10px;
  padding: 7px;
  background: var(--surface-muted);
  color: var(--ink-500);
  font-size: 0.68rem;
  text-align: center;
}

/* 카드 바닥 — margin-top:auto 로 카드 최하단에 붙인다 */
.card-footer {
  gap: 12px;
  margin-top: auto;
  padding-top: 15px;
}

/* "20분 전 업데이트" — 바닥 좌측, 가장 흐린 글자 */
.card-footer small {
  color: var(--ink-400);
  font-size: 0.65rem;
}

/* [상세보기 →] — 바닥 우측, 진초록 텍스트 버튼 */
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
