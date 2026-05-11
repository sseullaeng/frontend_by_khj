// 거래(Transaction) 관련 훅 — 백엔드 spec 정합
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { transactionApi } from './api'
import type {
  TransactionCreateRequest,
  TransactionListParams,
  TransactionPatchRequest,
} from './types'
import { itemKeys } from '@/features/item/keys'
import { pointKeys } from '@/features/payment/keys'
import { BusinessError } from '@/shared/types'

// 쿼리 키
export const transactionKeys = {
  all:    ()                                   => ['transactions'] as const,
  detail: (id: number)                         => [...transactionKeys.all(), 'detail', id] as const,
  list:   (params?: TransactionListParams)     => [...transactionKeys.all(), 'list', params ?? {}] as const,
}

// 거래 단건 조회
export function useTransactionDetail(id: number) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionApi.getDetail(id).then((r) => r.data),
    enabled: !!id,
  })
}

// 내 거래 목록
export function useMyTransactions(params?: TransactionListParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionApi.getMyList(params).then((r) => r.data),
  })
}

// 거래 생성
export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TransactionCreateRequest) =>
      transactionApi.create(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transactionKeys.all() })
      toast.success('거래가 시작됐어요.')
    },
    onError: (err) => {
      if (err instanceof BusinessError) {
        switch (err.code) {
          case 'TRANSACTION_SELF_NOT_ALLOWED':
            toast.error('본인 물품은 거래할 수 없어요.'); break
          case 'ITEM_INVALID_STATE':
            toast.error('현재 거래할 수 없는 물품이에요.'); break
          // 라운드12 — 채팅방 안에서만 시작
          case 'TX_CHATROOM_REQUIRED':
            toast.error('채팅방에서 거래를 시작해 주세요.'); break
          case 'TX_CHATROOM_ITEM_MISMATCH':
            toast.error('채팅방의 물품과 거래 물품이 일치하지 않아요.'); break
          case 'TX_ALREADY_ACTIVE_IN_ROOM':
            toast.error('이 채팅방에 이미 진행 중인 거래가 있어요.'); break
          case 'TX_SELLER_ONLY':
            toast.error('판매자만 거래를 시작할 수 있어요.'); break
          default:
            toast.error(err.message)
        }
      } else {
        toast.error('거래를 시작하지 못했어요.')
      }
    },
  })
}

// 상태 전이 (예약/인계확인/인수확인/취소) — 라운드 11 (Tx-Hold)
export function usePatchTransaction(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TransactionPatchRequest) =>
      transactionApi.patch(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transactionKeys.detail(id) })
      qc.invalidateQueries({ queryKey: transactionKeys.all() })
      qc.invalidateQueries({ queryKey: itemKeys.all() })          // Item.status 자동 연동
      qc.invalidateQueries({ queryKey: pointKeys.all() })         // 라운드11: 잔액·내역 전체 갱신 (hold/release/refund)
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
    onError: (err) => {
      if (err instanceof BusinessError) {
        switch (err.code) {
          case 'TRANSACTION_FORBIDDEN':
            toast.error('권한이 없어요.'); break
          case 'TRANSACTION_INVALID_STATE':
            toast.error('현재 상태에서는 불가능한 동작이에요.'); break
          case 'TRANSACTION_RESERVED_BY_OTHER':
            toast.error('다른 거래가 먼저 예약됐어요.'); break
          case 'TRANSACTION_HANDOVER_NOT_ALLOWED':
            toast.error('판매자만 인계 확인할 수 있어요.'); break
          case 'TRANSACTION_RECEIVE_NOT_ALLOWED':
            toast.error('구매자만 인수 확인할 수 있어요. 판매자가 먼저 인계 확인해야 해요.'); break
          case 'TRANSACTION_HOLD_FAILED':
            toast.error('포인트가 부족해 예약할 수 없어요. 충전 후 다시 시도해 주세요.'); break
          case 'INSUFFICIENT_POINT':
            toast.error('포인트가 부족해요.'); break
          default:
            toast.error(err.message)
        }
      } else {
        toast.error('거래 상태를 변경하지 못했어요.')
      }
    },
  })
}
