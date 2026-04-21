import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './use-auth'
import coursesData from '../data/courses.json'

interface RawCourseFile {
  courses: Array<{ id: string }>
}

// Heart state for a single course — subscribes to the likes subcollection
// so the count updates live across tabs without a manual refresh. Toggle
// writes/deletes a doc keyed by the current user's uid.
export const useCourseLike = (courseId: string | null) => {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!courseId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(0)
      setLiked(false)
      return
    }
    const ref = collection(db, 'courses', courseId, 'likes')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setCount(snap.size)
        setLiked(user ? snap.docs.some((d) => d.id === user.uid) : false)
      },
      () => {
        // Permission or network error — silently reset so the UI stays
        // usable without tearing down the whole page.
        setCount(0)
        setLiked(false)
      },
    )
    return unsub
  }, [courseId, user])

  const toggle = useCallback(async () => {
    if (!user || !courseId) return
    const ref = doc(db, 'courses', courseId, 'likes', user.uid)
    if (liked) {
      await deleteDoc(ref)
    } else {
      await setDoc(ref, { createdAt: serverTimestamp() })
    }
  }, [user, courseId, liked])

  return { liked, count, toggle, canLike: Boolean(user) }
}

// Which courses has the current user liked. Checks each course's
// `likes/{uid}` doc directly — with 6 or so static courses that's cheap,
// and it avoids the collectionGroup + index + cross-collection rule
// complexity that a global query would need.
const COURSE_IDS: string[] = (coursesData as RawCourseFile).courses.map((c) => c.id)

export const useMyLikedCourses = () => {
  const { user } = useAuth()
  const [courseIds, setCourseIds] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCourseIds([])
      setLoaded(true)
      return
    }
    let cancelled = false
    setLoaded(false)
    const run = async () => {
      const checks = await Promise.all(
        COURSE_IDS.map(async (cid) => {
          try {
            const snap = await getDoc(doc(db, 'courses', cid, 'likes', user.uid))
            return snap.exists() ? cid : null
          } catch {
            return null
          }
        }),
      )
      if (cancelled) return
      setCourseIds(checks.filter((x): x is string => Boolean(x)))
      setLoaded(true)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [user])

  return { courseIds, loaded }
}
