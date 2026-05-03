// 공지 (Notice) 공개 API — 가이드 §10.9
//
// 관리자용 CRUD 는 features/admin/api.ts 의 notices 사용.
import api from '@/shared/api/axios'
import type { PageResponse } from '@/shared/types'
import type { Notice, NoticeType } from '@/features/admin/types'

export const noticeApi = {
  list: (params?: { type?: NoticeType; page?: number; size?: number }) =>
    api.get<PageResponse<Notice>>('/api/v1/notices', { params }),

  // 단건 조회 — viewCount 자동 +1
  detail: (id: number) =>
    api.get<Notice>(`/api/v1/notices/${id}`),
}

export type { Notice, NoticeType }
