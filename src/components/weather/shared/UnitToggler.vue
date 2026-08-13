<script setup>
import { storeToRefs } from 'pinia'
import { useConfigStore } from '../../../stores/configStore.js'

const configStore = useConfigStore()
const { unit, unitSymbol, theme } = storeToRefs(configStore)
const unitOptions = [
  { label: '°C', value: 'celsius' },
  { label: '°F', value: 'fahrenheit' },
]

const changeUnit = (value) => {
  if (value !== unit.value) configStore.toggleUnit()
}
</script>

<template>
  <div class="unit-toggler">
    <span>{{ unit === 'celsius' ? '섭씨' : '화씨' }} {{ unitSymbol }}</span>
    <ElSwitch
      :model-value="theme"
      class="theme-switch"
      active-value="dark"
      inactive-value="light"
      inline-prompt
      active-text="☀"
      inactive-text="☾"
      :aria-label="theme === 'light' ? '다크 모드로 변경' : '라이트 모드로 변경'"
      :title="theme === 'light' ? '다크 모드' : '라이트 모드'"
      @change="configStore.toggleTheme"
    />
    <ElSegmented
      :model-value="unit"
      :options="unitOptions"
      size="small"
      aria-label="날씨 온도 단위"
      @change="changeUnit"
    />
  </div>
</template>

<style scoped>
.unit-toggler {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  color: var(--ink-500);
  font-size: 0.7rem;
  font-weight: 750;
}

.theme-switch {
  --el-switch-on-color: var(--primary-600);
  --el-switch-off-color: var(--surface-muted);
}

@media (max-width: 660px) {
  .unit-toggler {
    padding-left: 8px;
  }
}
</style>
