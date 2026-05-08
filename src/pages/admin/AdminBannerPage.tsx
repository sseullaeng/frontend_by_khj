// 관리자 배너 관리 — 메인 배너(§10.8 / §11.3) CRUD + 이미지 업로드
//
// 흐름:
//   1) 목록: GET /api/v1/admin/banners (active=false 포함)
//   2) 새 배너 / 수정: 이미지 업로드(presigned URL purpose=BANNER) → imageUrl 채움 → upsert
//   3) 활성 토글: PATCH /api/v1/admin/banners/{id}/active
//   4) 삭제: DELETE /api/v1/admin/banners/{id} (hard delete)
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Image as ImageIcon, Plus, Pencil, Trash2, ExternalLink, X } from 'lucide-react'
import {
  useAdminBanners,
  useCreateBanner,
  useUpdateBanner,
  useSetBannerActive,
  useDeleteBanner,
} from '@/features/admin/hooks'
import type { Banner, BannerUpsertRequest } from '@/features/admin/types'
import { uploadSingleImage, validateImageFile } from '@/shared/api/upload'
import { Button } from '@/shared/ui/Button'
import { fromNow } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

export default function AdminBannerPage() {
  const { data, isLoading } = useAdminBanners({ page: 0, size: 50 })
  const banners = data?.content ?? []

  const [editing, setEditing] = useState<Banner | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">배너 관리</h1>
        <Button onClick={() => setCreating(true)} variant="primary">
          <Plus size={16} className="mr-1" />
          새 배너
        </Button>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : banners.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">등록된 배너가 없어요. 새 배너를 만들어 주세요.</p>
      ) : (
        <ul className="grid gap-3">
          {banners.map((b) => (
            <BannerRow key={b.id} banner={b} onEdit={() => setEditing(b)} />
          ))}
        </ul>
      )}

      {(creating || editing) && (
        <BannerFormModal
          initial={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

// ── 행 컴포넌트 ──────────────────────────────────────────────────────────────

function BannerRow({ banner, onEdit }: { banner: Banner; onEdit: () => void }) {
  const setActive = useSetBannerActive()
  const remove    = useDeleteBanner()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <li className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
      {/* 이미지 미리보기 */}
      <div className="w-32 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
        {banner.imageUrl ? (
          <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={20} className="text-gray-300" />
        )}
      </div>

      {/* 메타 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[11px] font-medium',
            banner.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500',
          )}>
            {banner.active ? '활성' : '비활성'}
          </span>
          <span className="text-[11px] text-gray-400">순서 {banner.sortOrder}</span>
          {banner.linkUrl && (
            <a
              href={banner.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary-500 hover:underline"
            >
              {banner.linkUrl}
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        <p className="font-semibold text-gray-900 truncate">{banner.title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {banner.startsAt ? fmtDateTime(banner.startsAt) : '시작 미지정'}
          {' ~ '}
          {banner.endsAt ? fmtDateTime(banner.endsAt) : '종료 미지정'}
          {' · 등록 '}{fromNow(banner.createdAt)}
        </p>
      </div>

      {/* 액션 */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setActive.mutate({ id: banner.id, active: !banner.active })}
          disabled={setActive.isPending}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium border',
            banner.active
              ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
          )}
        >
          {banner.active ? '비활성' : '활성'}
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md text-gray-500 hover:text-primary-600 hover:bg-gray-100"
          aria-label="수정"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          className="p-1.5 rounded-md text-gray-500 hover:text-red-500 hover:bg-red-50"
          aria-label="삭제"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* 삭제 확인 모달 */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">배너를 삭제할까요?</h3>
            <p className="text-sm text-gray-500 mb-4">"{banner.title}" 배너가 영구 삭제됩니다.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
              >
                취소
              </button>
              <button
                onClick={() => remove.mutate(banner.id, { onSuccess: () => setConfirmOpen(false) })}
                disabled={remove.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

// ── 등록/수정 모달 ───────────────────────────────────────────────────────────

function BannerFormModal({
  initial, onClose,
}: { initial: Banner | null; onClose: () => void }) {
  const isEdit = !!initial
  const create = useCreateBanner()
  const update = useUpdateBanner()

  const [title,     setTitle]     = useState(initial?.title ?? '')
  const [linkUrl,   setLinkUrl]   = useState(initial?.linkUrl ?? '')
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0)
  const [startsAt,  setStartsAt]  = useState(toDateTimeLocal(initial?.startsAt))
  const [endsAt,    setEndsAt]    = useState(toDateTimeLocal(initial?.endsAt))
  const [imageUrl,  setImageUrl]  = useState(initial?.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ESC 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handlePickImage = async (file: File) => {
    const err = validateImageFile(file)
    if (err) { toast.error(err); return }
    try {
      setUploading(true)
      const { getUrl } = await uploadSingleImage('BANNER', file)
      setImageUrl(getUrl)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '이미지 업로드에 실패했어요.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = () => {
    const t = title.trim()
    if (!t)        { toast.error('제목을 입력해 주세요.'); return }
    if (!imageUrl) { toast.error('배너 이미지를 업로드해 주세요.'); return }

    const body: BannerUpsertRequest = {
      title:     t,
      imageUrl,
      linkUrl:   linkUrl.trim() || undefined,
      sortOrder,
      startsAt:  fromDateTimeLocal(startsAt),
      endsAt:    fromDateTimeLocal(endsAt),
    }

    if (isEdit && initial) {
      update.mutate({ id: initial.id, body }, { onSuccess: onClose })
    } else {
      create.mutate(body, { onSuccess: onClose })
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{isEdit ? '배너 수정' : '새 배너 등록'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 이미지 업로드 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              배너 이미지 <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative w-full h-40 rounded-xl border border-dashed border-gray-300 overflow-hidden cursor-pointer hover:border-primary-400 transition-colors',
                imageUrl ? 'bg-gray-100' : 'bg-gray-50 flex items-center justify-center',
              )}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="미리보기" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <ImageIcon size={28} className="text-gray-300 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">클릭하여 이미지 선택</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">JPG/PNG/WEBP, 최대 5MB</p>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs text-gray-600">
                  업로드 중...
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) handlePickImage(f)
              }}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              권장 비율 16:5 (예: 1600 × 500). 메인 배너 슬라이더에 cover 로 표시됩니다.
            </p>
          </div>

          {/* 제목 */}
          <Field label="제목" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="예: 5월 봄맞이 이벤트"
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
            />
          </Field>

          {/* 링크 */}
          <Field label="클릭 시 이동 경로" hint="비워두면 클릭 비활성">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              maxLength={500}
              placeholder="/events/spring 또는 https://..."
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
            />
          </Field>

          {/* 정렬 순서 */}
          <Field label="정렬 순서" hint="작은 숫자가 먼저 노출">
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
            />
          </Field>

          {/* 노출 기간 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="시작 (선택)">
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
              />
            </Field>
            <Field label="종료 (선택)">
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
              />
            </Field>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
          >
            취소
          </button>
          <Button onClick={handleSubmit} isLoading={isPending} disabled={uploading} fullWidth>
            {isEdit ? '수정' : '등록'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  )
}

// ── 날짜 변환 ────────────────────────────────────────────────────────────────
// 백엔드 LocalDateTime 'YYYY-MM-DDTHH:mm:ss' ↔ datetime-local input 'YYYY-MM-DDTHH:mm'

function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.length >= 16 ? iso.slice(0, 16) : iso
}

function fromDateTimeLocal(local: string): string | undefined {
  if (!local) return undefined
  return local.length === 16 ? `${local}:00` : local
}

function fmtDateTime(iso: string): string {
  if (iso.length < 16) return iso
  return iso.slice(0, 16).replace('T', ' ')
}
