/**
 * koreanCityCatalog.js — 국내 8개 도시 기준 데이터
 *
 * 무엇을 담나: 도시별 좌표와 검색 별칭. 이 앱에서 "국내 도시"의 정의가 여기다.
 *
 * 어디서 쓰나:
 *   citySearch.js        검색어를 aliases와 대조
 *   openWeatherProvider  초기 8개 도시를 실 API로 조회할 좌표 목록
 *
 * 필드 설명:
 *   id       내부 고유 id (예: 'kr-seoul')
 *   name     화면에 표시할 한글 이름
 *   apiName  OpenWeather가 쓰는 영문 이름
 *   state    행정구역. 카드의 도시명 위에 표시된다
 *   aliases  검색 매칭용 표기 모음. '제주도', 'jeju' 같은 변형을 여기 넣으면 검색에 잡힌다
 *   coords   위도·경도. 실 API 조회와 중복 판정(isSameLocation)에 쓰인다
 *
 * 도시를 추가하려면 이 배열에 좌표와 검색 별칭을 등록한다.
 */
export const KOREAN_CITY_CATALOG = [
  {
    id: 'kr-seoul',
    name: '서울',
    apiName: 'Seoul',
    country: 'KR',
    state: '서울특별시',
    aliases: ['서울', '서울시', '서울특별시', 'seoul'],
    coords: { lat: 37.5665, lon: 126.978 },
  },
  {
    id: 'kr-suwon',
    name: '수원',
    apiName: 'Suwon',
    country: 'KR',
    state: '경기도',
    aliases: ['수원', '수원시', 'suwon'],
    coords: { lat: 37.2636, lon: 127.0286 },
  },
  {
    id: 'kr-busan',
    name: '부산',
    apiName: 'Busan',
    country: 'KR',
    state: '부산광역시',
    aliases: ['부산', '부산시', '부산광역시', 'busan'],
    coords: { lat: 35.1796, lon: 129.0756 },
  },
  {
    id: 'kr-ulsan',
    name: '울산',
    apiName: 'Ulsan',
    country: 'KR',
    state: '울산광역시',
    aliases: ['울산', '울산시', '울산광역시', 'ulsan'],
    coords: { lat: 35.5384, lon: 129.3114 },
  },
  {
    id: 'kr-gangneung',
    name: '강릉',
    apiName: 'Gangneung',
    country: 'KR',
    state: '강원특별자치도',
    aliases: ['강릉', '강릉시', 'gangneung'],
    coords: { lat: 37.7519, lon: 128.8761 },
  },
  {
    id: 'kr-jeju',
    name: '제주',
    apiName: 'Jeju City',
    country: 'KR',
    state: '제주특별자치도',
    aliases: ['제주', '제주시', '제주도', '제주특별자치도', 'jeju', 'jeju city'],
    coords: { lat: 33.4996, lon: 126.5312 },
  },
  {
    id: 'kr-gwangju',
    name: '광주',
    apiName: 'Gwangju',
    country: 'KR',
    state: '광주광역시',
    aliases: ['광주', '광주시', '광주광역시', 'gwangju'],
    coords: { lat: 35.1595, lon: 126.8526 },
  },
  {
    id: 'kr-sejong',
    name: '세종',
    apiName: 'Sejong',
    country: 'KR',
    state: '세종특별자치시',
    aliases: ['세종', '세종시', '세종특별자치시', 'sejong'],
    coords: { lat: 36.4801, lon: 127.289 },
  },
]
