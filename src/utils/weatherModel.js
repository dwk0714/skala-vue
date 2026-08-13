/**
 * weatherModel.js — 내부 데이터 스키마 정의 + 공용 원시 함수
 *
 * 이 프로젝트에서 참조가 가장 많은 파일이다 (9개 파일이 import).
 *   지수 5종      → clamp
 *   매퍼 2개      → clampPop, makeLocationId
 *   스토어        → isSameLocation
 * 여기를 고치면 위 전부에 영향이 가므로 변경에 주의할 것.
 *
 * 왜 .vue가 아니라 별도 파일인가:
 *   Vue와 무관한 순수 계산 함수이고, 여러 층(계산·매핑·상태)이 공유해야 한다.
 */

/**
 * @typedef {Object} CityWeather  OpenWeather 응답을 이 형태로 변환해 사용한다.
 *   지수 계산 로직은 데이터가 어디서 왔는지 알 필요가 없다.
 * @property {string} id
 * @property {string} name
 * @property {{ lat: number, lon: number }} coords
 * @property {number} feelsLike
 * @property {number} windSpeed
 * @property {number} pop  강수확률 0~1
 */

/**
 * 값을 [min, max] 범위 안으로 잘라낸다.
 *
 * 입력: value {number}, min {number}, max {number}
 * 출력: {number} 범위를 벗어나면 경계값, 아니면 원래 값
 * 목적: 지수 점수가 0~100을 넘거나 음수가 되는 것을 막는다.
 *       (감점이 겹치면 음수가, 가점이 겹치면 100 초과가 나올 수 있다)
 */
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * 강수확률을 0~1 범위의 숫자로 정규화한다.
 *
 * 입력: value {any} API가 준 pop 값 (없거나 문자열일 수 있다)
 * 출력: {number} 0~1 사이의 숫자
 * 목적: 외부 응답에 결측·이상값이 와도 계산이 깨지지 않게 한다.
 * 기능: 숫자로 못 바꾸면 0으로 보고, 1을 넘으면 1로 자른다.
 */
export const clampPop = (value) => clamp(Number(value) || 0, 0, 1)

/**
 * 좌표로 위치 고유 id를 만든다.
 *
 * 입력: { lat, lon } 좌표 객체
 * 출력: {string} 예) 'kr-37.5665-126.9780'
 * 목적: Geocoding 결과처럼 id가 없는 위치에도 안정적인 식별자를 부여한다.
 * 기능: 소수점 4자리로 고정한다. 같은 지점인데 소수점 자릿수만 달라
 *       다른 도시로 취급되는 것을 막기 위함이다.
 */
export const makeLocationId = ({ lat, lon }) =>
  `kr-${Number(lat).toFixed(4)}-${Number(lon).toFixed(4)}`

/**
 * 두 위치가 같은 곳인지 판정한다.
 *
 * 입력: left {Object}, right {Object} — id 또는 coords를 가진 위치/도시 객체
 * 출력: {boolean}
 * 목적: 검색 결과로 이미 목록에 있는 도시를 다시 추가하는 것을 막는다.
 * 기능: id가 같으면 바로 같은 곳으로 본다. id 체계가 다른 경우(카탈로그의 'kr-seoul' vs
 *       Geocoding의 'kr-37.5665-126.9780')를 대비해 좌표도 소수점 4자리까지 비교한다.
 */
export const isSameLocation = (left, right) =>
  left.id === right.id ||
  (Number(left.coords?.lat).toFixed(4) === Number(right.coords?.lat).toFixed(4) &&
    Number(left.coords?.lon).toFixed(4) === Number(right.coords?.lon).toFixed(4))

/**
 * PM10 농도를 사용자가 바로 이해할 수 있는 5단계 등급으로 바꾼다.
 * 계산에는 원본 수치를 유지하고 화면에 쓸 value만 정수로 반올림한다.
 */
export const getPm10Level = (pm10) => {
  const rawValue = Math.max(0, Number(pm10) || 0)
  const value = Math.round(rawValue)

  if (rawValue <= 15) return { level: 'very-good', label: '매우 좋음', value }
  if (rawValue <= 30) return { level: 'good', label: '좋음', value }
  if (rawValue <= 80) return { level: 'normal', label: '보통', value }
  if (rawValue <= 150) return { level: 'bad', label: '나쁨', value }
  return { level: 'very-bad', label: '매우 나쁨', value }
}
