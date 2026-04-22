// Native share for course detail / map sheet with clipboard fallback.
// `navigator.share` pops the OS share sheet (KakaoTalk / iMessage / etc.);
// if the browser doesn't support it, we copy the URL to the clipboard so
// the user can paste it manually.

export type ShareResult = 'shared' | 'copied' | 'failed'

export const shareCourse = async (payload: {
  title: string
  text: string
  url: string
}): Promise<ShareResult> => {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined
  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share(payload)
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'shared'
      }
      // fall through to clipboard fallback
    }
  }
  if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
    try {
      await nav.clipboard.writeText(payload.url)
      return 'copied'
    } catch {
      return 'failed'
    }
  }
  return 'failed'
}
