<!--
  WalkTimePanel.vue — 선택한 도시의 산책 추천 시간대

  어떤 컴포넌트인가:
    "오늘 언제 걷기 좋은가"를 시간 칩으로 보여주는 프레젠테이션 컴포넌트.
    걷기 좋은 시간을 고르는 판단은 utils/recommendations/walkTimes.js 가 이미 끝냈고,
    여기서는 결과 배열을 받아 그리기만 한다.

  부모:  WeatherParent.vue — 선택 도시 아래 2단 그리드의 오른쪽 칸
  자식:  BaseDashboardCard.vue — 패널 껍데기를 빌려 쓴다

  두 가지 화면 상태:
    걷기 좋은 시간 있음 → 시간 칩 목록
    하나도 없음(종일 비 등) → danger 상태로 배경이 회보라로 바뀌고
                              "밖은 위험해.. 이불 속에 숨기" 문구만 표시
-->
<script setup>
import { formatHour } from '../../utils/recommendations/walkTimes.js'
import BaseDashboardCard from './BaseDashboardCard.vue'

/**
 * props
 *
 * @property {Object} city            선택된 도시. name(제목)과 timezone(시각 변환)에 쓰인다
 * @property {Array}  availableHours  걷기 좋은 시간대 배열. getWalkableHours()의 결과.
 *                                    각 원소는 { dt, temp, status }.
 *                                    비어 있으면 danger 상태로 전환된다
 * @property {string} walkImage       산책 추천 일러스트 경로. 아직 이미지가 없어 빈 문자열이며
 *                                    이 경우 자리표시자 박스만 보인다 (추후 정적 import로 채울 자리)
 * @property {string} stayHomeImage   실내 휴식 일러스트 경로. 위와 동일
 */
defineProps({
  city: { type: Object, required: true },
  availableHours: { type: Array, default: () => [] },
  walkImage: { type: String, default: '' },
  stayHomeImage: { type: String, default: '' },
})
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
    <!-- 걷기 좋은 시간이 하나라도 있을 때 -->
    <template v-if="availableHours.length">
      <div class="image-slot">
        <img v-if="walkImage" :src="walkImage" alt="산책 추천" />
        <span v-else aria-label="산책 이미지 영역"></span>
      </div>
      <p>비 걱정 없이 걷기 좋은 시간이에요.</p>
      <!-- 시간 칩: 윗줄 시각(도시 timezone 기준), 아랫줄 기온·날씨 -->
      <div class="time-list">
        <span v-for="hour in availableHours" :key="hour.dt">
          <strong>{{ formatHour(hour.dt, city.timezone) }}</strong>
          {{ hour.temp }}℃ · {{ hour.status }}
        </span>
      </div>
    </template>
    <!-- 걷기 좋은 시간이 없을 때 (예: 수원 종일 비) -->
    <template v-else>
      <div class="image-slot empty">
        <img v-if="stayHomeImage" :src="stayHomeImage" alt="실내 휴식 추천" />
        <span v-else aria-label="실내 휴식 이미지 영역"></span>
      </div>
      <p class="danger-message">밖은 위험해.. 이불 속에 숨기</p>
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
  --card-bg: linear-gradient(140deg, rgba(230, 247, 238, 0.9), rgba(232, 245, 255, 0.78));
  --card-heading-margin: 0;
  --card-icon-bg: rgba(255, 255, 255, 0.72);
  height: 100%;
}

/* 걷기 좋은 시간이 없을 때 — 배경을 회보라로 바꿔 "오늘은 실내" 분위기를 준다 */
.walk-panel.danger {
  --card-bg: linear-gradient(140deg, rgba(245, 241, 247, 0.92), rgba(236, 240, 246, 0.85));
}

/* 일러스트 자리 — 헤더 바로 아래 가로 띠.
   이미지가 아직 없어 점선 테두리의 빈 박스로 보인다 */
.image-slot {
  height: 54px;
  margin: 15px 0 10px;
  overflow: hidden;
  border: 1px dashed rgba(76, 137, 106, 0.25);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.28);
}

/* 이미지가 들어오면 자리를 꽉 채우고 넘치는 부분은 잘라낸다 */
.image-slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 이미지가 없을 때의 빈 자리표시자 */
.image-slot span {
  display: block;
  width: 100%;
  height: 100%;
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
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.58);
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
