import { ADVISORIES, type Advisory, type AdvisoryCategory } from '../data/advisories'
import type { TourSearchItem } from './api'

const CATEGORY_ORDER: AdvisoryCategory[] = ['price', 'transit', 'etiquette', 'safety']

const hasAnyMatch = (haystack: string, needles: string[]) =>
  needles.some((n) => haystack.toLowerCase().includes(n.toLowerCase()))

export const matchAdvisories = (item: TourSearchItem): Advisory[] => {
  const title = item.title ?? ''
  const addr = item.addr ?? ''

  return ADVISORIES.filter((a) => {
    const regionOk = !a.regions?.length || hasAnyMatch(addr, a.regions)
    const keywordOk =
      !a.keywords?.length || hasAnyMatch(title, a.keywords) || hasAnyMatch(addr, a.keywords)
    if (a.regions?.length && a.keywords?.length) return regionOk && keywordOk
    if (a.regions?.length) return regionOk
    if (a.keywords?.length) return keywordOk
    return true
  })
}

export const groupByCategory = (advisories: Advisory[]) => {
  const groups = new Map<AdvisoryCategory, Advisory[]>()
  for (const cat of CATEGORY_ORDER) groups.set(cat, [])
  for (const a of advisories) groups.get(a.category)?.push(a)
  return CATEGORY_ORDER.map((cat) => ({ category: cat, items: groups.get(cat) ?? [] })).filter(
    (g) => g.items.length > 0,
  )
}
