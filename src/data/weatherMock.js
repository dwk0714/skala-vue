import { KOREAN_CITY_CATALOG } from './koreanCityCatalog.js'

const TIMEZONE = 9 * 60 * 60
const DAY = 86400
const rawEpoch = (value) => Math.floor(Date.parse(value) / 1000)

/**
 * 아래 데이터가 기준으로 삼는 날짜. 실제 dt는 이 날짜를 "오늘"로 당겨서 계산한다.
 * 고정 날짜를 그대로 쓰면 시간이 지날수록 "N일 전 업데이트"가 계속 늘어나고,
 * 상대 시간 표기와 1분 갱신 타이머가 동작하는 걸 확인할 수 없다.
 */
const BASE_DATE = '2026-08-11'
const UPDATED_AT_MS = Date.now() - 20 * 60 * 1000

const dayIndex = (seconds) => Math.floor((seconds + TIMEZONE) / DAY)
// 예보 날짜를 updatedAt과 같은 날에 맞춘다. 둘을 같은 기준으로 옮겨야
// 자정 근처에서도 findNextRain의 daysFromNow가 어긋나지 않는다.
const SHIFT =
  (dayIndex(Math.floor(UPDATED_AT_MS / 1000)) -
    dayIndex(rawEpoch(`${BASE_DATE}T00:00:00+09:00`))) *
  DAY

const epoch = (value) => rawEpoch(value) + SHIFT
const city = (id) => KOREAN_CITY_CATALOG.find((item) => item.id === id)
const hour = (date, time, temp, status = '맑음', pop = 0) => ({
  dt: epoch(`${date}T${time}:00+09:00`),
  temp,
  feelsLike: temp,
  status,
  pop,
})
const day = (date, pop) => ({ dt: epoch(`${date}T12:00:00+09:00`), pop })

const makeWeather = (id, current, hourly, forecast) => ({
  ...city(id),
  timezone: TIMEZONE,
  ...current,
  forecast,
  hourly,
  updatedAt: new Date(UPDATED_AT_MS).toISOString(),
  isFavorite: false,
})

