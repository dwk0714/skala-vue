<script setup>
import { formatHour } from '../../utils/recommendations/walkTimes.js'
import BaseDashboardCard from './BaseDashboardCard.vue'

defineProps({
  city: { type: Object, required: true },
  availableHours: { type: Array, default: () => [] },
  walkImage: { type: String, default: '' },
  stayHomeImage: { type: String, default: '' },
})
</script>

<template>
  <BaseDashboardCard
    class="walk-panel"
    :class="{ danger: !availableHours.length }"
    :title="`${city.name} 산책 추천 시간`"
    title-id="walk-title"
    eyebrow="WALK WINDOW"
    icon="🚶"
  >
    <template v-if="availableHours.length">
      <div class="image-slot">
        <img v-if="walkImage" :src="walkImage" alt="산책 추천" />
        <span v-else aria-label="산책 이미지 영역"></span>
      </div>
      <p>비 걱정 없이 걷기 좋은 시간이에요.</p>
      <div class="time-list">
        <span v-for="hour in availableHours" :key="hour.dt">
          <strong>{{ formatHour(hour.dt, city.timezone) }}</strong>
          {{ hour.temp }}℃ · {{ hour.status }}
        </span>
      </div>
    </template>
    <template v-else>
      <div class="image-slot empty">
        <img v-if="stayHomeImage" :src="stayHomeImage" alt="실내 휴식 추천" />
        <span v-else aria-label="실내 휴식 이미지 영역"></span>
      </div>
      <p class="danger-message">밖은 위험해.. 이불 속에 숨기</p>
    </template>
  </BaseDashboardCard>
</template>

<style scoped>
.walk-panel {
  --card-bg: linear-gradient(
    140deg,
    rgba(230, 247, 238, 0.9),
    rgba(232, 245, 255, 0.78)
  );
  --card-heading-margin: 0;
  --card-icon-bg: rgba(255, 255, 255, 0.72);
  height: 100%;
}
.walk-panel.danger {
  --card-bg: linear-gradient(
    140deg,
    rgba(245, 241, 247, 0.92),
    rgba(236, 240, 246, 0.85)
  );
}
.image-slot {
  height: 54px;
  margin: 15px 0 10px;
  overflow: hidden;
  border: 1px dashed rgba(76, 137, 106, 0.25);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.28);
}
.image-slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.image-slot span {
  display: block;
  width: 100%;
  height: 100%;
}
p {
  margin: 0 0 11px;
  color: var(--ink-600);
  font-size: 0.76rem;
}
.time-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.time-list span {
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.58);
  color: var(--ink-500);
  font-size: 0.67rem;
}
.time-list strong {
  display: block;
  color: var(--primary-800);
  font-size: 0.83rem;
}
.danger-message {
  margin-top: 14px;
  color: #725d75;
  font-size: 0.92rem;
  font-weight: 800;
  text-align: center;
}
</style>
