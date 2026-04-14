import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { FavoritePlace } from '../hooks/use-favorites'
import type { RecentCheck } from '../hooks/use-recent-checks'

interface UserCloudDoc {
  favorites?: FavoritePlace[]
  recent?: RecentCheck[]
}

const userDocRef = (uid: string) => doc(db, 'users', uid)

export const loadCloudProfile = async (uid: string): Promise<UserCloudDoc | null> => {
  try {
    const snap = await getDoc(userDocRef(uid))
    if (!snap.exists()) return null
    return snap.data() as UserCloudDoc
  } catch (err) {
    console.warn('cloud-sync load failed', err)
    return null
  }
}

export const saveCloudProfile = async (uid: string, payload: UserCloudDoc): Promise<void> => {
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
    console.warn('cloud-sync save failed', err)
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
