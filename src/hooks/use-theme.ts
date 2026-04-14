import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'nwk.theme'

const readStored = (): Theme => {
  if (typeof window === 'undefined') return 'system'
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    /* storage unavailable */
  }
  return 'system'
}

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

const apply = (theme: Theme) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const effective = theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme
  if (effective === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(readStored)

  useEffect(() => {
    apply(theme)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  // React to system-level changes when the user is on 'system'.
  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => apply('system')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])

  const effective = theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme

  return { theme, effective, setTheme }
}

// Apply theme as early as possible (before React hydrates) to avoid FOUC.
export const initTheme = () => {
  if (typeof document === 'undefined') return
  apply(readStored())
}
