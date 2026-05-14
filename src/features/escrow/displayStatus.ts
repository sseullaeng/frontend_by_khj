// 거래대행 통합 표시 상태 (라운드13 — 2-G)
//
// 백엔드 Escrow status + Delivery sub-status 를 합쳐 사용자에게 7단계 라벨로 노출.
//   - sub-status 는 GET /api/v1/deliveries/{deliveryId} 에서 조회 (escrow.deliveryId 필요)
//   - /escrow/applications/me 페이징 응답은 deliveryId=null 이라 sub-status 미상 → '매칭중' fallback
//
// 매핑 (백엔드 spec):
//   Escrow.정보입력대기                            → 신청중
//   Escrow.결제대기 + 결제완료                      → 신청완료
//   Escrow.진행중 + Delivery.대기                  → 매칭중
//   Escrow.진행중 + Delivery.매칭                  → 픽업중
//   Escrow.진행중 + Delivery.픽업완료 + 배달중      → 배달중
//   Escrow.사용중                                  → 사용중
//   Escrow.반납중                                  → 반납중
//   Escrow.취소대기                                → 취소대기
//   Escrow.완료                                    → 완료
//   Escrow.취소                                    → 취소
import type { EscrowApplicationStatus } from './types'

export type EscrowDisplayStatus =
  | '신청중'
  | '신청완료'
  | '매칭중'
  | '픽업중'
  | '배달중'
  | '사용중'
  | '반납중'
  | '취소대기'
  | '완료'
  | '취소'

// Delivery sub-status — 백엔드 spec 의 4단계 + 기존 standalone delivery enum 도 안전 매핑
//   "모집중" → 대기 / "수락" → 매칭 / "배송중" → 배달중 으로 호환 매핑
const SUB_LABEL_MAP: Record<string, EscrowDisplayStatus> = {
  '대기':     '매칭중',
  '모집중':   '매칭중',
  '매칭':     '픽업중',
  '수락':     '픽업중',
  '픽업완료': '배달중',
  '배달중':   '배달중',
  '배송중':   '배달중',
}

export function getEscrowDisplayStatus(
  escrowStatus: EscrowApplicationStatus,
  deliverySubStatus?: string | null,
): EscrowDisplayStatus {
  switch (escrowStatus) {
    case '정보입력대기': return '신청중'
    case '결제대기':
    case '결제완료':     return '신청완료'
    case '사용중':       return '사용중'
    case '반납중':       return '반납중'
    case '취소대기':     return '취소대기'
    case '완료':         return '완료'
    case '취소':         return '취소'
    case '진행중': {
      if (!deliverySubStatus) return '매칭중'
      return SUB_LABEL_MAP[deliverySubStatus] ?? '매칭중'
    }
  }
}

// UI 보조 — 라벨별 색상/아이콘은 호출부에서 결정 (lucide 의존성 회피)
export const ESCROW_DISPLAY_COLOR: Record<EscrowDisplayStatus, string> = {
  '신청중':   'text-gray-600 bg-gray-100',
  '신청완료': 'text-blue-600 bg-blue-100',
  '매칭중':   'text-amber-600 bg-amber-100',
  '픽업중':   'text-orange-600 bg-orange-100',
  '배달중':   'text-purple-600 bg-purple-100',
  '사용중':   'text-sky-700 bg-sky-100',
  '반납중':   'text-orange-700 bg-orange-100',
  '취소대기': 'text-red-700 bg-red-50',
  '완료':     'text-emerald-600 bg-emerald-100',
  '취소':     'text-red-600 bg-red-100',
}
