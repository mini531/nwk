// TourAPI 원본 이미지 URL을 Firebase Functions `/thumb` 프록시를 거쳐
// WebP로 리사이즈·재인코딩해 받아오도록 감싸는 헬퍼.
//
// 백엔드(functions/src/thumb.ts)가 허용하는 호스트만 프록시하고,
// 그 외 URL은 그대로 반환해 깨지지 않게 한다.

const PROXY_HOSTS = new Set([
  'tong.visitkorea.or.kr',
  'cdn.tour.visitkorea.or.kr',
  'api.visitkorea.or.kr',
])

export const THUMB_WIDTHS = [320, 480, 640, 960] as const
export type ThumbWidth = (typeof THUMB_WIDTHS)[number]

export function thumb(url: string | null | undefined, width: ThumbWidth = 480): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (!PROXY_HOSTS.has(u.hostname)) return url
    return `/thumb?url=${encodeURIComponent(url)}&w=${width}`
  } catch {
    return url
  }
}
