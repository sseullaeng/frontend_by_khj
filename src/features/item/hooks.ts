// 물품 관련 훅 — 백엔드 §6 / PR #66 정합
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { itemApi } from './api'
import { itemKeys } from './keys'
import { compressImage } from '@/shared/lib/imageCompress'
import { uploadImages, validateImageFile } from '@/shared/api/upload'
import type {
  Item,
  ItemCreateRequest,
  ItemDetail,
  ItemFilter,
  ItemUpdateRequest,
  MyItemStatus,
  WishlistToggleResponse,
} from './types'
import type { PageResponse } from '@/shared/types'

// 무한 스크롤 목록
export function useItemList(filter: ItemFilter) {
  return useInfiniteQuery({
    queryKey: itemKeys.list(filter),
    queryFn: ({ pageParam = 0 }) =>
      itemApi.getList({ ...filter, page: pageParam }).then((r) => r.data),
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    initialPageParam: 0,
  })
}

// 상세 — ItemDetail 반환
export function useItemDetail(id: number) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => itemApi.getDetail(id).then((r) => r.data),
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
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
      toast.success('상품이 수정됐어요!')
    },
    onError: () => toast.error('상품 수정에 실패했어요.'),
  })
}

// 본인 물품 삭제 (DELETE /api/v1/items/{id})
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

// 라운드12 PR #109 — admin 권한 삭제 (DELETE /api/v1/admin/items/{id})
//   본인 아닌 물품 삭제 시 사용 (ItemDetailPage 의 admin 분기)
export function useAdminDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => itemApi.deleteByAdmin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
      toast.success('상품이 삭제됐어요.')
    },
    onError: () => toast.error('상품 삭제에 실패했어요.'),
  })
}

// 내 찜 목록
export function useWishList(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: itemKeys.wished(),
    queryFn: () => itemApi.getWishList(params).then((r) => r.data),
  })
}

// 라운드14 4-C — 대여 가능 기간 (공개). 활성 거래의 [rentalStart, rentalEnd] 페어.
export function useRentalBlocks(itemId: number | undefined) {
  return useQuery({
    queryKey: itemKeys.rentalBlocks(itemId ?? 0),
    queryFn: () => itemApi.getRentalBlocks(itemId!).then((r) => r.data),
    enabled: !!itemId,
    staleTime: 30_000,
  })
}

// 라운드14 4-C — 대여 신청 (buyer). 응답으로 채팅중 transactionId.
export function useRequestRental(itemId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { rentalStart: string; rentalEnd: string; chatRoomId?: number }) =>
      itemApi.postRentalRequest(itemId, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.rentalBlocks(itemId) })
    },
  })
}

// 내 물품 — 마이페이지 탭 (status 별)
export function useMyItems(params?: { status?: MyItemStatus; page?: number; size?: number }) {
  return useQuery({
    queryKey: [...itemKeys.lists(), 'my', params?.status ?? 'all', params?.page ?? 0, params?.size ?? 20],
    queryFn: () => itemApi.getMyItems(params).then((r) => r.data),
  })
}

/**
 * 찜 토글 — 추가/해제 분리 endpoint 사용
 *
 * 호출부가 현재 isWishlisted 를 인자로 전달해야 정확한 분기 가능.
 *   useToggleWish(id).mutate({ current: item.isWishlisted })
 *
 * (이전엔 detail 캐시에서만 읽어 목록 화면에서 detail 미캐시 시 항상 add 가 호출됐음)
 *
 * 응답이 { wishlisted, wishlistCount } 를 직접 반환하므로 detail 재조회 불필요.
 * optimistic update + 응답으로 동기화.
 */
