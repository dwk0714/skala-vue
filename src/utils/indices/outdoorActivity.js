import { clamp } from '../weatherModel.js'

export default {
  id: 'outdoor-activity',
  label: '야외활동 지수',
  icon: '🌳',
  compute(weather) {
    let score = 100
    if (weather.temp < 15) score -= Math.min((15 - weather.temp) * 4, 35)
    else if (weather.temp > 26) score -= Math.min((weather.temp - 26) * 4, 35)
    score -= Math.round(weather.pop * 40)
    score -= weather.pm10 > 80 ? 30 : weather.pm10 > 50 ? 20 : weather.pm10 > 30 ? 10 : 0
    score -= weather.windSpeed > 10 ? 20 : weather.windSpeed > 6 ? 10 : 0
    score -= weather.humidity > 85 ? 10 : weather.humidity > 70 ? 5 : 0
    score = clamp(Math.round(score), 0, 100)
    const level = score >= 80 ? 'high' : score >= 60 ? 'mid' : score >= 40 ? 'low' : 'none'
    const message =
      level === 'high'
        ? '밖으로 나가기 딱 좋아요'
        : level === 'mid'
          ? '가벼운 산책 추천'
          : level === 'low'
            ? '짧게 다녀오세요'
            : '오늘은 실내 활동 추천'
    const activities =
      level === 'high'
        ? ['산책', '러닝', '피크닉']
        : level === 'mid'
          ? ['산책', '가벼운 운동']
          : level === 'low'
            ? ['짧은 산책']
            : ['실내 스트레칭']
    return { score, level, message, activities }
  },
}
