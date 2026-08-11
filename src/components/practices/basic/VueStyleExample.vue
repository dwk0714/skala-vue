<script setup>
// 자바스크립트 방은 깨끗하게 비워둡니다.
</script>
<template>
  <div class="practice-section">
    <h2>Scoped 스타일 및 외부 CSS 활용</h2>
    <p class="title">이 글자는 이 컴포넌트 내부에서만 빨간색이 됩니다.</p>
    <button class="btn-external">외부 CSS에서 불러온 버튼 스타일</button>
  </div>
</template>

<!-- 1. 이 컴포넌트 전용 스타일 (Scoped) -->
<style scoped>
/* 내 방 전용 타이틀 디자인 */
.title {
  color: #ff7675;
  font-weight: bold;
  font-size: 18px;
}
</style>

<!-- 2. 외부 CSS 파일을 가져오는 일반 스타일 -->
<style>
@import '@/assets/challenge.css';
</style>
