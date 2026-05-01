// 물품 관련 훅: 물품 목록 조회, 생성, 수정, 삭제 등 물품 관련 상태 관리
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'  // React Query 훅
import { toast } from 'sonner'  // 토스트 알림 라이브러리
import axios from 'axios'  // HTTP 클라이언트
import { itemApi } from './api'  // 물품 API
import { itemKeys } from './keys'  // 물품 쿼리 키
import { compressImage } from '@/shared/lib/imageCompress'  // 이미지 압축 유틸리티
import type { ItemCreateRequest, ItemFilter, ItemUpdateRequest } from './types'  // 물품 관련 타입
import { MOCK_ITEMS } from './mockData'  // 모의 데이터

// 모의 데이터 사용 여부: MSW 활성화 시 모의 데이터 사용
const isMock = import.meta.env.VITE_MSW_ENABLED === 'true'

/**
 * 물품 목록 훅
 * 
 * 기능:
 * - 무한 스크롤 물품 목록 조회
 * - 필터링 (키워드, 카테고리, 타입)
 * - 모의 데이터 또는 API 데이터 사용
 * - 페이지네이션 처리
 */
export function useItemList(filter: ItemFilter) {
  return useInfiniteQuery({
    queryKey: itemKeys.list(filter),  // 쿼리 키
    queryFn: async ({ pageParam = 0 }) => {
      if (isMock) {
        // 모의 데이터 필터링
        const keyword = filter.keyword?.toLowerCase() ?? ''
        const filtered = MOCK_ITEMS.filter((item) => {
          const matchKeyword = !keyword || item.title.toLowerCase().includes(keyword) ||
            item.hashtags.some((t) => t.toLowerCase().includes(keyword))  // 키워드 매칭
          const matchCategory = !filter.category || item.category === filter.category  // 카테고리 매칭
          const matchType = !filter.itemType || item.itemType === filter.itemType  // 타입 매칭
          return matchKeyword && matchCategory && matchType
        })
        const size = filter.size ?? 10  // 페이지 크기
        const start = (pageParam as number) * size
        const content = filtered.slice(start, start + size)
        return { content, page: pageParam as number, size, totalElements: filtered.length,
          totalPages: Math.ceil(filtered.length / size),
          hasNext: start + size < filtered.length, hasPrevious: (pageParam as number) > 0 }
      }
      return itemApi.getList({ ...filter, page: pageParam }).then((r) => r.data)
    },
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    initialPageParam: 0,
  })
}

export function useItemDetail(id: number) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => {
      if (isMock) {
        const item = MOCK_ITEMS.find((i) => i.id === id)
        if (!item) throw new Error('ITEM_NOT_FOUND')
        return item
      }
      return itemApi.getDetail(id).then((r) => r.data)
    },
    enabled: !!id,
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ItemCreateRequest) => itemApi.create(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
      toast.success('상품이 등록됐어요!')
    },
    onError: () => toast.error('상품 등록에 실패했어요.'),
  })
}

export function useUpdateItem(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ItemUpdateRequest) => itemApi.update(id, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.detail(id) })
      toast.success('상품이 수정됐어요!')
    },
  })
}

export function useWishList() {
  return useQuery({
    queryKey: itemKeys.wished(),
    queryFn: () => {
      if (isMock) {
        return { content: MOCK_ITEMS.slice(0, 5).map(i => ({ ...i, isWished: true })), page: 0, size: 5, totalElements: 5, totalPages: 1, hasNext: false, hasPrevious: false }
      }
      return itemApi.getWishList().then((r) => r.data)
    },
  })
}

export function useMyItems() {
  const MOCK_BUYERS = ['이서아', '박지호', '최하은', '정현우']
  return useQuery({
    queryKey: [...itemKeys.lists(), 'my'],
    queryFn: () => {
      if (isMock) {
        const mine = MOCK_ITEMS.filter((i) => i.sellerId === 1).map((item, idx) => ({
          ...item,
          status: 'SOLD' as const,
          buyerNickname: MOCK_BUYERS[idx % MOCK_BUYERS.length],
        }))
        return { content: mine, page: 0, size: mine.length, totalElements: mine.length, totalPages: 1, hasNext: false, hasPrevious: false }
      }
      return itemApi.getMyItems().then((r) => r.data)
    },
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => itemApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
      toast.success('상품이 삭제됐어요.')
    },
    onError: () => toast.error('상품 삭제에 실패했어요.'),
  })
}

export function useToggleWish(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => {
      if (isMock) return Promise.resolve(null)
      return itemApi.toggleWish(id).then((r) => r.data)
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: itemKeys.detail(id) })
      const prev = qc.getQueryData(itemKeys.detail(id))
      qc.setQueryData(itemKeys.detail(id), (old: any) =>
        old ? { ...old, isWished: !old.isWished, wishCount: old.wishCount + (old.isWished ? -1 : 1) } : old
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(itemKeys.detail(id), ctx.prev)
    },
    onSuccess: () => {
      if (!isMock) {
        qc.invalidateQueries({ queryKey: itemKeys.detail(id) })
        qc.invalidateQueries({ queryKey: itemKeys.wished() })
      }
    },
  })
}

/** 이미지 압축 → Presigned URL 발급 → S3 PUT */
export function useUploadImages() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      // 1. 압축
      const compressed = await Promise.all(files.map(compressImage))

      // 2. Presigned URL 발급
      const { data: { uploads } } = await itemApi.getPresignedUrls(
        compressed.map((f) => ({ name: f.name, contentType: f.type, size: f.size }))
      )

      // 3. S3 PUT (Content-Type 일치 필수)
      await Promise.all(
        uploads.map((u, i) =>
          axios.put(u.presignedUrl, compressed[i], {
            headers: { 'Content-Type': compressed[i].type },
          })
        )
      )

      return uploads.map((u) => u.key)
    },
    onError: () => toast.error('이미지 업로드에 실패했어요.'),
  })
}
