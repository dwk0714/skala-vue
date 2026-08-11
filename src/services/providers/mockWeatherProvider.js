import { WEATHER_MOCK } from '../../data/weatherMock.js'
import { isSameLocation } from '../../utils/weatherModel.js'
import { searchCityCatalog } from '../../utils/citySearch.js'

export const mockWeatherProvider = {
  async listInitialCities() {
    return structuredClone(WEATHER_MOCK)
  },
  async searchCities(query) {
    return structuredClone(searchCityCatalog(query))
  },
  async fetchCityWeather(location) {
    const weather = WEATHER_MOCK.find((item) => isSameLocation(item, location))
    if (!weather) throw new Error('Mock 데이터에서 해당 도시를 찾지 못했습니다.')
    return structuredClone(weather)
  },
}
