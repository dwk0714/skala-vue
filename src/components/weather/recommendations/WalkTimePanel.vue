<!--
  WalkTimePanel.vue — 선택한 도시의 산책 추천 시간대

  어떤 컴포넌트인가:
    "오늘 언제 걷기 좋은가"를 시간 칩으로 보여주는 프레젠테이션 컴포넌트.
    걷기 좋은 시간을 고르는 판단은 utils/recommendations/walkTimes.js 가 이미 끝냈고,
    여기서는 결과 배열을 받아 그리기만 한다.

  부모:  WeatherIndicesView.vue — 선택 도시 아래 2단 그리드의 오른쪽 칸
  자식:  BaseDashboardCard.vue — 패널 껍데기를 빌려 쓴다

  두 가지 화면 상태:
    걷기 좋은 시간 있음 → 시간 칩 목록
    하나도 없음(종일 비 등) → danger 상태로 배경이 회보라로 바뀌고
                              "밖은 위험해.. 이불 속에 숨기" 문구만 표시
-->
<script setup>
import { computed } from 'vue'
import { useTemperature } from '../../../composables/useTemperature.js'
import { formatHour } from '../../../utils/recommendations/walkTimes.js'
import BaseDashboardCard from '../shared/BaseDashboardCard.vue'

const { displayTemperature, unitSymbol } = useTemperature()

/**
 * props
 *
 * @property {Object} city            선택된 도시. name(제목)과 timezone(시각 변환)에 쓰인다
 * @property {Array}  availableHours  걷기 좋은 시간대 배열. getWalkableHours()의 결과.
 *                                    각 원소는 { dt, temp, status }.
 *                                    비어 있으면 danger 상태로 전환된다
 * @property {string} image           현재 강수 상태에 맞춰 부모가 고른 산책 이미지 경로
 * @property {string} weatherType     'sunny' | 'rain' | 'thunder' | 'snow' | 'hail'.
 *                                    이미지 설명과 안내 문구를 바꾼다
 */
const props = defineProps({
  city: { type: Object, required: true },
  availableHours: { type: Array, default: () => [] },
  image: { type: String, required: true },
  weatherType: { type: String, default: 'sunny' },
})

/** 사진과 같은 날씨를 설명해 스크린 리더와 안내 문구도 함께 바뀌게 한다. */
const WEATHER_COPY = {
  sunny: {
    alt: '맑은 날 공원을 산책하는 사람',
    available: '비 걱정 없이 걷기 좋은 시간이에요.',
    unavailable: '오늘은 추천 산책 시간대가 없어요.',
  },
  rain: {
    alt: '비 오는 날 우산을 쓰고 산책하는 사람',
    available: '비 예보가 있어요. 추천 시간에도 작은 우산을 챙겨주세요.',
    unavailable: '비 오는 날이에요. 외출한다면 우산을 꼭 챙기세요.',
  },
  thunder: {
    alt: '천둥 번개가 치는 날 대피 장소로 걷는 사람',
    available: '천둥 예보 시간은 피하고, 안전한 시간대에만 걸으세요.',
    unavailable: '천둥·번개 예보가 있어요. 산책 대신 실내에 머물러 주세요.',
  },
  snow: {
    alt: '눈 내리는 겨울 공원을 걷는 사람',
    available: '눈 예보 시간은 피하고 미끄럽지 않은 신발을 준비하세요.',
    unavailable: '눈길이 미끄러울 수 있어요. 오늘 산책은 쉬어가세요.',
  },
  hail: {
    alt: '우박이 내리는 날 대피 장소로 걷는 사람',
    available: '우박 예보 시간은 피하고 실내 대피 장소를 확인하세요.',
    unavailable: '우박 예보가 있어요. 안전을 위해 실내에 머물러 주세요.',
  },
}

const weatherCopy = computed(() => WEATHER_COPY[props.weatherType] ?? WEATHER_COPY.sunny)
</script>

<template>
  <BaseDashboardCard
    class="walk-panel"
    :class="{ danger: !availableHours.length }"
    :title="`${city.name} 산책 추천 시간`"
    title-id="walk-title"
    eyebrow="WALK WINDOW"
    icon="🚶"
  >
    <!-- 현재 강수 종류에 맞는 실제 사진을 모든 추천 상태에서 공통으로 보여준다. -->
    <div class="image-slot">
      <img :src="image" :alt="weatherCopy.alt" />
    </div>

    <!-- 걷기 좋은 시간이 하나라도 있을 때 -->
    <template v-if="availableHours.length">
      <p>{{ weatherCopy.available }}</p>
      <!-- 시간 칩: 윗줄 시각(도시 timezone 기준), 아랫줄 기온·날씨 -->
      <div class="time-list">
        <span v-for="hour in availableHours" :key="hour.dt">
          <strong>{{ formatHour(hour.dt, city.timezone) }}</strong>
          {{ displayTemperature(hour.temp) }}{{ unitSymbol }} · {{ hour.status }}
        </span>
      </div>
    </template>
    <!-- 걷기 좋은 시간이 없을 때 (예: 수원 종일 비) -->
    <template v-else>
      <p class="danger-message">{{ weatherCopy.unavailable }}</p>
    </template>
  </BaseDashboardCard>
</template>

<style scoped>
/*
  패널 루트 — 추천 2단 그리드의 오른쪽 칸 (왼쪽 준비물 패널보다 조금 넓다)
  이 패널만 배경이 단색이 아니라 민트→하늘 그라디언트다.
  --card-bg 로 BaseDashboardCard의 기본 유리 배경을 덮어쓴다.
  height:100% 로 왼쪽 패널과 높이를 맞춘다.
*/
.walk-panel {
  --card-bg: linear-gradient(140deg, var(--surface-glass), rgba(87, 176, 255, 0.18));
  --card-heading-margin: 0;
  --card-icon-bg: var(--surface-card);
  height: 100%;
}

/* 걷기 좋은 시간이 없을 때 — 배경을 회보라로 바꿔 "오늘은 실내" 분위기를 준다 */
.walk-panel.danger {
  --card-bg: linear-gradient(140deg, var(--surface-glass), rgba(126, 106, 168, 0.2));
}

/* 산책 사진 — 가로 카드 비율을 유지하되 모바일에서도 지나치게 커지지 않는다. */
.image-slot {
  height: clamp(130px, 17vw, 180px);
  margin: 15px 0 10px;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  background: var(--surface-soft);
  box-shadow: var(--shadow-card);
}

/* 이미지가 들어오면 자리를 꽉 채우고 넘치는 부분은 잘라낸다 */
.image-slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 안내 문구 — 일러스트 아래 */
p {
  margin: 0 0 11px;
  color: var(--ink-600);
  font-size: 0.76rem;
}

/* 시간 칩 목록 — 패널 하단, 넘치면 다음 줄로 */
.time-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

/* 시간 칩 하나 — 반투명 흰 배경. 그라디언트 위에서 떠 보이게 흰 테두리 */
.time-list span {
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--surface-soft);
  color: var(--ink-500);
  font-size: 0.67rem;
}

/* 칩 안 시각(예: 09:00) — 윗줄에 진초록 굵은 글씨 */
.time-list strong {
  display: block;
  color: var(--primary-800);
  font-size: 0.83rem;
}

/* "밖은 위험해.. 이불 속에 숨기" — 패널 가운데. 배경과 어울리는 보랏빛 회색 */
.danger-message {
  margin-top: 14px;
  color: #725d75;
  font-size: 0.92rem;
  font-weight: 800;
  text-align: center;
}
</style>
