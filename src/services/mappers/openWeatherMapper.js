/**
 * openWeatherMapper.js — OpenWeather 응답 3종을 내부 스키마 하나로 합친다
 *
 * 이 파일이 있어서 지수 계산 로직은 "OpenWeather"라는 말을 몰라도 된다.
 * mock 데이터와 실 API가 여기서 같은 모양으로 수렴한다.
 */
import { clampPop, makeLocationId } from '../../utils/weatherModel.js'

/**
 * 타임스탬프를 도시 현지 날짜 문자열로 바꾼다.
 * 입력: timestamp {number} UNIX 초, timezone {number} UTC offset(초)
 * 출력: {string} 'YYYY-MM-DD'
 * 기능: timezone을 더한 뒤 UTC 기준으로 읽어 "그 도시의 날짜"를 얻는다.
 *       일별 그룹핑의 기준 키로 쓰인다.
 */
const localDateKey = (timestamp, timezone) =>
  new Date((timestamp + timezone) * 1000).toISOString().slice(0, 10)

/** OpenWeather의 영문 날씨 코드를 짧고 읽기 쉬운 한글 상태로 통일한다. */
const WEATHER_STATUS = {
  Clear: '맑음',
  Clouds: '흐림',
  Rain: '비',
  Drizzle: '이슬비',
  Thunderstorm: '뇌우',
  Snow: '눈',
  Mist: '안개',
  Fog: '안개',
  Haze: '안개',
  Smoke: '연무',
  Dust: '먼지',
  Sand: '먼지',
  Ash: '화산재',
  Squall: '강풍',
  Tornado: '돌풍',
}

/** 대표 날씨를 고를 때 눈·비처럼 외출에 영향이 큰 상태를 우선한다. */
const WEATHER_PRIORITY = {
  Clear: 0,
  Clouds: 1,
  Mist: 2,
  Fog: 2,
  Haze: 2,
  Drizzle: 3,
  Rain: 4,
  Thunderstorm: 5,
  Snow: 6,
}

/** description의 어색한 번역보다 안정적인 weather.main 코드를 우선한다. */
export const normalizeWeatherStatus = (weather = {}) =>
  WEATHER_STATUS[weather.main] ?? weather.description ?? weather.main ?? '정보 없음'

/**
 * 3시간 간격 예보를 시간대별 배열로 변환한다.
 *
 * 입력: items {Array} forecast.list 배열
 * 출력: {Array} { dt, temp, feelsLike, status, pop }
 * 목적: 산책 추천 시간 계산(getWalkableHours)에 쓸 형태로 정리한다.
 * 기능: 기온은 반올림해 정수로 만들고, 결측 필드는 기본값으로 채워
 *       이후 계산에서 undefined가 튀어나오지 않게 한다.
 */
export const mapHourlyForecast = (items = []) =>
  items.map((item) => ({
    dt: Number(item.dt),
    temp: Math.round(Number(item.main?.temp ?? 0)),
    feelsLike: Math.round(Number(item.main?.feels_like ?? item.main?.temp ?? 0)),
    status: normalizeWeatherStatus(item.weather?.[0]),
    pop: clampPop(item.pop),
  }))

/**
 * 3시간 간격 예보를 하루 단위로 묶는다.
 *
 * 입력: items {Array} forecast.list, timezone {number}
 * 출력: {Array} { dt, pop, tempMin, tempMax, status } — 날짜별 한 항목씩
 * 목적: 손세차 지수의 findNextRain이 "며칠 뒤 비"를 판단하려면 일 단위 데이터가 필요하다.
 * 기능: 같은 날짜의 여러 시간대 중 강수확률이 가장 높은 값을 그날의 대표로 삼는다.
 *       평균을 쓰면 "오후에만 폭우"인 날이 낮은 값으로 뭉개져 세차 판단이 어긋난다.
 *       Map을 쓰므로 입력 순서(시간순)가 그대로 유지된다.
 */
