import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', () => {
  const unit = ref('celsius')
  const theme = ref('light')
  const unitSymbol = computed(() => (unit.value === 'celsius' ? '°C' : '°F'))

  const toggleUnit = () => {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return { unit, theme, unitSymbol, toggleUnit, toggleTheme }
})
