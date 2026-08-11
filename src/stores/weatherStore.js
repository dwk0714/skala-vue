import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { weatherService } from '../services/weatherService.js'
import { isSameLocation } from '../utils/weatherModel.js'
import { normalizeCityQuery } from '../utils/citySearch.js'

export const useWeatherStore = defineStore('weather', () => {
  const cities = ref([])
  const selectedCityId = ref(null)
  const searchQuery = ref('')
  const recentSearches = ref([])
  const searchResults = ref([])
  const searchStatus = ref('idle')
  const cityLoadStatus = ref({})
  const loadStatus = ref('idle')
  const error = ref('')

  let searchTimer
  let searchController

  const selectedCity = computed(
    () => cities.value.find((city) => city.id === selectedCityId.value) ?? cities.value[0] ?? null,
  )
  const filteredCities = computed(() => {
    const query = normalizeCityQuery(searchQuery.value)
    return query
      ? cities.value.filter((city) =>
          normalizeCityQuery(`${city.name} ${city.state} ${city.apiName}`).includes(query),
        )
      : cities.value
  })
  const favoriteCities = computed(() => cities.value.filter((city) => city.isFavorite))

  const loadCities = async () => {
    if (loadStatus.value === 'loading' || cities.value.length) return
    loadStatus.value = 'loading'
    error.value = ''
    try {
      cities.value = await weatherService.listInitialCities()
      selectedCityId.value = cities.value[0]?.id ?? null
      loadStatus.value = 'success'
    } catch (loadError) {
      error.value = loadError.message
      loadStatus.value = 'error'
    }
  }

  const clearSearch = () => {
    clearTimeout(searchTimer)
    searchController?.abort()
    searchResults.value = []
    searchStatus.value = 'idle'
  }

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

  const selectCity = (cityId) => {
    if (cities.value.some((city) => city.id === cityId)) selectedCityId.value = cityId
  }

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

  const removeCity = (cityId) => {
    cities.value = cities.value.filter((city) => city.id !== cityId)
    if (selectedCityId.value === cityId) selectedCityId.value = cities.value[0]?.id ?? null
  }

  const toggleFavorite = (cityId) => {
    const city = cities.value.find((item) => item.id === cityId)
    if (city) city.isFavorite = !city.isFavorite
  }

  const addRecentSearch = (query) => {
    const value = String(query).trim()
    if (!value) return
    recentSearches.value = [value, ...recentSearches.value.filter((item) => item !== value)].slice(
      0,
      5,
    )
  }

  const removeRecentSearch = (query) => {
    recentSearches.value = recentSearches.value.filter((item) => item !== query)
  }

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
  }
})
