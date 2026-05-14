// 거래대행(Escrow) 훅 — 백엔드 spec 5/11 라운드
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { escrowApi } from './api'
import { pointKeys } from '@/features/payment/keys'
import { itemKeys } from '@/features/item/keys'
import type {
  EscrowApplicationCreateRequest,
  EscrowApplicationStatus,
  EscrowBuyerInfoPatch,
  EscrowByLinkRequest,
  EscrowCancelRequest,
  EscrowDraftRequest,
  EscrowFeeSettingsRequest,
  EscrowInternalApplicationRequest,
  EscrowPreviewRequest,
  EscrowSellerInfoPatch,
  EscrowStartRequest,
} from './types'

export const escrowKeys = {
  all:                ()                                                   => ['escrow'] as const,
  link:               (linkToken: string)                                  => [...escrowKeys.all(), 'link', linkToken] as const,
  myApplications:     (status?: EscrowApplicationStatus, page = 0)         => [...escrowKeys.all(), 'my', status ?? 'ALL', page] as const,
  applicationDetail:  (id: number)                                         => [...escrowKeys.all(), 'application', id] as const,
  paymentPreview:     (id: number)                                         => [...escrowKeys.all(), 'application', id, 'payment-preview'] as const,
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

// 라운드13 PR #130 — 외부 link 분리 입력. 수신자가 본인 영역만 보냄.
export function useCreateEscrowByLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EscrowByLinkRequest) =>
      escrowApi.applications.createByLink(body).then((r) => r.data),
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

// 라운드12 PR #105 — 채팅방 내부 신청 (한 번에 입력, deprecated 권장)
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

// 라운드12 PR-B-4 — 판매자 draft 생성 (판매자 영역만)
export function useCreateEscrowDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EscrowDraftRequest) =>
      escrowApi.applications.createDraft(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      toast.success('거래대행 신청이 접수됐어요. 구매자의 수령지 입력 후 결제로 진행됩니다.')
    },
  })
}

// 라운드12 PR-B-4 — 판매자 영역 수정
export function usePatchEscrowSellerInfo(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EscrowSellerInfoPatch) =>
      escrowApi.applications.patchSellerInfo(id, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: escrowKeys.applicationDetail(id) })
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      toast.success('판매자 정보가 수정됐어요.')
    },
  })
}

// 라운드12 PR-B-4 — 구매자 영역 입력 (양쪽 filled 시 자동 결제대기 전환)
export function usePatchEscrowBuyerInfo(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EscrowBuyerInfoPatch) =>
      escrowApi.applications.patchBuyerInfo(id, body).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: escrowKeys.applicationDetail(id) })
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      if (data.status === '결제대기') {
        toast.success('수령지 입력 완료 — 결제 화면으로 진행하세요.')
      } else {
        toast.success('수령지가 입력됐어요.')
      }
    },
  })
}

// 라운드13 PR #119 — 결제 미리보기. EscrowPayPage 진입 시 사용.
//   잔액/필요액/부족액/결제 가능 여부를 한 번에 받음.
export function useEscrowPaymentPreview(id: number | undefined) {
  return useQuery({
    queryKey: escrowKeys.paymentPreview(id ?? 0),
    queryFn: () => escrowApi.applications.paymentPreview(id!).then((r) => r.data),
    enabled: !!id,
    staleTime: 5_000,   // 짧게 — 충전 후 재조회 빠르게 반영
  })
}

// 라운드12 PR-B-5 — 본인 share 결제 (포인트 차감, 양쪽 결제 완료 시 자동 라이더 매칭)
export function usePayEscrowApplication(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      escrowApi.applications.pay(id).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: escrowKeys.applicationDetail(id) })
      qc.invalidateQueries({ queryKey: escrowKeys.paymentPreview(id) })
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      qc.invalidateQueries({ queryKey: pointKeys.all() })  // 포인트 잔액 갱신
      if (data.status === '결제완료' || data.status === '진행중') {
        toast.success('양쪽 결제가 완료됐어요. 라이더 매칭이 시작돼요.')
      } else {
        toast.success('결제가 완료됐어요. 상대방 결제를 기다려 주세요.')
      }
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
      qc.invalidateQueries({ queryKey: pointKeys.all() })
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

// 라운드13 PR #131 — 판매자 인계 마킹 (멱등). 상태 머신 영향 X, 타임스탬프만.
export function useConfirmEscrowHandover() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      escrowApi.applications.confirmHandover(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      toast.success('물품 인계 확인 완료. 배달이 진행돼요.')
    },
  })
}

export function useRequestEscrowReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      escrowApi.applications.requestReturn(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      qc.invalidateQueries({ queryKey: pointKeys.all() })
      toast.success('반납 요청이 접수됐어요.')
    },
  })
}

export function useConfirmEscrowReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      escrowApi.applications.confirmReturn(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      qc.invalidateQueries({ queryKey: itemKeys.all() })
      qc.invalidateQueries({ queryKey: pointKeys.all() })
      toast.success('반납 확인이 완료됐어요. 정산이 진행돼요.')
    },
  })
}

export function useRequestEscrowCancel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: EscrowCancelRequest }) =>
      escrowApi.applications.requestCancel(id, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      toast.success('취소 요청을 보냈어요.')
    },
  })
}

export function useConfirmEscrowCancel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      escrowApi.applications.confirmCancel(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      qc.invalidateQueries({ queryKey: pointKeys.all() })
      toast.success('취소 요청을 승인했어요.')
    },
  })
}

export function useWithdrawEscrowCancel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      escrowApi.applications.withdrawCancel(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: escrowKeys.all() })
      toast.success('취소 요청을 철회했어요.')
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
