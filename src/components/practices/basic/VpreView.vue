<script setup>
import { ref } from 'vue'
const msg = ref('하이용')
</script>

<template>
  <div class="practice-section">
    <h2>v-pre 디렉티브 학습</h2>
    <p>일반 출력: {{ msg }}</p>
    <p v-pre>v-pre 출력: {{ msg }}</p>
  </div>
</template>
