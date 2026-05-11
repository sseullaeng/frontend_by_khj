// 거래대행(Escrow) 훅 — 백엔드 spec 5/11 라운드
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { escrowApi } from './api'
import type {
  EscrowApplicationCreateRequest,
  EscrowApplicationStatus,
  EscrowCancelRequest,
  EscrowFeeSettingsRequest,
  EscrowInternalApplicationRequest,
  EscrowPreviewRequest,
  EscrowStartRequest,
} from './types'

export const escrowKeys = {
  all:                ()                                                   => ['escrow'] as const,
  link:               (linkToken: string)                                  => [...escrowKeys.all(), 'link', linkToken] as const,
  myApplications:     (status?: EscrowApplicationStatus, page = 0)         => [...escrowKeys.all(), 'my', status ?? 'ALL', page] as const,
  applicationDetail:  (id: number)                                         => [...escrowKeys.all(), 'application', id] as const,
  adminApplications:  (status?: EscrowApplicationStatus, page = 0)         => [...escrowKeys.all(), 'admin', 'applications', status ?? 'ALL', page] as const,
  feeSettings:        ()                                                   => [...escrowKeys.all(), 'admin', 'feeSettings'] as const,
}

// ── 사용자 ────────────────────────────────────────────────────────────

export function useCreateEscrowLink() {
  return useMutation({
    mutationFn: (body: EscrowStartRequest) =>
      escrowApi.links.create(body).then((r) => r.data),
  })
}

// linkToken 비로그인 OK
export function useEscrowLink(linkToken: string | undefined) {
  return useQuery({
    queryKey: escrowKeys.link(linkToken ?? ''),
    queryFn: () => escrowApi.links.detail(linkToken!).then((r) => r.data),
    enabled: !!linkToken,
    retry: false,                       // 404/410 즉시 표시
  })
}

export function useCreateEscrowApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EscrowApplicationCreateRequest) =>
      escrowApi.applications.create(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
    },
  })
}

// 라운드12 PR #102 — 수수료 미리보기. 폼 작성 중 호출용 (debounce 는 호출부에서).
export function useEscrowPreview() {
  return useMutation({
    mutationFn: (body: EscrowPreviewRequest) =>
      escrowApi.applications.preview(body).then((r) => r.data),
  })
}

// 라운드12 PR #105 — 채팅방 내부 신청 (판매자만)
export function useCreateInternalEscrowApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EscrowInternalApplicationRequest) =>
      escrowApi.applications.createInternal(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      toast.success('거래대행 신청이 완료됐어요.')
    },
  })
}

export function useMyEscrowApplications(params?: { status?: EscrowApplicationStatus; page?: number; size?: number }) {
  return useQuery({
    queryKey: escrowKeys.myApplications(params?.status, params?.page),
    queryFn: () => escrowApi.applications.listMine(params).then((r) => r.data),
  })
}

export function useEscrowApplicationDetail(id: number | undefined) {
  return useQuery({
    queryKey: escrowKeys.applicationDetail(id ?? 0),
    queryFn: () => escrowApi.applications.detail(id!).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCancelEscrowApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: EscrowCancelRequest }) =>
      escrowApi.applications.cancel(id, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      toast.success('취소했어요.')
    },
  })
}

export function useConfirmEscrowReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      escrowApi.applications.confirmReceipt(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      toast.success('수령 확인 완료. 정산이 진행돼요.')
    },
  })
}

// ── 관리자 ────────────────────────────────────────────────────────────

export function useAdminEscrowApplications(params?: { status?: EscrowApplicationStatus; page?: number; size?: number }) {
  return useQuery({
    queryKey: escrowKeys.adminApplications(params?.status, params?.page),
    queryFn: () => escrowApi.admin.listApplications(params).then((r) => r.data),
  })
}

export function useAdminEscrowApplicationDetail(id: number | undefined) {
  return useQuery({
    queryKey: [...escrowKeys.all(), 'admin', 'application', id ?? 0] as const,
    queryFn: () => escrowApi.admin.detailApplication(id!).then((r) => r.data),
    enabled: !!id,
  })
}

export function useEscrowFeeSettings() {
  return useQuery({
    queryKey: escrowKeys.feeSettings(),
    queryFn: () => escrowApi.admin.getFeeSettings().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

export function usePatchEscrowFeeSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EscrowFeeSettingsRequest) =>
      escrowApi.admin.patchFeeSettings(body).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: escrowKeys.feeSettings() })
      toast.success(data?.message ?? '수수료 정책이 변경됐어요.')
    },
  })
}
