import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { MapView, type MapMarker } from '../components/map-view'
import { useAppStore } from '../stores/app-store'
import { PinIcon } from '../components/icons'

const SEOUL: [number, number] = [126.9779, 37.5663]

export const MapPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const selectedPlace = useAppStore((s) => s.selectedPlace)
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.longitude, pos.coords.latitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    )
  }, [])

  const center: [number, number] = useMemo(() => {
    if (selectedPlace?.lng && selectedPlace?.lat) return [selectedPlace.lng, selectedPlace.lat]
    if (userLoc) return userLoc
    return SEOUL
  }, [selectedPlace, userLoc])

  const markers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = []
    if (selectedPlace) {
      list.push({
        id: selectedPlace.id,
        lng: selectedPlace.lng,
        lat: selectedPlace.lat,
        title: selectedPlace.title,
        active: true,
      })
    }
    return list
  }, [selectedPlace])

  return (
    <div className="space-y-5 pb-4">
      <header className="space-y-1">
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">{t('page.map.title')}</h1>
        <p className="text-sm text-ink-2">{t('page.map.subhead')}</p>
      </header>

      <MapView
        center={center}
        zoom={selectedPlace ? 15 : 11}
        markers={markers}
        className="h-[460px] w-full overflow-hidden rounded-3xl border border-line shadow-card"
      />

      {selectedPlace && (
        <button
          type="button"
          onClick={() => navigate('/place')}
          className="nwk-card flex w-full items-center gap-4 p-4 text-left transition-transform active:scale-[0.99]"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <PinIcon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold tracking-tight text-ink">
              {selectedPlace.title}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-ink-3">{selectedPlace.addr}</p>
          </div>
        </button>
      )}

      {selectedPlace && (
        <button
          type="button"
          onClick={() => setSelectedPlace(null)}
          className="text-[12px] font-medium text-ink-3 hover:text-ink-2"
        >
          {t('page.map.clearSelection')}
        </button>
      )}
    </div>
  )
}
