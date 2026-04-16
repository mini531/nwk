import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'
import { db } from '../firebase'
import type { FavoritePlace } from '../hooks/use-favorites'
import type { RecentCheck } from '../hooks/use-recent-checks'

interface UserCloudDoc {
  favorites?: FavoritePlace[]
  recent?: RecentCheck[]
}

const userDocRef = (uid: string) => doc(db, 'users', uid)

// Once Firestore reports the database doesn't exist (or we aren't
// allowed to touch it), stop trying for the rest of the session so the
// console doesn't flood. The local-first experience keeps working.
let disabled = false

const isFatalConfigError = (err: unknown): boolean => {
  if (err instanceof FirebaseError) {
    return (
      err.code === 'not-found' || err.code === 'failed-precondition' || err.code === 'unimplemented'
    )
  }
  const message = err instanceof Error ? err.message : String(err)
  return /Database .* not found|NOT_FOUND|failed-precondition/i.test(message)
}

const handleError = (scope: string, err: unknown) => {
  if (isFatalConfigError(err)) {
    if (!disabled) {
      disabled = true
      console.info(
        `[cloud-sync] disabled for this session — Firestore not provisioned yet (${scope}). Local data continues to work.`,
      )
    }
    return
  }
  console.warn(`cloud-sync ${scope} failed`, err)
}

export const isCloudSyncDisabled = () => disabled

export const loadCloudProfile = async (uid: string): Promise<UserCloudDoc | null> => {
  if (disabled) return null
  try {
    const snap = await getDoc(userDocRef(uid))
    if (!snap.exists()) return null
    return snap.data() as UserCloudDoc
  } catch (err) {
    handleError('load', err)
    return null
  }
}

export const saveCloudProfile = async (uid: string, payload: UserCloudDoc): Promise<void> => {
  if (disabled) return
  try {
    await setDoc(
      userDocRef(uid),
      {
        ...payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (err) {
    handleError('save', err)
  }
}

// Merge two arrays by id, preferring the newer addedAt timestamp.
export const mergeById = <T extends { id: string; addedAt: string }>(
  a: T[] = [],
  b: T[] = [],
): T[] => {
  const map = new Map<string, T>()
  for (const item of [...a, ...b]) {
    const existing = map.get(item.id)
    if (!existing || existing.addedAt < item.addedAt) {
      map.set(item.id, item)
    }
  }
  return Array.from(map.values()).sort((x, y) => y.addedAt.localeCompare(x.addedAt))
}
