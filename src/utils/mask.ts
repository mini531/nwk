export const maskEmail = (email: string): string => {
  const at = email.indexOf('@')
  if (at <= 0) {
    const chars = Array.from(email)
    return (chars[0] ?? '') + '*'.repeat(Math.max(chars.length - 1, 1))
  }
  const local = email.slice(0, at)
  const domain = email.slice(at)
  const head = local[0] ?? ''
  return head + '*'.repeat(Math.max(local.length - 1, 1)) + domain
}
