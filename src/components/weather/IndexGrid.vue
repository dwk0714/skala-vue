<script setup>
import IndexCard from './IndexCard.vue'
defineProps({ indices: { type: Array, default: () => [] } })
</script>

<template>
  <div class="index-grid">
    <IndexCard v-for="index in indices" :key="index.id" :index="index" />
  </div>
</template>

<style scoped>
.index-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}
@media (max-width: 1080px) {
  .index-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 700px) {
  .index-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 440px) {
  .index-grid {
    grid-template-columns: 1fr;
  }
}
</style>
