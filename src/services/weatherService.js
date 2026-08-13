/** OpenWeather Provider를 앱과 Store에 연결한다. */
import { createOpenWeatherProvider } from './providers/openWeatherProvider.js'

export const createWeatherService = ({ apiKey = '' } = {}) => createOpenWeatherProvider(apiKey)

/** 앱 전역에서 사용하는 OpenWeather Provider 인스턴스. */
export const weatherService = createWeatherService({
  apiKey: import.meta.env.VITE_OPENWEATHER_KEY ?? '',
})
