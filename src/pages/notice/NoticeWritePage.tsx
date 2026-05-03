// 공지/이벤트 글쓰기·수정 페이지 (관리자 전용) — 백엔드 hook 연동
//
// 백엔드 NoticeType 은 '공지' | '이벤트' 두 가지. main 의 'news'(새소식) 옵션은 '공지' 로 매핑.
// 이미지 첨부 UI 는 보존하되, 현재 백엔드 imageUrl 단일 + NOTICE upload purpose 미합의 → 미전송 (TODO).
import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Bold, Italic, Underline, List, ListOrdered,
  Heading2, Heading3, Link2, X, ImagePlus, ArrowLeft, Eye, EyeOff,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { useCreateNotice, useUpdateNotice } from '@/features/admin/hooks'
import { useNoticeDetail } from '@/features/notice/hooks'
import type { NoticeType } from '@/features/admin/types'
import { cn } from '@/shared/lib/cn'

// UI 표시용 type — 백엔드에는 '공지' | '이벤트' 만 존재. 'news' 는 '공지' 로 보냄.
type LocalNoticeType = 'notice' | 'news' | 'event'

const TYPE_MAP: Record<LocalNoticeType, { label: string; cls: string }> = {
  event:  { label: '이벤트',   cls: 'bg-orange-100 text-orange-700 border-orange-300' },
  news:   { label: '새소식',   cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  notice: { label: '공지사항', cls: 'bg-blue-100 text-blue-700 border-blue-300' },
}

const toBackendType = (t: LocalNoticeType): NoticeType =>
  t === 'event' ? '이벤트' : '공지'

const toLocalType = (t: NoticeType): LocalNoticeType =>
  t === '이벤트' ? 'event' : 'notice'

const MAX_IMAGES = 50

export default function NoticeWritePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const editId = id ? parseInt(id) : null

  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.role === 'ADMIN'

  // 수정 모드: 기존 공지 fetch
  const { data: editTarget } = useNoticeDetail(editId ?? 0)
  const create = useCreateNotice()
  const update = useUpdateNotice()
  const submitting = create.isPending || update.isPending

  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [noticeType, setNoticeType] = useState<LocalNoticeType>('notice')
  const [title, setTitle] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  // 관리자 가드
  useEffect(() => {
    if (!isAdmin) navigate('/', { replace: true })
  }, [isAdmin, navigate])

  // 수정 모드 — 폼 초기값 채우기 (편집기는 별도 effect 에서)
  const initialFromServer = useMemo(() => {
    if (!editId || !editTarget) return null
    return {
      type: toLocalType(editTarget.type),
      title: editTarget.title,
      content: editTarget.content,
    }
  }, [editId, editTarget])

  useEffect(() => {
    if (!initialFromServer) return
    setNoticeType(initialFromServer.type)
    setTitle(initialFromServer.title)
    if (editorRef.current) {
      editorRef.current.innerHTML = initialFromServer.content
    }
  }, [initialFromServer])

  const applyFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value ?? undefined)
    editorRef.current?.focus()
  }, [])

  const insertLink = () => {
    const url = prompt('링크 URL을 입력하세요', 'https://')
    if (url) applyFormat('createLink', url)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setImages((prev) => [...prev, ...files].slice(0, MAX_IMAGES))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const togglePreview = () => {
    if (!previewMode) setPreviewHtml(editorRef.current?.innerHTML ?? '')
    setPreviewMode((v) => !v)
  }

  const handleSubmit = async () => {
    const content = editorRef.current?.innerHTML ?? ''
    if (!title.trim() || content === '<br>' || content === '' || content === '<div><br></div>') return

    // TODO: 이미지 첨부 — 백엔드 NOTICE upload purpose 합의 후 S3 업로드 → imageUrl 전송
    const body = {
      type: toBackendType(noticeType),
      title: title.trim(),
      content,
    }

    try {
      if (editId !== null) {
        await update.mutateAsync({ id: editId, body })
        navigate(`/notices/${editId}`, { replace: true })
      } else {
        await create.mutateAsync(body)
        navigate('/notices', { replace: true })
      }
    } catch {
      // hook 에서 토스트 처리됨
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">

      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {editId !== null ? '글 수정' : '새 글 작성'}
        </h1>
      </div>

      {/* 유형 선택 */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">유형</label>
        <div className="flex gap-2">
          {(['notice', 'news', 'event'] as LocalNoticeType[]).map((t) => (
            <button
              key={t}
              onClick={() => setNoticeType(t)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors',
                noticeType === t
                  ? TYPE_MAP[t].cls
                  : 'text-gray-500 border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              {TYPE_MAP[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* 제목 */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
        />
      </div>

      {/* 텍스트 편집기 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-gray-600">내용</label>
          <button
            onClick={togglePreview}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-500 transition-colors"
          >
            {previewMode ? <EyeOff size={13} /> : <Eye size={13} />}
            {previewMode ? '편집 모드' : '미리보기'}
          </button>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          {!previewMode && (
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
              <button onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', 'h2') }} className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600" title="제목2"><Heading2 size={15} /></button>
              <button onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', 'h3') }} className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600" title="제목3"><Heading3 size={15} /></button>
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <button onMouseDown={(e) => { e.preventDefault(); applyFormat('bold') }} className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 font-bold text-sm" title="굵게"><Bold size={15} /></button>
              <button onMouseDown={(e) => { e.preventDefault(); applyFormat('italic') }} className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600" title="기울임"><Italic size={15} /></button>
              <button onMouseDown={(e) => { e.preventDefault(); applyFormat('underline') }} className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600" title="밑줄"><Underline size={15} /></button>
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <button onMouseDown={(e) => { e.preventDefault(); applyFormat('insertUnorderedList') }} className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600" title="글머리 기호"><List size={15} /></button>
              <button onMouseDown={(e) => { e.preventDefault(); applyFormat('insertOrderedList') }} className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600" title="번호 목록"><ListOrdered size={15} /></button>
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <button onMouseDown={(e) => { e.preventDefault(); insertLink() }} className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600" title="링크 삽입"><Link2 size={15} /></button>
            </div>
          )}

          {previewMode ? (
            <div
              className="min-h-[240px] px-4 py-3 prose prose-sm max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="min-h-[240px] px-4 py-3 text-sm text-gray-800 focus:outline-none leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-0.5 [&_a]:text-primary-600 [&_a]:underline"
              data-placeholder="내용을 입력하세요..."
              style={{ position: 'relative' }}
            />
          )}
        </div>

        <style>{`
          [data-placeholder]:empty::before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `}</style>
      </div>

      {/* 이미지 첨부 (TODO: 백엔드 NOTICE upload purpose 합의 후 활성화) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-gray-600">
            이미지 첨부
            <span className="ml-1.5 text-[10px] font-normal text-amber-600">백엔드 합의 대기 — 미전송</span>
          </label>
          <span className={cn(
            'text-xs font-medium',
            images.length >= MAX_IMAGES ? 'text-red-500' : 'text-gray-400'
          )}>
            {images.length} / {MAX_IMAGES}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-primary-500 transition-colors flex-shrink-0"
            >
              <ImagePlus size={18} />
              <span className="text-[10px] font-medium">추가</span>
            </button>
          )}

          {images.map((file, i) => (
            <div key={i} className="relative w-16 h-16 flex-shrink-0 group">
              <img
                src={URL.createObjectURL(file)}
                alt={`첨부 ${i + 1}`}
                className="w-full h-full object-cover rounded-xl border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          disabled={submitting}
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || submitting}
          className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {submitting ? '저장 중...' : editId !== null ? '수정 완료' : '등록'}
        </button>
      </div>
    </div>
  )
}
