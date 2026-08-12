/**
 * walkTimes.js — 산책하기 좋은 시간대 추출
 *
 * 왜 .vue가 아니라 별도 파일인가:
 *   두 컴포넌트가 함께 쓴다. WeatherParent가 getWalkableHours로 시간대를 고르고,
 *   WalkTimePanel이 formatHour로 그 시각을 화면에 찍는다.
 */

/** 강수를 뜻하는 날씨 문자열들. status에 이 중 하나라도 들어 있으면 산책 시간에서 뺀다 */
const RAIN_KEYWORDS = ['비', '소나기', '이슬비', '뇌우']

/**
 * 시간대별 예보에서 걷기 좋은 구간만 골라낸다.
 *
 * 입력: hourly {Array} { dt, temp, status, pop } 배열. 없으면 빈 배열로 취급
 * 출력: {Array} 조건을 모두 만족한 시간대만 남긴 배열. 하나도 없으면 빈 배열
 *               (빈 배열이면 WalkTimePanel이 danger 화면으로 바뀐다)
 * 목적: "오늘 언제 나가면 좋은지"를 시간 단위로 집어준다.
 *
 * 기능: 세 조건을 모두 만족해야 통과한다.
 *         1. 강수확률이 정확히 0    — 조금이라도 올 것 같으면 뺀다
 *         2. 기온 15~26℃           — 너무 춥거나 더우면 걷기 힘들다
 *         3. status에 강수 키워드 없음 — pop이 0이어도 "비"라고 적혀 있으면 뺀다
 *       2번과 3번을 함께 보는 이유는 데이터 출처마다 pop과 status가 어긋날 수 있어서다.
 */
export const getWalkableHours = (hourly = []) =>
  hourly.filter(
    (hour) =>
      hour.pop === 0 &&
      hour.temp >= 15 &&
      hour.temp <= 26 &&
      !RAIN_KEYWORDS.some((keyword) => hour.status.includes(keyword)),
  )

/**
 * 타임스탬프를 도시 현지 시각 문자열로 바꾼다.
 *
 * 입력: timestamp {number} UNIX 초
 *       timezone {number} 도시의 UTC offset(초). 한국은 32400
 * 출력: {string} 'HH:00' 형식 (예: '09:00')
 * 기능: timezone을 더한 뒤 getUTCHours()로 읽는다.
 *       getHours()를 쓰면 보는 사람의 브라우저 시간대가 섞여 들어가므로,
 *       일부러 UTC로 읽어 "도시 현지 시각"을 정확히 표시한다.
 */
export const formatHour = (timestamp, timezone = 0) => {
  const date = new Date((timestamp + timezone) * 1000)
  return `${String(date.getUTCHours()).padStart(2, '0')}:00`
}
