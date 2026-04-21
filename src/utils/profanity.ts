// Client-side profanity filter for user-generated notes. Keeps a curated
// list of Korean + English slurs and masks them with asterisks before
// persisting. Intentionally conservative — err on the side of
// under-blocking rather than false-positive on everyday speech (e.g. place
// names that overlap slurs).
//
// The server-side rules in firestore.rules re-validate length limits but
// do not re-run this filter, so the masking happens on write only. That's
// acceptable because a determined user can always bypass a client filter;
// the goal is to keep casual trolling off the public feed and give us an
// administrative `hidden` flag for anything that slips through.

const PROFANITY_LIST = [
  // Korean — common coarse insults and their colloquial spellings
  '씨발',
  '시발',
  '씨바',
  '씨팔',
  '좆',
  '좇',
  '개새끼',
  '개새',
  '개색',
  '병신',
  '븅신',
  '븅쉰',
  '지랄',
  '꺼져',
  '미친놈',
  '미친년',
  '썅',
  '쌍년',
  '쌍놈',
  '십새',
  '십새끼',
  '엿먹어',
  '또라이',
  '또라인',
  '등신',
  '멍청이',
  // English
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'damn',
  'bastard',
]

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Case-insensitive whole-or-partial match. Korean words are matched
// literally; English words get a word-boundary check to avoid masking
// subwords (e.g. "scunthorpe problem").
const PATTERNS = PROFANITY_LIST.map((word) => {
  const isKorean = /[\uAC00-\uD7AF]/.test(word)
  const body = escapeRegex(word)
  return {
    word,
    re: isKorean ? new RegExp(body, 'gi') : new RegExp(`\\b${body}\\b`, 'gi'),
  }
})

export const maskProfanity = (text: string): string => {
  let out = text
  for (const { word, re } of PATTERNS) {
    out = out.replace(re, '*'.repeat(Math.max(2, word.length)))
  }
  return out
}

export const hasProfanity = (text: string): boolean => {
  return PATTERNS.some(({ re }) => re.test(text))
}
