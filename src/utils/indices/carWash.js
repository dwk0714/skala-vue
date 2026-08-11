import { clamp } from '../weatherModel.js'

const levelFor = (score) =>
  score >= 75 ? 'high' : score >= 50 ? 'mid' : score >= 25 ? 'low' : 'none'

export const findNextRain = (weather, threshold = 0.6) => {
  const hit = weather.forecast?.find((item) => item.pop >= threshold)
  if (!hit) return null
  const now = Math.floor(Date.parse(weather.updatedAt) / 1000)
  const timezone = Number(weather.timezone ?? 0)
  const daysFromNow = Math.max(
    0,
    Math.floor((hit.dt + timezone) / 86400) - Math.floor((now + timezone) / 86400),
  )
  return { ...hit, daysFromNow }
}

const temperatureScore = (temp) => {
  if (temp >= 10 && temp <= 25) return 30
  const distance = temp < 10 ? 10 - temp : temp - 25
  return Math.max(0, 30 - distance * 3)
}

const pm10Score = (pm10) => (pm10 <= 30 ? 20 : pm10 <= 50 ? 14 : pm10 <= 80 ? 7 : 0)
const windScore = (windSpeed) =>
  windSpeed <= 3 ? 15 : windSpeed <= 6 ? 9 : windSpeed <= 10 ? 4 : 0
const humidityScore = (humidity) =>
  humidity <= 60 ? 10 : humidity <= 75 ? 6 : humidity <= 85 ? 3 : 0

export default {
  id: 'car-wash',
  label: '손세차 지수',
  icon: '🚗',
  compute(weather) {
    const nextRain = findNextRain(weather)
    let score = Math.round(
      temperatureScore(weather.temp) +
        25 * (1 - weather.pop) +
        pm10Score(weather.pm10) +
        windScore(weather.windSpeed) +
        humidityScore(weather.humidity),
    )
    if (nextRain?.daysFromNow === 0) score = 0
    else if (nextRain?.daysFromNow === 1) score = Math.min(score, 20)
    else if (nextRain?.daysFromNow === 2) score -= 20
    else if (nextRain?.daysFromNow === 3) score -= 10
    score = clamp(score, 0, 100)

    const level = levelFor(score)
    const message =
      nextRain?.daysFromNow === 0
        ? '세차하면 오늘 비 옴'
        : level === 'high'
          ? '오늘 손세차 각'
          : level === 'mid'
            ? '해볼 만함'
            : level === 'low'
              ? '자동세차 추천'
              : '오늘은 참기'
    return { score, level, message, nextRain }
  },
}
