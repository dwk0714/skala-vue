import { KOREAN_CITY_CATALOG } from '../data/koreanCityCatalog.js'

export const normalizeCityQuery = (query) =>
  String(query ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

export const searchCityCatalog = (query) => {
  const normalized = normalizeCityQuery(query)
  if (!normalized) return []
  return KOREAN_CITY_CATALOG.filter((city) =>
    city.aliases.some((alias) => normalizeCityQuery(alias).includes(normalized)),
  )
}
