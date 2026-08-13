/**
 * citySearch.js — 도시 검색어 정규화와 카탈로그 매칭
 *
 * 왜 .vue가 아니라 별도 파일인가:
 *   스토어의 필터링과 API 검색 전처리에서 같은 규칙을 써야 한다.
 *   컴포넌트 안에 두면 세 곳에 같은 코드를 복사해야 한다.
 */
import { KOREAN_CITY_CATALOG } from '../data/koreanCityCatalog.js'

/**
 * 검색어를 비교하기 좋은 형태로 다듬는다.
 *
 * 입력: query {string|null|undefined} 사용자가 입력한 원문
 * 출력: {string} 앞뒤 공백 제거, 연속 공백 1칸 축약, 소문자 변환된 문자열
 * 목적: "  Seoul  " 과 "seoul" 이 같은 검색으로 취급되게 한다.
 * 기능: null/undefined가 와도 빈 문자열로 안전하게 처리한다.
 */
export const normalizeCityQuery = (query) =>
  String(query ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

/**
 * 국내 도시 카탈로그에서 검색어와 맞는 도시들을 찾는다.
 *
 * 입력: query {string} 검색어
 * 출력: {Array} 매칭된 도시 객체 배열. 검색어가 비면 빈 배열
 * 목적: API를 부르기 전에 로컬에서 먼저 찾아, 흔한 도시는 네트워크 없이 즉시 응답한다.
 * 기능: 각 도시의 aliases 배열(예: 제주 → ['제주','제주도','jeju'])을 순회하며
 *       부분 일치를 검사한다. 그래서 "제주도", "ULSAN", "서울시" 같은 표기도 잡힌다.
 */
export const searchCityCatalog = (query) => {
  const normalized = normalizeCityQuery(query)
  if (!normalized) return []
  return KOREAN_CITY_CATALOG.filter((city) =>
    city.aliases.some((alias) => normalizeCityQuery(alias).includes(normalized)),
  )
}
