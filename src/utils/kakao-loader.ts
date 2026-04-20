// Dynamic Kakao Maps JS SDK loader. Caches the load promise so the
// <script> is injected at most once per page. Waits for
// `kakao.maps.load()` to flush the internal module graph before resolving.

type KakaoNs = typeof window extends { kakao: infer K } ? K : never

let loadPromise: Promise<KakaoNs> | null = null

export const loadKakaoMaps = (): Promise<KakaoNs> => {
  if (loadPromise) return loadPromise
  loadPromise = new Promise<KakaoNs>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('kakao-loader: no window'))
      return
    }
    const w = window as unknown as { kakao?: { maps?: { load?: (cb: () => void) => void } } }
    if (w.kakao?.maps?.load) {
      w.kakao.maps.load(() => resolve(w.kakao as unknown as KakaoNs))
      return
    }
    const key = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined
    if (!key) {
      reject(new Error('VITE_KAKAO_MAP_KEY is not set'))
      return
    }
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=clusterer&autoload=false`
    script.async = true
    script.onload = () => {
      const k = (window as unknown as { kakao?: { maps?: { load?: (cb: () => void) => void } } })
        .kakao
      if (!k?.maps?.load) {
        reject(new Error('kakao.maps not present after script load'))
        return
      }
      k.maps.load(() => resolve(k as unknown as KakaoNs))
    }
    script.onerror = () => reject(new Error('failed to load kakao maps sdk'))
    document.head.appendChild(script)
  })
  return loadPromise
}
