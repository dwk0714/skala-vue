import bungeoppang from './bungeoppang.js'
import carWash from './carWash.js'
import iceAmericano from './iceAmericano.js'
import mosquito from './mosquito.js'
import outdoorActivity from './outdoorActivity.js'

export const INDICES = [carWash, outdoorActivity, iceAmericano, bungeoppang, mosquito]

export const computeIndices = (weather) =>
  INDICES.map((index) => ({ ...index, ...index.compute(weather) }))
