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
        services: {
          Places: new () => KakaoPlaces
          Geocoder: new () => KakaoGeocoder
          Status: { OK: string; ZERO_RESULT: string; ERROR: string }
        }
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

// 카카오 로컬 검색 (services 라이브러리)
export interface KakaoPlace {
  id: string
  place_name: string         // 장소명 또는 도로명/지번
  address_name: string       // 지번 주소 (예: "서울 종로구 세종로 1-1")
  road_address_name: string  // 도로명 주소 (없으면 빈 문자열)
  category_name: string
  phone: string
  x: string                  // 경도(lng) — 문자열로 옴
  y: string                  // 위도(lat)
}
export interface KakaoPlaces {
  keywordSearch: (
    query: string,
    callback: (data: KakaoPlace[], status: string) => void,
    options?: { size?: number },
  ) => void
}

export interface KakaoGeocoderResult {
  address_name: string
  region_1depth_name: string
  region_2depth_name: string
  region_3depth_name: string
  road_address?: { address_name: string }
  x: string
  y: string
}
export interface KakaoCoord2AddressResult {
  address: { address_name: string } | null
  road_address: { address_name: string } | null
}
export interface KakaoGeocoder {
  addressSearch: (
    query: string,
    callback: (data: KakaoGeocoderResult[], status: string) => void,
  ) => void
  coord2RegionCode: (
    lng: number,
    lat: number,
    callback: (data: KakaoGeocoderResult[], status: string) => void,
  ) => void
  coord2Address: (
    lng: number,
    lat: number,
    callback: (data: KakaoCoord2AddressResult[], status: string) => void,
  ) => void
}

/**
 * 현재 위치 → 도로명 주소 우선, 없으면 지번 주소.
 * navigator.geolocation + 카카오 reverse geocode 통합 헬퍼.
 */
export async function reverseGeocodeCurrentPosition(): Promise<string> {
  if (!navigator.geolocation) {
    throw new Error('이 브라우저는 위치 정보를 지원하지 않아요.')
  }
  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000,
    })
  })
  await ensureKakaoMap()
  const { kakao } = window
  if (!kakao?.maps.services) throw new Error('카카오 SDK 가 로드되지 않았어요.')

  const geocoder = new kakao.maps.services.Geocoder()
  return new Promise<string>((resolve, reject) => {
    geocoder.coord2Address(
      pos.coords.longitude,
      pos.coords.latitude,
      (data, status) => {
        const Status = window.kakao!.maps.services.Status
        if (status !== Status.OK || data.length === 0) {
          reject(new Error('현재 위치의 주소를 알 수 없어요.'))
          return
        }
        const first = data[0]
        const text = first.road_address?.address_name ?? first.address?.address_name
        if (!text) {
          reject(new Error('현재 위치의 주소를 알 수 없어요.'))
          return
        }
        resolve(text)
      },
    )
  })
}

/**
 * 카카오맵 SDK 동적 로드 + 초기화 (싱글톤).
 * 호출처에서 `await ensureKakaoMap()` 후 `window.kakao.maps` 사용.
 */
export function ensureKakaoMap(): Promise<void> {
  if (loadPromise) return loadPromise

  // 카카오 디벨로퍼스: 같은 앱의 JavaScript 키 하나로 로그인 + 지도 + 로컬 API 모두 사용
  const key = import.meta.env.VITE_KAKAO_JS_KEY
  if (!key) {
    return Promise.reject(new Error('VITE_KAKAO_JS_KEY 환경변수가 비어있어요.'))
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
