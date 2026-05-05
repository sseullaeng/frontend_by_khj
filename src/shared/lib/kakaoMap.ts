// 카카오맵 JavaScript SDK 로더
// SDK URL: //dapi.kakao.com/v2/maps/sdk.js?appkey=KEY&autoload=false
// autoload=false 로 받아 kakao.maps.load(callback) 으로 초기화 — 한 번만.

const SDK_SRC = (key: string) =>
  `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`

let loadPromise: Promise<void> | null = null

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (cb: () => void) => void
        Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMapInstance
        LatLng: new (lat: number, lng: number) => KakaoLatLng
        Marker: new (options: { position: KakaoLatLng; map?: KakaoMapInstance; image?: KakaoMarkerImage }) => KakaoMarker
        MarkerImage: new (src: string, size: KakaoSize, options?: { offset?: KakaoPoint }) => KakaoMarkerImage
        Size: new (w: number, h: number) => KakaoSize
        Point: new (x: number, y: number) => KakaoPoint
        InfoWindow: new (options: { content: string }) => KakaoInfoWindow
      }
    }
  }
}

// 카카오맵 SDK 의 일부 타입 (필요한 것만)
export interface KakaoLatLng { getLat: () => number; getLng: () => number }
export interface KakaoMapInstance {
  setCenter: (latlng: KakaoLatLng) => void
  panTo: (latlng: KakaoLatLng) => void
  setLevel: (level: number) => void
}
export interface KakaoMarker {
  setPosition: (latlng: KakaoLatLng) => void
  setMap: (map: KakaoMapInstance | null) => void
}
export interface KakaoMarkerImage { _opaque?: never }
export interface KakaoSize { _opaque?: never }
export interface KakaoPoint { _opaque?: never }
export interface KakaoInfoWindow {
  open: (map: KakaoMapInstance, marker: KakaoMarker) => void
  close: () => void
}

/**
 * 카카오맵 SDK 동적 로드 + 초기화 (싱글톤).
 * 호출처에서 `await ensureKakaoMap()` 후 `window.kakao.maps` 사용.
 */
export function ensureKakaoMap(): Promise<void> {
  if (loadPromise) return loadPromise

  const key = import.meta.env.VITE_KAKAO_MAP_KEY
  if (!key || key === 'your_kakao_map_api_key') {
    return Promise.reject(new Error('VITE_KAKAO_MAP_KEY 환경변수가 비어있어요.'))
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(resolve)
      return
    }

    const existing = document.querySelector(`script[data-kakao-map-sdk]`)
    if (existing) {
      existing.addEventListener('load', () => window.kakao!.maps.load(resolve))
      existing.addEventListener('error', () => reject(new Error('카카오맵 SDK 로드 실패')))
      return
    }

    const script = document.createElement('script')
    script.src = SDK_SRC(key)
    script.async = true
    script.dataset.kakaoMapSdk = 'true'
    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error('카카오맵 SDK 가 로드되었지만 kakao.maps 가 없어요.'))
        return
      }
      window.kakao.maps.load(resolve)
    }
    script.onerror = () => reject(new Error('카카오맵 SDK 스크립트 로드 실패'))
    document.head.appendChild(script)
  })

  return loadPromise
}
