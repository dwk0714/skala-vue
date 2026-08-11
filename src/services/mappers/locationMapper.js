import { makeLocationId } from '../../utils/weatherModel.js'

export const mapGeocodingLocation = (location) => ({
  id: makeLocationId(location),
  name: location.local_names?.ko ?? location.name,
  apiName: location.name,
  country: location.country,
  state: location.state ?? '',
  coords: { lat: Number(location.lat), lon: Number(location.lon) },
})

export const mapKoreanGeocodingResults = (locations) =>
  locations.filter((location) => location.country === 'KR').map(mapGeocodingLocation)
