<script setup>
import { ref } from 'vue'
const msg = ref('느린 네트워크에서도 안전하게 출력되는 메세지!')
</script>

<template>
  <div v-cloak class="practice-section">
    <h2>v-cloak 디렉티브 학습</h2>
    <p>{{ msg }}</p>
  </div>
</template>

<style scoped>
/* v-cloak 디렉티브를 사용하면 Vue 인스턴스가 완전히 초기화될 때까지 해당 요소를 숨길 수 있습니다. */
[v-cloak] {
  display: none !important;
}
</style>
