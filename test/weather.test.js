import test from 'node:test'
import assert from 'node:assert/strict'

import { KOREAN_CITY_CATALOG } from '../src/data/koreanCityCatalog.js'
import { WEATHER_MOCK } from '../src/data/weatherMock.js'
import { mapKoreanGeocodingResults } from '../src/services/mappers/locationMapper.js'
import { groupDailyForecast, mapOpenWeatherBundle } from '../src/services/mappers/openWeatherMapper.js'
import { createWeatherService } from '../src/services/weatherService.js'
import { searchCityCatalog } from '../src/utils/citySearch.js'
import { INDICES, computeIndices } from '../src/utils/indices/index.js'
import bungeoppang from '../src/utils/indices/bungeoppang.js'
import mosquito from '../src/utils/indices/mosquito.js'
import { findNextRain } from '../src/utils/indices/carWash.js'
import { getWalkableHours } from '../src/utils/recommendations/walkTimes.js'

test('국내 도시 카탈로그와 별칭을 검색한다', () => {
  assert.equal(KOREAN_CITY_CATALOG.length, 8)
  assert.equal(searchCityCatalog('광주')[0].state, '광주광역시')
  assert.equal(searchCityCatalog('제주도')[0].name, '제주')
  assert.equal(searchCityCatalog('ULSAN')[0].name, '울산')
})

test('Geocoding 결과는 국내만 남기고 내부 위치 모델로 바꾼다', () => {
  const result = mapKoreanGeocodingResults([
    { name: 'Gwangju', local_names: { ko: '광주' }, country: 'KR', state: '광주광역시', lat: 35.1595, lon: 126.8526 },
    { name: 'Gwangju', country: 'XX', lat: 0, lon: 0 },
  ])
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 'kr-35.1595-126.8526')
})

test('Forecast를 날짜별 최대 pop으로 묶는다', () => {
  const grouped = groupDailyForecast([
    { dt: 1000, pop: 0.1 },
    { dt: 2000, pop: 0.8 },
    { dt: 90000, pop: 0.3 },
  ])
  assert.deepEqual(grouped.map((item) => item.pop), [0.8, 0.3])
})

test('OpenWeather 필드를 고정 내부 스키마로 매핑한다', () => {
  const mapped = mapOpenWeatherBundle({
    location: KOREAN_CITY_CATALOG[0],
    current: { coord: { lat: 1, lon: 2 }, main: { temp: 21.6, feels_like: 23.4, humidity: 60 }, weather: [{ description: '맑음' }], wind: { speed: 3.2 }, timezone: 32400, dt: 1000, sys: { country: 'KR' } },
    forecast: { list: [{ dt: 2000, pop: 1.4, main: { temp: 20, feels_like: 19 }, weather: [{ description: '흐림' }] }] },
    airPollution: { list: [{ components: { pm10: 42 } }] },
  })
  assert.equal(mapped.feelsLike, 23)
  assert.equal(mapped.windSpeed, 3.2)
  assert.deepEqual(mapped.coords, { lat: 1, lon: 2 })
  assert.equal(mapped.pop, 1)
})

test('지수 레지스트리 계약과 Mock 등급 분포를 지킨다', () => {
  assert.equal(INDICES.length, 5)
  for (const index of INDICES) {
    assert.equal(typeof index.compute, 'function')
    const levels = new Set(WEATHER_MOCK.map((weather) => index.compute(weather).level))
    assert.ok(levels.size >= 2, `${index.id}의 Mock 등급이 갈려야 합니다.`)
  }
  assert.equal(computeIndices(WEATHER_MOCK[0]).length, 5)
})

test('지수 경계와 다음 비를 계산한다', () => {
  assert.equal(bungeoppang.compute({ temp: 15 }).level, 'none')
  assert.equal(mosquito.compute({ temp: 15, humidity: 90, windSpeed: 0 }).score, 0)
  assert.equal(findNextRain(WEATHER_MOCK[0]).daysFromNow, 3)
  assert.equal(findNextRain({ ...WEATHER_MOCK[0], forecast: [] }), null)
})

test('산책 시간은 맑은 15~26도를 포함하고 비를 제외한다', () => {
  const hours = getWalkableHours([
    { temp: 15, pop: 0, status: '맑음' },
    { temp: 26, pop: 0, status: '맑음' },
    { temp: 20, pop: 0, status: '비' },
    { temp: 20, pop: 0.1, status: '맑음' },
  ])
  assert.deepEqual(hours.map((item) => item.temp), [15, 26])
  assert.equal(getWalkableHours(WEATHER_MOCK.find((city) => city.id === 'kr-suwon').hourly).length, 0)
})

test('데이터 소스를 선택하고 잘못된 설정을 거부한다', async () => {
  assert.equal((await createWeatherService().listInitialCities()).length, 8)
  assert.throws(() => createWeatherService({ source: 'unknown' }), /지원하지 않는/)
  await assert.rejects(() => createWeatherService({ source: 'openweather' }).searchCities('서울'), /VITE_OPENWEATHER_KEY/)
})
