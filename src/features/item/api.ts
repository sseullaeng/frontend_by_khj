// 물품 API: 물품 목록 조회, 상세 정보, 생성, 수정, 삭제 등 물품 관련 API 호출
import api from '@/shared/api/axios'  // 기본 API 클라이언트
import type { Item, ItemCreateRequest, ItemFilter, ItemUpdateRequest } from './types'  // 물품 관련 타입
import type { PageResponse } from '@/shared/types'  // 페이지 응답 타입

/**
 * 물품 API 객체
 * 
 * 기능:
 * - 물품 목록 조회 및 필터링
 * - 물품 상세 정보 조회
 * - 물품 생성, 수정, 삭제
 * - 찜하기 토글 및 목록 조회
 * - 내 물품 목록 조회
 * - 물품 신고
 */
export const itemApi = {
  getList:  (filter: ItemFilter) =>
    api.get<PageResponse<Item>>('/api/v1/items', { params: filter }),  // 물품 목록 조회

  getDetail: (id: number) =>
    api.get<Item>(`/api/v1/items/${id}`),  // 물품 상세 정보 조회

  create: (body: ItemCreateRequest) =>
    api.post<Item>('/api/v1/items', body),  // 물품 생성

  update: (id: number, body: ItemUpdateRequest) =>
    api.patch<Item>(`/api/v1/items/${id}`, body),  // 물품 수정

  delete: (id: number) =>
    api.delete<void>(`/api/v1/items/${id}`),  // 물품 삭제

  toggleWish: (id: number) =>
    api.post<{ isWished: boolean }>(`/api/v1/items/${id}/wish`),  // 찜하기 토글

  getWishList: () =>
    api.get<PageResponse<Item>>('/api/v1/items/wished'),  // 찜 목록 조회

  getMyItems: () =>
    api.get<PageResponse<Item>>('/api/v1/items/my'),  // 내 물품 목록 조회

  report: (id: number, reason: string) =>
    api.post<void>(`/api/v1/items/${id}/report`, { reason }),

  // Presigned URL 발급
  getPresignedUrls: (files: { name: string; contentType: string; size: number }[]) =>
    api.post<{ uploads: { presignedUrl: string; key: string }[] }>(
      '/api/v1/files/presigned-url',
      { purpose: 'item', files }
    ),
}
