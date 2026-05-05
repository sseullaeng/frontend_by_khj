// 카카오맵 공용 컴포넌트 — 마커 1개 + 자동 panTo
//
// 사용 예:
//   <KakaoMap
//     center={{ lat, lng }}
//     marker={{ lat, lng, label: '라이더' }}
//     height="300px"
//   />
import { useEffect, useRef, useState } from 'react'
import { ensureKakaoMap } from '@/shared/lib/kakaoMap'
import type { KakaoMapInstance, KakaoMarker } from '@/shared/lib/kakaoMap'

interface MarkerInfo {
  lat: number
  lng: number
  label?: string
}

interface Props {
  center: { lat: number; lng: number }
  marker?: MarkerInfo | null
  height?: string
  level?: number             // 줌 레벨 (1=가장 확대, 14=가장 축소). 기본 4
  className?: string
}

export default function KakaoMap({
  center,
  marker,
  height = '280px',
  level = 4,
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<KakaoMapInstance | null>(null)
  const markerRef = useRef<KakaoMarker | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 1) 마운트 시 SDK 로드 + 지도 생성
  useEffect(() => {
    let cancelled = false
    ensureKakaoMap()
      .then(() => {
        if (cancelled || !containerRef.current || !window.kakao) return
        const { kakao } = window
        const initial = new kakao.maps.LatLng(center.lat, center.lng)
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center: initial,
          level,
        })
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '지도를 불러오지 못했어요.')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2) center 변경 시 panTo
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return
    const latlng = new window.kakao.maps.LatLng(center.lat, center.lng)
    mapRef.current.panTo(latlng)
  }, [center.lat, center.lng])

  // 3) marker 변경 시 위치 갱신 (또는 생성/제거)
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return
    const { kakao } = window

    if (!marker) {
      markerRef.current?.setMap(null)
      markerRef.current = null
      return
    }

    const latlng = new kakao.maps.LatLng(marker.lat, marker.lng)
    if (markerRef.current) {
      markerRef.current.setPosition(latlng)
    } else {
      markerRef.current = new kakao.maps.Marker({
        position: latlng,
        map: mapRef.current,
      })
    }
  }, [marker])

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-400 ${className}`}
        style={{ height }}
      >
        {error}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden border border-gray-200 ${className}`}
      style={{ width: '100%', height }}
    />
  )
}
