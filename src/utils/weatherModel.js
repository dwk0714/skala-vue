/**
 * @typedef {Object} CityWeather
 * @property {string} id
 * @property {string} name
 * @property {{ lat: number, lon: number }} coords
 * @property {number} feelsLike
 * @property {number} windSpeed
 * @property {number} pop
 */

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const clampPop = (value) => clamp(Number(value) || 0, 0, 1)

export const makeLocationId = ({ lat, lon }) =>
  `kr-${Number(lat).toFixed(4)}-${Number(lon).toFixed(4)}`

export const isSameLocation = (left, right) =>
  left.id === right.id ||
  (Number(left.coords?.lat).toFixed(4) === Number(right.coords?.lat).toFixed(4) &&
    Number(left.coords?.lon).toFixed(4) === Number(right.coords?.lon).toFixed(4))
