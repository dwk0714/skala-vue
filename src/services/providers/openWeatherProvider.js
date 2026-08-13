/**
 * OpenWeather 실 API 프로바이더.
 * 외부 응답은 Mapper를 거쳐 앱 내부 데이터 형식으로 반환한다.
 */
import axios from 'axios'
import { mapKoreanGeocodingResults } from '../mappers/locationMapper.js'
import { mapOpenWeatherBundle, mapOpenWeatherDetails } from '../mappers/openWeatherMapper.js'
import { KOREAN_CITY_CATALOG } from '../../data/koreanCityCatalog.js'
import { searchCityCatalog } from '../../utils/citySearch.js'

const API_BASE_URL = 'https://api.openweathermap.org'

const createHttpClient = () =>
  axios.create({
    baseURL: API_BASE_URL,
    timeout: 10_000,
  })

const toAbortError = () => {
  const error = new Error('요청이 취소되었습니다.')
  error.name = 'AbortError'
  return error
}

/** API Key나 Axios 설정 전체를 노출하지 않는 사용자용 오류로 바꾼다. */
const normalizeRequestError = (error) => {
  if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') return toAbortError()

  const status = error?.response?.status
  if (status === 401)
    return new Error('OpenWeather 인증에 실패했습니다. API Key와 활성화 상태를 확인하세요.')
  if (status === 429)
    return new Error('OpenWeather 요청 한도를 초과했습니다. 잠시 후 다시 시도하세요.')
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT')
    return new Error('OpenWeather 응답 시간이 초과되었습니다.')
  if (!error?.response)
    return new Error('OpenWeather 서버에 연결할 수 없습니다. 네트워크 상태를 확인하세요.')

  const apiMessage = error.response.data?.message
  return new Error(
    `OpenWeather 요청 실패 (${status ?? '알 수 없음'})${apiMessage ? `: ${apiMessage}` : ''}`,
  )
}

const requestJson = async (httpClient, path, params, apiKey, signal) => {
  try {
    const response = await httpClient.get(path, {
      params: { ...params, appid: apiKey },
      signal,
    })
    return response.data
  } catch (error) {
    throw normalizeRequestError(error)
  }
}

/**
 * @param {string} apiKey OpenWeather API Key
 * @param {object} [httpClient] 테스트 또는 특수 실행 환경에서 주입할 Axios 호환 Client
 */
export const createOpenWeatherProvider = (apiKey, httpClient = createHttpClient()) => {
  const requireApiKey = () => {
    if (!apiKey) throw new Error('VITE_OPENWEATHER_KEY가 설정되지 않았습니다.')
  }

  const getJson = async (path, params, signal) => {
    requireApiKey()
    return requestJson(httpClient, path, params, apiKey, signal)
  }

  const weatherParams = (location) => ({
    lat: location.coords.lat,
    lon: location.coords.lon,
    units: 'metric',
    lang: 'kr',
  })

  return {
    async listInitialCities({ signal, onCity } = {}) {
      requireApiKey()
      const requests = KOREAN_CITY_CATALOG.map(async (location, index) => {
        const city = await this.fetchCitySummary(location, { signal })
        onCity?.(city, index)
        return city
      })
      const results = await Promise.allSettled(requests)
      const cities = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)

      if (!cities.length)
        throw results[0]?.reason ?? new Error('날씨 데이터를 불러오지 못했습니다.')
      return cities
    },

    async searchCities(query, { signal } = {}) {
      requireApiKey()
      const localMatches = searchCityCatalog(query)
      if (localMatches.length) return structuredClone(localMatches)
      const data = await getJson('/geo/1.0/direct', { q: `${query},KR`, limit: 5 }, signal)
      return mapKoreanGeocodingResults(data)
    },

    async fetchCitySummary(location, { signal } = {}) {
      const current = await getJson('/data/2.5/weather', weatherParams(location), signal)
      return mapOpenWeatherBundle({ location, current })
    },

    async fetchCityDetails(location, { signal } = {}) {
      const params = weatherParams(location)
      const [forecast, airPollution] = await Promise.all([
        getJson('/data/2.5/forecast', params, signal),
        getJson('/data/2.5/air_pollution', params, signal),
      ])
      return mapOpenWeatherDetails(location, forecast, airPollution)
    },

    async fetchCityWeather(location, { signal } = {}) {
      requireApiKey()
      const params = weatherParams(location)
      const [current, forecast, airPollution] = await Promise.all([
        getJson('/data/2.5/weather', params, signal),
        getJson('/data/2.5/forecast', params, signal),
        getJson('/data/2.5/air_pollution', params, signal),
      ])
      return mapOpenWeatherBundle({ location, current, forecast, airPollution })
    },
  }
}
