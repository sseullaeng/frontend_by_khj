// 고객지원 API — 가이드 §10.14 / §11.8 / §11.9 (라운드7)
import api from '@/shared/api/axios'
import type { PageResponse } from '@/shared/types'
import type {
  Inquiry,
  InquiryCreateRequest,
  InquiryReplyRequest,
  InquiryStatus,
  InquiryStatusRequest,
  SupportPost,
  SupportPostType,
  SupportPostUpsertRequest,
} from './types'

export const supportApi = {
  // ── 사용자 — 1:1 문의 ───────────────────────────────────────
  inquiries: {
    create: (body: InquiryCreateRequest) =>
      api.post<number>('/api/v1/support/inquiries', body),

    listMine: (params?: { status?: InquiryStatus; page?: number; size?: number }) =>
      api.get<PageResponse<Inquiry>>('/api/v1/support/inquiries/me', { params }),

    detail: (id: number) =>
      api.get<Inquiry>(`/api/v1/support/inquiries/${id}`),

    remove: (id: number) =>
      api.delete<void>(`/api/v1/support/inquiries/${id}`),
  },

  // ── 공개 — FAQ / QNA 게시글 ────────────────────────────────
  posts: {
    list: (params: { type: SupportPostType; category?: string; page?: number; size?: number }) =>
      api.get<PageResponse<SupportPost>>('/api/v1/support/posts', { params }),

    detail: (id: number) =>
      api.get<SupportPost>(`/api/v1/support/posts/${id}`),
  },

  // ── 관리자 — 1:1 문의 ───────────────────────────────────────
  adminInquiries: {
    list: (params?: { status?: InquiryStatus; page?: number; size?: number }) =>
      api.get<PageResponse<Inquiry>>('/api/v1/admin/inquiries', { params }),

    detail: (id: number) =>
      api.get<Inquiry>(`/api/v1/admin/inquiries/${id}`),

    reply: (id: number, body: InquiryReplyRequest) =>
      api.patch<Inquiry>(`/api/v1/admin/inquiries/${id}/reply`, body),

    setStatus: (id: number, body: InquiryStatusRequest) =>
      api.patch<Inquiry>(`/api/v1/admin/inquiries/${id}/status`, body),

    remove: (id: number) =>
      api.delete<void>(`/api/v1/admin/inquiries/${id}`),
  },

  // ── 관리자 — FAQ / QNA 게시글 ──────────────────────────────
  adminPosts: {
    create: (body: SupportPostUpsertRequest) =>
      api.post<number>('/api/v1/admin/support/posts', body),

    update: (id: number, body: SupportPostUpsertRequest) =>
      api.put<SupportPost>(`/api/v1/admin/support/posts/${id}`, body),

    remove: (id: number) =>
      api.delete<void>(`/api/v1/admin/support/posts/${id}`),
  },
}
