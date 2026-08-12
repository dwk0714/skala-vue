/**
 * formatRelativeTime.js — 타임스탬프를 "N분 전" 표기로 바꾼다
 *
 * 왜 .vue가 아니라 별도 파일인가:
 *   Vue에 의존하지 않는 순수 함수라 node --test로 바로 검증할 수 있고,
 *   여러 컴포넌트에서 재사용할 수 있다.
 */

/**
 * 갱신 시각과 현재 시각의 차이를 사람이 읽는 표현으로 바꾼다.
 *
 * 입력: updatedAt {string} ISO 날짜 문자열 (예: '2026-08-12T09:00:00+09:00')
 *       now {number} 비교 기준 시각(ms). 기본값은 실제 현재 시각.
 *                    화면에서는 부모가 1분마다 갱신하는 now를 넘겨,
 *                    카드마다 타이머를 두지 않고도 표기가 함께 갱신되게 한다.
 * 출력: {string} '방금 전' | 'N분 전' | 'N시간 전' | 'N일 전'
 *
 * 기능: 초 단위 차이를 구한 뒤 큰 단위로 올라가며 처음 걸리는 구간을 반환한다.
 *       - 60초 미만  → 방금 전
 *       - 60분 미만  → N분 전
 *       - 24시간 미만 → N시간 전
 *       - 그 이상    → N일 전
 *       Math.max(0, ...)로 음수를 막는다. updatedAt이 미래여도 '방금 전'이 되고
 *       "-3분 전" 같은 이상한 표기가 나오지 않는다.
 */
export const formatRelativeTime = (updatedAt, now = Date.now()) => {
  const seconds = Math.max(0, Math.floor((now - Date.parse(updatedAt)) / 1000))
  if (seconds < 60) return '방금 전'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}
