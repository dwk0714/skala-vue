import { getPm10Level } from '../weatherModel.js'
import { getWalkWeatherType } from './walkTimes.js'

/**
 * preparation.js — 외출 준비물 추천
 *
 * 이름이 모호해 보이지만 "오늘 뭘 챙겨야 하나"를 계산하는 파일이다.
 * 지수(indices/)가 점수를 매기는 것과 달리, 여기서는 챙길 물건 목록을 만든다.
 *
 * 왜 .vue가 아니라 별도 파일인가:
 *   Vue와 무관한 순수 함수라 node --test로 바로 검증할 수 있고,
 *   나중에 다른 화면(도시 상세 등)에서도 그대로 재사용할 수 있다.
 */

/**
 * 날씨 조건에 맞는 준비물 목록을 만든다.
 *
 * 입력: weather {Object} temp·pop·pm10·humidity·windSpeed 사용
 * 출력: {Array} { id, icon, label, detail, temperature? } 배열. 항상 1개 이상
 *       - label  준비물 이름 (예: '우산')
 *       - detail 왜 필요한지 (예: '강수확률 90%') — 근거를 함께 보여주기 위한 값
 * 목적: 숫자(강수확률 90%)를 행동(우산 챙기기)으로 번역해준다.
 *
 * 기능: 옷차림은 기온 5단계로 항상 하나 정하고,
 *       나머지 4개는 조건을 만족할 때만 배열에 추가한다.
 *         ☂️ 우산     강수확률 ≥ 30%
 *         😷 마스크   미세먼지 ≥ 50㎍/㎥
 *         💧 물       기온 ≥ 25℃ 또는 습도 ≥ 70%
 *         🧥 바람막이 풍속 > 8m/s
 *       그래서 결과 개수는 날씨에 따라 1~5개로 달라진다.
 */
export const getPreparationItems = (weather) => {
  // 기온 5단계로 옷차림 결정 (이 항목은 항상 포함된다)
  const clothes =
    weather.temp <= 5
      ? '두꺼운 외투'
      : weather.temp <= 14
        ? '가벼운 코트'
        : weather.temp <= 22
          ? '얇은 겉옷'
          : weather.temp <= 27
            ? '가벼운 옷차림'
            : '통풍이 잘되는 옷'
  const items = [
    {
      id: 'clothes',
      icon: '👕',
      label: clothes,
      detail: `${weather.temp}℃ 기준 옷차림`,
      temperature: weather.temp,
    },
  ]

  if (weather.pop >= 0.3)
    items.push({
      id: 'umbrella',
      icon: '☂️',
      label: '우산',
      detail: `강수확률 ${Math.round(weather.pop * 100)}%`,
    })

  if (weather.pm10 >= 50) {
    const pm10 = getPm10Level(weather.pm10)
    items.push({
      id: 'mask',
      icon: '😷',
      label: '마스크',
      detail: `미세먼지 ${pm10.value}㎍/㎥ · ${pm10.label}`,
    })
  }

  if (weather.temp >= 25 || weather.humidity >= 70)
    items.push({ id: 'water', icon: '💧', label: '물', detail: '수분 보충이 필요해요' })

  if (weather.windSpeed > 8)
    items.push({
      id: 'windbreaker',
      icon: '🧥',
      label: '바람막이',
      detail: `풍속 ${weather.windSpeed}m/s`,
    })

  return items
}

/** 현재 날씨와 산책 가능 시간을 짧은 외출 행동 문장으로 바꾼다. */
export const getOutingBriefing = (weather, walkableHours = []) => {
  const activityMessage = {
    hail: '우박 예보가 있어 외출보다 안전한 실내 활동을 권해요.',
    thunder: '천둥·번개 예보가 있어 야외 활동을 미루는 편이 안전해요.',
    snow: '눈길이 미끄러울 수 있으니 이동 시간을 여유롭게 잡으세요.',
    rain: '비 예보가 있어 야외 일정은 짧게 잡는 편이 좋아요.',
    sunny: walkableHours.length
      ? `산책하기 좋은 시간대가 ${walkableHours.length}번 있어 야외 활동에 좋아요.`
      : '강수 걱정은 적지만 기온을 확인하고 무리 없는 외출을 계획하세요.',
  }[getWalkWeatherType(weather)]

  const preparation = getPreparationItems(weather)
    .map((item) => item.label)
    .join(' · ')
  return `${activityMessage} 추천 준비: ${preparation}.`
}
