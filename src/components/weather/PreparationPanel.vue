<script setup>
defineProps({
  cityName: { type: String, required: true },
  items: { type: Array, default: () => [] },
})
</script>

<template>
  <section class="recommendation-panel">
    <div class="panel-heading">
      <span>🎒</span>
      <div>
        <small>READY TO GO</small>
        <h2>{{ cityName }} 외출 준비</h2>
      </div>
    </div>
    <div class="preparation-list">
      <article v-for="item in items" :key="item.id">
        <span>{{ item.icon }}</span>
        <div>
          <strong>{{ item.label }}</strong
          ><small>{{ item.detail }}</small>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.recommendation-panel {
  height: 100%;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  padding: 22px;
  background: var(--surface-glass);
  box-shadow: var(--shadow-card);
}
.panel-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 17px;
}
.panel-heading > span {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 14px;
  background: #fff3dc;
  font-size: 1.35rem;
}
small {
  color: var(--ink-400);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
}
h2 {
  margin: 2px 0 0;
  color: var(--ink-900);
  font-size: 1.1rem;
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
article small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 480px) {
  .preparation-list {
    grid-template-columns: 1fr;
  }
}
</style>
