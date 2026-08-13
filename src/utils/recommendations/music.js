import weatherMusic from '../../data/weatherMusic.json' with { type: 'json' }
import { getWalkWeatherType } from './walkTimes.js'

/** 흐림·안개는 산책 이미지의 sunny와 달리 차분한 음악 그룹으로 분리한다. */
const getMusicWeatherType = (weather) => {
  const status = weather?.status ?? ''
  if (['흐림', '구름', '안개', '연무'].some((keyword) => status.includes(keyword))) return 'cloudy'
  return getWalkWeatherType(weather)
}

/** 도시의 UTC offset을 사용해 브라우저 위치와 무관한 현지 시간대를 구한다. */
const getDayPart = (timestamp, timezone = 0) => {
  const hour = new Date(timestamp + timezone * 1000).getUTCHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour < 18) return 'day'
  if (hour < 22) return 'evening'
  return 'night'
}

/** 같은 도시·같은 현지 날짜에는 첫 추천이 유지되도록 간단한 고정 순서를 만든다. */
export const getMusicRecommendations = (weather, now = Date.now()) => {
  const weatherType = getMusicWeatherType(weather)
  const dayPart = getDayPart(now, weather?.timezone)
  const candidates = weatherMusic.filter(
    (music) => music.weatherTypes.includes(weatherType) && music.dayParts.includes(dayPart),
  )
  const fallback = candidates.length
    ? candidates
    : weatherMusic.filter((music) => music.weatherTypes.includes(weatherType))
  if (!fallback.length) return []

  const localDate = new Date(now + (weather?.timezone ?? 0) * 1000).toISOString().slice(0, 10)
  const seed = `${weather?.id ?? ''}${localDate}`
    .split('')
    .reduce((sum, character) => sum + character.charCodeAt(0), 0)
  const start = seed % fallback.length
  return [...fallback.slice(start), ...fallback.slice(0, start)]
}

export const getMusicRecommendation = (weather, now = Date.now()) =>
  getMusicRecommendations(weather, now)[0] ?? null
