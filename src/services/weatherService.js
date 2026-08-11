import { mockWeatherProvider } from './providers/mockWeatherProvider.js'
import { createOpenWeatherProvider } from './providers/openWeatherProvider.js'

export const createWeatherService = ({ source = 'mock', apiKey = '' } = {}) => {
  if (source === 'mock') return mockWeatherProvider
  if (source === 'openweather') return createOpenWeatherProvider(apiKey)
  throw new Error(`지원하지 않는 날씨 데이터 소스입니다: ${source}`)
}

const env = import.meta.env ?? {}
export const weatherService = createWeatherService({
  source: env.VITE_WEATHER_SOURCE ?? 'mock',
  apiKey: env.VITE_OPENWEATHER_KEY ?? '',
})
