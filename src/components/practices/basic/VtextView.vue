<script setup>
const content = '안녕하세요! <strong>Skala-Vue</strong> 강의입니다.'
</script>

<template>
  <div class="practice-section">
    <h2>v-text 디렉티브 학습</h2>
    <br />
    <h3>일반 보간법 {{}} 결과:</h3>
    <p>출력: {{ content }}</p>
    <br />
    <h3>v-text 디렉티브 사용 결과:</h3>
    <p v-text="'출력: ' + content"></p>
    <br />
    <h3>v-html 결과 비교:</h3>
    <p v-html="content"></p>
  </div>
</template>
