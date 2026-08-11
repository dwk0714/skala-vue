import { clamp } from '../weatherModel.js'

export default {
  id: 'mosquito',
  label: '모기 출현 지수',
  icon: '🦟',
  compute(weather) {
    const temp = weather.temp
    const tempScore =
      temp <= 15 || temp >= 35 ? 0 : temp <= 25 ? ((temp - 15) / 10) * 60 : ((35 - temp) / 10) * 60
    const humidityScore = clamp((weather.humidity - 40) / 40, 0, 1) * 40
    const windPenalty = Math.min(weather.windSpeed * 4, 25)
    const score =
      temp <= 15 ? 0 : clamp(Math.round(tempScore + humidityScore - windPenalty), 0, 100)
    const level = score >= 75 ? 'high' : score >= 50 ? 'mid' : score >= 25 ? 'low' : 'none'
    const message =
      level === 'high'
        ? '모기 파티 주의'
        : level === 'mid'
          ? '기피제 챙기기'
          : level === 'low'
            ? '한두 마리 조심'
            : '모기 걱정 없음'
    return { score, level, message }
  },
}
