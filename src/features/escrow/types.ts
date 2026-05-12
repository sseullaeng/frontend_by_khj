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
  | '정보입력대기'   // 라운드12 PR-B-4 — draft 단계 (양쪽 입력 전)
  | '결제대기'
  | '결제완료'
  | '진행중'
  | '완료'
  | '취소'

// 옵션 키 — 라운드12 PR-B 부터 EscrowWeightCode / VolumeCode / FragilityCode 와 통일
//   (옛 소문자 enum 사용처는 새 대문자 enum 으로 일괄 정합)
export type WeightKey    = EscrowWeightCode
export type VolumeKey    = EscrowVolumeCode
export type FragilityKey = EscrowFragilityCode

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
  // 라운드13 PR #126 — 정보입력대기/draft 단계는 fee 미산정 → null.
  //   양쪽 영역 채워지면 백엔드가 계산해서 채움.
  appliedDeliveryFee:    number | null
  appliedCommissionFee:  number | null
  appliedTotalFee:       number | null
  appliedCommissionRate: number | null
  appliedDistanceKm:     number | null
  // feePayer="both" 일 때 백엔드가 자동 계산. draft 단계는 null.
  initiatorShare: number | null
  receiverShare:  number | null
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

  // 라운드12 PR-B-2/B-4 — 신규 필드
  entryType?: EscrowEntryType        // INTERNAL = 채팅방 흐름 / EXTERNAL = 외부 link
  chatRoomId?: number | null         // INTERNAL 흐름만 값. EXTERNAL=null
  sellerInfoFilled?: boolean
  buyerInfoFilled?: boolean
  receiverPhone?: string | null      // PATCH /buyer-info 에서 채워짐

  // 라운드13 PR #121 — 매칭된 배달 id. 단건 조회 응답에만 채워짐.
  //   미매칭/미생성 시 null. /me 페이징 응답은 N+1 회피로 항상 null.
  //   sub-status 필요 시 GET /deliveries/{deliveryId} 호출.
  deliveryId?: number | null

  // 라운드13 PR #131 — 판매자 인계 마킹 시각 (멱등 endpoint, 한 번 누르면 채워짐)
  handoverConfirmedBySellerAt?: string | null

  createdAt: string
  updatedAt: string
}

export interface EscrowCancelRequest {
  reason?: string
}

// ── 라운드12 PR-B — 채팅방 내부 거래대행 흐름 (preview / draft / buyer-info / pay) ───
// 백엔드 spec PR #102 ~ #110 정합
//   ⚠ 라운드13 정정 — Jackson 매칭이 소문자 code 기반. 대문자로 보내면 400.
//   weight    : lt1 / 1to3 / 3to5 / 5to10 / over10  (라운드13 PR #130: gt10 → over10)
//   volume    : s / m / l
//   fragility : f1 ~ f5
export type EscrowWeightCode    = 'lt1' | '1to3' | '3to5' | '5to10' | 'over10'
export type EscrowVolumeCode    = 's' | 'm' | 'l'
export type EscrowFragilityCode = 'f1' | 'f2' | 'f3' | 'f4' | 'f5'

// EscrowApplicationResponse — 라운드 12 신규 필드 (entryType / chatRoomId / *Filled / receiverPhone)
//   기존 EscrowApplication 인터페이스에 옵셔널로 추가 — 외부 link 흐름은 chatRoomId=null
export type EscrowEntryType = 'INTERNAL' | 'EXTERNAL'

// 수수료/배달비 미리보기 (POST /escrow/applications/preview)
export interface EscrowPreviewRequest {
  tradeMode: TradeMode
  itemPrice: number
  pickupLat: number
  pickupLng: number
  deliveryLat: number
  deliveryLng: number
  weight:    EscrowWeightCode
  volume:    EscrowVolumeCode    // PR #102 spec — 정합 누락 픽스
  fragility: EscrowFragilityCode
  feePayer:  FeePayer
}

export interface EscrowPreviewResponse {
  distanceKm:     number
  deliveryFee:    number
  commissionFee:  number
  totalFee:       number
  buyerPayable:   number   // BOTH=50%, BUYER 단독=전액(+itemPrice), SELLER 단독=0
  sellerPayable:  number
  commissionRate: number
}

// ── PR-B-4: 입력 분리 흐름 ─────────────────────────────────────────────

// 판매자 draft 생성 (POST /escrow/applications/internal/draft) — 판매자만
//   기존 internal 과 다른 점: delivery 좌표 없음 (구매자가 buyer-info 에서 입력)
export interface EscrowDraftRequest {
  chatRoomId:      number
  itemId:          number
  tradeMode:       TradeMode
  feePayer:        FeePayer
  itemPrice:       number
  itemDescription: string

  pickupAddress: string
  pickupLat:     number
  pickupLng:     number

  weight:    EscrowWeightCode
  volume:    EscrowVolumeCode
  fragility: EscrowFragilityCode
  deliveryNotes?: string
  imageUrls?: string[]
}

// 판매자 영역 수정 (PATCH /seller-info) — 정보입력대기 상태에서만
export interface EscrowSellerInfoPatch {
  pickupAddress:   string
  pickupLat:       number
  pickupLng:       number
  weight:          EscrowWeightCode
  volume:          EscrowVolumeCode
  fragility:       EscrowFragilityCode
  itemPrice:       number
  itemDescription: string
  deliveryNotes?:  string
}

// 구매자 영역 입력 (PATCH /buyer-info) — 양쪽 filled 시 자동 결제대기 전환
export interface EscrowBuyerInfoPatch {
  deliveryAddress: string
  deliveryLat:     number
  deliveryLng:     number
  receiverPhone:   string   // 010-1234-5678 / +82-... 형식 자유, max 20
}

// 라운드13 PR #119 — 본인 share 결제 미리보기 (GET /payment-preview)
//   /pay 호출 직전에 호출. deficit > 0 이면 충전 UI 유도.
export interface EscrowPaymentPreview {
  applicationId: number
  myShare:       number    // 내가 결제해야 할 총 금액 (item + fee 본인 부담)
  myBalance:     number    // 현재 잔액
  deficit:       number    // max(0, myShare - myBalance)
  canPay:        boolean   // myBalance >= myShare && !alreadyPaid
  alreadyPaid:   boolean
  // 백엔드 LocalDateTime — offset 없음 ("2026-05-12T18:00:00"). KST 기준.
  //   파싱 시 +09:00 명시 필요 (브라우저 로컬 TZ 와 다를 수 있음).
  paymentDueAt:  string | null
}

// ── 채팅방 내부 신청 (POST /escrow/applications/internal) — 한 번에 입력 (deprecated 권장) ──
export interface EscrowInternalApplicationRequest {
  chatRoomId: number
  itemId:     number
  tradeMode:  'INTERNAL'
  feePayer:   FeePayer
  itemPrice:  number
  itemDescription: string

  pickupAddress:   string
  pickupLat:       number
  pickupLng:       number
  deliveryAddress: string
  deliveryLat:     number
  deliveryLng:     number

  weight:    EscrowWeightCode
  volume:    EscrowVolumeCode
  fragility: EscrowFragilityCode
  deliveryNotes?: string

  // preview 결과 그대로 전달 (백엔드 ±10원 검증)
  submittedDeliveryFee:   number
  submittedCommissionFee: number
  submittedTotalFee:      number
  submittedDistanceKm:    number

  imageUrls: string[]
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
