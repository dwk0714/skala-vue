/**
 * walkTimes.js — 산책하기 좋은 시간대 추출
 *
 * 왜 .vue가 아니라 별도 파일인가:
 *   WeatherIndicesView와 WalkTimePanel이 함께 쓴다. View가 getWalkableHours로 시간대를 고르고,
 *   WalkTimePanel이 formatHour로 그 시각을 화면에 찍는다.
 */

/** 강수를 뜻하는 날씨 문자열들. status에 이 중 하나라도 들어 있으면 산책 시간에서 뺀다. */
const PRECIPITATION_KEYWORDS = [
  '비',
  '소나기',
  '이슬비',
  '뇌우',
  '천둥',
  '번개',
  '눈',
  '진눈깨비',
  '우박',
]

/** 산책 사진으로 구분할 수 있는 날씨. 앞쪽일수록 더 구체적인 상태다. */
const WALK_WEATHER_KEYWORDS = [
  ['hail', ['우박']],
  ['thunder', ['뇌우', '천둥', '번개']],
  ['snow', ['진눈깨비', '눈']],
  ['rain', ['소나기', '이슬비', '비']],
]

const findWalkWeatherType = (status = '') =>
  WALK_WEATHER_KEYWORDS.find(([, keywords]) =>
    keywords.some((keyword) => status.includes(keyword)),
  )?.[0]

/**
 * 현재 강수확률이 높거나 시간대별 예보의 절반 이상이 비인지 판단한다.
 * 이 결과로 산책 패널의 맑은 날/비 오는 날 이미지를 선택한다.
 */
export const isMostlyRainy = (weather) => {
  const hourly = weather?.hourly ?? []
  const rainyHours = hourly.filter(
    (hour) =>
      hour.pop >= 0.3 || PRECIPITATION_KEYWORDS.some((keyword) => hour.status.includes(keyword)),
  ).length
  return weather?.pop >= 0.5 || (hourly.length > 0 && rainyHours >= hourly.length / 2)
}

/**
 * 현재 날씨를 우선하고, 시간대별 예보에 위험 기상이 있으면 해당 산책 사진을 고른다.
 * 평범한 비는 예보의 절반 이상일 때만 비 사진으로 바꿔 잠깐의 비에 화면이 흔들리지 않게 한다.
 */
export const getWalkWeatherType = (weather) => {
  const currentType = findWalkWeatherType(weather?.status)
  if (currentType) return currentType

  const forecastTypes = (weather?.hourly ?? []).map((hour) => findWalkWeatherType(hour.status))
  return (
    ['hail', 'thunder', 'snow'].find((type) => forecastTypes.includes(type)) ??
    (isMostlyRainy(weather) ? 'rain' : 'sunny')
  )
}

/**
 * 시간대별 예보에서 걷기 좋은 구간만 골라낸다.
 *
 * 입력: hourly {Array} { dt, temp, status, pop } 배열. 없으면 빈 배열로 취급
 * 출력: {Array} 조건을 모두 만족한 시간대만 남긴 배열. 하나도 없으면 빈 배열
 *               (빈 배열이면 WalkTimePanel이 danger 화면으로 바뀐다)
 * 목적: "오늘 언제 나가면 좋은지"를 시간 단위로 집어준다.
 *
 * 기능: 세 조건을 모두 만족해야 통과한다.
 *         1. 강수확률이 정확히 0    — 조금이라도 올 것 같으면 뺀다
 *         2. 기온 15~26℃           — 너무 춥거나 더우면 걷기 힘들다
 *         3. status에 강수 키워드 없음 — pop이 0이어도 "비"라고 적혀 있으면 뺀다
 *       2번과 3번을 함께 보는 이유는 데이터 출처마다 pop과 status가 어긋날 수 있어서다.
 */
export const getWalkableHours = (hourly = []) =>
  hourly.filter(
    (hour) =>
      hour.pop === 0 &&
      hour.temp >= 15 &&
      hour.temp <= 26 &&
      !PRECIPITATION_KEYWORDS.some((keyword) => hour.status.includes(keyword)),
  )

/**
 * 타임스탬프를 도시 현지 시각 문자열로 바꾼다.
 *
 * 입력: timestamp {number} UNIX 초
 *       timezone {number} 도시의 UTC offset(초). 한국은 32400
 * 출력: {string} 'HH:00' 형식 (예: '09:00')
 * 기능: timezone을 더한 뒤 getUTCHours()로 읽는다.
 *       getHours()를 쓰면 보는 사람의 브라우저 시간대가 섞여 들어가므로,
 *       일부러 UTC로 읽어 "도시 현지 시각"을 정확히 표시한다.
 */
export const formatHour = (timestamp, timezone = 0) => {
  const date = new Date((timestamp + timezone) * 1000)
  return `${String(date.getUTCHours()).padStart(2, '0')}:00`
}

/** 상세 화면에서 보여줄 오늘의 3시간 단위 고정 슬롯. 24시는 다음 날 0시 데이터다. */
const TODAY_FORECAST_HOURS = [3, 6, 9, 12, 15, 18, 21, 24]

/**
 * 도시 현지 시간을 기준으로 오늘 날짜와 03:00~24:00 예보 8칸을 만든다.
 * OpenWeather는 현재 이후 예보만 주므로 이미 지난 시간은 forecast가 null로 남는다.
 */
export const getTodayForecast = (
  hourly = [],
  timezone = 0,
  nowTimestamp = Math.floor(Date.now() / 1000),
) => {
  const localDayStart = Math.floor((nowTimestamp + timezone) / 86400) * 86400
  const forecastsByTime = new Map(hourly.map((hour) => [hour.dt, hour]))

  return {
    dateLabel: new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(new Date(localDayStart * 1000)),
    slots: TODAY_FORECAST_HOURS.map((hour) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      forecast: forecastsByTime.get(localDayStart + hour * 3600 - timezone) ?? null,
    })),
  }
}
