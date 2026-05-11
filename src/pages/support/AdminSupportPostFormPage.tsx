// 관리자 — FAQ / Q&A 게시글 작성·수정 페이지 (모달 → 페이지로 분리)
//
// 라우트:
//   /support/posts/new         → 신규 등록
//   /support/posts/:id/edit    → 기존 글 수정
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateSupportPost, useUpdateSupportPost, useSupportPostDetail } from '@/features/support/hooks'
import { uploadImages, validateImageFile } from '@/shared/api/upload'
import type { SupportPostType, InquiryCategory } from '@/features/support/types'
import { useAuthStore } from '@/features/auth/store'
import { cn } from '@/shared/lib/cn'

// 1:1 문의 카테고리 — 백엔드 spec 정합
const INQUIRY_CATEGORIES: InquiryCategory[] = ['계정', '거래', '결제', '배송', '기타']

const MAX_POST_IMAGES = 5

export default function AdminSupportPostFormPage() {
  const navigate = useNavigate()
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : undefined
  const isEdit = id != null

  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'

  const create = useCreateSupportPost()
  const update = useUpdateSupportPost()
  const submitting = create.isPending || update.isPending

  const { data: existing, isLoading: loadingDetail } = useSupportPostDetail(id)

  const [postType, setPostType] = useState<SupportPostType>('FAQ')
  const [category, setCategory] = useState<InquiryCategory | ''>('')
  const [question, setQuestion] = useState('')
  const [answer,   setAnswer]   = useState('')
  const [keepUrls, setKeepUrls] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])

  const totalImages = keepUrls.length + newFiles.length

  // 수정 모드 — 기존 데이터 로드 후 prefill
  useEffect(() => {
    if (!existing) return
    setPostType(existing.postType)
    setCategory(existing.category as InquiryCategory)
    setQuestion(existing.question)
    setAnswer(existing.answer)
    setKeepUrls(existing.imageUrls)
  }, [existing])

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    const remaining = MAX_POST_IMAGES - totalImages
    if (remaining <= 0) return
    const valid: File[] = []
    for (const f of files.slice(0, remaining)) {
      const err = validateImageFile(f)
      if (err) { toast.error(err); continue }
      valid.push(f)
    }
    setNewFiles((prev) => [...prev, ...valid])
  }

  const handleSubmit = async () => {
    if (!question.trim() || !answer.trim() || !category) return
    try {
      const uploadedUrls = newFiles.length > 0
        ? (await uploadImages('SUPPORT', newFiles)).map((u) => u.getUrl)
        : []
      const body = {
        postType,
        category,
        question: question.trim(),
        answer: answer.trim(),
        imageUrls: [...keepUrls, ...uploadedUrls],
      }
      if (isEdit && id != null) {
        await update.mutateAsync({ id, body })
        toast.success('수정됐어요.')
      } else {
        await create.mutateAsync(body)
        toast.success('등록됐어요.')
      }
      navigate('/support')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했어요.')
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <p className="text-sm text-gray-500">관리자만 접근할 수 있어요.</p>
      </div>
    )
  }
  if (isEdit && loadingDetail) {
    return <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
  }

  return (
    <div className="max-w-2xl mx-auto w-full pb-10">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-gray-400 hover:text-gray-600"
          aria-label="뒤로"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">
          {isEdit ? 'FAQ / Q&A 수정' : 'FAQ / Q&A 등록'}
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">게시 유형</p>
          <div className="flex gap-2">
            {(['FAQ', 'QNA'] as SupportPostType[]).map((t) => (
              <button
                key={t}
                onClick={() => setPostType(t)}
                className={cn(
                  'flex-1 py-2 text-sm font-medium rounded-xl border-2 transition-colors',
                  postType === t
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300',
                )}
              >
                {t === 'FAQ' ? '자주하는 질문' : 'Q&A'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">카테고리</p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as InquiryCategory | '')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-400 bg-white"
          >
            <option value="">카테고리를 선택해주세요</option>
            {INQUIRY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">질문</p>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="질문을 입력하세요"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-400"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">답변</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={8}
            placeholder="답변 내용을 입력하세요"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-400 resize-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">이미지 첨부</p>
            <p className="text-xs text-gray-400">{totalImages}/{MAX_POST_IMAGES}</p>
          </div>
          {totalImages > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-2">
              {keepUrls.map((url, i) => (
                <div key={`u-${i}`} className="relative">
                  <img src={url} alt="" className="w-full h-16 object-cover rounded-lg border border-gray-200" />
                  <button
                    onClick={() => setKeepUrls((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                  >
                    <X size={9} />
                  </button>
                </div>
              ))}
              {newFiles.map((f, i) => (
                <div key={`f-${i}`} className="relative">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-16 object-cover rounded-lg border border-gray-200" />
                  <button
                    onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                  >
                    <X size={9} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {totalImages < MAX_POST_IMAGES && (
            <label className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-primary-300 hover:text-primary-500 cursor-pointer transition-colors">
              <ImageIcon size={14} />
              이미지 추가
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImages}
              />
            </label>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => navigate('/support')}
            disabled={submitting}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!question.trim() || !answer.trim() || !category || submitting}
            className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {submitting ? '저장 중...' : isEdit ? '수정' : '등록'}
          </button>
        </div>
      </div>
    </div>
  )
}
