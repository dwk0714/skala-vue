const RAIN_KEYWORDS = ['비', '소나기', '이슬비', '뇌우']

export const getWalkableHours = (hourly = []) =>
  hourly.filter(
    (hour) =>
      hour.pop === 0 &&
      hour.temp >= 15 &&
      hour.temp <= 26 &&
      !RAIN_KEYWORDS.some((keyword) => hour.status.includes(keyword)),
  )

export const formatHour = (timestamp, timezone = 0) => {
  const date = new Date((timestamp + timezone) * 1000)
  return `${String(date.getUTCHours()).padStart(2, '0')}:00`
}
