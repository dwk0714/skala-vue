/**
 * indices/index.js — 생활 지수 레지스트리
 *
 * 이 프로젝트의 확장 포인트. 지수는 컴포넌트에 하드코딩되지 않고 이 배열에 등록된다.
 * 지수를 추가하려면 이 폴더에 파일 하나를 만들고 아래 배열에 한 줄 넣으면 끝이며,
 * 화면 코드(IndexGrid / IndexCard)는 수정할 필요가 없다.
 *
 * 모든 지수 모듈은 같은 계약을 지킨다:
 *   { id, label, icon, compute(weather) => { score, level, message, ...선택필드 } }
 *     score   0~100 정수
 *     level   'high' | 'mid' | 'low' | 'none' — 카드 색과 뱃지를 결정
 *     message 사람이 읽는 한 줄 평
 *   선택 필드: carWash는 nextRain, outdoorActivity는 activities를 더 반환한다.
 */
import bungeoppang from './bungeoppang.js'
import carWash from './carWash.js'
import iceAmericano from './iceAmericano.js'
import mosquito from './mosquito.js'
import outdoorActivity from './outdoorActivity.js'

/** 등록된 지수 목록. 화면에 표시되는 순서와 같다 */
export const INDICES = [carWash, outdoorActivity, iceAmericano, bungeoppang, mosquito]

/**
 * 도시 하나에 대해 등록된 모든 지수를 계산한다.
 *
 * 입력: weather {Object} 도시 날씨 객체 (temp, humidity, windSpeed, pop, pm10, forecast 사용)
 * 출력: {Array} 각 지수의 메타데이터(id·label·icon)와 계산 결과를 합친 배열.
 *               IndexGrid가 이 배열을 그대로 v-for로 돌린다.
 * 기능: 스프레드로 메타와 결과를 병합하므로, 화면은 "id·label·icon·score·level·message"를
 *       한 객체에서 꺼내 쓸 수 있다.
 */
export const computeIndices = (weather) =>
  INDICES.map((index) => ({ ...index, ...index.compute(weather) }))
