// PDF export + native share for course detail screens.
//
// PDF: uses the browser's built-in "Print to PDF". Earlier attempts with
//      html2canvas+jsPDF choked on Tailwind v4's color-mix()/oklch output,
//      and bundling Korean fonts large enough for direct jsPDF text was
//      impractical. window.print() renders with the real page fonts,
//      handles CJK perfectly, and the browser offers "Save as PDF" in the
//      native dialog. A body class toggles print-only visibility rules.
//
// Share: `navigator.share` with clipboard fallback. On Android the share
//        sheet includes KakaoTalk by default, which covers the requirement
//        without needing Kakao's JavaScript SDK or an app registration.

export const downloadCoursePdf = async (targetId: string): Promise<void> => {
  const target = document.getElementById(targetId)
  if (!target) return

  // Bring the PDF content to the top of the viewport so the print preview
  // starts where we expect, not mid-scroll.
  target.scrollIntoView({ block: 'start' })

  document.body.classList.add('pdf-printing')
  const cleanup = () => {
    document.body.classList.remove('pdf-printing')
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  // afterprint doesn't always fire (some browsers / user cancels) — fall
  // back to a timed cleanup so the body never stays in print-mode.
  window.setTimeout(cleanup, 30000)

  // Small delay so the class-based CSS can apply before the print dialog
  // snapshots the document.
  window.setTimeout(() => window.print(), 50)
}

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
