// 고객지원 훅 — 라운드7
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supportApi } from './api'
import type {
  InquiryCreateRequest,
  InquiryReplyRequest,
  InquiryStatus,
  InquiryStatusRequest,
  SupportPostType,
  SupportPostUpsertRequest,
} from './types'

// ── 쿼리 키 ─────────────────────────────────────────────────
export const supportKeys = {
  all:                ()                                 => ['support'] as const,
  myInquiries:        (status?: InquiryStatus, page = 0) => [...supportKeys.all(), 'my', status ?? 'ALL', page] as const,
  inquiryDetail:      (id: number)                       => [...supportKeys.all(), 'inquiry', id] as const,
  posts:              (type: SupportPostType, category?: string, page = 0) =>
                                                            [...supportKeys.all(), 'posts', type, category ?? 'ALL', page] as const,
  postDetail:         (id: number)                       => [...supportKeys.all(), 'post', id] as const,
  adminInquiries:     (status?: InquiryStatus, page = 0) => [...supportKeys.all(), 'admin', 'inquiries', status ?? 'ALL', page] as const,
  adminInquiryDetail: (id: number)                       => [...supportKeys.all(), 'admin', 'inquiry', id] as const,
}

// ── 사용자: 1:1 문의 ────────────────────────────────────────
export function useMyInquiries(params?: { status?: InquiryStatus; page?: number; size?: number }) {
  return useQuery({
    queryKey: supportKeys.myInquiries(params?.status, params?.page),
    queryFn: () => supportApi.inquiries.listMine(params).then((r) => r.data),
  })
}

export function useInquiryDetail(id: number | undefined) {
  return useQuery({
    queryKey: supportKeys.inquiryDetail(id ?? 0),
    queryFn: () => supportApi.inquiries.detail(id!).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateInquiry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: InquiryCreateRequest) =>
      supportApi.inquiries.create(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.all() })
      toast.success('문의를 등록했어요.')
    },
  })
}

export function useDeleteMyInquiry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => supportApi.inquiries.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.all() })
      toast.success('문의를 삭제했어요.')
    },
  })
}

// ── 공개: FAQ / QNA 게시글 ─────────────────────────────────
export function useSupportPosts(params: { type: SupportPostType; category?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: supportKeys.posts(params.type, params.category, params.page),
    queryFn: () => supportApi.posts.list(params).then((r) => r.data),
  })
}

export function useSupportPostDetail(id: number | undefined) {
  return useQuery({
    queryKey: supportKeys.postDetail(id ?? 0),
    queryFn: () => supportApi.posts.detail(id!).then((r) => r.data),
    enabled: !!id,
  })
}

// ── 관리자: 1:1 문의 ──────────────────────────────────────
export function useAdminInquiries(params?: { status?: InquiryStatus; page?: number; size?: number }) {
  return useQuery({
    queryKey: supportKeys.adminInquiries(params?.status, params?.page),
    queryFn: () => supportApi.adminInquiries.list(params).then((r) => r.data),
  })
}

export function useAdminInquiryDetail(id: number | undefined) {
  return useQuery({
    queryKey: supportKeys.adminInquiryDetail(id ?? 0),
    queryFn: () => supportApi.adminInquiries.detail(id!).then((r) => r.data),
    enabled: !!id,
  })
}

export function useReplyInquiry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: InquiryReplyRequest }) =>
      supportApi.adminInquiries.reply(id, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.all() })
      toast.success('답변을 등록했어요.')
    },
  })
}

export function useUpdateInquiryStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: InquiryStatusRequest }) =>
      supportApi.adminInquiries.setStatus(id, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.all() })
      toast.success('상태를 변경했어요.')
    },
  })
}

export function useDeleteAdminInquiry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => supportApi.adminInquiries.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.all() })
      toast.success('문의를 삭제했어요.')
    },
  })
}

// ── 관리자: FAQ / QNA 게시글 ──────────────────────────────
export function useCreateSupportPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SupportPostUpsertRequest) =>
      supportApi.adminPosts.create(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.all() })
      toast.success('게시글을 등록했어요.')
    },
  })
}

export function useUpdateSupportPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: SupportPostUpsertRequest }) =>
      supportApi.adminPosts.update(id, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.all() })
      toast.success('수정됐어요.')
    },
  })
}

export function useDeleteSupportPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => supportApi.adminPosts.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.all() })
      toast.success('게시글을 삭제했어요.')
    },
  })
}
