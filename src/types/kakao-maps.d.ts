// Minimal Kakao Maps JS SDK typings — only what this app uses.
// Full official typings don't exist; we type the surface we touch.

declare global {
  interface Window {
    kakao: typeof kakao
  }

  namespace kakao.maps {
    class LatLng {
      constructor(lat: number, lng: number)
      getLat(): number
      getLng(): number
    }

    class LatLngBounds {
      constructor()
      extend(latlng: LatLng): void
      getSouthWest(): LatLng
      getNorthEast(): LatLng
      isEmpty(): boolean
    }

    class Size {
      constructor(width: number, height: number)
    }

    class Point {
      constructor(x: number, y: number)
    }

    class MarkerImage {
      constructor(src: string, size: Size, options?: { offset?: Point; alt?: string })
    }

    interface MapOptions {
      center: LatLng
      level?: number
      mapTypeId?: MapTypeId
      draggable?: boolean
      scrollwheel?: boolean
    }

    class Map {
      constructor(container: HTMLElement, options: MapOptions)
      setCenter(latlng: LatLng): void
      getCenter(): LatLng
      setLevel(level: number, options?: { animate?: boolean }): void
      getLevel(): number
      setMapTypeId(mapTypeId: MapTypeId): void
      getBounds(): LatLngBounds
      setBounds(bounds: LatLngBounds, paddingTop?: number): void
      relayout(): void
      panTo(latlng: LatLng): void
    }

    enum MapTypeId {
      ROADMAP = 1,
      SKYVIEW = 2,
      HYBRID = 3,
    }

    interface MarkerOptions {
      position: LatLng
      map?: Map
      image?: MarkerImage
      title?: string
      clickable?: boolean
      zIndex?: number
    }

    class Marker {
      constructor(options: MarkerOptions)
      setMap(map: Map | null): void
      setPosition(latlng: LatLng): void
      getPosition(): LatLng
    }

    namespace event {
      function addListener<T>(target: T, type: string, handler: (...args: unknown[]) => void): void
      function removeListener<T>(
        target: T,
        type: string,
        handler: (...args: unknown[]) => void,
      ): void
    }

    namespace services {
      // not used here yet — placeholder
    }
  }

  namespace kakao.maps.MarkerClusterer {
    interface ClustererOptions {
      map: kakao.maps.Map
      averageCenter?: boolean
      minLevel?: number
      minClusterSize?: number
      gridSize?: number
      styles?: Array<Record<string, string | number>>
      calculator?: number[]
      disableClickZoom?: boolean
    }
  }

  namespace kakao.maps {
    class MarkerClusterer {
      constructor(options: kakao.maps.MarkerClusterer.ClustererOptions)
      addMarkers(markers: Marker[]): void
      clear(): void
      removeMarker(marker: Marker): void
    }
  }
}

export {}
