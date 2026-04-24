// 한국은행 ECOS 일일 원/달러 매매기준율 클라이언트 캐시.
// Cloud Function `/exchangeRate` 엔드포인트가 ECOS OpenAPI를 6h TTL로 프록시.

export interface ExchangeRateLive {
  rate: number
  date: string
  source: string
  sourceUrl: string
  statCode: string
}

let cache: ExchangeRateLive | null = null
let inflight: Promise<ExchangeRateLive | null> | null = null

export const getCachedExchangeRate = (): ExchangeRateLive | null => cache

export const loadExchangeRate = async (): Promise<ExchangeRateLive | null> => {
  if (cache) return cache
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const res = await fetch('/exchangeRate', { cache: 'no-store' })
      if (!res.ok) return null
      const j = (await res.json()) as Partial<ExchangeRateLive>
      if (!j.rate || j.rate <= 0 || !j.source || !j.sourceUrl) return null
      cache = {
        rate: j.rate,
        date: String(j.date ?? ''),
        source: j.source,
        sourceUrl: j.sourceUrl,
        statCode: String(j.statCode ?? ''),
      }
      return cache
    } catch {
      return null
    } finally {
      inflight = null
    }
  })()
  return inflight
}

// 시중은행 현찰 매도율 스프레드: 매매기준율의 약 1.5%~1.95%.
// 출처: 금융감독원 금융상품 통합비교공시 (fine.fss.or.kr) 외환 환율 스프레드 분포.
const SPREAD_MIN_RATIO = 0.015
const SPREAD_MAX_RATIO = 0.0195

export const computeUsdSpreadRange = (rate: number): { min: number; max: number } => ({
  min: Math.round(rate * SPREAD_MIN_RATIO),
  max: Math.round(rate * SPREAD_MAX_RATIO),
})
