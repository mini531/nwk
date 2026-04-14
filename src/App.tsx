function App() {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 backdrop-blur">
        <h1 className="text-lg font-bold text-nwk-primary">NWK</h1>
        <button
          className="rounded-full p-2 text-neutral-600 active:bg-neutral-100"
          aria-label="menu"
        >
          ☰
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <section className="mx-auto max-w-md">
          <h2 className="text-2xl font-bold text-neutral-900">No Worries Korea</h2>
          <p className="mt-2 text-sm text-neutral-600">외국인 관광객을 위한 한국 여행 안전망</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="flex h-24 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 active:scale-95 transition-transform">
              <span className="text-2xl">📍</span>
              <span className="mt-1 text-sm font-medium">주변 탐색</span>
            </button>
            <button className="flex h-24 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 active:scale-95 transition-transform">
              <span className="text-2xl">💰</span>
              <span className="mt-1 text-sm font-medium">물가 정보</span>
            </button>
            <button className="flex h-24 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 active:scale-95 transition-transform">
              <span className="text-2xl">🚇</span>
              <span className="mt-1 text-sm font-medium">교통</span>
            </button>
            <button className="flex h-24 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 active:scale-95 transition-transform">
              <span className="text-2xl">⚠️</span>
              <span className="mt-1 text-sm font-medium">주의사항</span>
            </button>
          </div>
        </section>
      </main>

      <nav className="sticky bottom-0 flex h-16 items-center justify-around border-t border-neutral-200 bg-white">
        <button className="flex flex-col items-center text-xs text-nwk-primary">
          <span>🏠</span>홈
        </button>
        <button className="flex flex-col items-center text-xs text-neutral-500">
          <span>🔍</span>검색
        </button>
        <button className="flex flex-col items-center text-xs text-neutral-500">
          <span>🗺️</span>지도
        </button>
        <button className="flex flex-col items-center text-xs text-neutral-500">
          <span>👤</span>내정보
        </button>
      </nav>
    </div>
  )
}

export default App
