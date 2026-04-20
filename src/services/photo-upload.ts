import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

const MAX_EDGE = 1600
const JPEG_QUALITY = 0.82

const downscale = async (file: File): Promise<Blob> => {
  if (typeof createImageBitmap !== 'function') return file
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const { width, height } = bitmap
  const max = Math.max(width, height)
  if (max <= MAX_EDGE) {
    bitmap.close()
    return file
  }
  const scale = MAX_EDGE / max
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', JPEG_QUALITY)
  })
}

export const uploadReceiptPhoto = async (uid: string, file: File): Promise<string> => {
  const blob = await downscale(file)
  const stamp = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  const path = `users/${uid}/receipts/${stamp}-${rand}.jpg`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}
