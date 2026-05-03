// 배달 실시간 위치 훅 — 가이드 §10.13 라운드6
//
// 라이더: setInterval 로 5초 주기 navigator.geolocation → STOMP publish
// 요청자: STOMP subscribe + REST fallback (마지막 좌표)

import { useEffect, useState } from 'react'
import { deliveryApi } from './api'
import type { DeliveryLocation } from './types'
import { publishStomp, subscribeStomp } from '@/shared/lib/stomp'

const PUBLISH_DEST = (id: number) => `/app/delivery/${id}/location`
const SUBSCRIBE_TOPIC = (id: number) => `/topic/delivery/${id}/location`
const PUBLISH_INTERVAL_MS = 5000

/**
 * 라이더가 본인 위치를 주기 publish.
 * - 추적 가능 상태(수락/배송중)일 때만 활성화 (호출처에서 boolean 으로 제어)
 * - 1초 미만 재호출 X (5초 주기로 충분히 안전)
 * - HTTPS 환경 또는 localhost 에서만 geolocation 사용 가능
 */
export function useRiderLocationPublisher(deliveryId: number, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !deliveryId) return
    if (!('geolocation' in navigator)) return

    const send = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          publishStomp(PUBLISH_DEST(deliveryId), {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyM: pos.coords.accuracy,
            recordedAt: new Date().toISOString(),
          })
        },
        () => {
          // 위치 권한 거부 / 실패 — 조용히 다음 주기로
        },
        { enableHighAccuracy: false, maximumAge: 3000, timeout: 4500 },
      )
    }

    send() // 즉시 1회
    const timer = setInterval(send, PUBLISH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [deliveryId, enabled])
}

/**
 * 요청자(또는 라이더 본인) 가 실시간 위치 구독.
 * - 마운트 시 REST fallback 으로 마지막 좌표 가져옴
 * - 이후 STOMP subscribe → 실시간 갱신
 * - 추적 가능 상태에서만 호출 권장 (참여자 + 미종료 상태)
 */
export function useDeliveryLocation(deliveryId: number, enabled: boolean) {
  const [location, setLocation] = useState<DeliveryLocation | null>(null)

  // REST fallback — 마지막 좌표
  useEffect(() => {
    if (!enabled || !deliveryId) return
    let cancelled = false
    deliveryApi
      .getLastLocation(deliveryId)
      .then((res) => {
        if (cancelled) return
        // 200 + DeliveryLocation 또는 204 + '' (axios 인터셉터 unwrap 후 '')
        if (res.data && typeof res.data === 'object') {
          setLocation(res.data as DeliveryLocation)
        }
      })
      .catch(() => {
        // 권한 없음 / 미존재 등 — 조용히 무시
      })
    return () => {
      cancelled = true
    }
  }, [deliveryId, enabled])

  // STOMP 실시간
  useEffect(() => {
    if (!enabled || !deliveryId) return
    const unsubscribe = subscribeStomp(SUBSCRIBE_TOPIC(deliveryId), (frame) => {
      try {
        const loc: DeliveryLocation = JSON.parse(frame.body)
        setLocation(loc)
      } catch (err) {
        console.error('delivery location parse error', err)
      }
    })
    return unsubscribe
  }, [deliveryId, enabled])

  return location
}
