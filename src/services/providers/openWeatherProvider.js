/**
 * openWeatherProvider.js — OpenWeather 실 API 프로바이더
 *
 * mockWeatherProvider와 똑같은 3개 메서드를 제공하므로 서로 교체 가능하다.
 *
 * 연동 상태: 코드는 완성되어 있으나 실제 API 키로는 아직 검증하지 않았다.
 *   .env 에 VITE_WEATHER_SOURCE=openweather 와 VITE_OPENWEATHER_KEY 를 넣으면 활성화된다.
 *
 * axios를 쓰지 않고 브라우저 내장 fetch를 쓴다. 패키지를 하나 덜 깔기 위해서다.
 */
import { mapKoreanGeocodingResults } from '../mappers/locationMapper.js'
import { mapOpenWeatherBundle } from '../mappers/openWeatherMapper.js'
import { KOREAN_CITY_CATALOG } from '../../data/koreanCityCatalog.js'
import { searchCityCatalog } from '../../utils/citySearch.js'

const API_BASE_URL = 'https://api.openweathermap.org'

/**
 * JSON을 받아오는 공통 함수.
 * 입력: url {URL|string}, signal {AbortSignal} 요청 취소용
 * 출력: {Promise<Object>} 파싱된 JSON
 * 예외: 2xx가 아니면 상태 코드를 담아 throw. fetch는 404에도 reject하지 않으므로 직접 확인해야 한다.
 */
const fetchJson = async (url, signal) => {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`OpenWeather 요청 실패 (${response.status})`)
  return response.json()
}

/**
 * 쿼리 문자열을 안전하게 조립한다.
 * 입력: path {string} 엔드포인트 경로, params {Object} 쿼리 파라미터
 * 출력: {URL}
 * 기능: URL API가 인코딩을 처리하므로 한글 도시명을 그대로 넣어도 된다.
 */
const withParams = (path, params) => {
  const url = new URL(path, API_BASE_URL)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url
}

/**
 * API 키를 주입해 프로바이더를 만든다. (팩토리)
 *
 * 입력: apiKey {string}
 * 출력: {Object} mockWeatherProvider와 같은 모양의 객체
 * 목적: 키를 모듈 전역에 두지 않고 클로저에 가둔다.
 */
export const createOpenWeatherProvider = (apiKey) => {
  /** 키가 없으면 요청 전에 막는다. 401을 받고 원인을 헤매는 것보다 낫다 */
  const requireApiKey = () => {
    if (!apiKey) throw new Error('VITE_OPENWEATHER_KEY가 설정되지 않았습니다.')
  }

  return {
    /**
     * 카탈로그의 8개 도시 날씨를 모두 받아온다.
     * 입력: { signal } / 출력: {Promise<Array>}
     * 기능: Promise.all로 병렬 호출한다. 순차 호출하면 8배 느리다.
     */
    async listInitialCities({ signal } = {}) {
      return Promise.all(
        KOREAN_CITY_CATALOG.map((location) => this.fetchCityWeather(location, { signal })),
      )
    },

    /**
     * 도시를 검색한다.
     * 입력: query {string}, { signal }
     * 출력: {Promise<Array>} 국내 도시만 담긴 위치 배열
     * 기능: 로컬 카탈로그를 먼저 뒤지고, 걸리는 게 있으면 네트워크를 타지 않는다.
     *       없을 때만 Geocoding API를 부르고, 결과 중 country가 'KR'인 것만 남긴다.
     */
    async searchCities(query, { signal } = {}) {
      requireApiKey()
      const localMatches = searchCityCatalog(query)
      if (localMatches.length) return structuredClone(localMatches)
      const url = withParams('/geo/1.0/direct', { q: `${query},KR`, limit: '5', appid: apiKey })
      return mapKoreanGeocodingResults(await fetchJson(url, signal))
    },

    /**
     * 도시 한 곳의 날씨를 받아온다.
     *
     * 입력: location {Object} coords를 가진 위치 객체, { signal }
     * 출력: {Promise<Object>} 내부 스키마로 변환된 날씨 객체
     * 기능: 세 엔드포인트를 Promise.all로 동시에 부른다.
     *         /data/2.5/weather        현재 날씨
     *         /data/2.5/forecast       5일 3시간 예보 (hourly·forecast의 원천)
     *         /data/2.5/air_pollution  미세먼지
     *       세 응답을 mapOpenWeatherBundle이 하나의 내부 스키마로 합친다.
     *       lang=kr로 날씨 설명을 한글로 받고, units=metric으로 섭씨를 받는다.
     */
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
