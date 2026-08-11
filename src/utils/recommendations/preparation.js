export const getPreparationItems = (weather) => {
  const clothes =
    weather.temp <= 5
      ? '두꺼운 외투'
      : weather.temp <= 14
        ? '가벼운 코트'
        : weather.temp <= 22
          ? '얇은 겉옷'
          : weather.temp <= 27
            ? '가벼운 옷차림'
            : '통풍이 잘되는 옷'
  const items = [
    { id: 'clothes', icon: '👕', label: clothes, detail: `${weather.temp}℃ 기준 옷차림` },
  ]
  if (weather.pop >= 0.3)
    items.push({
      id: 'umbrella',
      icon: '☂️',
      label: '우산',
      detail: `강수확률 ${Math.round(weather.pop * 100)}%`,
    })
  if (weather.pm10 >= 50)
    items.push({ id: 'mask', icon: '😷', label: '마스크', detail: `미세먼지 ${weather.pm10}㎍/㎥` })
  if (weather.temp >= 25 || weather.humidity >= 70)
    items.push({ id: 'water', icon: '💧', label: '물', detail: '수분 보충이 필요해요' })
  if (weather.windSpeed > 8)
    items.push({
      id: 'windbreaker',
      icon: '🧥',
      label: '바람막이',
      detail: `풍속 ${weather.windSpeed}m/s`,
    })
  return items
}
