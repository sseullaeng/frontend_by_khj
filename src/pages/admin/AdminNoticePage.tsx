// 관리자 공지 관리 — 가이드 §11.4
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Pin, Eye, EyeOff } from 'lucide-react'
import {
  useAdminNotices,
  useCreateNotice,
  useDeleteNotice,
  useSetNoticePinned,
  useSetNoticePublished,
} from '@/features/admin/hooks'
import type { NoticeType, NoticeUpsertRequest } from '@/features/admin/types'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

export default function AdminNoticePage() {
  const [type, setType] = useState<NoticeType | 'all'>('all')
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useAdminNotices({
    type: type === 'all' ? undefined : type,
    page,
    size: 20,
  })
  const { mutate: setPinned } = useSetNoticePinned()
  const { mutate: setPublished } = useSetNoticePublished()
  const { mutate: deleteNotice } = useDeleteNotice()

  const items = data?.content ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">공지 관리</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
        >
          <Plus size={14} /> 공지 추가
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(['all', '공지', '이벤트'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t)
              setPage(0)
            }}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
              type === t
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {t === 'all' ? '전체' : t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-gray-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-gray-400">공지가 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className="p-4 bg-white border border-gray-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      n.type === '이벤트' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700',
                    )}>
                      {n.type}
                    </span>
                    {n.pinned && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">고정</span>
                    )}
                    {!n.published && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">미게시</span>
                    )}
                    <span className="text-xs text-gray-400">{formatKst(n.createdAt, 'yyyy.MM.dd')}</span>
                    <span className="text-xs text-gray-400">조회 {n.viewCount}</span>
                  </div>
                  <p className="font-medium text-gray-900 truncate">{n.title}</p>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{n.content}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => setPinned({ id: n.id, value: !n.pinned })}
                    title={n.pinned ? '고정 해제' : '고정'}
                    className={cn('p-2 rounded', n.pinned ? 'text-red-500' : 'text-gray-400 hover:text-red-500')}
                  >
                    <Pin size={16} />
                  </button>
                  <button
                    onClick={() => setPublished({ id: n.id, value: !n.published })}
                    title={n.published ? '비공개로' : '공개로'}
                    className="p-2 text-gray-500 hover:text-primary-500"
                  >
                    {n.published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('공지를 삭제할까요?')) deleteNotice(n.id)
                    }}
                    title="삭제"
                    className="p-2 text-gray-500 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
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
  const { mutateAsync, isPending } = useCreateNotice()
  const { register, handleSubmit, formState: { errors } } = useForm<NoticeUpsertRequest>({
    defaultValues: { type: '공지' },
  })

  const onSubmit = async (data: NoticeUpsertRequest) => {
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
        <h3 className="font-bold text-gray-900 mb-4">공지 추가</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">유형</label>
            <select {...register('type')} className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500">
              <option value="공지">공지</option>
              <option value="이벤트">이벤트</option>
            </select>
          </div>
          <Input label="제목" error={errors.title?.message} {...register('title', { required: '제목 필수', maxLength: 200 })} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">내용</label>
            <textarea
              {...register('content', { required: true })}
              className="h-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
              placeholder="HTML/Markdown 자유"
            />
          </div>
          <Input label="이미지 URL (선택)" {...register('imageUrl', { maxLength: 500 })} />
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
