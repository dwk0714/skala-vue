import { computeIndices } from './indices/index.js'

/** 모기는 적을수록 쾌적하므로 다른 생활 지수와 반대로 비교한다. */
const isLowerBetter = (indexId) => indexId === 'mosquito'

/** 종합점수에서는 모기 점수를 더하지 않고 불쾌 요소로 보아 뺀다. */
const getContribution = (indexId, score) => (isLowerBetter(indexId) ? -score : score)

/** 두 도시의 생활 지수 5종을 라운드 방식으로 비교한다. */
export const compareCities = (leftCity, rightCity) => {
  if (leftCity.id === rightCity.id) throw new Error('서로 다른 도시를 선택해 주세요.')

  const rightIndices = new Map(computeIndices(rightCity).map((index) => [index.id, index]))
  const rounds = computeIndices(leftCity).map((leftIndex) => {
    const rightIndex = rightIndices.get(leftIndex.id)
    const lowerBetter = isLowerBetter(leftIndex.id)
    const winner =
      leftIndex.score === rightIndex.score
        ? null
        : lowerBetter
          ? leftIndex.score < rightIndex.score
            ? leftCity
            : rightCity
          : leftIndex.score > rightIndex.score
            ? leftCity
            : rightCity
    return {
      id: leftIndex.id,
      label: leftIndex.label,
      icon: leftIndex.icon,
      leftScore: leftIndex.score,
      rightScore: rightIndex.score,
      lowerBetter,
      winner,
    }
  })

  const leftWins = rounds.filter((round) => round.winner?.id === leftCity.id).length
  const rightWins = rounds.filter((round) => round.winner?.id === rightCity.id).length
  const leftTotal = rounds.reduce(
    (total, round) => total + getContribution(round.id, round.leftScore),
    0,
  )
  const rightTotal = rounds.reduce(
    (total, round) => total + getContribution(round.id, round.rightScore),
    0,
  )

  let winner = null
  if (leftWins !== rightWins) winner = leftWins > rightWins ? leftCity : rightCity
  else if (leftTotal !== rightTotal) winner = leftTotal > rightTotal ? leftCity : rightCity

  return { rounds, leftWins, rightWins, leftTotal, rightTotal, winner }
}
