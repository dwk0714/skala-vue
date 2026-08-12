<script setup>
defineProps({
  title: { type: String, required: true },
  titleId: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  icon: { type: String, default: '' },
})
</script>

<template>
  <section class="dashboard-card" :aria-labelledby="titleId">
    <header class="card-heading">
      <span v-if="icon" class="card-icon" aria-hidden="true">{{ icon }}</span>
      <div>
        <small v-if="eyebrow">{{ eyebrow }}</small>
        <h2 :id="titleId">{{ title }}</h2>
      </div>
      <div v-if="$slots.meta" class="card-meta"><slot name="meta" /></div>
    </header>
    <slot />
  </section>
</template>

<style scoped>
.dashboard-card {
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  padding: 22px;
  background: var(--card-bg, var(--surface-glass));
  box-shadow: var(--shadow-card);
}
.card-heading {
  display: flex;
  align-items: var(--card-heading-align, center);
  flex-direction: var(--card-heading-direction, row);
  gap: var(--card-heading-gap, 12px);
  margin-bottom: var(--card-heading-margin, 17px);
}
.card-heading small {
  color: var(--card-eyebrow-color, var(--ink-400));
  font-size: var(--card-eyebrow-size, 0.62rem);
  font-weight: var(--card-eyebrow-weight, 400);
  letter-spacing: var(--card-eyebrow-spacing, 0.08em);
}
.card-heading h2 {
  margin: var(--card-title-margin, 2px 0 0);
  color: var(--ink-900);
  font-size: var(--card-title-size, 1.1rem);
}
.card-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 14px;
  background: var(--card-icon-bg, var(--surface-muted));
  font-size: 1.35rem;
}
.card-meta {
  margin-left: var(--card-meta-margin-left, auto);
}
</style>
