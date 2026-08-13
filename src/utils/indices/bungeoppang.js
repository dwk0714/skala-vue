/**
 * bungeoppang.js — 🐟 붕어빵 지수
 *
 * 다른 지수와 반대로 기온이 낮을수록 점수가 올라가는 역방향 지수다.
 * 낮은 기온일수록 점수가 높아지도록 계산한다.
 */
import { clamp } from '../weatherModel.js'

export default {
  id: 'bungeoppang',
  label: '붕어빵 지수',
  icon: '🐟',
  /**
   * 붕어빵 지수를 계산한다.
   *
   * 입력: weather {Object} temp 사용
   * 출력: { score, level, message }
   * 기능: 15℃ 이상이면 0점으로 반전되고, 0℃ 이하면 100점.
   *       그 사이는 (15 - 기온) / 15 을 백분율로 환산한다.
   *       등급이 'none'인 경우만 문구가 "오늘은 붕어빵 없음"이 된다.
   */
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
