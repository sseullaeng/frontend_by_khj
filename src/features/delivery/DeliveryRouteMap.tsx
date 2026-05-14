// 배달 경로 지도 — 출발지 + 도착지 + (옵션) 라이더 실시간 위치
//
// - pickupAddress / dropoffAddress 는 문자열 주소 → 카카오 geocoder 로 좌표 변환
// - 두 좌표 잡히면 점선 경로 그리고 자동 fit bounds
// - rider 좌표는 별도 마커 + 위치만 갱신 (지도는 panTo 하지 않음 — 사용자의 수동 스크롤 방해 X)

import { useEffect, useRef, useState } from 'react'
import { ensureKakaoMap } from '@/shared/lib/kakaoMap'
import type {
  KakaoCustomOverlay,
  KakaoMapInstance,
  KakaoMarker,
  KakaoPolyline,
} from '@/shared/lib/kakaoMap'

interface Coord {
  lat: number
  lng: number
}

interface Props {
  pickupAddress: string
  dropoffAddress: string
  riderLocation: Coord | null
  demoRiderAtDropoff?: boolean
  height?: string
}

async function geocodeAddress(address: string): Promise<Coord | null> {
  if (!address) return null
  await ensureKakaoMap()
  const { kakao } = window
  if (!kakao?.maps.services) return null
  const geocoder = new kakao.maps.services.Geocoder()
  return new Promise<Coord | null>((resolve) => {
    geocoder.addressSearch(address, (data, status) => {
      const Status = window.kakao!.maps.services.Status
      if (status !== Status.OK || data.length === 0) {
        resolve(null)
        return
      }
      const first = data[0]
      resolve({ lat: Number(first.y), lng: Number(first.x) })
    })
  })
}

function badgeHtml(text: string, bg: string): string {
  return `<div style="
    transform: translateY(-44px);
    background:${bg};
    color:white;
    padding:3px 8px;
    border-radius:999px;
    font-size:11px;
    font-weight:700;
    box-shadow:0 2px 4px rgba(0,0,0,0.15);
    white-space:nowrap;
  ">${text}</div>`
}

