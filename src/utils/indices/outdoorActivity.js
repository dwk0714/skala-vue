/**
 * outdoorActivity.js — 🌳 야외활동 지수
 *
 * 100점에서 시작해 불리한 조건마다 깎는 감점 방식.
 * 이 지수만 추천 활동 배열(activities)을 추가로 반환하며,
 * 선택 도시 배너의 "활동 N점"과 상세보기 alert에도 이 점수가 쓰인다.
 */
import { clamp } from '../weatherModel.js'

export default {
  id: 'outdoor-activity',
  label: '야외활동 지수',
  icon: '🌳',
  /**
   * 야외활동 지수를 계산한다.
   *
   * 입력: weather {Object} temp·pop·pm10·windSpeed·humidity 사용
   * 출력: { score, level, message, activities }
   *       activities는 이 지수만 반환하는 추가 필드로, IndexCard가 칩으로 렌더한다.
   * 기능: 100점에서 아래 순서로 감점한다.
   *         기온   15℃ 미만 / 26℃ 초과 시 1℃당 4점 (최대 35)
   *         강수   강수확률 × 40
   *         미세먼지 >80:30 / >50:20 / >30:10
   *         풍속   >10:20 / >6:10
   *         습도   >85:10 / >70:5
   *       등급 기준이 다른 지수보다 높다(80/60/40). 야외활동은 조건이 웬만큼 좋아야
   *       "나가기 좋다"고 말할 수 있기 때문이다.
   */
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
