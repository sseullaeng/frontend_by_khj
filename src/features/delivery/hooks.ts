// 배달대행 훅 — 가이드 §10.13
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deliveryApi } from './api'
import type {
  DeliveryCancelRequest,
  DeliveryCreateRequest,
  DeliveryListParams,
} from './types'
import { BusinessError } from '@/shared/types'

export const deliveryKeys = {
  all:    ()                                => ['deliveries'] as const,
  list:   (params?: DeliveryListParams)     => [...deliveryKeys.all(), 'list', params ?? {}] as const,
  myList: (params?: DeliveryListParams)     => [...deliveryKeys.all(), 'me', params ?? {}] as const,
  detail: (id: number)                       => [...deliveryKeys.all(), 'detail', id] as const,
}

// 모집중 목록 (라이더 후보 화면)
export function useDeliveryList(params?: DeliveryListParams) {
  return useQuery({
    queryKey: deliveryKeys.list(params),
    queryFn: () => deliveryApi.getList(params).then((r) => r.data),
  })
}

// 본인 참여 목록 (requester/rider)
export function useMyDeliveries(params?: DeliveryListParams) {
  return useQuery({
    queryKey: deliveryKeys.myList(params),
    queryFn: () => deliveryApi.getMyList(params).then((r) => r.data),
  })
}

// 단건 상세 (필요 시 폴링)
export function useDeliveryDetail(id: number, opts?: { polling?: boolean }) {
  return useQuery({
    queryKey: deliveryKeys.detail(id),
    queryFn: () => deliveryApi.getDetail(id).then((r) => r.data),
    enabled: !!id,
    refetchInterval: opts?.polling ? 5000 : false,  // 가이드 권장: 좌표 미지원이라 5초 폴링
  })
}

// 등록
export function useCreateDelivery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: DeliveryCreateRequest) => deliveryApi.create(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryKeys.all() })
      toast.success('배달 요청을 등록했어요.')
    },
    onError: errorToast('배달 요청 등록에 실패했어요.'),
  })
}

// 액션 — 모두 invalidate detail + lists
function makeActionHook(
  apiFn: (id: number) => Promise<{ data: { id?: number } | unknown }>,
  successMsg: string,
  fallbackMsg: string,
) {
  return (id: number) => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: () => apiFn(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: deliveryKeys.detail(id) })
        qc.invalidateQueries({ queryKey: deliveryKeys.all() })
        qc.invalidateQueries({ queryKey: ['auth', 'me'] })  // 정산 시 잔액 변동
        toast.success(successMsg)
      },
      onError: errorToast(fallbackMsg),
    })
  }
}

export const useAcceptDelivery   = makeActionHook(deliveryApi.accept,  '수락했어요.',     '수락에 실패했어요.')
export const usePickupDelivery   = makeActionHook(deliveryApi.pickup,  '픽업 처리됐어요.', '상태 변경에 실패했어요.')
export const useDeliverDelivery  = makeActionHook(deliveryApi.deliver, '배송완료로 변경됐어요.', '상태 변경에 실패했어요.')
export const useCompleteDelivery = makeActionHook(deliveryApi.complete,'정산이 완료됐어요.', '정산에 실패했어요.')

// 취소는 body 가 있어 별도
export function useCancelDelivery(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body?: DeliveryCancelRequest) => deliveryApi.cancel(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryKeys.detail(id) })
      qc.invalidateQueries({ queryKey: deliveryKeys.all() })
      toast.success('취소되었어요.')
    },
    onError: errorToast('취소에 실패했어요.'),
  })
}

function errorToast(fallback: string) {
  return (err: unknown) => {
    if (err instanceof BusinessError) {
      if (err.code === 'DELIVERY_ALREADY_ACCEPTED') toast.error('이미 다른 라이더가 수락한 배달이에요.')
      else if (err.code === 'DELIVERY_SELF_NOT_ALLOWED') toast.error('본인 요청은 수락할 수 없어요.')
      else if (err.code === 'DELIVERY_INVALID_STATE') toast.error('현재 상태에서는 가능한 동작이 아니에요.')
      else if (err.code === 'INSUFFICIENT_POINT') toast.error('포인트가 부족해서 정산할 수 없어요.')
      else toast.error(err.message)
    } else {
      toast.error(fallback)
    }
  }
}
