import { clamp } from '../weatherModel.js'

export default {
  id: 'ice-americano',
  label: '얼죽아 지수',
  icon: '🧊',
  compute(weather) {
    const score = clamp(
      Math.round((weather.feelsLike + 5) * 2.5 + Math.max(0, weather.humidity - 50) * 0.3),
      0,
      100,
    )
    const level = score >= 75 ? 'high' : score >= 45 ? 'mid' : score >= 20 ? 'low' : 'none'
    const message =
      level === 'high'
        ? '얼어 죽어도 아이스'
        : level === 'mid'
          ? '아이스도 괜찮음'
          : level === 'low'
            ? '따뜻한 것도 고민'
            : '오늘은 뜨아'
    return { score, level, message }
  },
}
