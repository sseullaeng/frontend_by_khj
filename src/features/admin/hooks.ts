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
import type { AdminTransactionSearchParams, AdminUserSearchParams } from './api'
import { BusinessError } from '@/shared/types'
import { getErrorMessage } from '@/shared/lib/errorMessages'

export const adminKeys = {
  all:        ()                                 => ['admin'] as const,
  me:         ()                                 => [...adminKeys.all(), 'me'] as const,
  dashboard:  ()                                 => [...adminKeys.all(), 'dashboard'] as const,
  dashboardCharts: (start?: string, end?: string) => [...adminKeys.all(), 'dashboard', 'charts', start ?? 'default', end ?? 'default'] as const,
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

// ── 로그인 / Me ─────────────────────────────────────────────────────────
//
// 백엔드 정책: /users/me 는 ROLE_USER 만, admin 은 별도 GET /admin/me.
// 따라서 useAuthStore.user (USER 도메인) 와 분리해서 useAdminMe 로 가드한다.
export function useAdminMe(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminKeys.me(),
    queryFn: () => adminApi.me().then((r) => r.data),
    retry: false,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  })
}

export function useAdminLogin() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AdminLoginRequest) => adminApi.login(body),
    onSuccess: async () => {
      // 200 OK 만으로는 가드가 통과 못 함 → /admin/me 재조회로 role 확인 후 navigate.
      await qc.refetchQueries({ queryKey: adminKeys.me() })
      navigate('/admin/dashboard')
    },
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

// 라운드12 — 차트 대시보드 (마이페이지 AdminStats 가 사용)
//   기간 미지정 시 백엔드 default = 최근 14일
export function useAdminDashboardCharts(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: adminKeys.dashboardCharts(startDate, endDate),
    queryFn: () => adminApi.stats.dashboardCharts({ startDate, endDate }).then((r) => r.data),
    staleTime: 60_000,
  })
}

// ── Users (라운드9 — 검색/필터 서버 쿼리) ─────────────────────────────────
export function useAdminUsers(params?: AdminUserSearchParams) {
  return useQuery({
    queryKey: [...adminKeys.all(), 'users', params ?? {}] as const,
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

// ── Broadcast (라운드9 — 관리자 전체 알림 발송) ─────────────────────────
export function useBroadcastNotification() {
  return useMutation({
    mutationFn: (body: { title: string; content: string; targetRole?: string }) =>
      adminApi.notifications.broadcast(body).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(`${data?.sent ?? 0}명에게 발송됐어요.`)
    },
  })
}
