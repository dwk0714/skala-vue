/**
 * mockWeatherProvider.js — API 없이 동작하는 가짜 날씨 프로바이더
 *
 * openWeatherProvider와 똑같은 3개 메서드를 제공한다. 이 "같은 모양" 덕분에
 * 스토어는 어느 쪽이 연결됐는지 모른 채 동일하게 호출할 수 있다.
 *
 * 모든 메서드가 async인 이유: 실 API와 호출 방식을 맞추기 위해서다.
 * mock은 즉시 반환할 수 있지만 async가 아니면 스토어에서 await 처리가 갈린다.
 */
import { WEATHER_MOCK } from '../../data/weatherMock.js'
import { isSameLocation } from '../../utils/weatherModel.js'
import { searchCityCatalog } from '../../utils/citySearch.js'

export const mockWeatherProvider = {
  /**
   * 초기 도시 목록을 돌려준다.
   *
   * 입력: 없음
   * 출력: {Promise<Array>} 도시 8곳의 날씨 배열
   * 기능: structuredClone으로 깊은 복사를 한다. 원본을 그대로 넘기면
   *       화면에서 즐겨찾기를 토글할 때 WEATHER_MOCK 자체가 오염되어,
   *       다음 로드에 이전 상태가 섞여 나온다.
   */
  async listInitialCities({ onCity } = {}) {
    const cities = structuredClone(WEATHER_MOCK)
    cities.forEach((city, index) => onCity?.(city, index))
    return cities
  },

  /**
   * 도시를 검색한다.
   *
   * 입력: query {string} 검색어
   * 출력: {Promise<Array>} 별칭이 일치하는 도시 목록
   * 기능: 네트워크 없이 로컬 카탈로그만 뒤진다. ('제주도', 'ULSAN' 같은 표기도 매칭)
   */
  async searchCities(query) {
    return structuredClone(searchCityCatalog(query))
  },

  /**
   * 도시 한 곳의 날씨를 돌려준다.
   *
   * 입력: location {Object} id 또는 coords를 가진 위치 객체
   * 출력: {Promise<Object>} 해당 도시의 날씨
   * 예외: mock에 없는 도시면 throw. 실 API에서 404가 나는 상황과 대응된다.
   * 기능: id가 달라도 좌표가 같으면 같은 도시로 인정한다 (isSameLocation).
   */
  async fetchCityWeather(location) {
    const weather = WEATHER_MOCK.find((item) => isSameLocation(item, location))
    if (!weather) throw new Error('Mock 데이터에서 해당 도시를 찾지 못했습니다.')
    return structuredClone(weather)
  },

  async fetchCitySummary(location) {
    return this.fetchCityWeather(location)
  },

  async fetchCityDetails(location) {
    return this.fetchCityWeather(location)
  },
}
