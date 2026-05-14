// 연체(Overdue) hooks — React Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { overdueApi } from './api'
import type {
  AdminOverdueListParams,
  OverdueLegalActionPatch,
  OverdueResolvePatch,
} from './types'
import { BusinessError } from '@/shared/types'
import { getErrorMessage } from '@/shared/lib/errorMessages'

export const overdueKeys = {
  all: () => ['overdue'] as const,
  me: () => [...overdueKeys.all(), 'me'] as const,
  myDebt: () => [...overdueKeys.all(), 'me', 'debt'] as const,
  admin: () => [...overdueKeys.all(), 'admin'] as const,
  adminList: (params?: AdminOverdueListParams) =>
    [...overdueKeys.admin(), 'list', params ?? {}] as const,
  adminDetail: (id: number) => [...overdueKeys.admin(), 'detail', id] as const,
}

// ── 본인 ─────────────────────────────────────────────────────────────
export function useMyOverdueRecords(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: overdueKeys.me(),
    queryFn: () => overdueApi.me.list().then((r) => r.data),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  })
}

export function useMyOverdueDebt(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: overdueKeys.myDebt(),
    queryFn: () => overdueApi.me.debt().then((r) => r.data),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  })
}

// ── 관리자 (PR②에서 사용 — 페이지가 추가되기 전에 훅만 미리 노출) ────
export function useAdminOverdueList(params?: AdminOverdueListParams) {
  return useQuery({
    queryKey: overdueKeys.adminList(params),
    queryFn: () => overdueApi.admin.list(params).then((r) => r.data),
  })
}

export function useAdminOverdueDetail(id: number | undefined) {
  return useQuery({
    queryKey: overdueKeys.adminDetail(id ?? 0),
    queryFn: () => overdueApi.admin.detail(id!).then((r) => r.data),
    enabled: !!id,
  })
}

export function useAdminOverduePatchLegalAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: OverdueLegalActionPatch }) =>
      overdueApi.admin.patchLegalAction(id, body).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: overdueKeys.admin() })
      qc.invalidateQueries({ queryKey: overdueKeys.adminDetail(vars.id) })
      toast.success('법적 조치 단계가 갱신됐어요.')
    },
    onError: (err) => {
      if (err instanceof BusinessError) toast.error(getErrorMessage(err.code, err.message))
      else toast.error('처리에 실패했어요.')
    },
  })
}

export function useAdminOverdueResolve() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body?: OverdueResolvePatch }) =>
      overdueApi.admin.resolve(id, body).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: overdueKeys.admin() })
      qc.invalidateQueries({ queryKey: overdueKeys.adminDetail(vars.id) })
      toast.success('연체 건을 종료했어요.')
    },
    onError: (err) => {
      if (err instanceof BusinessError) toast.error(getErrorMessage(err.code, err.message))
      else toast.error('처리에 실패했어요.')
    },
  })
}

export function useAdminOverdueRecompute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => overdueApi.admin.recompute(id).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: overdueKeys.admin() })
      qc.invalidateQueries({ queryKey: overdueKeys.adminDetail(id) })
      toast.success('재계산이 완료됐어요.')
    },
    onError: (err) => {
      if (err instanceof BusinessError) toast.error(getErrorMessage(err.code, err.message))
      else toast.error('재계산에 실패했어요.')
    },
  })
}
