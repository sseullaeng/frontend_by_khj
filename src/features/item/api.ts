// 물품(Item) API — 백엔드 §6 / PR #66 정합
import api from '@/shared/api/axios'
import type {
  Item,
  ItemDetail,
  ItemCreateRequest,
  ItemFilter,
  ItemUpdateRequest,
  MyItemStatus,
  WishlistToggleResponse,
} from './types'
import type { PageResponse } from '@/shared/types'

export const itemApi = {
  // 목록 / 검색 (공개)
  getList: (filter: ItemFilter) =>
    api.get<PageResponse<Item>>('/api/v1/items', { params: filter }),

  // 상세
  getDetail: (id: number) => api.get<ItemDetail>(`/api/v1/items/${id}`),

  // 등록 (이메일 인증 필수)
  create: (body: ItemCreateRequest) =>
    api.post<{ id: number }>('/api/v1/items', body),

  // 수정 (본인, 판매중·비공개 상태만)
  update: (id: number, body: ItemUpdateRequest) =>
    api.patch<void>(`/api/v1/items/${id}`, body),

  // 삭제 (본인, soft delete)
  delete: (id: number) => api.delete<void>(`/api/v1/items/${id}`),

  // 찜 추가 (멱등) — 응답: { wishlisted: true, wishlistCount }
  addWishlist: (id: number) =>
    api.post<WishlistToggleResponse>(`/api/v1/items/${id}/wishlist`),

  // 찜 해제 (멱등) — 응답: { wishlisted: false, wishlistCount }
  removeWishlist: (id: number) =>
    api.delete<WishlistToggleResponse>(`/api/v1/items/${id}/wishlist`),

  // 내 찜 목록
  getWishList: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<Item>>('/api/v1/users/me/wishlist', { params }),

  // 내 물품 (마이페이지 탭) — status 미지정 시 삭제만 제외하고 전체
  getMyItems: (params?: { status?: MyItemStatus; page?: number; size?: number }) =>
    api.get<PageResponse<Item>>('/api/v1/users/me/items', { params }),

  // 신고 — 가이드 §10 (이메일 인증 필수)
  report: (id: number, body: { reason: string; detail?: string }) =>
    api.post<{ id: number }>(`/api/v1/items/${id}/report`, body),

  // 이미지 부분 편집 (PR #67) — 본인 + 이메일 인증 필수
  // 응답: { imageUrls: [...정렬된 전체 URL] } — 첫 번째가 썸네일

  // 추가 — 합산 5장 한도 (초과 시 ITEM_IMAGE_LIMIT_EXCEEDED)
  addImages: (id: number, imageUrls: string[]) =>
    api.post<{ imageUrls: string[] }>(`/api/v1/items/${id}/images`, { imageUrls }),

  // 단건 제거 — imageUrl 은 query param (URL encoded)
  removeImage: (id: number, imageUrl: string) =>
    api.delete<{ imageUrls: string[] }>(`/api/v1/items/${id}/images`, {
      params: { imageUrl },
    }),

  // 순서 변경 (썸네일 변경 포함) — 기존 set 과 정확히 일치해야 함
  reorderImages: (id: number, imageUrls: string[]) =>
    api.patch<{ imageUrls: string[] }>(`/api/v1/items/${id}/images/order`, { imageUrls }),
}
