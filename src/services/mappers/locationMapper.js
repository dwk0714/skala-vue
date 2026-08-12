/**
 * locationMapper.js — Geocoding 응답을 내부 위치 모델로 변환
 *
 * 왜 매퍼가 따로 있나:
 *   외부 API의 필드 이름(local_names, lat, lon…)이 앱 곳곳에 퍼지면
 *   API가 바뀔 때 전부 고쳐야 한다. 변환을 이 파일 한 곳에 가둬,
 *   앱 나머지는 항상 같은 모양의 객체만 보게 한다.
 */
import { makeLocationId } from '../../utils/weatherModel.js'

/**
 * Geocoding 결과 하나를 내부 위치 객체로 바꾼다.
 *
 * 입력: location {Object} OpenWeather Geocoding 응답 항목
 *       { name, local_names, country, state, lat, lon }
 * 출력: {Object} { id, name, apiName, country, state, coords }
 *       - name    화면에 보여줄 이름. 한글이 있으면 한글 우선 (없으면 영문)
 *       - apiName API가 쓰는 영문 이름. 이후 조회에 필요해 따로 보관한다
 *       - id      좌표 기반 고유 id (Geocoding 응답에는 id가 없다)
 */
export const mapGeocodingLocation = (location) => ({
  id: makeLocationId(location),
  name: location.local_names?.ko ?? location.name,
  apiName: location.name,
  country: location.country,
  state: location.state ?? '',
  coords: { lat: Number(location.lat), lon: Number(location.lon) },
})

/**
 * Geocoding 결과 배열에서 국내 도시만 남겨 변환한다.
 *
 * 입력: locations {Array} Geocoding 응답 배열
 * 출력: {Array} 국내 위치 객체 배열
 * 목적: 이 앱은 국내 날씨만 다루므로, "광주"를 검색했을 때
 *       해외 동명 도시가 섞여 나오는 것을 막는다.
 */
export const mapKoreanGeocodingResults = (locations) =>
  locations.filter((location) => location.country === 'KR').map(mapGeocodingLocation)
