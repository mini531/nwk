// Client-side menu/receipt OCR using tesseract.js.
// Lazy-loaded so the ~4MB wasm + language files only download when the
// user actually uses photo verdict.

export interface ExtractedLine {
  text: string
  confidence: number
}

export interface ExtractedPrice {
  label: string // text fragment that looks like an item name
  price: number // KRW
  raw: string // original line text for debugging
}

// Match prices in Korean menus. Accepts formats:
// 8,000  8,000원  ₩8,000  8000원  8.000  8,000KRW  8000
const PRICE_RE = /(?:₩|￦)?\s?(\d{1,3}(?:[,.]\d{3})+|\d{3,6})\s?(원|KRW|won)?/gi

const parseKrw = (match: string): number => {
  const digits = match.replace(/[^0-9]/g, '')
  if (!digits) return 0
  const n = Number(digits)
  // Menu prices typically 500 - 500,000 KRW. Filter out years/phone segments.
  if (n < 500 || n > 500000) return 0
  return n
}

export const ocrImage = async (file: File): Promise<ExtractedLine[]> => {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(['kor', 'eng'])
  try {
    const { data } = await worker.recognize(file)
    type TesseractLine = { text?: string; confidence?: number }
    const anyData = data as unknown as { lines?: TesseractLine[]; text?: string }
    const lines = anyData.lines ?? []
    if (lines.length > 0) {
      return lines
        .map((l) => ({
          text: String(l.text ?? '').trim(),
          confidence: Number(l.confidence ?? 0),
        }))
        .filter((l) => l.text.length > 0)
    }
    // Fallback: split the full `text` field by newline if `lines` not exposed
    return String(anyData.text ?? '')
      .split(/\r?\n/)
      .map((t) => ({ text: t.trim(), confidence: 0 }))
      .filter((l) => l.text.length > 0)
  } finally {
    await worker.terminate()
  }
}

export const extractPrices = (lines: ExtractedLine[]): ExtractedPrice[] => {
  const out: ExtractedPrice[] = []
  for (const line of lines) {
    const matches = [...line.text.matchAll(PRICE_RE)]
    if (matches.length === 0) continue
    // Take the first valid price on the line; use the text BEFORE that price
    // as the item label (common menu layout: "비빔밥 ... 9,000원").
    for (const m of matches) {
      const price = parseKrw(m[0])
      if (!price) continue
      const start = m.index ?? 0
      const label = line.text
        .slice(0, start)
        .trim()
        .replace(/[·•\-–]+$/, '')
        .trim()
      if (!label) continue
      out.push({ label, price, raw: line.text })
      break
    }
  }
  return out
}
