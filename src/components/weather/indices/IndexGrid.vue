<!--
  IndexGrid.vue — 생활 지수 카드들을 격자로 배치

  어떤 컴포넌트인가:
    지수 배열을 받아 IndexCard를 반복 렌더하는 레이아웃 전용 컴포넌트.
    지수가 몇 개인지, 어떤 지수인지 알지 못한다. 배열을 그대로 돌 뿐이라
    지수를 추가해도 이 파일은 수정할 필요가 없다.

  부모:  WeatherIndicesView.vue — "생활 날씨 지수" 패널 안에 놓인다
  자식:  IndexCard.vue     — 지수 하나당 한 장
-->
<script setup>
import IndexCard from './IndexCard.vue'

/**
 * props
 *
 * @property {Array} indices  computeIndices()가 만든 지수 결과 배열.
 *                            각 원소는 { id, label, icon, score, level, message, ... } 형태이며
 *                            id는 v-for의 :key로 쓰인다
 */
defineProps({ indices: { type: Array, default: () => [] } })
</script>

<template>
  <TransitionGroup name="index-card" tag="div" class="index-grid">
    <IndexCard v-for="index in indices" :key="index.id" :index="index" />
  </TransitionGroup>
</template>

<style scoped>
/*
  지수 격자 — "생활 날씨 지수" 패널 본문 전체
  데스크톱에서는 지수 5종이 한 줄에 나란히 놓인다
*/
.index-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.index-card-enter-active,
.index-card-leave-active,
.index-card-move {
  transition:
    opacity 240ms ease,
    transform 240ms ease;
}

.index-card-enter-from,
.index-card-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 노트북 폭 — 3열로 줄여 카드가 너무 좁아지지 않게 한다 */
@media (max-width: 1080px) {
  .index-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* 태블릿 — 2열 */
@media (max-width: 700px) {
  .index-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 좁은 모바일 — 1열로 세로 나열 */
@media (max-width: 440px) {
  .index-grid {
    grid-template-columns: 1fr;
  }
}
</style>
