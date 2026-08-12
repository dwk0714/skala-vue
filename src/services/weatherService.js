/**
 * weatherService.js — 날씨 데이터 출처를 고르는 스위치
 *
 * 무엇을 하나:
 *   환경변수를 읽어 mock 프로바이더와 실 API 프로바이더 중 하나를 선택한다.
 *   두 프로바이더가 똑같은 3개 메서드를 제공하므로, 스토어와 화면은 어느 쪽이
 *   선택됐는지 전혀 모른 채 동작한다.
 *
 * 왜 컴포넌트 밖에 있나:
 *   이 파일이 컴포넌트 안에 있었다면 mock ↔ 실API 전환이 불가능했다.
 *   출처를 바꿔도 화면 코드는 한 줄도 손대지 않는 구조가 여기서 나온다.
 *
 * 전환 방법: .env 에 VITE_WEATHER_SOURCE=openweather 와 VITE_OPENWEATHER_KEY 를 넣는다.
 */
import { mockWeatherProvider } from './providers/mockWeatherProvider.js'
import { createOpenWeatherProvider } from './providers/openWeatherProvider.js'

/**
 * 설정에 맞는 프로바이더를 만들어 돌려준다.
 *
 * 입력: { source, apiKey }
 *       source {string} 'mock' | 'openweather' (기본 'mock')
 *       apiKey {string} openweather일 때만 필요
 * 출력: {Object} listInitialCities / searchCities / fetchCityWeather 를 가진 객체
 * 예외: 지원하지 않는 source면 즉시 throw 한다.
 *       조용히 mock으로 넘어가면 "API 연동했는데 왜 가짜 데이터지?"를 디버깅하게 되므로
 *       설정 실수는 바로 드러내는 편이 낫다.
 */
export const createWeatherService = ({ source = 'mock', apiKey = '' } = {}) => {
  if (source === 'mock') return mockWeatherProvider
  if (source === 'openweather') return createOpenWeatherProvider(apiKey)
  throw new Error(`지원하지 않는 날씨 데이터 소스입니다: ${source}`)
}

/** 앱 전역에서 쓰는 프로바이더 인스턴스. 환경변수가 없으면 mock으로 동작한다 */
const env = import.meta.env ?? {}
export const weatherService = createWeatherService({
  source: env.VITE_WEATHER_SOURCE ?? 'mock',
  apiKey: env.VITE_OPENWEATHER_KEY ?? '',
})
