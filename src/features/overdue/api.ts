// 연체(Overdue) API — 라운드14 백엔드 spec
import api from '@/shared/api/axios'
import type { PageResponse } from '@/shared/types'
import type {
  AdminOverdueListParams,
  MyOverdueDebt,
  OverdueLegalActionPatch,
  OverdueRecord,
  OverdueResolvePatch,
} from './types'

export const overdueApi = {
  // ── 본인 영역 ───────────────────────────────────────────────────────
  me: {
    /** 진행 중 + 최근 정산 record 목록 — 최신순 */
    list: () => api.get<OverdueRecord[]>('/api/v1/users/me/overdue'),
    /** 누적 채무 합계 */
    debt: () => api.get<MyOverdueDebt>('/api/v1/users/me/overdue-debt'),
  },

  // ── 관리자 영역 (PR②에서 사용) ─────────────────────────────────────
  admin: {
    list: (params?: AdminOverdueListParams) =>
      api.get<PageResponse<OverdueRecord>>('/api/v1/admin/overdue', { params }),
    detail: (id: number) =>
      api.get<OverdueRecord>(`/api/v1/admin/overdue/${id}`),
    patchLegalAction: (id: number, body: OverdueLegalActionPatch) =>
      api.patch<OverdueRecord>(`/api/v1/admin/overdue/${id}/legal-action`, body),
    resolve: (id: number, body?: OverdueResolvePatch) =>
      api.patch<OverdueRecord>(`/api/v1/admin/overdue/${id}/resolve`, body ?? {}),
    recompute: (id: number) =>
      api.post<OverdueRecord>(`/api/v1/admin/overdue/${id}/recompute`),
  },
}
