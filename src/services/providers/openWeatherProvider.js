import { mapKoreanGeocodingResults } from '../mappers/locationMapper.js'
import { mapOpenWeatherBundle } from '../mappers/openWeatherMapper.js'
import { KOREAN_CITY_CATALOG } from '../../data/koreanCityCatalog.js'
import { searchCityCatalog } from '../../utils/citySearch.js'

const API_BASE_URL = 'https://api.openweathermap.org'
const fetchJson = async (url, signal) => {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`OpenWeather 요청 실패 (${response.status})`)
  return response.json()
}
const withParams = (path, params) => {
  const url = new URL(path, API_BASE_URL)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url
}

export const createOpenWeatherProvider = (apiKey) => {
  const requireApiKey = () => {
    if (!apiKey) throw new Error('VITE_OPENWEATHER_KEY가 설정되지 않았습니다.')
  }
  return {
    async listInitialCities({ signal } = {}) {
      return Promise.all(
        KOREAN_CITY_CATALOG.map((location) => this.fetchCityWeather(location, { signal })),
      )
    },
    async searchCities(query, { signal } = {}) {
      requireApiKey()
      const localMatches = searchCityCatalog(query)
      if (localMatches.length) return structuredClone(localMatches)
      const url = withParams('/geo/1.0/direct', { q: `${query},KR`, limit: '5', appid: apiKey })
      return mapKoreanGeocodingResults(await fetchJson(url, signal))
    },
    async fetchCityWeather(location, { signal } = {}) {
      requireApiKey()
      const params = {
        lat: String(location.coords.lat),
        lon: String(location.coords.lon),
        units: 'metric',
        lang: 'kr',
        appid: apiKey,
      }
      const [current, forecast, airPollution] = await Promise.all([
        fetchJson(withParams('/data/2.5/weather', params), signal),
        fetchJson(withParams('/data/2.5/forecast', params), signal),
        fetchJson(withParams('/data/2.5/air_pollution', params), signal),
      ])
      return mapOpenWeatherBundle({ location, current, forecast, airPollution })
    },
  }
}