export function useToggleWish(id: number) {
  const qc = useQueryClient()
  return useMutation<WishlistToggleResponse, Error, { current: boolean }, { prevDetail?: ItemDetail }>({
    mutationFn: async ({ current }) => {
      const res = current
        ? await itemApi.removeWishlist(id)
        : await itemApi.addWishlist(id)
      return res.data
    },
    onMutate: async ({ current }) => {
      await qc.cancelQueries({ queryKey: itemKeys.detail(id) })
      const prevDetail = qc.getQueryData<ItemDetail>(itemKeys.detail(id))
      const next = !current

      // detail 캐시 즉시 갱신
      if (prevDetail) {
        qc.setQueryData<ItemDetail>(itemKeys.detail(id), {
          ...prevDetail,
          isWishlisted: next,
          wishlistCount: prevDetail.wishlistCount + (current ? -1 : 1),
        })
      }

      // 목록 캐시들도 해당 item 만 patch (있으면)
      qc.setQueriesData<PageResponse<Item>>({ queryKey: itemKeys.lists() }, (old) =>
        old
          ? {
              ...old,
              content: old.content.map((it) =>
                it.id === id
                  ? {
                      ...it,
                      isWishlisted: next,
                      wishlistCount: it.wishlistCount + (current ? -1 : 1),
                    }
                  : it,
              ),
            }
          : old,
      )

      return { prevDetail }
    },
    onSuccess: (data) => {
      // 응답 fresh 값으로 정합 (detail 캐시)
      const detail = qc.getQueryData<ItemDetail>(itemKeys.detail(id))
      if (detail) {
        qc.setQueryData<ItemDetail>(itemKeys.detail(id), {
          ...detail,
          isWishlisted: data.wishlisted,
          wishlistCount: data.wishlistCount,
        })
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevDetail) {
        qc.setQueryData(itemKeys.detail(id), ctx.prevDetail)
      }
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
      toast.error('찜 상태를 바꾸지 못했어요.')
    },
    onSettled: () => {
      // 찜 목록 페이지 캐시는 invalidate (해제 시 사라져야 하므로)
      qc.invalidateQueries({ queryKey: itemKeys.wished() })
    },
  })
}

// ── Item 이미지 부분 편집 (PR #67) ──────────────────────────────────────────

/**
 * 이미지 추가 — 미리 S3 업로드된 URL 리스트를 백엔드에 등록 (5장 한도)
 * 응답: 정렬된 전체 imageUrls (첫 번째가 썸네일)
 */
export function useAddItemImages(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (imageUrls: string[]) => itemApi.addImages(id, imageUrls).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.detail(id) })
      qc.invalidateQueries({ queryKey: itemKeys.lists() })  // thumbnailUrl 갱신용
    },
    onError: (err) => {
      if (err instanceof Error) toast.error(err.message)
      else toast.error('이미지 추가에 실패했어요.')
    },
  })
}

/**
 * 이미지 단건 제거 — sortOrder 자동 재정렬, 첫 번째가 새 썸네일
 */
export function useRemoveItemImage(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (imageUrl: string) => itemApi.removeImage(id, imageUrl).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.detail(id) })
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
    },
    onError: () => toast.error('이미지 제거에 실패했어요.'),
  })
}

/**
 * 이미지 순서 변경 — imageUrls 가 기존 set 과 정확히 일치해야 함
 */
export function useReorderItemImages(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (imageUrls: string[]) => itemApi.reorderImages(id, imageUrls).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.detail(id) })
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
    },
    onError: () => toast.error('순서 변경에 실패했어요.'),
  })
}

/**
 * 물품 이미지 업로드 — 검증 + 압축 + presigned URL 발급 + S3 PUT
 * 반환: GET URL 배열 (imageUrls 에 사용)
 */
export function useUploadImages() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      if (files.length === 0) return [] as string[]
      for (const file of files) {
        const err = validateImageFile(file)
        if (err) throw new Error(err)
      }
      const compressed = await Promise.all(files.map(compressImage))
      const results = await uploadImages('ITEM', compressed)
      return results.map((r) => r.getUrl)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '이미지 업로드에 실패했어요.')
    },
  })
}
