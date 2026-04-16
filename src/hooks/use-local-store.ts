import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'nwk.'

// Simple typed localStorage hook. Values are serialized as JSON.
// Safe against SSR / private-mode failures (falls back to memory state).
export const useLocalStore = <T>(key: string, initial: T) => {
  const storageKey = `${PREFIX}${key}`

  const read = (): T => {
    if (typeof window === 'undefined') return initial
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw === null) return initial
      return JSON.parse(raw) as T
    } catch {
      return initial
    }
  }

  const [value, setValue] = useState<T>(read)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // quota exceeded or private mode — drop silently
    }
  }, [storageKey, value])

  // Also react to changes from other tabs.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== storageKey) return
      if (ev.newValue === null) {
        setValue(initial)
        return
      }
      try {
        setValue(JSON.parse(ev.newValue))
      } catch {
        /* ignore parse errors */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const reset = useCallback(() => setValue(initial), [initial])

  return [value, setValue, reset] as const
}
