import { useCallback, useMemo } from 'react'
import { useLocalStore } from './use-local-store'

export interface FavoritePlace {
  id: string
  title: string
  addr: string
  thumbnail?: string | null
  lat?: number
  lng?: number
  addedAt: string
}

const MAX_FAVORITES = 50

export const useFavorites = () => {
  const [list, setList] = useLocalStore<FavoritePlace[]>('favorites', [])

  const ids = useMemo(() => new Set(list.map((p) => p.id)), [list])

  const isFavorite = useCallback((id: string) => ids.has(id), [ids])

  const add = useCallback(
    (place: Omit<FavoritePlace, 'addedAt'>) => {
      setList((prev) => {
        if (prev.some((p) => p.id === place.id)) return prev
        const next = [{ ...place, addedAt: new Date().toISOString() }, ...prev]
        return next.slice(0, MAX_FAVORITES)
      })
    },
    [setList],
  )

  const remove = useCallback(
    (id: string) => {
      setList((prev) => prev.filter((p) => p.id !== id))
    },
    [setList],
  )

  const toggle = useCallback(
    (place: Omit<FavoritePlace, 'addedAt'>) => {
      setList((prev) => {
        if (prev.some((p) => p.id === place.id)) return prev.filter((p) => p.id !== place.id)
        return [{ ...place, addedAt: new Date().toISOString() }, ...prev].slice(0, MAX_FAVORITES)
      })
    },
    [setList],
  )

  const clear = useCallback(() => setList([]), [setList])

  return { favorites: list, isFavorite, add, remove, toggle, clear, count: list.length }
}
