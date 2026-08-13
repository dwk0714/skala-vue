import { storeToRefs } from 'pinia'
import { useConfigStore } from '../stores/configStore.js'

export const useTemperature = () => {
  const configStore = useConfigStore()
  const { unit, unitSymbol } = storeToRefs(configStore)

  const displayTemperature = (celsius) =>
    unit.value === 'fahrenheit' ? Math.round((celsius * 9) / 5 + 32) : celsius

  return { displayTemperature, unitSymbol }
}
