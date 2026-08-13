/**
 * weatherStore.js — 날씨 화면의 전역 상태 (Pinia Setup Store)
 *
 * 무엇을 하나:
 *   도시 목록·선택·검색·즐겨찾기 상태를 한곳에 모으고, 비동기 처리(로딩·디바운스·요청 취소)를
 *   담당한다. 화면이 어떻게 생겼는지는 모르고, 데이터가 어디서 오는지도 모른다
 *   (weatherService가 mock/실API를 골라주므로).
 *
 * 왜 컴포넌트 밖에 있나:
 *   싱글톤이라 페이지를 나눠도 상태가 유지된다. 대시보드에서 즐겨찾기한 도시가
 *   나중에 만들 즐겨찾기 화면에서도 그대로 보인다.
 *   각 날씨 View가 이 스토어를 공유하며, 자식 컴포넌트는 props/emit으로만 소통한다.
 *
 * 과제 문서와의 이름 대응:
 *   weatherList → cities / filteredWeatherList → filteredCities / selectedCityInfo → selectedCity
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { weatherService } from '../services/weatherService.js'
import { isSameLocation } from '../utils/weatherModel.js'
import { normalizeCityQuery } from '../utils/citySearch.js'

export const useWeatherStore = defineStore('weather', () => {
  /* ───────── state ───────── */

  /** 대시보드에 올라온 전체 도시 배열 (과제 문서의 weatherList) */
  const cities = ref([])
  /** 현재 선택된 도시의 id. null이면 아직 아무것도 선택되지 않은 상태 */
  const selectedCityId = ref(null)
  /** 검색 입력값. SearchBar와 양방향으로 이어진다 */
  const searchQuery = ref('')
  /** 최근 검색어 (최신순, 최대 5개). 새로고침하면 사라진다 — localStorage 영속화는 미구현 */
  const recentSearches = ref([])
  /** 검색 결과 후보 도시들. 드롭다운에 표시된다 (cities와 별개) */
  const searchResults = ref([])
  /** 검색 진행 상태 'idle' | 'loading' | 'success' | 'error' */
  const searchStatus = ref('idle')
  /** 도시별 개별 로딩 상태 { [cityId]: 'loading'|'success'|'error' }. 추가·새로고침 시 사용 */
  const cityLoadStatus = ref({})
  /** 초기 목록 로딩 상태. 화면의 로딩/에러/본문 3분기를 결정한다 */
  const loadStatus = ref('idle')
  /** 사용자에게 보여줄 에러 메시지 */
  const error = ref('')

  /** 디바운스 타이머 핸들 (반응형일 필요가 없어 ref를 쓰지 않는다) */
  let searchTimer
  /** 진행 중인 검색 요청을 취소하기 위한 컨트롤러 */
  let searchController
  /** 같은 도시의 상세 API가 겹쳐 호출되지 않도록 진행 중 Promise만 보관한다. */
  const detailRequests = new Map()

  /* ───────── getters ───────── */

  /**
   * 현재 선택된 도시 객체 (과제 문서의 selectedCityInfo).
   * 선택 id가 없거나 목록에서 사라졌으면 첫 번째 도시로 대체하고, 그마저 없으면 null.
   */
  const selectedCity = computed(
    () => cities.value.find((city) => city.id === selectedCityId.value) ?? cities.value[0] ?? null,
  )

  /**
   * 검색어로 걸러낸 도시 배열 (과제 문서의 filteredWeatherList). 과제 2 요건 2.
   * 검색어가 비면 원본 전체를 그대로 돌려준다.
   * 도시명·행정구역·영문명을 모두 이어붙여 부분 일치를 검사하므로
   * "경기"로도 수원이 걸리고 "seoul"로도 서울이 걸린다.
   */
  const filteredCities = computed(() => {
    const query = normalizeCityQuery(searchQuery.value)
    return query
      ? cities.value.filter((city) =>
          normalizeCityQuery(`${city.name} ${city.state} ${city.apiName}`).includes(query),
        )
      : cities.value
  })

  /** 즐겨찾기한 도시만 추린 배열. 즐겨찾기 전용 화면을 만들 때 쓸 자리 (현재 미사용) */
  const favoriteCities = computed(() => cities.value.filter((city) => city.isFavorite))

  /* ───────── actions ───────── */

  /**
   * 초기 도시 목록을 불러온다.
   *
   * 입력: 없음
   * 출력: {Promise<void>}
   * 기능: 이미 로딩 중이거나 목록이 차 있으면 아무것도 하지 않는다 (중복 호출 방지).
   *       성공하면 첫 도시를 자동 선택한다.
   */
  const loadCities = async () => {
    if (loadStatus.value === 'loading' || cities.value.length) return
    loadStatus.value = 'loading'
    error.value = ''
    const progressiveCities = []
    try {
      const loadedCities = await weatherService.listInitialCities({
        onCity(city, index) {
          progressiveCities[index] = city
          cities.value = progressiveCities.filter(Boolean)
          cityLoadStatus.value[city.id] = city.hourly?.length ? 'success' : 'idle'
          selectedCityId.value ??= cities.value[0]?.id ?? null
        },
      })
      if (!cities.value.length) cities.value = loadedCities
      selectedCityId.value ??= cities.value[0]?.id ?? null
      loadStatus.value = 'success'
    } catch (loadError) {
      error.value = loadError.message
      loadStatus.value = 'error'
    }
  }

  /** 현재 날씨만 받은 도시에 예보와 미세먼지를 한 번만 보충한다. */
  const ensureCityDetails = async (cityId) => {
    const city = cities.value.find((item) => item.id === cityId)
    if (!city || cityLoadStatus.value[cityId] === 'success') return city ?? null
    if (detailRequests.has(cityId)) return detailRequests.get(cityId)

    const request = (async () => {
      cityLoadStatus.value[cityId] = 'loading'
      try {
        const details = await weatherService.fetchCityDetails(city)
        const index = cities.value.findIndex((item) => item.id === cityId)
        if (index >= 0) cities.value[index] = { ...cities.value[index], ...details }
        cityLoadStatus.value[cityId] = 'success'
        return cities.value[index] ?? null
      } catch (loadError) {
        cityLoadStatus.value[cityId] = 'error'
        error.value = loadError.message
        return null
      } finally {
        detailRequests.delete(cityId)
      }
    })()

    detailRequests.set(cityId, request)
    return request
  }

  /**
   * 진행 중인 검색을 정리한다.
   *
   * 입력: 없음 / 출력: 없음
   * 목적: 새 검색을 시작하기 전, 그리고 화면을 떠날 때 뒷정리를 한다.
   * 기능: 예약된 디바운스 타이머를 취소하고, 이미 날아간 요청도 중단시킨다.
   */
  const clearSearch = () => {
    clearTimeout(searchTimer)
    searchController?.abort()
    searchResults.value = []
    searchStatus.value = 'idle'
  }

  /**
   * 도시를 검색한다. (디바운스 + 요청 취소)
   *
   * 입력: query {string} 검색어
   * 출력: 없음 (searchResults를 갱신하는 부수효과)
   * 기능: 타이핑 한 글자마다 요청을 보내지 않도록 300ms 기다렸다가 실행한다.
   *       그 사이 새 입력이 오면 이전 타이머와 요청을 모두 취소한다.
   *       AbortError는 "일부러 취소한 것"이므로 에러로 취급하지 않고 조용히 넘긴다.
   */
  const searchCities = (query) => {
    clearSearch()
    if (!normalizeCityQuery(query)) return
    searchStatus.value = 'loading'
    searchTimer = setTimeout(async () => {
      searchController = new AbortController()
      try {
        searchResults.value = await weatherService.searchCities(query, {
          signal: searchController.signal,
        })
        searchStatus.value = 'success'
      } catch (searchError) {
        if (searchError.name === 'AbortError') return
        error.value = searchError.message
        searchStatus.value = 'error'
      }
    }, 300)
  }

  /**
   * 도시를 선택한다.
   * 입력: cityId {string} / 출력: 없음
   * 기능: 목록에 실제로 있는 id일 때만 반영한다 (없는 도시가 선택되는 것을 막는다).
   */
  const selectCity = (cityId) => {
    if (cities.value.some((city) => city.id === cityId)) selectedCityId.value = cityId
  }

  /**
   * 검색 결과에서 고른 도시를 목록에 추가한다.
   *
   * 입력: location {Object} 위치 객체 { id, name, coords, ... }
   * 출력: {Promise<{ added: boolean, city: Object|null }>}
   *       added=false 이면 이미 있던 도시이거나 조회에 실패한 경우
   * 기능: 좌표 기반 중복 판정(isSameLocation)으로 같은 도시가 두 번 들어가는 것을 막는다.
   *       카탈로그 id('kr-seoul')와 Geocoding id('kr-37.5665-...')가 달라도
   *       좌표가 같으면 같은 도시로 본다.
   */
  const addCityFromSearchResult = async (location) => {
    const existing = cities.value.find((city) => isSameLocation(city, location))
    if (existing) {
      selectCity(existing.id)
      return { added: false, city: existing }
    }
    cityLoadStatus.value[location.id] = 'loading'
    try {
      const city = await weatherService.fetchCityWeather(location)
      cities.value.push(city)
      selectedCityId.value = city.id
      cityLoadStatus.value[location.id] = 'success'
      return { added: true, city }
    } catch (loadError) {
      cityLoadStatus.value[location.id] = 'error'
      error.value = loadError.message
      return { added: false, city: null }
    }
  }

  /**
   * 도시를 목록에서 제거한다.
   * 입력: cityId {string} / 출력: 없음
   * 기능: 지운 도시가 선택 중이었다면 첫 도시로 선택을 옮긴다 (선택이 빈 상태로 남지 않게).
   */
  const removeCity = (cityId) => {
    cities.value = cities.value.filter((city) => city.id !== cityId)
    if (selectedCityId.value === cityId) selectedCityId.value = cities.value[0]?.id ?? null
  }

  /**
   * 즐겨찾기를 켜고 끈다.
   * 입력: cityId {string} / 출력: 없음
   * 기능: 배열 원소의 속성만 바꾸므로, 이를 감시하려면 watch에 { deep: true }가 필요하다.
   */
  const toggleFavorite = (cityId) => {
    const city = cities.value.find((item) => item.id === cityId)
    if (city) city.isFavorite = !city.isFavorite
  }

  /**
   * 최근 검색어에 추가한다.
   * 입력: query {string} / 출력: 없음
   * 기능: 빈 문자열은 무시한다. 이미 있던 검색어는 제거 후 맨 앞에 다시 넣어
   *       "최신순"을 유지하고, 5개까지만 남긴다.
   */
  const addRecentSearch = (query) => {
    const value = String(query).trim()
    if (!value) return
    recentSearches.value = [value, ...recentSearches.value.filter((item) => item !== value)].slice(
      0,
      5,
    )
  }

  /** 최근 검색어 하나를 지운다. 입력: query {string} / 출력: 없음 */
  const removeRecentSearch = (query) => {
    recentSearches.value = recentSearches.value.filter((item) => item !== query)
  }

  /**
   * 도시 한 곳의 날씨를 다시 받아온다.
   *
   * 입력: cityId {string} / 출력: {Promise<void>}
   * 기능: 갱신 전 즐겨찾기 값을 따로 보관했다가 새 데이터에 다시 붙인다.
   *       API 응답에는 즐겨찾기 정보가 없어 그냥 교체하면 별표가 풀려버리기 때문이다.
   */
  const refreshCity = async (cityId) => {
    const index = cities.value.findIndex((city) => city.id === cityId)
    if (index < 0) return
    cityLoadStatus.value[cityId] = 'loading'
    try {
      const favorite = cities.value[index].isFavorite
      const refreshed = await weatherService.fetchCityWeather(cities.value[index])
      refreshed.isFavorite = favorite
      cities.value[index] = refreshed
      cityLoadStatus.value[cityId] = 'success'
    } catch (loadError) {
      cityLoadStatus.value[cityId] = 'error'
      error.value = loadError.message
    }
  }

  return {
    cities,
    selectedCityId,
    searchQuery,
    recentSearches,
    searchResults,
    searchStatus,
    cityLoadStatus,
    loadStatus,
    error,
    selectedCity,
    filteredCities,
    favoriteCities,
    loadCities,
    searchCities,
    clearSearch,
    addCityFromSearchResult,
    removeCity,
    selectCity,
    toggleFavorite,
    addRecentSearch,
    removeRecentSearch,
    refreshCity,
    ensureCityDetails,
  }
})
