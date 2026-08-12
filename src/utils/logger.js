const PREFIX = {
  watch: '👁 [watch 감지]',
  watchEffect: '🤖 [watchEffect 자동 호출]',
  action: '⚡ [사용자 액션]',
}

export const formatLog = (kind, message) => `${PREFIX[kind] ?? kind} ${message}`

export const log = (kind, message) => {
  const line = formatLog(kind, message)
  console.log(line)
  return line
}
