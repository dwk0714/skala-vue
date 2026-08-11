<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const dummy = ref(0)

const getMethodResult = () => {
  console.log('X 일반 함수 실행됨!')
  return count.value * 2
}

const doubleCount = computed(() => {
  console.log('O computed 실행됨!')
  return count.value * 2
})
</script>

<template>
  <div class="practice-section">
    <h2>Computed() 캐싱 동작 비교</h2>

    <p>count: {{ count }} | {{ dummy }}</p>
    <button @click="count++">카운트 증가 (의존성 변경)</button>
    <button @click="dummy++">더미 증가(무관한 변경)</button>

    <p>일반 함수 결과: {{ getMethodResult() }}</p>
    <p>computed 결과: {{ doubleCount }}</p>
  </div>
</template>
