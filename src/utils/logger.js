/**
 * logger.js — 반응성 추적 로그의 접두사 포맷 (과제 2)
 *
 * 왜 .vue가 아니라 별도 파일인가:
 *   여러 곳에서 같은 접두사 규칙을 써야 하고, Vue에 전혀 의존하지 않는 순수 함수라
 *   컴포넌트 밖에 두는 편이 재사용·테스트에 유리하다.
 *
 * 이 파일은 "찍는 방법"만 알고 "무엇을 찍을지"는 모른다.
 * 화면 로그 패널에 같은 문자열을 넣는 일은 WeatherParent의 pushLog가 담당한다.
 */

/** 로그 종류별 접두사. 콘솔에서 어떤 반응성이 발화했는지 한눈에 구분하기 위한 것 */
const PREFIX = {
  watch: '👁 [watch 감지]',
  watchEffect: '🤖 [watchEffect 자동 호출]',
  action: '⚡ [사용자 액션]',
}

/**
 * 접두사를 붙인 로그 문자열을 만든다.
 *
 * 입력: kind {string} 'watch' | 'watchEffect' | 'action'
 *       message {string} 본문
 * 출력: {string} 예) "👁 [watch 감지] 상태 바 문구가 업데이트되었습니다"
 * 기능: 정의되지 않은 kind가 들어오면 그 문자열을 그대로 접두사로 쓴다.
 */
export const formatLog = (kind, message) => `${PREFIX[kind] ?? kind} ${message}`

/**
 * 콘솔에 로그를 찍고, 찍은 문자열을 돌려준다.
 *
 * 입력: kind {string}, message {string} — formatLog와 동일
 * 출력: {string} 콘솔에 찍힌 것과 완전히 같은 문자열
 * 목적: 반환값을 화면 로그 패널에서 재사용해, 콘솔과 화면의 내용이 항상 일치하게 한다.
 *       (같은 문자열을 두 번 조립하면 나중에 한쪽만 바뀌어 어긋난다)
 */
export const log = (kind, message) => {
  const line = formatLog(kind, message)
  console.log(line)
  return line
}