export const groupDailyForecast = (items = [], timezone = 0) => {
  const grouped = new Map()
  for (const item of items) {
    const key = localDateKey(Number(item.dt), timezone)
    const previous = grouped.get(key)
    const pop = clampPop(item.pop)
    const tempMin = Number(item.main?.temp_min ?? item.main?.temp)
    const tempMax = Number(item.main?.temp_max ?? item.main?.temp)
    const weather = item.weather?.[0] ?? {}
    const priority = WEATHER_PRIORITY[weather.main] ?? 0

    if (!previous) {
      grouped.set(key, {
        dt: Number(item.dt),
        pop,
        tempMin: Number.isFinite(tempMin) ? Math.round(tempMin) : null,
        tempMax: Number.isFinite(tempMax) ? Math.round(tempMax) : null,
        status: normalizeWeatherStatus(weather),
        priority,
      })
      continue
    }

    previous.pop = Math.max(previous.pop, pop)
    if (Number.isFinite(tempMin))
      previous.tempMin =
        previous.tempMin === null
          ? Math.round(tempMin)
          : Math.min(previous.tempMin, Math.round(tempMin))
    if (Number.isFinite(tempMax))
      previous.tempMax =
        previous.tempMax === null
          ? Math.round(tempMax)
          : Math.max(previous.tempMax, Math.round(tempMax))
    if (priority > previous.priority) {
      previous.status = normalizeWeatherStatus(weather)
      previous.priority = priority
    }
  }
  return [...grouped.values()].map(({ priority: _priority, ...forecast }) => forecast)
}

/**
 * 세 API 응답을 내부 CityWeather 스키마 하나로 합친다.
 *
 * 입력: { location, current, forecast, airPollution }
 *   location    호출에 쓴 위치 객체 (이름·행정구역을 우선 사용)
 *   current     /data/2.5/weather 응답
 *   forecast    /data/2.5/forecast 응답
 *   airPollution /data/2.5/air_pollution 응답
 * 출력: {Object} mock과 동일한 형태의 도시 날씨 객체
 *
 * 기능: 모든 필드에 ?? 기본값을 둔다. 무료 플랜이나 일부 지역에서 필드가 빠져 와도
 *       화면이 깨지지 않게 하기 위해서다.
 *       pop은 forecast의 가장 가까운 시간대 값을 "오늘의 강수확률"로 쓴다
 *       (현재 날씨 응답에는 강수확률 필드가 없다).
 *       isFavorite은 API에 없는 앱 고유 상태라 항상 false로 시작한다.
 */
export const mapOpenWeatherDetails = (weather, forecast, airPollution) => {
  const forecastItems = forecast?.list ?? []
  return {
    pop: clampPop(forecastItems[0]?.pop),
    pm10: Number(airPollution?.list?.[0]?.components?.pm10 ?? 0),
    forecast: groupDailyForecast(forecastItems, weather.timezone),
    hourly: mapHourlyForecast(forecastItems),
  }
}

export const mapOpenWeatherBundle = ({ location, current, forecast, airPollution }) => {
  const timezone = Number(current.timezone ?? 0)
  const coords = {
    lat: Number(current.coord?.lat ?? location.coords.lat),
    lon: Number(current.coord?.lon ?? location.coords.lon),
  }
  return {
    id: location.id ?? (current.id ? String(current.id) : makeLocationId(coords)),
    name: location.name ?? current.name,
    apiName: location.apiName ?? current.name,
    country: location.country ?? current.sys?.country ?? 'KR',
    state: location.state ?? '',
    coords,
    timezone,
    temp: Math.round(Number(current.main?.temp ?? 0)),
    feelsLike: Math.round(Number(current.main?.feels_like ?? current.main?.temp ?? 0)),
    status: normalizeWeatherStatus(current.weather?.[0]),
    humidity: Number(current.main?.humidity ?? 0),
    windSpeed: Number(current.wind?.speed ?? 0),
    ...mapOpenWeatherDetails({ timezone }, forecast, airPollution),
    updatedAt: new Date(Number(current.dt ?? Date.now() / 1000) * 1000).toISOString(),
    isFavorite: false,
  }
}
