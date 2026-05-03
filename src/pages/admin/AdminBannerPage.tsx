// 관리자 배너 관리 — 가이드 §11.3
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import {
  useAdminBanners,
  useCreateBanner,
  useDeleteBanner,
  useSetBannerActive,
} from '@/features/admin/hooks'
import type { BannerUpsertRequest } from '@/features/admin/types'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { formatKst } from '@/shared/lib/date'

export default function AdminBannerPage() {
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useAdminBanners({ page, size: 20 })
  const { mutate: setActive } = useSetBannerActive()
  const { mutate: deleteBanner } = useDeleteBanner()

  const items = data?.content ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">배너 관리</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
        >
          <Plus size={14} /> 배너 추가
        </button>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-gray-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-gray-400">등록된 배너가 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl"
            >
              <img
                src={b.imageUrl}
                alt={b.title}
                className="w-24 h-16 object-cover rounded bg-gray-100"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{b.title}</p>
                <p className="text-xs text-gray-500 truncate">{b.linkUrl ?? '-'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  순서 {b.sortOrder} · {formatKst(b.createdAt, 'yyyy.MM.dd')}
                </p>
              </div>
              <button
                onClick={() => setActive({ id: b.id, active: !b.active })}
                title={b.active ? '비활성화' : '활성화'}
                className="p-2 text-gray-500 hover:text-primary-500"
              >
                {b.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              </button>
              <button
                onClick={() => {
                  if (confirm('배너를 삭제할까요?')) deleteBanner(b.id)
                }}
                title="삭제"
                className="p-2 text-gray-500 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50">
            이전
          </button>
          <span className="px-3 py-1 text-sm text-gray-500">{page + 1} / {data.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={!data.hasNext} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50">
            다음
          </button>
        </div>
      )}

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const { mutateAsync, isPending } = useCreateBanner()
  const { register, handleSubmit, formState: { errors } } = useForm<BannerUpsertRequest>({
    defaultValues: { sortOrder: 0 },
  })

  const onSubmit = async (data: BannerUpsertRequest) => {
    try {
      await mutateAsync({
        ...data,
        startsAt: data.startsAt && data.startsAt.length === 16 ? `${data.startsAt}:00` : data.startsAt,
        endsAt: data.endsAt && data.endsAt.length === 16 ? `${data.endsAt}:00` : data.endsAt,
      })
      onClose()
    } catch {
      // hook 에서 토스트
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-gray-900 mb-4">배너 추가</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Input label="제목" error={errors.title?.message} {...register('title', { required: '제목 필수', maxLength: 200 })} />
          <Input label="이미지 URL" error={errors.imageUrl?.message} {...register('imageUrl', { required: '이미지 URL 필수', maxLength: 500 })} />
          <Input label="링크 URL (선택)" {...register('linkUrl', { maxLength: 500 })} />
          <Input label="정렬 순서 (작을수록 상단)" type="number" {...register('sortOrder', { valueAsNumber: true })} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">시작 시각 (선택)</label>
            <input type="datetime-local" {...register('startsAt')} className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">종료 시각 (선택)</label>
            <input type="datetime-local" {...register('endsAt')} className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500" />
          </div>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium">
              취소
            </button>
            <Button type="submit" isLoading={isPending} className="flex-1">생성</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
