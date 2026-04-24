import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { maskEmail } from '../utils/mask'
import type { PriceCategory, Verdict } from './price-catalog'

export interface PublicCheck {
  id: string
  entryId: string
  category: PriceCategory
  paid: number
  fairMin: number
  fairMax: number
  verdict: Verdict
  extra?: string
  emailMasked: string
  hidden: boolean
  createdAt: Timestamp | null
}

interface PublishParams {
  entryId: string
  category: PriceCategory
  paid: number
  fairMin: number
  fairMax: number
  verdict: Verdict
  extra?: string
  email: string
}

export const publishCheck = async (p: PublishParams): Promise<void> => {
  const payload: Record<string, unknown> = {
    entryId: p.entryId,
    category: p.category,
    paid: p.paid,
    fairMin: p.fairMin,
    fairMax: p.fairMax,
    verdict: p.verdict,
    emailMasked: maskEmail(p.email),
    hidden: false,
    createdAt: serverTimestamp(),
  }
  if (p.extra) payload.extra = p.extra
  await addDoc(collection(db, 'publicChecks'), payload)
}

export const subscribeRecentChecks = (
  cb: (items: PublicCheck[]) => void,
  max = 50,
): (() => void) => {
  const q = query(collection(db, 'publicChecks'), orderBy('createdAt', 'desc'), limit(max))
  return onSnapshot(
    q,
    (snap) => {
      const out: PublicCheck[] = []
      for (const d of snap.docs) {
        const data = d.data()
        if (data.hidden === true) continue
        out.push({
          id: d.id,
          entryId: String(data.entryId ?? ''),
          category: data.category as PriceCategory,
          paid: Number(data.paid ?? 0),
          fairMin: Number(data.fairMin ?? 0),
          fairMax: Number(data.fairMax ?? 0),
          verdict: data.verdict as Verdict,
          extra: typeof data.extra === 'string' ? data.extra : undefined,
          emailMasked: String(data.emailMasked ?? ''),
          hidden: false,
          createdAt: (data.createdAt as Timestamp | undefined) ?? null,
        })
      }
      cb(out)
    },
    (err) => {
      console.error('publicChecks subscription failed', err)
      cb([])
    },
  )
}
