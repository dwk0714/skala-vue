<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter.js'

const counterStore = useCounterStore()
const { count, doubleCount } = storeToRefs(counterStore)
</script>

<template>
  <div class="practice-section">
    <h2>Pinia Store</h2>
    <p>현재 값: {{ count }}</p>
    <p>두 배 값: {{ doubleCount }}</p>
    <button type="button" @click="counterStore.increment">증가</button>
  </div>
</template>