export default function DeliveryRouteMap({
  pickupAddress,
  dropoffAddress,
  riderLocation,
  demoRiderAtDropoff,
  height = '280px',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<KakaoMapInstance | null>(null)
  const riderMarkerRef = useRef<KakaoMarker | null>(null)
  const riderLabelRef = useRef<KakaoCustomOverlay | null>(null)
  const polylineRef = useRef<KakaoPolyline | null>(null)
  const pickupMarkerRef = useRef<KakaoMarker | null>(null)
  const dropoffMarkerRef = useRef<KakaoMarker | null>(null)
  const pickupLabelRef = useRef<KakaoCustomOverlay | null>(null)
  const dropoffLabelRef = useRef<KakaoCustomOverlay | null>(null)

  const [pickupCoord, setPickupCoord] = useState<Coord | null>(null)
  const [dropoffCoord, setDropoffCoord] = useState<Coord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const effectiveRiderLocation = riderLocation ?? (demoRiderAtDropoff ? dropoffCoord : null)

  // 1) 주소 → 좌표 변환
  useEffect(() => {
    let cancelled = false
    Promise.all([geocodeAddress(pickupAddress), geocodeAddress(dropoffAddress)])
      .then(([p, d]) => {
        if (cancelled) return
        setPickupCoord(p)
        setDropoffCoord(d)
      })
      .catch(() => {
        if (cancelled) return
        setError('지도를 불러오지 못했어요.')
      })
    return () => {
      cancelled = true
    }
  }, [pickupAddress, dropoffAddress])

  // 2) 좌표 준비되면 지도 생성 + 출발/도착 마커 + 점선 경로 + fit bounds
  useEffect(() => {
    if (!pickupCoord || !dropoffCoord || !containerRef.current) return
    let cancelled = false
    ensureKakaoMap()
      .then(() => {
        if (cancelled || !containerRef.current || !window.kakao) return
        const { kakao } = window

        const pickupLatLng = new kakao.maps.LatLng(pickupCoord.lat, pickupCoord.lng)
        const dropoffLatLng = new kakao.maps.LatLng(dropoffCoord.lat, dropoffCoord.lng)

        // 지도 (중심점은 fit bounds 가 덮어쓰지만 초기값 필요)
        const map = new kakao.maps.Map(containerRef.current, {
          center: pickupLatLng,
          level: 5,
        })
        mapRef.current = map

        // 출발 마커 + 라벨
        pickupMarkerRef.current = new kakao.maps.Marker({ position: pickupLatLng, map })
        pickupLabelRef.current = new kakao.maps.CustomOverlay({
          position: pickupLatLng,
          content: badgeHtml('출발', '#10b981'),
          yAnchor: 1,
          map,
        })

        // 도착 마커 + 라벨
        dropoffMarkerRef.current = new kakao.maps.Marker({ position: dropoffLatLng, map })
        dropoffLabelRef.current = new kakao.maps.CustomOverlay({
          position: dropoffLatLng,
          content: badgeHtml('도착', '#ef4444'),
          yAnchor: 1,
          map,
        })

        // 점선 경로 — 직선 (Kakao Mobility 직접 라우팅 API 미사용)
        polylineRef.current = new kakao.maps.Polyline({
          path: [pickupLatLng, dropoffLatLng],
          strokeWeight: 4,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.8,
          strokeStyle: 'dash',
          map,
        })

        // 초기 fit bounds
        const bounds = new kakao.maps.LatLngBounds()
        bounds.extend(pickupLatLng)
        bounds.extend(dropoffLatLng)
        map.setBounds(bounds)
      })
      .catch(() => {
        if (cancelled) return
        setError('지도를 불러오지 못했어요.')
      })

    return () => {
      cancelled = true
      pickupMarkerRef.current?.setMap(null)
      dropoffMarkerRef.current?.setMap(null)
      pickupLabelRef.current?.setMap(null)
      dropoffLabelRef.current?.setMap(null)
      polylineRef.current?.setMap(null)
      riderMarkerRef.current?.setMap(null)
      riderLabelRef.current?.setMap(null)
      mapRef.current = null
      pickupMarkerRef.current = null
      dropoffMarkerRef.current = null
      pickupLabelRef.current = null
      dropoffLabelRef.current = null
      polylineRef.current = null
      riderMarkerRef.current = null
      riderLabelRef.current = null
    }
    // riderLocation 은 초기 bounds 계산에만 쓰이고, 이후 변경은 아래 effect 에서 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupCoord, dropoffCoord])

  // 3) 라이더 위치 갱신 — 마커만 이동, panTo 는 하지 않음
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return
    const { kakao } = window

    if (!effectiveRiderLocation) {
      riderMarkerRef.current?.setMap(null)
      riderLabelRef.current?.setMap(null)
      riderMarkerRef.current = null
      riderLabelRef.current = null
      return
    }

    const latlng = new kakao.maps.LatLng(effectiveRiderLocation.lat, effectiveRiderLocation.lng)
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setPosition(latlng)
    } else {
      riderMarkerRef.current = new kakao.maps.Marker({ position: latlng, map: mapRef.current })
    }
    if (riderLabelRef.current) {
      riderLabelRef.current.setPosition(latlng)
      riderLabelRef.current.setMap(null)
      riderLabelRef.current = new kakao.maps.CustomOverlay({
        position: latlng,
        content: badgeHtml(riderLocation ? '라이더' : '라이더(데모)', '#3b82f6'),
        yAnchor: 1,
        map: mapRef.current,
      })
    } else {
      riderLabelRef.current = new kakao.maps.CustomOverlay({
        position: latlng,
        content: badgeHtml(riderLocation ? '라이더' : '라이더(데모)', '#3b82f6'),
        yAnchor: 1,
        map: mapRef.current,
      })
    }
  }, [effectiveRiderLocation, riderLocation])

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-400"
        style={{ height }}
      >
        {error}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden border border-gray-200"
      style={{ width: '100%', height }}
    />
  )
}
