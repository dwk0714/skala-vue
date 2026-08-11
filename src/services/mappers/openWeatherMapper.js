import { clampPop, makeLocationId } from '../../utils/weatherModel.js'

const localDateKey = (timestamp, timezone) =>
  new Date((timestamp + timezone) * 1000).toISOString().slice(0, 10)

export const mapHourlyForecast = (items = []) =>
  items.map((item) => ({
    dt: Number(item.dt),
    temp: Math.round(Number(item.main?.temp ?? 0)),
    feelsLike: Math.round(Number(item.main?.feels_like ?? item.main?.temp ?? 0)),
    status: item.weather?.[0]?.description ?? item.weather?.[0]?.main ?? '정보 없음',
    pop: clampPop(item.pop),
  }))

export const groupDailyForecast = (items = [], timezone = 0) => {
  const grouped = new Map()
  for (const item of items) {
    const key = localDateKey(Number(item.dt), timezone)
    const previous = grouped.get(key)
    const pop = clampPop(item.pop)
    if (!previous) grouped.set(key, { dt: Number(item.dt), pop })
    else previous.pop = Math.max(previous.pop, pop)
  }
  return [...grouped.values()]
}

export const mapOpenWeatherBundle = ({ location, current, forecast, airPollution }) => {
  const timezone = Number(current.timezone ?? 0)
  const forecastItems = forecast?.list ?? []
  const coords = {
    lat: Number(current.coord?.lat ?? location.coords.lat),
    lon: Number(current.coord?.lon ?? location.coords.lon),
  }
  return {
    id: location.id ?? (current.id ? String(current.id) : makeLocationId(coords)),
    name: location.name ?? current.name,
    apiName: location.apiName ?? current.name,
    country: location.country ?? current.sys?.country ?? 'KR',
    state: location.state ?? '',
    coords,
    timezone,
    temp: Math.round(Number(current.main?.temp ?? 0)),
    feelsLike: Math.round(Number(current.main?.feels_like ?? current.main?.temp ?? 0)),
    status: current.weather?.[0]?.description ?? current.weather?.[0]?.main ?? '정보 없음',
    humidity: Number(current.main?.humidity ?? 0),
    windSpeed: Number(current.wind?.speed ?? 0),
    pop: clampPop(forecastItems[0]?.pop),
    pm10: Number(airPollution?.list?.[0]?.components?.pm10 ?? 0),
    forecast: groupDailyForecast(forecastItems, timezone),
    hourly: mapHourlyForecast(forecastItems),
    updatedAt: new Date(Number(current.dt ?? Date.now() / 1000) * 1000).toISOString(),
    isFavorite: false,
  }
}
