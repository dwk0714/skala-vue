import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'

import { useTemperature } from '../src/composables/useTemperature.js'
import { KOREAN_CITY_CATALOG } from '../src/data/koreanCityCatalog.js'
import { WEATHER_MOCK } from '../src/data/weatherMock.js'
import { mapKoreanGeocodingResults } from '../src/services/mappers/locationMapper.js'
import {
  groupDailyForecast,
  mapOpenWeatherBundle,
  normalizeWeatherStatus,
} from '../src/services/mappers/openWeatherMapper.js'
import { createOpenWeatherProvider } from '../src/services/providers/openWeatherProvider.js'
import { createWeatherService } from '../src/services/weatherService.js'
import { useConfigStore } from '../src/stores/configStore.js'
import { searchCityCatalog } from '../src/utils/citySearch.js'
import { INDICES, computeIndices } from '../src/utils/indices/index.js'
import bungeoppang from '../src/utils/indices/bungeoppang.js'
import mosquito from '../src/utils/indices/mosquito.js'
import { findNextRain } from '../src/utils/indices/carWash.js'
import {
  getMusicRecommendation,
  getMusicRecommendations,
} from '../src/utils/recommendations/music.js'
import {
  getOutingBriefing,
  getPreparationItems,
} from '../src/utils/recommendations/preparation.js'
import {
  getTodayForecast,
  getWalkWeatherType,
  getWalkableHours,
  isMostlyRainy,
} from '../src/utils/recommendations/walkTimes.js'
import { compareCities } from '../src/utils/weatherBattle.js'
import { getPm10Level } from '../src/utils/weatherModel.js'

const API_RESPONSES = {
  '/data/2.5/weather': {
    coord: { lat: 37.5665, lon: 126.978 },
    main: { temp: 22, feels_like: 24, humidity: 55 },
    weather: [{ description: '맑음' }],
    wind: { speed: 2.4 },
    timezone: 32400,
    dt: 1_786_460_400,
    sys: { country: 'KR' },
  },
  '/data/2.5/forecast': {
    list: [
      {
        dt: 1_786_471_200,
        pop: 0.1,
        main: { temp: 21, feels_like: 22 },
        weather: [{ description: '맑음' }],
      },
    ],
  },
  '/data/2.5/air_pollution': { list: [{ components: { pm10: 25 } }] },
}

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

