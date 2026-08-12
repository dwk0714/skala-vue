/**
 * carWash.js — 🚗 손세차 지수
 *
 * 다른 지수와 달리 "오늘 날씨"만 보지 않는다.
 * 세차의 실제 판단 기준은 "세차하고 며칠 버티느냐"이므로,
 * 오늘 조건으로 기본 점수를 낸 뒤 다음 비까지 남은 날짜로 감점한다.
 */
import { clamp } from '../weatherModel.js'

/**
 * 점수를 4단계 등급으로 나눈다.
 * 입력: score {number} 0~100 / 출력: {string} 'high'|'mid'|'low'|'none'
 */
const levelFor = (score) =>
  score >= 75 ? 'high' : score >= 50 ? 'mid' : score >= 25 ? 'low' : 'none'

/**
 * 예보에서 비가 올 가장 이른 날을 찾는다.
 *
 * 입력: weather {Object} forecast 배열과 updatedAt, timezone을 가진 도시 객체
 *       threshold {number} 비로 볼 강수확률 기준. 기본 0.6 (60%)
 * 출력: {Object|null} { dt, pop, daysFromNow } 또는 비 예보가 없으면 null
 *                     daysFromNow: 0=오늘, 1=내일, 2=모레 …
 * 목적: "3일 뒤 비 예보 70%" 같은 안내와 감점 보정에 쓰인다.
 * 기능: 예보 배열을 앞에서부터 훑어 임계치를 넘는 첫 항목을 잡는다.
 *       배열 길이를 가정하지 않으므로 예보 기간이 5일이든 8일이든 그대로 동작한다.
 *       날짜 차이는 도시의 timezone을 더한 뒤 일(86400초) 단위로 끊어 계산한다.
 *       (UTC 기준으로 세면 한국 시간대에서 하루가 어긋날 수 있다)
 */
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

/**
 * 기온 점수 (배점 30). 10~25℃가 세차하기 좋은 구간.
 * 입력: temp {number} / 출력: {number} 0~30
 * 기능: 적정 구간이면 만점, 벗어나면 1℃당 3점씩 깎는다.
 */
const temperatureScore = (temp) => {
  if (temp >= 10 && temp <= 25) return 30
  const distance = temp < 10 ? 10 - temp : temp - 25
  return Math.max(0, 30 - distance * 3)
}

/** 미세먼지 점수 (배점 20). 먼지가 많으면 세차해도 금방 더러워진다 */
const pm10Score = (pm10) => (pm10 <= 30 ? 20 : pm10 <= 50 ? 14 : pm10 <= 80 ? 7 : 0)

/** 풍속 점수 (배점 15). 바람이 강하면 먼지가 다시 붙고 물기가 얼룩진다 */
const windScore = (windSpeed) =>
  windSpeed <= 3 ? 15 : windSpeed <= 6 ? 9 : windSpeed <= 10 ? 4 : 0

/** 습도 점수 (배점 10). 습하면 물기가 안 말라 얼룩이 남는다 */
const humidityScore = (humidity) =>
  humidity <= 60 ? 10 : humidity <= 75 ? 6 : humidity <= 85 ? 3 : 0

export default {
  id: 'car-wash',
  label: '손세차 지수',
  icon: '🚗',

  /**
   * 손세차 지수를 계산한다.
   *
   * 입력: weather {Object} temp·pop·pm10·windSpeed·humidity·forecast 사용
   * 출력: { score, level, message, nextRain }
   *       nextRain은 이 지수만 반환하는 추가 필드로, IndexCard가 v-if로 분기해 표시한다.
   * 기능: 5개 요소 점수를 합해 기본 점수(최대 100)를 만든 뒤,
   *       다음 비까지 남은 날짜로 최종 보정한다.
   *         오늘 비 → 0점 (세차하면 헛수고)
   *         내일 비 → 20점 이하로 제한
   *         2일 뒤  → -20
   *         3일 뒤  → -10
   */
  compute(weather) {
    const nextRain = findNextRain(weather)
    let score = Math.round(
      temperatureScore(weather.temp) +
        25 * (1 - weather.pop) + // 강수확률 (배점 25): 오늘 비 올 확률이 낮을수록 높다
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
