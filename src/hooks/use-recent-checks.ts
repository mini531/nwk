import { useCallback } from 'react'
import { useLocalStore } from './use-local-store'
import type { Verdict } from '../data/price-catalog'

export interface RecentCheck {
  id: string
  entryId: string
  paid: number
  fairMin: number
  fairMax: number
  deltaPct: number
  verdict: Verdict
  addedAt: string
  photoUrl?: string
}

const MAX_RECENT = 20

export const useRecentChecks = () => {
  const [list, setList] = useLocalStore<RecentCheck[]>('recent_checks', [])

  const push = useCallback(
    (check: Omit<RecentCheck, 'id' | 'addedAt'>) => {
      const id = `${check.entryId}-${Date.now()}`
      setList((prev) => {
        const next: RecentCheck = { ...check, id, addedAt: new Date().toISOString() }
        return [next, ...prev].slice(0, MAX_RECENT)
      })
      return id
    },
    [setList],
  )

  const attachPhoto = useCallback(
    (id: string, photoUrl: string) => {
      setList((prev) => prev.map((r) => (r.id === id ? { ...r, photoUrl } : r)))
    },
    [setList],
  )

  const remove = useCallback(
    (id: string) => {
      setList((prev) => prev.filter((r) => r.id !== id))
    },
    [setList],
  )

  const clear = useCallback(() => setList([]), [setList])

  return { recent: list, push, attachPhoto, remove, clear, count: list.length }
}
