<script setup>
import BaseDashboardCard from './BaseDashboardCard.vue'

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
    <div class="preparation-list">
      <article v-for="item in items" :key="item.id">
        <span>{{ item.icon }}</span>
        <div>
          <strong>{{ item.label }}</strong
          ><small>{{ item.detail }}</small>
        </div>
      </article>
    </div>
  </BaseDashboardCard>
</template>

<style scoped>
.dashboard-card {
  --card-icon-bg: #fff3dc;
  height: 100%;
}
.preparation-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}
article {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border-soft);
  border-radius: 13px;
  padding: 11px;
  background: rgba(255, 255, 255, 0.67);
}
article > span {
  font-size: 1.25rem;
}
article div {
  display: grid;
  min-width: 0;
}
article strong {
  color: var(--ink-700);
  font-size: 0.78rem;
}
.preparation-list small {
  overflow: hidden;
  color: var(--ink-400);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 480px) {
  .preparation-list {
    grid-template-columns: 1fr;
  }
}
</style>
