/**
 * mosquito.js — 🦟 모기 출현 지수
 *
 * 모기는 25℃ 부근에서 가장 활발하고 너무 춥거나 더우면 활동이 줄어든다.
 * 그래서 단순 비례가 아니라 25℃를 꼭짓점으로 하는 삼각형 분포를 쓴다.
 */
import { clamp } from '../weatherModel.js'

export default {
  id: 'mosquito',
  label: '모기 출현 지수',
  icon: '🦟',
  /**
   * 모기 출현 지수를 계산한다.
   *
   * 입력: weather {Object} temp·humidity·windSpeed 사용
   * 출력: { score, level, message }
   * 기능: 세 요소를 더하고 뺀다.
   *         기온(최대 60) 15℃ 이하 또는 35℃ 이상이면 0.
   *                      25℃까지는 올라가고 25℃부터는 내려가는 삼각 분포
   *         습도(최대 40) 40%부터 80%까지 선형 증가
   *         풍속(최대 -25) 바람이 강하면 모기가 날지 못해 감점
   *       15℃ 이하는 습도가 아무리 높아도 0점으로 확정한다.
   */
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
