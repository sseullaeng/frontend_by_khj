// 거래대행(Escrow) API — 백엔드 spec 5/11 라운드 정합
import api from '@/shared/api/axios'
import type { PageResponse } from '@/shared/types'
import type {
  EscrowApplication,
  EscrowApplicationCreateRequest,
  EscrowApplicationStatus,
  EscrowCancelRequest,
  EscrowFeeSettings,
  EscrowFeeSettingsPatchResponse,
  EscrowFeeSettingsRequest,
  EscrowInternalApplicationRequest,
  EscrowLink,
  EscrowPreviewRequest,
  EscrowPreviewResponse,
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

    // 라운드12 PR #102 — 수수료/배달비 미리보기 (폼 작성 중 실시간 호출)
    preview: (body: EscrowPreviewRequest) =>
      api.post<EscrowPreviewResponse>('/api/v1/escrow/applications/preview', body),

    // 라운드12 PR #105 — 채팅방 내부 신청 (판매자만, link 흐름과 분리)
    createInternal: (body: EscrowInternalApplicationRequest) =>
      api.post<EscrowApplication>('/api/v1/escrow/applications/internal', body),

    listMine: (params?: { status?: EscrowApplicationStatus; page?: number; size?: number }) =>
      api.get<PageResponse<EscrowApplication>>('/api/v1/escrow/applications/me', { params }),

    detail: (id: number) =>
      api.get<EscrowApplication>(`/api/v1/escrow/applications/${id}`),

    cancel: (id: number, body: EscrowCancelRequest) =>
      api.patch<EscrowApplication>(`/api/v1/escrow/applications/${id}/cancel`, body),

    confirmReceipt: (id: number) =>
      api.post<EscrowApplication>(`/api/v1/escrow/applications/${id}/confirm-receipt`),
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
