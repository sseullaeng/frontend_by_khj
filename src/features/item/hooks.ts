import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { itemApi } from './api'
import { itemKeys } from './keys'
import { compressImage } from '@/shared/lib/imageCompress'
import type { ItemCreateRequest, ItemFilter, ItemUpdateRequest } from './types'

export function useItemList(filter: ItemFilter) {
  return useInfiniteQuery({
    queryKey: itemKeys.list(filter),
    queryFn: ({ pageParam = 0 }) =>
      itemApi.getList({ ...filter, page: pageParam }).then((r) => r.data),
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    initialPageParam: 0,
  })
}

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
      toast.success('상품이 수정됐어요!')
    },
  })
}

export function useToggleWish(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => itemApi.toggleWish(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.detail(id) })
      qc.invalidateQueries({ queryKey: itemKeys.wished() })
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
