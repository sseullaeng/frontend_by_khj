// 결제·포인트·출금 도메인 타입 — 백엔드 spec 정합

// ── 결제 ────────────────────────────────────────────────────────────────────

// 결제 시작 응답 (가이드 §6 ChargeStartResponse)
export interface PaymentStartResponse {
  paymentId: number
  merchantUid: string // 토스 requestPayment 의 orderId
  amount: number
  tossClientKey: string // 프론트 SDK 초기화에 사용 (env 대신)
}

// 결제 확정 요청 — 토스 successUrl 콜백 → 백엔드로 그대로 전달
export interface PaymentConfirmRequest {
  paymentKey: string
  orderId: string // = merchantUid
  amount: number
  // 라운드9: escrow 결제일 때만 (백엔드가 application status 자동 갱신)
  escrowApplicationId?: number
}

// 결제 종류 (한글 enum)
export type PaymentType = '충전' | '거래' | '배달'

// 결제 수단 (한글 enum)
export type PaymentMethod = '카드' | '가상계좌' | '계좌이체' | '휴대폰' | '토스페이' | string // 토스 SDK 응답에 따라 추가될 수 있음

// 결제 상태 (한글 enum)
export type PaymentStatus =
  | '대기'
  | '진행중'
  | '완료'
  | '실패'
  | '환불진행중'
  | '환불완료'
  | '환불실패'

// 결제 단건 응답
export interface PaymentResponse {
  id: number
  userId: number
  transactionId: number | null // 충전형은 항상 null. 거래/배달일 때만 값
  paymentType: PaymentType
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  merchantUid: string
  paidAt: string | null // 완료 시점 (status=완료 일 때만 값)
  createdAt: string
}

// ── 포인트 잔액 / 내역 ──────────────────────────────────────────────────────

// 포인트 변동 종류 (한글 enum) — 라운드 11 (Tx-Hold) 추가: 거래보관/거래환불
export type PointHistoryType =
  | '충전'
  | '결제'
  | '판매정산'
  | '출금'
  | '환불'
  | '배달결제'
  | '배달정산'
  | '거래보관' // 라운드11: 예약 시 hold (음수)
  | '거래환불' // 라운드11: 취소 시 hold 환불 (양수)
  | '보증금보관'
  | '보증금반환'
  | '보증금환불'
  | '보증금차감'

// 변동 발생 도메인 식별자
export type PointReferenceType = 'PAYMENT' | 'TRANSACTION' | 'WITHDRAWAL' | 'DELIVERY' | 'REFUND'

// 포인트 내역 단건
export interface PointHistory {
  id: number
  type: PointHistoryType
  amount: number // ⚠️ 부호 포함 — 적립 +, 차감 -
  balanceAfter: number // 변동 직후 잔액 스냅샷
  referenceType: PointReferenceType
  referenceId: number
  description: string
  createdAt: string
}

// 포인트 잔액 (라운드 11) — GET /api/v1/users/me/point
//   balance      : 사용 가능 잔액 (충전 - 사용 - hold)
//   holdAmount   : 거래 보관 중 (예약된 거래의 hold 합계)
//   totalBalance : balance + holdAmount
export interface PointBalanceResponse {
  balance: number
  holdAmount: number
  totalBalance: number
}

// ── 출금 ────────────────────────────────────────────────────────────────────

// 출금 신청 요청
export interface WithdrawRequest {
  idempotencyKey: string // ≤ 64, 클라가 발급
  amount: number // ≥ 1
  bankName: string // 자유 문자열 (예: "신한"/"국민"/...) ≤ 50
  accountNumber: string
  accountHolder: string
}

// 출금 신청 상태
export type WithdrawalStatus =
  | '신청'
  | '승인'
  | '완료'
  | '거부'
  // legacy/user-side values kept for older responses and user withdrawal history.
  | '실패'
  | '취소'
  | '환불완료'
  // English aliases may appear during backend enum migration.
  | 'REQUESTED'
  | 'PENDING'
  | 'APPROVED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCELLED'
  | 'CANCELED'
  | 'REFUNDED'

// 출금 신청 단건
export interface Withdrawal {
  id: number
  userId?: number
  amount: number
  bankName: string
  accountNumber: string
  accountHolder: string
  status: WithdrawalStatus
  adminId?: number | null
  adminMemo?: string | null
  requestedAt?: string
  processedAt?: string | null
  createdAt: string
  updatedAt: string
}