test('일별 예보는 최저·최고 기온과 눈·비를 우선한 대표 날씨를 만든다', () => {
  const grouped = groupDailyForecast([
    {
      dt: 1000,
      pop: 0.1,
      main: { temp: 13, temp_min: 11, temp_max: 14 },
      weather: [{ main: 'Clouds', description: '온흐림' }],
    },
    {
      dt: 2000,
      pop: 0.8,
      main: { temp: 16, temp_min: 12, temp_max: 18 },
      weather: [{ main: 'Rain', description: '비' }],
    },
  ])

  assert.equal(grouped[0].tempMin, 11)
  assert.equal(grouped[0].tempMax, 18)
  assert.equal(grouped[0].status, '비')
  assert.equal(normalizeWeatherStatus({ main: 'Clouds', description: '온흐림' }), '흐림')
  assert.equal(normalizeWeatherStatus({ main: 'Snow', description: '약한 눈' }), '눈')
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

test('PM10을 반올림해 매우 좋음부터 매우 나쁨까지 5단계로 표시한다', () => {
  assert.deepEqual(getPm10Level(19.81), { level: 'good', label: '좋음', value: 20 })
  assert.equal(getPm10Level(15).label, '매우 좋음')
  assert.equal(getPm10Level(16).label, '좋음')
  assert.equal(getPm10Level(31).label, '보통')
  assert.equal(getPm10Level(81).label, '나쁨')
  assert.equal(getPm10Level(151).label, '매우 나쁨')
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

test('산책 이미지는 시간대별 비 예보의 비중에 맞춰 선택한다', () => {
  assert.equal(isMostlyRainy(WEATHER_MOCK.find((city) => city.id === 'kr-seoul')), false)
  assert.equal(isMostlyRainy(WEATHER_MOCK.find((city) => city.id === 'kr-suwon')), true)
  assert.equal(getWalkWeatherType(WEATHER_MOCK.find((city) => city.id === 'kr-seoul')), 'sunny')
  assert.equal(getWalkWeatherType(WEATHER_MOCK.find((city) => city.id === 'kr-suwon')), 'rain')
  assert.equal(getWalkWeatherType({ status: '맑음', hourly: [{ status: '뇌우' }] }), 'thunder')
  assert.equal(getWalkWeatherType({ status: '눈', hourly: [] }), 'snow')
  assert.equal(getWalkWeatherType({ status: '우박', hourly: [] }), 'hail')
})

test('오늘의 외출 브리핑은 날씨와 준비물을 행동 문장으로 요약한다', () => {
  const seoul = WEATHER_MOCK.find((city) => city.id === 'kr-seoul')
  const suwon = WEATHER_MOCK.find((city) => city.id === 'kr-suwon')

  assert.match(getOutingBriefing(seoul, getWalkableHours(seoul.hourly)), /산책하기 좋은 시간대/)
  assert.match(getOutingBriefing(suwon, []), /비 예보/)
  assert.match(getOutingBriefing(suwon, []), /우산/)
  assert.ok(getPreparationItems(suwon).length >= 2)
})

test('오늘의 추천 음악은 날씨와 도시 현지 시간에 맞춰 안정적으로 선택한다', () => {
  const now = Date.parse('2026-08-13T09:00:00+09:00')
  const seoul = WEATHER_MOCK.find((city) => city.id === 'kr-seoul')
  const suwon = WEATHER_MOCK.find((city) => city.id === 'kr-suwon')
  const snow = { ...seoul, status: '눈' }

  assert.match(getMusicRecommendation(seoul, now).title, /햇살|맑은/)
  assert.match(getMusicRecommendation(suwon, now).title, /비/)
  assert.match(getMusicRecommendation(snow, now).title, /눈|겨울/)
  assert.deepEqual(getMusicRecommendations(seoul, now), getMusicRecommendations(seoul, now))
  assert.ok(getMusicRecommendations(seoul, now).length >= 2)
})

test('오늘 예보는 도시 현지 날짜의 03시부터 24시까지 8칸으로 제한한다', () => {
  const timezone = 9 * 60 * 60
  const now = Date.parse('2026-08-13T14:00:00+09:00') / 1000
  const hourly = [
    { dt: Date.parse('2026-08-13T15:00:00+09:00') / 1000, temp: 28 },
    { dt: Date.parse('2026-08-14T00:00:00+09:00') / 1000, temp: 24 },
    { dt: Date.parse('2026-08-14T03:00:00+09:00') / 1000, temp: 23 },
  ]
  const result = getTodayForecast(hourly, timezone, now)

  assert.equal(result.slots.length, 8)
  assert.deepEqual(
    result.slots.map((slot) => slot.label),
    ['03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '24:00'],
  )
  assert.equal(result.slots.find((slot) => slot.hour === 15).forecast.temp, 28)
  assert.equal(result.slots.find((slot) => slot.hour === 24).forecast.temp, 24)
  assert.equal(result.slots.find((slot) => slot.hour === 3).forecast, null)
  assert.match(result.dateLabel, /2026년 8월 13일/)
})

test('데이터 소스를 선택하고 잘못된 설정을 거부한다', async () => {
  assert.equal((await createWeatherService().listInitialCities()).length, 8)
  assert.throws(() => createWeatherService({ source: 'unknown' }), /지원하지 않는/)
  await assert.rejects(() => createWeatherService({ source: 'openweather' }).searchCities('서울'), /VITE_OPENWEATHER_KEY/)
})

test('날씨 단위를 전환하되 원본 데이터와 지수 계산은 섭씨를 유지한다', () => {
  setActivePinia(createPinia())
  const configStore = useConfigStore()
  const { displayTemperature, unitSymbol } = useTemperature()
  const originalTemp = WEATHER_MOCK[0].temp
  const originalScores = computeIndices(WEATHER_MOCK[0]).map((index) => index.score)

  assert.equal(configStore.unit, 'celsius')
  assert.equal(configStore.theme, 'light')
  assert.equal(unitSymbol.value, '°C')
  assert.equal(displayTemperature(0), 0)

  configStore.toggleUnit()
  assert.equal(configStore.unit, 'fahrenheit')
  assert.equal(unitSymbol.value, '°F')
  assert.equal(displayTemperature(0), 32)
  assert.equal(displayTemperature(22), 72)
  assert.equal(WEATHER_MOCK[0].temp, originalTemp)
  assert.deepEqual(
    computeIndices(WEATHER_MOCK[0]).map((index) => index.score),
    originalScores,
  )

  configStore.toggleUnit()
  assert.equal(configStore.unit, 'celsius')
  assert.equal(unitSymbol.value, '°C')

  configStore.toggleTheme()
  assert.equal(configStore.theme, 'dark')
  configStore.toggleTheme()
  assert.equal(configStore.theme, 'light')
})

test('Axios 요청에 인증·좌표·단위를 전달하고 response.data를 매핑한다', async () => {
  const requests = []
  const httpClient = {
    async get(path, config) {
      requests.push({ path, config })
      return { data: API_RESPONSES[path] }
    },
  }
  const provider = createOpenWeatherProvider('safe-test-key', httpClient)
  const location = KOREAN_CITY_CATALOG[0]
  const weather = await provider.fetchCityWeather(location)

  assert.equal(requests.length, 3)
  assert.deepEqual(
    requests.map(({ path }) => path).sort(),
    Object.keys(API_RESPONSES).sort(),
  )
  for (const { config } of requests) {
    assert.equal(config.params.appid, 'safe-test-key')
    assert.equal(config.params.lat, location.coords.lat)
    assert.equal(config.params.lon, location.coords.lon)
    assert.equal(config.params.units, 'metric')
    assert.equal(config.params.lang, 'kr')
  }
  assert.equal(weather.temp, 22)
  assert.equal(weather.feelsLike, 24)
  assert.equal(weather.pop, 0.1)
  assert.equal(weather.pm10, 25)
})

test('초기에는 현재 날씨 8건만 받고 선택 도시의 상세 2건을 나중에 받는다', async () => {
  const requests = []
  const delivered = []
  const httpClient = {
    async get(path) {
      requests.push(path)
      return { data: API_RESPONSES[path] }
    },
  }
  const provider = createOpenWeatherProvider('safe-test-key', httpClient)

  const cities = await provider.listInitialCities({
    onCity(city, index) {
      delivered[index] = city.id
    },
  })

  assert.equal(cities.length, 8)
  assert.equal(requests.length, 8)
  assert.ok(requests.every((path) => path === '/data/2.5/weather'))
  assert.equal(delivered.filter(Boolean).length, 8)
  assert.equal(cities[0].hourly.length, 0)

  const details = await provider.fetchCityDetails(cities[0])
  assert.equal(requests.length, 10)
  assert.deepEqual(requests.slice(-2).sort(), [
    '/data/2.5/air_pollution',
    '/data/2.5/forecast',
  ])
  assert.equal(details.hourly.length, 1)
  assert.equal(details.pm10, 25)
})

test('OpenWeather 오류를 안전한 사용자 메시지로 변환한다', async () => {
  const rejectWith = (error) => ({ get: async () => Promise.reject(error) })
  const search = (error) =>
    createOpenWeatherProvider('sensitive-test-key', rejectWith(error)).searchCities(
      'catalog에 없는 도시',
    )

  await assert.rejects(search({ response: { status: 401, data: { message: 'Invalid key' } } }), (error) => {
    assert.match(error.message, /인증/)
    assert.doesNotMatch(error.message, /sensitive-test-key/)
    return true
  })
  await assert.rejects(search({ response: { status: 429 } }), /요청 한도/)
  await assert.rejects(search({ code: 'ECONNABORTED' }), /시간이 초과/)
  await assert.rejects(search({ request: {} }), /네트워크/)
  await assert.rejects(search({ code: 'ERR_CANCELED' }), (error) => error.name === 'AbortError')
})

test('도시 대결은 모기 점수를 반대로 비교하고 종합점수에서 차감한다', () => {
  const left = WEATHER_MOCK.find((city) => city.id === 'kr-seoul')
  const right = WEATHER_MOCK.find((city) => city.id === 'kr-busan')
  const result = compareCities(left, right)

  assert.equal(result.rounds.length, 5)
  assert.equal(
    result.leftTotal,
    result.rounds.reduce(
      (sum, round) => sum + (round.id === 'mosquito' ? -round.leftScore : round.leftScore),
      0,
    ),
  )
  assert.equal(
    result.rightTotal,
    result.rounds.reduce(
      (sum, round) => sum + (round.id === 'mosquito' ? -round.rightScore : round.rightScore),
      0,
    ),
  )
  const mosquitoRound = result.rounds.find((round) => round.id === 'mosquito')
  assert.equal(mosquitoRound.lowerBetter, true)
  if (mosquitoRound.leftScore !== mosquitoRound.rightScore)
    assert.equal(
      mosquitoRound.winner,
      mosquitoRound.leftScore < mosquitoRound.rightScore ? left : right,
    )
  assert.equal(result.leftWins + result.rightWins <= 5, true)
  if (result.leftWins !== result.rightWins)
    assert.equal(result.winner, result.leftWins > result.rightWins ? left : right)
  else if (result.leftTotal !== result.rightTotal)
    assert.equal(result.winner, result.leftTotal > result.rightTotal ? left : right)
  else assert.equal(result.winner, null)
})

test('도시 대결은 동일 점수 무승부와 동일 도시 선택을 처리한다', () => {
  const city = WEATHER_MOCK[0]
  const copy = { ...structuredClone(city), id: 'kr-seoul-copy', name: '서울 복제' }
  const draw = compareCities(city, copy)

  assert.equal(draw.leftWins, 0)
  assert.equal(draw.rightWins, 0)
  assert.equal(draw.leftTotal, draw.rightTotal)
  assert.equal(draw.winner, null)
  assert.throws(() => compareCities(city, city), /서로 다른 도시/)
})

test('단위 전환은 도시 대결 점수와 승자를 바꾸지 않는다', () => {
  setActivePinia(createPinia())
  const configStore = useConfigStore()
  const left = WEATHER_MOCK[0]
  const right = WEATHER_MOCK[1]
  const before = compareCities(left, right)

  configStore.toggleUnit()
  const after = compareCities(left, right)

  assert.equal(after.leftTotal, before.leftTotal)
  assert.equal(after.rightTotal, before.rightTotal)
  assert.equal(after.winner?.id, before.winner?.id)
})
