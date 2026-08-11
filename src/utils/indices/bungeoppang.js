import { clamp } from '../weatherModel.js'

export default {
  id: 'bungeoppang',
  label: '붕어빵 지수',
  icon: '🐟',
  compute(weather) {
    const score =
      weather.temp >= 15
        ? 0
        : weather.temp <= 0
          ? 100
          : clamp(Math.round(((15 - weather.temp) / 15) * 100), 0, 100)
    const level = score >= 75 ? 'high' : score >= 45 ? 'mid' : score > 0 ? 'low' : 'none'
    const message =
      level === 'high'
        ? '붕어빵 필수'
        : level === 'mid'
          ? '붕어빵 생각남'
          : level === 'low'
            ? '있으면 먹기'
            : '오늘은 붕어빵 없음'
    return { score, level, message }
  },
}
