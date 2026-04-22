import { useEffect, useRef, type ReactNode } from 'react'

// Fades children in + slides up a few px when they enter the viewport.
// One-shot per mount: once revealed, the observer disconnects so quick
// scroll-ups don't re-animate. Respects prefers-reduced-motion via the
// `[data-in]` CSS rule — the transition itself is declared in index.css.
export const Reveal = ({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-in', 'true')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          if (delay > 0) {
            window.setTimeout(() => el.setAttribute('data-in', 'true'), delay)
          } else {
            el.setAttribute('data-in', 'true')
          }
          io.unobserve(el)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  )
}
