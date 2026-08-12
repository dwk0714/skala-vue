<!--
  LogPanel.vue — 반응형 상태 추적 로그 (과제 2 요건 5)

  어떤 컴포넌트인가:
    watch / watchEffect가 발화할 때마다 쌓인 로그를 화면에 보여주는 패널.
    브라우저 콘솔을 열지 않아도 반응성이 언제 동작하는지 눈으로 확인할 수 있게 한다.
    로그를 만들지는 않는다. 부모가 만든 배열을 받아 그리기만 한다.

  부모:  WeatherParent.vue — 페이지 최하단, 푸터 바로 위
  자식:  BaseDashboardCard.vue — 패널 껍데기를 빌려 쓴다

  내용은 BaseDashboardCard의 기본 슬롯으로 들어가므로,
  아래 <style scoped>는 이 파일에 있어야 적용된다. (슬롯 스코프 규칙)
-->
<script setup>
import BaseDashboardCard from './BaseDashboardCard.vue'

/**
 * props
 *
 * @property {Array} logs  최근 로그 배열 (최신순, 최대 20건).
 *                         각 원소는 { id: number, text: string }.
 *                         text는 utils/logger.js가 접두사를 붙인 문자열로,
 *                         콘솔에 찍힌 것과 완전히 같은 내용이다.
 */
defineProps({
  logs: { type: Array, default: () => [] },
})
</script>

<template>
  <BaseDashboardCard
    class="log-panel"
    title="반응형 상태 추적"
    title-id="log-title"
    eyebrow="REACTIVITY LOG"
  >
    <ol v-if="logs.length">
      <li v-for="entry in logs" :key="entry.id">{{ entry.text }}</li>
    </ol>
    <p v-else>상태가 변경되면 최근 로그가 여기에 표시됩니다.</p>
  </BaseDashboardCard>
</template>

<style scoped>
/*
  패널 루트 — 페이지 최하단 전체 폭
  아래 --card-* 는 BaseDashboardCard의 헤더 기본값을 이 패널용으로 덮는 값이다.
  (eyebrow를 진초록 굵은 글씨로 바꿔 다른 패널과 통일)
  자식 컴포넌트의 루트 엘리먼트는 부모의 scope 속성도 받으므로 여기서 덮을 수 있다.
*/
.log-panel {
  --card-heading-margin: 14px;
  --card-eyebrow-color: var(--primary-700);
  --card-eyebrow-weight: 800;
  --card-eyebrow-spacing: 0.12em;
  --card-title-margin: 3px 0 0;
  margin-top: 34px;
}

/* 로그 목록 — 최대 260px까지만 보이고 넘치면 안에서 스크롤된다
   (로그가 20건까지 쌓여도 페이지가 길어지지 않게) */
ol {
  display: grid;
  max-height: 260px;
  gap: 7px;
  overflow-y: auto;
  padding: 0;
  list-style: none;
}

/* 로그 한 줄 / 빈 상태 문구 — 연한 민트 배경의 알약
   고정폭(모노스페이스) 글꼴이라 콘솔과 같은 느낌으로 읽힌다 */
li,
p {
  margin: 0;
  border-radius: 10px;
  padding: 9px 11px;
  background: rgba(231, 242, 236, 0.7);
  color: var(--ink-600);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
}
</style>
