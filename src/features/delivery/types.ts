// 배달대행 (Delivery) 도메인 — 가이드 §10.13
//
// ⚠️ Item / Transaction 과 완전 독립. itemDescription 은 자유 텍스트.
// 상태값 모두 한글: 모집중 | 수락 | 배송중 | 배송완료 | 정산완료 | 취소

export type DeliveryStatus =
  | '모집중'
  | '수락'
  | '배송중'
  | '배송완료'
  | '정산완료'
  | '취소'

export interface Delivery {
  id: number
  requesterId: number
  requesterNickname: string | null
  riderId: number | null         // 수락 후 채워짐
  riderNickname: string | null
  pickupAddress: string
  dropoffAddress: string
  itemDescription: string         // 자유 텍스트
  fee: number                     // 라이더 수수료 (원)
  requestedDeadline: string | null
  memo: string | null
  status: DeliveryStatus
  requestedAt: string
  acceptedAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  completedAt: string | null
  canceledAt: string | null
  cancelReason: string | null
}

export interface DeliveryCreateRequest {
  pickupAddress: string           // 필수 ≤255
  dropoffAddress: string          // 필수 ≤255
  itemDescription: string         // 필수 ≤255 (자유 텍스트)
  fee: number                     // 필수 > 0
  requestedDeadline?: string      // optional, 미래 시각
  memo?: string                   // optional ≤500
}

export interface DeliveryListParams {
  page?: number
  size?: number
}

export interface DeliveryCancelRequest {
  reason?: string
}

// ── 실시간 위치 (가이드 §10.13 라운드6) ──────────────────────────────────
//   Rider:    publish → /app/delivery/{id}/location  (1초 미만 재호출 X, 한국 범위 안)
//   Requester: subscribe → /topic/delivery/{id}/location
//   REST fallback: GET /api/v1/deliveries/{id}/location/last (TTL 30분)
export interface DeliveryLocation {
  latitude: number               // 33~39 (한국 범위)
  longitude: number              // 124~132
  accuracyM?: number             // 정확도 (미터, optional)
  recordedAt: string             // Instant (UTC offset)
}
