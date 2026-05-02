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
        if (err.code === 'TRANSACTION_SELF_NOT_ALLOWED')
          toast.error('본인 물품은 거래할 수 없어요.')
        else if (err.code === 'ITEM_INVALID_STATE')
          toast.error('현재 거래할 수 없는 물품이에요.')
        else toast.error(err.message)
      } else {
        toast.error('거래를 시작하지 못했어요.')
      }
    },
  })
}

// 상태 전이 (예약/거래완료/취소)
export function usePatchTransaction(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TransactionPatchRequest) =>
      transactionApi.patch(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transactionKeys.detail(id) })
      qc.invalidateQueries({ queryKey: transactionKeys.all() })
      qc.invalidateQueries({ queryKey: itemKeys.all() })       // Item.status 자동 연동
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })       // 거래완료 시 잔액 변동
    },
    onError: (err) => {
      if (err instanceof BusinessError) {
        if (err.code === 'TRANSACTION_FORBIDDEN') toast.error('권한이 없어요.')
        else if (err.code === 'TRANSACTION_INVALID_STATE')
          toast.error('현재 상태에서는 불가능한 동작이에요.')
        else if (err.code === 'TRANSACTION_RESERVED_BY_OTHER')
          toast.error('다른 거래가 먼저 예약되었어요.')
        else if (err.code === 'INSUFFICIENT_POINT')
          toast.error('포인트가 부족해서 거래완료할 수 없어요.')
        else toast.error(err.message)
      } else {
        toast.error('거래 상태를 변경하지 못했어요.')
      }
    },
  })
}
