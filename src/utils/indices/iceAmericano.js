/**
 * iceAmericano.js — 🧊 얼죽아 지수 ("얼어 죽어도 아이스")
 *
 * 아이스 음료가 당기는 정도. 기온이 아니라 체감온도를 기준으로 삼는다.
 * 같은 기온이라도 습하고 바람 없으면 더 덥게 느껴지기 때문이다.
 */
import { clamp } from '../weatherModel.js'

export default {
  id: 'ice-americano',
  label: '얼죽아 지수',
  icon: '🧊',
  /**
   * 얼죽아 지수를 계산한다.
   *
   * 입력: weather {Object} feelsLike·humidity 사용
   * 출력: { score, level, message }
   * 기능: (체감온도 + 5) × 2.5 를 기본 점수로 하고,
   *       습도가 50%를 넘는 만큼 0.3배로 가산한다. 최종적으로 0~100으로 자른다.
   *       +5는 영하에서도 0점이 되지 않게 하는 하한 보정이다.
   */
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
