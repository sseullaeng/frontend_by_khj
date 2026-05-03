// 배달대행 API — 가이드 §10.13
//
// 액션마다 분리 endpoint (Transaction 과 패턴 다름).
import api from '@/shared/api/axios'
import type {
  Delivery,
  DeliveryCancelRequest,
  DeliveryCreateRequest,
  DeliveryListParams,
  DeliveryLocation,
} from './types'
import type { PageResponse } from '@/shared/types'

export const deliveryApi = {
  // 등록 — requester (이메일 인증 필수)
  create: (body: DeliveryCreateRequest) =>
    api.post<Delivery>('/api/v1/deliveries', body),

  // 모집중 페이징 — 누구나 (라이더 후보 화면)
  getList: (params?: DeliveryListParams) =>
    api.get<PageResponse<Delivery>>('/api/v1/deliveries', { params }),

  // 본인이 참여한 (requester / rider) 목록
  getMyList: (params?: DeliveryListParams) =>
    api.get<PageResponse<Delivery>>('/api/v1/deliveries/me', { params }),

  // 단건 (모집중=누구나 / 그 외=참여자만)
  getDetail: (id: number) =>
    api.get<Delivery>(`/api/v1/deliveries/${id}`),

  // 라이더 액션
  accept:  (id: number) => api.patch<Delivery>(`/api/v1/deliveries/${id}/accept`),
  pickup:  (id: number) => api.patch<Delivery>(`/api/v1/deliveries/${id}/pickup`),
  deliver: (id: number) => api.patch<Delivery>(`/api/v1/deliveries/${id}/deliver`),

  // 요청자 액션
  complete: (id: number) => api.patch<Delivery>(`/api/v1/deliveries/${id}/complete`),
  cancel:   (id: number, body?: DeliveryCancelRequest) =>
    api.patch<Delivery>(`/api/v1/deliveries/${id}/cancel`, body ?? {}),

  // 실시간 위치 — REST fallback (TTL 30분)
  // 200 = location, 204 = 데이터 없음 (TTL 만료/종료)
  getLastLocation: (id: number) =>
    api.get<DeliveryLocation | ''>(`/api/v1/deliveries/${id}/location/last`),
}
