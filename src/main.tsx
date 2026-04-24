import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router'
import { detectLang, initI18n } from './i18n'
import { useAppStore } from './stores/app-store'
import { ErrorBoundary } from './components/error-boundary'
import { initTheme } from './hooks/use-theme'
import { loadExchangeRate } from './data/exchange-rate'

initTheme()

const lang = detectLang()
await initI18n(lang)
useAppStore.setState({ lang })

// 환율 캐시 미리 로드 — 첫 화면 paint 를 막지 않도록 fire-and-forget.
void loadExchangeRate()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed', err)
    })
  })
}
