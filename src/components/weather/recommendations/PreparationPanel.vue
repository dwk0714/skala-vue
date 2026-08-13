<!--
  PreparationPanel.vue — 선택한 도시의 외출 준비물 추천

  어떤 컴포넌트인가:
    "오늘 뭘 챙겨야 하나"를 아이콘 목록으로 보여주는 프레젠테이션 컴포넌트.
    무엇을 챙길지 판단하는 로직은 utils/recommendations/preparation.js 가 이미 끝냈고,
    여기서는 완성된 목록을 받아 그리기만 한다.

  부모:  WeatherIndicesView.vue — 선택 도시 아래 2단 그리드의 왼쪽 칸
  자식:  BaseDashboardCard.vue — 패널 껍데기를 빌려 쓴다
-->
<script setup>
import { useTemperature } from '../../../composables/useTemperature.js'
import BaseDashboardCard from '../shared/BaseDashboardCard.vue'

const { displayTemperature, unitSymbol } = useTemperature()

/**
 * props
 *
 * @property {string} cityName  패널 제목에 넣을 도시 이름 (예: "서울 외출 준비")
 * @property {Array}  items     준비물 목록. getPreparationItems()의 결과.
 *                              각 원소는 { id, icon, label, detail, temperature? }
 *                              - label  준비물 이름 (예: "우산")
 *                              - detail 왜 필요한지 (예: "강수확률 90%")
 *                              옷차림은 항상 1개 포함되고, 나머지는 조건을 만족할 때만 들어온다
 */
defineProps({
  cityName: { type: String, required: true },
  items: { type: Array, default: () => [] },
})
</script>

<template>
  <BaseDashboardCard
    :title="`${cityName} 외출 준비`"
    title-id="preparation-title"
    eyebrow="READY TO GO"
    icon="🎒"
  >
    <!-- 준비물 카드 2열 격자. 항목 수는 날씨 조건에 따라 1~5개로 달라진다 -->
    <div class="preparation-list">
      <article v-for="item in items" :key="item.id">
        <span>{{ item.icon }}</span>
        <div>
          <strong>{{ item.label }}</strong
          ><small v-if="item.temperature !== undefined">
            {{ displayTemperature(item.temperature) }}{{ unitSymbol }} 기준 옷차림 </small
          ><small v-else>{{ item.detail }}</small>
        </div>
      </article>
    </div>
  </BaseDashboardCard>
</template>

<style scoped>
/*
  패널 루트 — 추천 2단 그리드의 왼쪽 칸
  --card-icon-bg 로 헤더 아이콘 칩을 크림색으로 (기본 회색 대신)
  height:100% 는 오른쪽 산책 패널과 높이를 맞추기 위한 것
*/
.dashboard-card {
  --card-icon-bg: color-mix(in srgb, var(--primary-500) 20%, var(--surface-card));
  height: 100%;
}

/* 준비물 격자 — 패널 본문. 데스크톱 2열 */
.preparation-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

/* 준비물 한 칸 — [이모지] [이름/설명] 가로 배치. 배경 반투명 흰색 */
article {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border-soft);
  border-radius: 13px;
  padding: 11px;
  background: var(--surface-soft);
}

/* 준비물 이모지 — 칸 좌측 */
article > span {
  font-size: 1.25rem;
}

/* 이름+설명 묶음 — min-width:0 이라야 긴 설명의 말줄임이 동작한다 */
article div {
  display: grid;
  min-width: 0;
}

/* 준비물 이름(예: 우산) — 칸 우측 윗줄 */
article strong {
  color: var(--ink-700);
  font-size: 0.78rem;
}

/*
  준비물 설명(예: "강수확률 90%") — 칸 우측 아랫줄, 흐린 회녹색
  ⚠ 셀렉터를 .preparation-list 로 한정한 이유:
     그냥 small { } 로 두면 BaseDashboardCard 헤더의 eyebrow까지 잡힌다.
     (원래 한 규칙이 헤더와 본문을 동시에 담당하고 있었음)
*/
.preparation-list small {
  overflow: hidden;
  color: var(--ink-400);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 좁은 모바일 — 1열로 세로 나열 */
@media (max-width: 480px) {
  .preparation-list {
    grid-template-columns: 1fr;
  }
}
</style>