export const WEATHER_MOCK = [
  makeWeather(
    'kr-seoul',
    { temp: 22, feelsLike: 24, status: '맑음', humidity: 55, windSpeed: 2.4, pop: 0, pm10: 25 },
    [
      hour('2026-08-11', '06:00', 16),
      hour('2026-08-11', '09:00', 18),
      hour('2026-08-11', '12:00', 22),
      hour('2026-08-11', '15:00', 25),
      hour('2026-08-11', '18:00', 23),
      hour('2026-08-11', '21:00', 19),
    ],
    [
      day('2026-08-11', 0),
      day('2026-08-12', 0.1),
      day('2026-08-13', 0.2),
      day('2026-08-14', 0.7),
      day('2026-08-15', 0.2),
    ],
  ),
  makeWeather(
    'kr-suwon',
    { temp: 18, feelsLike: 18, status: '비', humidity: 88, windSpeed: 2, pop: 0.9, pm10: 45 },
    [
      hour('2026-08-11', '06:00', 16, '비', 0.8),
      hour('2026-08-11', '09:00', 17, '비', 0.9),
      hour('2026-08-11', '12:00', 18, '소나기', 0.8),
      hour('2026-08-11', '15:00', 19, '비', 0.7),
      hour('2026-08-11', '18:00', 17, '비', 0.8),
      hour('2026-08-11', '21:00', 15, '이슬비', 0.7),
    ],
    [
      day('2026-08-11', 0.9),
      day('2026-08-12', 0.8),
      day('2026-08-13', 0.4),
      day('2026-08-14', 0.2),
      day('2026-08-15', 0.1),
    ],
  ),
  makeWeather(
    'kr-busan',
    {
      temp: 27,
      feelsLike: 33,
      status: '구름 많음',
      humidity: 88,
      windSpeed: 1.5,
      pop: 0.1,
      pm10: 30,
    },
    [
      hour('2026-08-11', '06:00', 24),
      hour('2026-08-11', '09:00', 26),
      hour('2026-08-11', '12:00', 28, '구름 많음', 0.1),
      hour('2026-08-11', '15:00', 29, '구름 많음', 0.2),
      hour('2026-08-11', '18:00', 26),
      hour('2026-08-11', '21:00', 24),
    ],
    [
      day('2026-08-11', 0.1),
      day('2026-08-12', 0.2),
      day('2026-08-13', 0.7),
      day('2026-08-14', 0.3),
      day('2026-08-15', 0.1),
    ],
  ),
  makeWeather(
    'kr-ulsan',
    { temp: 23, feelsLike: 24, status: '흐림', humidity: 65, windSpeed: 11, pop: 0.5, pm10: 55 },
    [
      hour('2026-08-11', '06:00', 20, '흐림', 0.3),
      hour('2026-08-11', '09:00', 22, '흐림', 0.4),
      hour('2026-08-11', '12:00', 24, '소나기', 0.6),
      hour('2026-08-11', '15:00', 25, '흐림', 0.4),
      hour('2026-08-11', '18:00', 22),
      hour('2026-08-11', '21:00', 20),
    ],
    [
      day('2026-08-11', 0.5),
      day('2026-08-12', 0.7),
      day('2026-08-13', 0.3),
      day('2026-08-14', 0.2),
      day('2026-08-15', 0.2),
    ],
  ),
  makeWeather(
    'kr-gangneung',
    { temp: 2, feelsLike: -1, status: '맑음', humidity: 45, windSpeed: 4, pop: 0, pm10: 20 },
    [
      hour('2026-08-11', '06:00', 5),
      hour('2026-08-11', '09:00', 10),
      hour('2026-08-11', '12:00', 15),
      hour('2026-08-11', '15:00', 16),
      hour('2026-08-11', '18:00', 12),
      hour('2026-08-11', '21:00', 8),
    ],
    [
      day('2026-08-11', 0),
      day('2026-08-12', 0.8),
      day('2026-08-13', 0.2),
      day('2026-08-14', 0.1),
      day('2026-08-15', 0),
    ],
  ),
  makeWeather(
    'kr-jeju',
    { temp: 20, feelsLike: 19, status: '바람', humidity: 72, windSpeed: 12, pop: 0.3, pm10: 55 },
    [
      hour('2026-08-11', '06:00', 18, '바람'),
      hour('2026-08-11', '09:00', 20, '바람'),
      hour('2026-08-11', '12:00', 23, '흐림', 0.3),
      hour('2026-08-11', '15:00', 24, '비', 0.7),
      hour('2026-08-11', '18:00', 21, '바람'),
      hour('2026-08-11', '21:00', 19, '바람'),
    ],
    [
      day('2026-08-11', 0.3),
      day('2026-08-12', 0.4),
      day('2026-08-13', 0.8),
      day('2026-08-14', 0.5),
      day('2026-08-15', 0.2),
    ],
  ),
  makeWeather(
    'kr-gwangju',
    { temp: 28, feelsLike: 35, status: '맑음', humidity: 90, windSpeed: 0.5, pop: 0, pm10: 70 },
    [
      hour('2026-08-11', '06:00', 24),
      hour('2026-08-11', '09:00', 26),
      hour('2026-08-11', '12:00', 29),
      hour('2026-08-11', '15:00', 31),
      hour('2026-08-11', '18:00', 27),
      hour('2026-08-11', '21:00', 25),
    ],
    [
      day('2026-08-11', 0),
      day('2026-08-12', 0.1),
      day('2026-08-13', 0.2),
      day('2026-08-14', 0.7),
      day('2026-08-15', 0.3),
    ],
  ),
  makeWeather(
    'kr-sejong',
    { temp: 19, feelsLike: 18, status: '맑음', humidity: 48, windSpeed: 2, pop: 0, pm10: 35 },
    [
      hour('2026-08-11', '06:00', 15),
      hour('2026-08-11', '09:00', 18),
      hour('2026-08-11', '12:00', 21),
      hour('2026-08-11', '15:00', 23),
      hour('2026-08-11', '18:00', 20),
      hour('2026-08-11', '21:00', 17),
    ],
    [
      day('2026-08-11', 0),
      day('2026-08-12', 0.1),
      day('2026-08-13', 0.2),
      day('2026-08-14', 0.1),
      day('2026-08-15', 0.1),
    ],
  ),
]
