import { useCallback, useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './use-auth'
import { maskProfanity } from '../utils/profanity'

export interface CourseNote {
  id: string
  uid: string
  displayName: string
  photoURL: string | null
  text: string
  createdAt: Date | null
  hidden: boolean
}

const NOTE_MAX_LEN = 500
const LIST_LIMIT = 50

export const useCourseNotes = (courseId: string | null) => {
  const { user } = useAuth()
  const [notes, setNotes] = useState<CourseNote[]>([])
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) {
      setNotes([])
      setLoaded(true)
      return
    }
    setLoaded(false)
    // Unordered query — Firestore excludes docs with pending
    // serverTimestamp from orderBy results, which would hide the user's
    // own just-posted opinion until the server round-trip completes.
    // Sort client-side instead; with the 50-row limit this is trivial.
    const q = query(collection(db, 'courses', courseId, 'notes'), limit(LIST_LIMIT))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: CourseNote[] = []
        for (const d of snap.docs) {
          const data = d.data()
          if (data.hidden) continue
          const rawDate = data.createdAt as Timestamp | undefined
          list.push({
            id: d.id,
            uid: String(data.uid ?? ''),
            displayName: String(data.displayName ?? ''),
            photoURL: data.photoURL ? String(data.photoURL) : null,
            text: String(data.text ?? ''),
            createdAt: rawDate ? rawDate.toDate() : null,
            hidden: Boolean(data.hidden),
          })
        }
        // Newest first. Pending writes have createdAt === null → treat as
        // most recent so the user sees their own post immediately.
        list.sort((a, b) => {
          const ta = a.createdAt?.getTime() ?? Number.POSITIVE_INFINITY
          const tb = b.createdAt?.getTime() ?? Number.POSITIVE_INFINITY
          return tb - ta
        })
        setNotes(list)
        setLoaded(true)
      },
      (err) => {
        console.error('notes snapshot error', err)
        setNotes([])
        setLoaded(true)
      },
    )
    return unsub
  }, [courseId])

  const submit = useCallback(
    async (rawText: string) => {
      setError(null)
      if (!user) {
        setError('auth-required')
        return false
      }
      if (!courseId) return false
      const trimmed = rawText.trim()
      if (!trimmed) {
        setError('empty')
        return false
      }
      if (trimmed.length > NOTE_MAX_LEN) {
        setError('too-long')
        return false
      }
      setSubmitting(true)
      try {
        const masked = maskProfanity(trimmed)
        await addDoc(collection(db, 'courses', courseId, 'notes'), {
          uid: user.uid,
          displayName: user.displayName ?? '익명',
          photoURL: user.photoURL ?? null,
          text: masked,
          hidden: false,
          createdAt: serverTimestamp(),
        })
        return true
      } catch (err) {
        console.error('note submit failed', err)
        setError('write-failed')
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [user, courseId],
  )

  const remove = useCallback(
    async (noteId: string) => {
      if (!user || !courseId) return
      try {
        await deleteDoc(doc(db, 'courses', courseId, 'notes', noteId))
      } catch (err) {
        console.error('note delete failed', err)
      }
    },
    [user, courseId],
  )

  return { notes, loaded, submit, remove, submitting, error, canWrite: Boolean(user) }
}
