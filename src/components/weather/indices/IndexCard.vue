<!--
  IndexCard.vue — 생활 지수 한 종류의 카드

  어떤 컴포넌트인가:
    지수 결과 객체 하나를 받아 점수·등급·게이지·문구를 그리는 프레젠테이션 컴포넌트.
    계산은 utils/indices/ 의 순수 함수들이 이미 끝냈고, 여기서는 표시만 한다.
    지수 종류를 알지 못하며, 어떤 지수가 와도 같은 방식으로 렌더한다.

  부모:  IndexGrid.vue — indices 배열을 v-for로 돌며 이 카드를 렌더한다
  자식:  없음

  선택 필드 두 개:
    nextRain   — 손세차 지수만 가진다 → 다음 비 예보 문구를 하단에 추가
    activities — 야외활동 지수만 가진다 → 추천 활동 칩을 하단에 추가
    나머지 지수는 이 두 영역이 v-if로 통째로 빠진다.
-->
<script setup>
import { computed } from 'vue'

/**
 * props
 *
 * @property {Object} index  computeIndices()가 만든 지수 결과 하나.
 *   { id, label, icon, score, level, message } 는 모든 지수가 갖고,
 *   { nextRain } 은 손세차만, { activities } 는 야외활동만 갖는다.
 *   - score  0~100 정수
 *   - level  'high' | 'mid' | 'low' | 'none' — 카드 색상과 뱃지에 쓰인다
 */
const props = defineProps({ index: { type: Object, required: true } })
const levelType = computed(
  () => ({ high: 'success', mid: 'warning', low: 'danger', none: 'info' })[props.index.level],
)

/**
 * 손세차 지수의 "다음 비" 안내 문구를 만든다.
 *
 * 목적: 세차의 실제 판단 기준은 오늘 날씨가 아니라 "세차하고 며칠 버티느냐"이므로,
 *       며칠 뒤에 비가 오는지를 사람이 읽는 표현으로 바꿔 보여준다.
 * 입력: 없음 (props.index.nextRain 을 읽는다. daysFromNow와 pop 사용)
 * 출력: {string} 예) "3일 뒤 비 예보 70%" / 비 예보가 없으면 "비는 문제 없음!"
 * 기능: 0일이면 "오늘", 1일이면 "내일", 그 외에는 "N일 뒤"로 접두사를 정하고
 *       강수확률(0~1)을 백분율로 반올림해 붙인다.
 */
const rainMessage = computed(() => {
  if (!props.index.nextRain) return '비는 문제 없음!'
  const days = props.index.nextRain.daysFromNow
  const prefix = days === 0 ? '오늘' : days === 1 ? '내일' : `${days}일 뒤`
  return `${prefix} 비 예보 ${Math.round(props.index.nextRain.pop * 100)}%`
})
</script>

<template>
  <!-- level-* 클래스가 카드 전체의 강조색(--level-color)을 결정한다 -->
  <article class="index-card" :class="`level-${index.level}`">
    <!-- 카드 최상단: 좌측 지수 아이콘 / 우측 등급 뱃지 -->
    <div class="index-heading">
      <span class="index-icon">{{ index.icon }}</span>
      <ElTag class="index-level" :type="levelType" round>{{ index.level }}</ElTag>
    </div>

    <ElTooltip :content="index.message" placement="top">
      <h3>{{ index.label }}</h3>
    </ElTooltip>

    <!-- 점수 줄: 좌측 큰 숫자 / 우측 "/ 100" -->
    <div class="score-line">
      <strong>{{ index.score }}</strong
      ><span>/ 100</span>
    </div>

    <!-- Element Plus Progress가 0~100 점수를 시각화한다 -->
    <ElProgress
      class="score-progress"
      :percentage="index.score"
      :show-text="false"
      :stroke-width="7"
      color="var(--level-color)"
    />

    <p>{{ index.message }}</p>

    <!-- 손세차 전용: 다음 비 예보. 비가 있으면 .rain 으로 주황색 경고 톤 -->
    <small v-if="index.id === 'car-wash'" :class="{ rain: index.nextRain }">{{
      rainMessage
    }}</small>

    <!-- 야외활동 전용: 추천 활동 칩 -->
    <div v-if="index.activities" class="activity-list">
      <ElTag v-for="activity in index.activities" :key="activity" size="small" round>{{
        activity
      }}</ElTag>
    </div>
  </article>
</template>

<style scoped>
/*
  지수 카드 본체 — "생활 날씨 지수" 격자의 한 칸 (데스크톱 5열)
  배경: 반투명 흰색(--surface-card)
  --level-color 는 등급에 따라 바뀌는 강조색으로, 아이콘 칩·등급 뱃지·게이지가 모두 이 값을 쓴다
*/
.index-card {
  --level-color: var(--primary-600); /* high (기본) — 초록 */
  min-height: 210px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 18px;
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(18px) saturate(135%);
}

/* 등급별 강조색 — 초록(high) → 노랑(mid) → 주황(low) → 회색(none) */
.index-card.level-mid {
  --level-color: #d39235;
}
.index-card.level-low {
  --level-color: #cf754e;
}
.index-card.level-none {
  --level-color: #84909d;
}

/* 최상단 줄과 점수 줄은 좌우 양끝 정렬 */
.index-heading,
.score-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 지수 아이콘 칩 — 카드 좌측 상단 38×38
   배경은 강조색을 흰색에 13% 섞은 아주 연한 톤 */
.index-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--level-color) 18%, var(--surface-card));
  font-size: 1.2rem;
}

/* 등급 뱃지(high/mid/low/none) — 카드 우측 상단 알약. 글자색이 곧 강조색 */
.index-level {
  font-size: 0.62rem;
  font-weight: 850;
  text-transform: uppercase;
}

/* 지수 이름(예: 손세차 지수) — 아이콘 줄 아래 */
h3 {
  margin: 14px 0 5px;
  color: var(--ink-700);
  font-size: 0.88rem;
}

/* 점수 숫자 — 카드 중앙 좌측의 가장 큰 글자 */
.score-line strong {
  color: var(--ink-900);
  font-size: 1.8rem;
}

/* "/ 100" — 점수 우측, 흐린 회녹색 */
.score-line span {
  color: var(--ink-400);
  font-size: 0.7rem;
}

/* 점수 게이지 — Element Plus Progress의 바탕을 카드 토큰에 맞춘다 */
.score-progress {
  margin-top: 2px;
}

:deep(.score-progress .el-progress-bar__outer) {
  background: var(--surface-muted);
}

/* 지수 문구(예: "오늘 손세차 각") — 게이지 아래.
   min-height로 문구 길이가 달라도 카드 높이가 흔들리지 않게 한다 */
p {
  min-height: 20px;
  margin: 11px 0 6px;
  color: var(--ink-600);
  font-size: 0.76rem;
  font-weight: 700;
}

/* 손세차 하단 문구 — 기본은 진초록("비는 문제 없음!") */
small {
  color: var(--primary-700);
  font-size: 0.65rem;
}

/* 비 예보가 있을 때 — 주황빛으로 바꿔 경고 톤 */
small.rain {
  color: #c56746;
}

/* 야외활동 추천 활동 칩 목록 — 카드 하단, 넘치면 다음 줄로 */
.activity-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 7px;
}

/* 활동 칩 하나 — 아주 연한 초록 배경 + 진초록 글자 */
.activity-list .el-tag {
  font-size: 0.6rem;
}
</style>
