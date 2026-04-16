import { useEffect, useRef } from 'react'
import { useAuth } from './use-auth'
import { useFavorites, type FavoritePlace } from './use-favorites'
import { useRecentChecks, type RecentCheck } from './use-recent-checks'
import {
  loadCloudProfile,
  saveCloudProfile,
  mergeById,
  isCloudSyncDisabled,
} from '../services/cloud-sync'

// Mirrors the localStorage-backed favorites + recent checks to Firestore
// whenever the user is signed in. On first sign-in, merges anything
// already in the cloud with anything the user built up while signed
// out. Debounces writes so rapid edits don't hammer Firestore.
export const useCloudSync = () => {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const { favorites, count: favCount } = useFavorites() as ReturnType<typeof useFavorites> & {
    favorites: FavoritePlace[]
  }
  const { recent, count: recentCount } = useRecentChecks() as ReturnType<typeof useRecentChecks> & {
    recent: RecentCheck[]
  }

  const loadedForUidRef = useRef<string | null>(null)

  // On sign-in, pull cloud and merge into local.
  useEffect(() => {
    if (!uid) return
    if (loadedForUidRef.current === uid) return
    loadedForUidRef.current = uid

    let cancelled = false
    loadCloudProfile(uid).then((cloud) => {
      if (cancelled || !cloud) return
      const localFavRaw = window.localStorage.getItem('nwk.favorites')
      const localRecentRaw = window.localStorage.getItem('nwk.recent_checks')
      try {
        const localFavs: FavoritePlace[] = localFavRaw ? JSON.parse(localFavRaw) : []
        const localRecent: RecentCheck[] = localRecentRaw ? JSON.parse(localRecentRaw) : []
        const mergedFavs = mergeById(localFavs, cloud.favorites ?? [])
        const mergedRecent = mergeById(localRecent, cloud.recent ?? [])
        window.localStorage.setItem('nwk.favorites', JSON.stringify(mergedFavs))
        window.localStorage.setItem('nwk.recent_checks', JSON.stringify(mergedRecent))
        // Storage event broadcasts to any listening hooks in the same tab
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'nwk.favorites',
            newValue: JSON.stringify(mergedFavs),
          }),
        )
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'nwk.recent_checks',
            newValue: JSON.stringify(mergedRecent),
          }),
        )
      } catch (err) {
        console.warn('cloud merge failed', err)
      }
    })
    return () => {
      cancelled = true
    }
  }, [uid])

  // Track the previous uid so we can detect sign-out transitions and
  // wipe the browser copy of the personal data. On a fresh anonymous
  // session that never signed in, this is a no-op.
  const previousUidRef = useRef<string | null>(uid)
  useEffect(() => {
    const prev = previousUidRef.current
    if (prev && !uid) {
      // Sign-out transition — clear local personal data to protect the
      // next user of the device. Cloud copy under the signed-out uid is
      // preserved and will be re-merged on the next sign-in.
      try {
        window.localStorage.removeItem('nwk.favorites')
        window.localStorage.removeItem('nwk.recent_checks')
        window.dispatchEvent(new StorageEvent('storage', { key: 'nwk.favorites', newValue: null }))
        window.dispatchEvent(
          new StorageEvent('storage', { key: 'nwk.recent_checks', newValue: null }),
        )
      } catch {
        /* storage unavailable */
      }
    }
    previousUidRef.current = uid
    if (!uid) loadedForUidRef.current = null
  }, [uid])

  // Debounced push: any time favorites/recent change while signed in,
  // save after 1s of quiet.
  useEffect(() => {
    if (!uid) return
    if (isCloudSyncDisabled()) return
    const timer = window.setTimeout(() => {
      saveCloudProfile(uid, { favorites, recent })
    }, 1000)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, favCount, recentCount])
}
