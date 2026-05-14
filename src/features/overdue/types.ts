// 연체(Overdue) 도메인 타입 — 라운드14 백엔드 spec 정합
//
// 흐름 요약:
//   대여 거래대행 반납 기한(rentalEndAt) 경과 → 연체 record 자동 생성
//   Phase 1 (D+1)  : 안내. 차감 시작.
//   Phase 2 (D+3)  : 보증금 일부 차감 누적.
//   Phase 3 (D+7)  : 보증금 소진 시작 → 누적 채무(extraDebt) 발생.
//   Phase 4 (D+14) : 계정 자동 정지 + 법적 조치 검토.
//
// 본인(사용자) endpoint :
//   GET /api/v1/users/me/overdue        진행 중 record 목록
//   GET /api/v1/users/me/overdue-debt   누적 채무 합계
// 관리자 endpoint:
//   GET    /api/v1/admin/overdue                 목록 (status/phase 필터)
//   GET    /api/v1/admin/overdue/{id}            상세
//   PATCH  /api/v1/admin/overdue/{id}/legal-action  법적 조치 단계 갱신
//   PATCH  /api/v1/admin/overdue/{id}/resolve       강제 종료(정산)
//   POST   /api/v1/admin/overdue/{id}/recompute     재계산 (반납 확인 후 동기화)

export type OverduePhase = 'PHASE_1' | 'PHASE_2' | 'PHASE_3' | 'PHASE_4'

export type OverdueStatus = '진행중' | '정산완료' | '법적조치중' | '종료'

export type OverdueLegalAction = 'NONE' | '내용증명' | '분쟁조정' | '소송제기'

// 백엔드 OverdueRecord 응답 (사용자/관리자 공통 — 관리자에는 PII 더 채워질 수 있음)
export interface OverdueRecord {
  id: number
  escrowApplicationId: number
  buyerId: number
  sellerId: number

  depositAmount: number             // 거래 시점 보증금 (절대값)
  depositForfeitedAmount: number    // 누적 차감된 보증금
  extraDebtAmount: number           // 보증금 소진 후 누적 채무
  remainingDeposit: number          // depositAmount - depositForfeitedAmount

  overdueDays: number
  phase: OverduePhase
  status: OverdueStatus
  legalAction: OverdueLegalAction

  rentalEndAt: string               // 원래 반납 기한
  overdueStartedAt: string          // 연체 시작 시각
  accountSuspendedAt: string | null // PHASE_4 진입 시 계정 정지 시각
  resolvedAt: string | null
  resolutionNote: string | null

  createdAt: string
  updatedAt: string
}

// /users/me/overdue-debt 응답
export interface MyOverdueDebt {
  totalDebt: number                // 진행 중 record 의 extraDebtAmount 합계
  activeRecordCount: number
}

// ── 관리자 목록 쿼리 파라미터 ────────────────────────────────────────────
export interface AdminOverdueListParams {
  status?: OverdueStatus
  phase?: OverduePhase
  legalAction?: OverdueLegalAction
  page?: number
  size?: number
}

// 법적 조치 패치 body
export interface OverdueLegalActionPatch {
  legalAction: OverdueLegalAction
  memo?: string
}

// 강제 종료(정산) 패치 body
export interface OverdueResolvePatch {
  note?: string
}
