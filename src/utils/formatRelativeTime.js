export const formatRelativeTime = (updatedAt, now = Date.now()) => {
  const seconds = Math.max(0, Math.floor((now - Date.parse(updatedAt)) / 1000))
  if (seconds < 60) return '방금 전'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}
