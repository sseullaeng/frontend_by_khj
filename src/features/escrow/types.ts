// 거래대행(Escrow) 도메인 타입 — 백엔드 spec 5/11 라운드 정합
//
// 흐름:
//   신청자 → POST /escrow/links (linkToken 발급)
//   ↓ 링크 공유
//   수신자 진입 → GET /escrow/links/{linkToken}
//   ↓ 폼 작성
//   POST /escrow/applications (atomic claim)
//   ↓ 양쪽 결제 (POST /payments/charge with escrowApplicationId)
//   진행 → 완료 (Mode B: confirm-receipt)
import { z } from 'zod'

// ── enum ────────────────────────────────────────────────────────────────

export type EscrowRole = 'buyer' | 'seller'
export type FeePayer = 'buyer' | 'seller' | 'both'
export type TradeMode = 'INTERNAL' | 'EXTERNAL'

// 백엔드 status 한글 enum
export type EscrowLinkStatus = '대기' | '확정' | '만료'
export type EscrowApplicationStatus =
  | '결제대기'
  | '결제완료'
  | '진행중'
  | '완료'
  | '취소'

// 옵션 키 — 백엔드 admin fee_settings multipliers 키와 일치
export type WeightKey = 'lt1' | '1to3' | '3to5' | '5to10' | 'gt10'
export type VolumeKey = 's' | 'm' | 'l'
export type FragilityKey = 'f1' | 'f2' | 'f3' | 'f4' | 'f5'

// ── Link ────────────────────────────────────────────────────────────────

export interface EscrowLink {
  id: number
  linkToken: string                  // UUID v4 — URL 토큰
  initiatorId: number
  initiatorNickname: string
  initiatorRole: EscrowRole
  feePayer: FeePayer
  tradeMode: TradeMode
  status: EscrowLinkStatus
  expiresAt: string                  // 24h 후
  createdAt: string
}

// 신청자 시작 폼 (POST /escrow/links)
export const escrowStartSchema = z.object({
  role:      z.enum(['buyer', 'seller'],          { errorMap: () => ({ message: '역할을 선택해 주세요.' }) }),
  feePayer:  z.enum(['buyer', 'seller', 'both'],  { errorMap: () => ({ message: '수수료 부담을 선택해 주세요.' }) }),
  tradeMode: z.enum(['INTERNAL', 'EXTERNAL'],     { errorMap: () => ({ message: '거래 모드를 선택해 주세요.' }) }),
})
export type EscrowStartRequest = z.infer<typeof escrowStartSchema>

// ── Application (신청서) ────────────────────────────────────────────────

export interface EscrowApplicationCreateRequest {
  linkToken: string
  itemPrice: number                  // INTERNAL > 0, EXTERNAL = 0
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  deliveryAddress: string
  deliveryLat: number
  deliveryLng: number
  weight: WeightKey
  volume: VolumeKey
  fragility: FragilityKey
  deliveryNotes?: string
  // 프론트 calcFees 결과 (백엔드 ±10원 검증)
  deliveryFee: number
  commissionFee: number
  totalFee: number
  distanceKm: number
  imageUrls: string[]                // S3 업로드 후 URL
}

export interface EscrowApplication {
  id: number
  linkId: number
  buyerId: number
  sellerId: number
  feePayer: FeePayer
  tradeMode: TradeMode
  itemPrice: number
  appliedDeliveryFee: number
  appliedCommissionFee: number
  appliedTotalFee: number
  appliedCommissionRate: number
  appliedDistanceKm: number
  // feePayer="both" 일 때 백엔드가 자동 계산
  initiatorShare: number
  receiverShare: number
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  deliveryAddress: string
  deliveryLat: number
  deliveryLng: number
  weight: WeightKey
  volume: VolumeKey
  fragility: FragilityKey
  deliveryNotes: string | null
  imageUrls: string[]
  status: EscrowApplicationStatus
  createdAt: string
  updatedAt: string
}

export interface EscrowCancelRequest {
  reason?: string
}

// ── Admin fee settings ──────────────────────────────────────────────────

export interface EscrowFeeSettings {
  commissionRate: number
  fuelPricePerL: number
  baseFuelPrice: number
  // 오토바이
  baseDeliveryFee: number
  baseKmRate: number
  fuelEfficiency: number
  minDeliveryFee: number
  // 용달차
  truckBaseDeliveryFee: number
  truckBaseKmRate: number
  truckFuelEfficiency: number
  truckMinDeliveryFee: number
  updatedAt: string
  updatedBy: number | null
}

export type EscrowFeeSettingsRequest = Omit<EscrowFeeSettings, 'updatedAt' | 'updatedBy'>

export interface EscrowFeeSettingsPatchResponse {
  settings: EscrowFeeSettings
  inProgressCount: number
  message: string
}
