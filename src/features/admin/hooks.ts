// 관리자 hooks — 가이드 §11
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from './api'
import type {
  AdminLoginRequest,
  AdminReportPatchRequest,
  AdminReportStatus,
  AdminWithdrawalPatchRequest,
  BannerUpsertRequest,
  NoticeType,
  NoticeUpsertRequest,
} from './types'
import type { WithdrawalStatus } from '@/features/payment/types'
import type { AdminTransactionSearchParams } from './api'
import { BusinessError } from '@/shared/types'
import { getErrorMessage } from '@/shared/lib/errorMessages'

export const adminKeys = {
  all:        ()                                 => ['admin'] as const,
  dashboard:  ()                                 => [...adminKeys.all(), 'dashboard'] as const,
  users:      (page = 0, size = 20)              => [...adminKeys.all(), 'users', page, size] as const,
  user:       (id: number)                       => [...adminKeys.all(), 'user', id] as const,
  banners:    (page = 0, size = 20)              => [...adminKeys.all(), 'banners', page, size] as const,
  banner:     (id: number)                       => [...adminKeys.all(), 'banner', id] as const,
  notices:    (type?: NoticeType, page = 0)      => [...adminKeys.all(), 'notices', type ?? 'all', page] as const,
  notice:     (id: number)                       => [...adminKeys.all(), 'notice', id] as const,
  reports:    (status?: AdminReportStatus, page = 0) => [...adminKeys.all(), 'reports', status ?? 'all', page] as const,
  report:     (id: number)                       => [...adminKeys.all(), 'report', id] as const,
  withdrawals:(status?: WithdrawalStatus, page = 0)  => [...adminKeys.all(), 'withdrawals', status ?? 'all', page] as const,
  transactions:(params?: { startDate?: string; endDate?: string; type?: string; status?: string; keyword?: string; page?: number }) =>
                                                        [...adminKeys.all(), 'transactions', params ?? {}] as const,
}

// ── 로그인 ────────────────────────────────────────────────────────────────
export function useAdminLogin() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (body: AdminLoginRequest) => adminApi.login(body),
    onSuccess: () => navigate('/admin/dashboard'),
    onError: (err) => {
      if (err instanceof BusinessError) toast.error(getErrorMessage(err.code))
      else toast.error('로그인에 실패했어요.')
    },
  })
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () => adminApi.stats.dashboard().then((r) => r.data),
  })
}

// ── Users ─────────────────────────────────────────────────────────────────
export function useAdminUsers(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: adminKeys.users(params?.page, params?.size),
    queryFn: () => adminApi.users.list(params).then((r) => r.data),
  })
}

export function useSetUserBlocked() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, blocked }: { id: number; blocked: boolean }) =>
      adminApi.users.setBlocked(id, blocked),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all() })
      toast.success('처리됐어요.')
    },
  })
}

// ── Banners ───────────────────────────────────────────────────────────────
export function useAdminBanners(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: adminKeys.banners(params?.page, params?.size),
    queryFn: () => adminApi.banners.list(params).then((r) => r.data),
  })
}

export function useCreateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: BannerUpsertRequest) => adminApi.banners.create(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all() })
      toast.success('배너가 생성됐어요.')
    },
  })
}

export function useUpdateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: BannerUpsertRequest }) =>
      adminApi.banners.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all() })
      toast.success('수정됐어요.')
    },
  })
}

export function useSetBannerActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminApi.banners.setActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all() }),
  })
}

export function useDeleteBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.banners.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all() })
      toast.success('삭제됐어요.')
    },
  })
}

// ── Notices ───────────────────────────────────────────────────────────────
export function useAdminNotices(params?: { type?: NoticeType; page?: number; size?: number }) {
  return useQuery({
    queryKey: adminKeys.notices(params?.type, params?.page),
    queryFn: () => adminApi.notices.list(params).then((r) => r.data),
  })
}

export function useCreateNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: NoticeUpsertRequest) => adminApi.notices.create(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all() })
      toast.success('공지가 생성됐어요.')
    },
  })
}

export function useUpdateNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: NoticeUpsertRequest }) =>
      adminApi.notices.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all() })
      toast.success('수정됐어요.')
    },
  })
}

export function useSetNoticePinned() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) =>
      adminApi.notices.setPinned(id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all() }),
  })
}

export function useSetNoticePublished() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) =>
      adminApi.notices.setPublished(id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all() }),
  })
}

export function useDeleteNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.notices.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all() })
      toast.success('삭제됐어요.')
    },
  })
}

// ── Reports ───────────────────────────────────────────────────────────────
export function useAdminReports(params?: { status?: AdminReportStatus; page?: number; size?: number }) {
  return useQuery({
    queryKey: adminKeys.reports(params?.status, params?.page),
    queryFn: () => adminApi.reports.list(params).then((r) => r.data),
  })
}

export function usePatchAdminReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AdminReportPatchRequest }) =>
      adminApi.reports.patch(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all() })
      toast.success('처리됐어요.')
    },
  })
}

// ── Withdrawals ───────────────────────────────────────────────────────────
export function useAdminWithdrawals(params?: { status?: WithdrawalStatus; page?: number; size?: number }) {
  return useQuery({
    queryKey: adminKeys.withdrawals(params?.status, params?.page),
    queryFn: () => adminApi.withdrawals.list(params).then((r) => r.data),
  })
}

export function usePatchAdminWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AdminWithdrawalPatchRequest }) =>
      adminApi.withdrawals.patch(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all() })
      toast.success('처리됐어요.')
    },
  })
}

// ── Transactions (라운드8) ───────────────────────────────────────────────
export function useAdminTransactions(params?: AdminTransactionSearchParams) {
  return useQuery({
    queryKey: adminKeys.transactions(params),
    queryFn: () => adminApi.transactions.list(params).then((r) => r.data),
  })
}
