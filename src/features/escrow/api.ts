// 거래대행(Escrow) API — 백엔드 spec 5/11 라운드 정합
import api from '@/shared/api/axios'
import type { PageResponse } from '@/shared/types'
import type {
  EscrowApplication,
  EscrowApplicationCreateRequest,
  EscrowApplicationStatus,
  EscrowBuyerInfoPatch,
  EscrowByLinkRequest,
  EscrowCancelRequest,
  EscrowDraftRequest,
  EscrowFeeSettings,
  EscrowFeeSettingsPatchResponse,
  EscrowFeeSettingsRequest,
  EscrowInternalApplicationRequest,
  EscrowLink,
  EscrowPaymentPreview,
  EscrowPreviewRequest,
  EscrowPreviewResponse,
  EscrowSellerInfoPatch,
  EscrowStartRequest,
} from './types'

export const escrowApi = {
  // ── 사용자 ────────────────────────────────────────────────────────────
  links: {
    create: (body: EscrowStartRequest) =>
      api.post<EscrowLink>('/api/v1/escrow/links', body),

    detail: (linkToken: string) =>
      api.get<EscrowLink>(`/api/v1/escrow/links/${linkToken}`),
  },

  applications: {
    create: (body: EscrowApplicationCreateRequest) =>
      api.post<EscrowApplication>('/api/v1/escrow/applications', body),

    // 라운드13 PR #130 — 외부 link 분리 입력. 수신자가 본인 영역만 채워 신청.
    //   link 응답의 발급자 영역과 백엔드가 머지해서 application 생성.
    createByLink: (body: EscrowByLinkRequest) =>
      api.post<EscrowApplication>('/api/v1/escrow/applications/by-link', body),

    // 라운드12 PR #102 — 수수료/배달비 미리보기 (폼 작성 중 실시간 호출)
    preview: (body: EscrowPreviewRequest) =>
      api.post<EscrowPreviewResponse>('/api/v1/escrow/applications/preview', body),

    // 라운드12 PR #105 — 채팅방 내부 신청 (한 번에 입력, deprecated 권장)
    createInternal: (body: EscrowInternalApplicationRequest) =>
      api.post<EscrowApplication>('/api/v1/escrow/applications/internal', body),

    // 라운드12 PR-B-4 #108 — 판매자 draft 생성 (판매자 영역만)
    createDraft: (body: EscrowDraftRequest) =>
      api.post<EscrowApplication>('/api/v1/escrow/applications/internal/draft', body),

    // 라운드12 PR-B-4 — 판매자 영역 수정 (정보입력대기 상태만)
    patchSellerInfo: (id: number, body: EscrowSellerInfoPatch) =>
      api.patch<EscrowApplication>(`/api/v1/escrow/applications/${id}/seller-info`, body),

    // 라운드12 PR-B-4 — 구매자 영역 입력 (양쪽 filled 시 자동 결제대기 전환)
    patchBuyerInfo: (id: number, body: EscrowBuyerInfoPatch) =>
      api.patch<EscrowApplication>(`/api/v1/escrow/applications/${id}/buyer-info`, body),

    // 라운드12 PR-B-5 #110 — 본인 share 포인트 결제. 양쪽 결제 완료 시 자동 라이더 매칭.
    pay: (id: number) =>
      api.post<{ status: EscrowApplicationStatus }>(`/api/v1/escrow/applications/${id}/pay`),

    // 라운드13 PR #119 — 본인 share 결제 미리보기. /pay 호출 직전 사용.
    //   응답으로 myShare/myBalance/deficit/canPay/alreadyPaid 한 번에 조회.
    paymentPreview: (id: number) =>
      api.get<EscrowPaymentPreview>(`/api/v1/escrow/applications/${id}/payment-preview`),

    listMine: (params?: { status?: EscrowApplicationStatus; page?: number; size?: number }) =>
      api.get<PageResponse<EscrowApplication>>('/api/v1/escrow/applications/me', { params }),

    detail: (id: number) =>
      api.get<EscrowApplication>(`/api/v1/escrow/applications/${id}`),

    cancel: (id: number, body: EscrowCancelRequest) =>
      api.patch<EscrowApplication>(`/api/v1/escrow/applications/${id}/cancel`, body),

    confirmReceipt: (id: number) =>
      api.post<EscrowApplication>(`/api/v1/escrow/applications/${id}/confirm-receipt`),

    // 라운드13 PR #131 — 판매자 인계 마킹 (타임스탬프만 기록, 상태 머신 영향 X)
    //   조건: 진행중 + seller. 멱등.
    confirmHandover: (id: number) =>
      api.post<EscrowApplication>(`/api/v1/escrow/applications/${id}/confirm-handover`),
  },

  // ── 관리자 ────────────────────────────────────────────────────────────
  admin: {
    listApplications: (params?: { status?: EscrowApplicationStatus; page?: number; size?: number }) =>
      api.get<PageResponse<EscrowApplication>>('/api/v1/admin/escrow/applications', { params }),

    detailApplication: (id: number) =>
      api.get<EscrowApplication>(`/api/v1/admin/escrow/applications/${id}`),

    getFeeSettings: () =>
      api.get<EscrowFeeSettings>('/api/v1/admin/escrow/fee-settings'),

    patchFeeSettings: (body: EscrowFeeSettingsRequest) =>
      api.patch<EscrowFeeSettingsPatchResponse>('/api/v1/admin/escrow/fee-settings', body),
  },
}
