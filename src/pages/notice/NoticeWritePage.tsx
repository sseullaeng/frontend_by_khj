// 공지/이벤트/새소식 글쓰기·수정 페이지 (관리자 전용)
import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Bold, Italic, Underline, List, ListOrdered,
  Heading2, Heading3, Link2, X, ImagePlus, ArrowLeft, Eye, EyeOff,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { useNoticeStore, type NoticeType } from '@/shared/store/noticeStore'
import { cn } from '@/shared/lib/cn'

// 타입별 레이블·색상
const TYPE_MAP: Record<NoticeType, { label: string; cls: string }> = {
  event:  { label: '이벤트',   cls: 'bg-orange-100 text-orange-700 border-orange-300' },
  news:   { label: '새소식',   cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  notice: { label: '공지사항', cls: 'bg-blue-100 text-blue-700 border-blue-300' },
}

const MAX_IMAGES = 50  // 이미지 첨부 최대 장수

export default function NoticeWritePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const editId = id ? parseInt(id) : null  // 수정 모드이면 ID 존재

  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.role === 'ADMIN'
  const { notices, addNotice, updateNotice } = useNoticeStore()

  // 수정 대상 공지
  const editTarget = editId !== null ? notices.find((n) => n.id === editId) : null

  // 편집기 ref (contenteditable div)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 폼 상태
  const [noticeType, setNoticeType] = useState<NoticeType>(editTarget?.type ?? 'notice')
  const [title, setTitle] = useState(editTarget?.title ?? '')
  const [tagInput, setTagInput] = useState(editTarget?.tags?.join(', ') ?? '')
  const [images, setImages] = useState<File[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  // 관리자가 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAdmin) navigate('/', { replace: true })
  }, [isAdmin, navigate])

  // 수정 모드 초기값: 에디터에 기존 HTML 삽입
  useEffect(() => {
    if (editTarget && editorRef.current) {
      editorRef.current.innerHTML = editTarget.content
    }
  }, [editTarget])

  /** execCommand 포맷 적용 */
  const applyFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value ?? undefined)
    editorRef.current?.focus()
  }, [])

  /** 링크 삽입 */
  const insertLink = () => {
    const url = prompt('링크 URL을 입력하세요', 'https://')
    if (url) applyFormat('createLink', url)
  }

  /** 이미지 파일 선택 처리 */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setImages((prev) => [...prev, ...files].slice(0, MAX_IMAGES))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /** 개별 이미지 제거 */
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  /** 미리보기 모드 전환 */
  const togglePreview = () => {
    if (!previewMode) setPreviewHtml(editorRef.current?.innerHTML ?? '')
    setPreviewMode((v) => !v)
  }

  /** 등록/수정 처리 */
  const handleSubmit = () => {
    const content = editorRef.current?.innerHTML ?? ''
    if (!title.trim() || content === '<br>' || content === '' || content === '<div><br></div>') return

    const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean)

    if (editId !== null) {
      // 수정 모드
      updateNotice(editId, { title, content, type: noticeType, tags })
      navigate(`/notices/${editId}`, { replace: true })
    } else {
      // 신규 등록
      addNotice({ title, content, type: noticeType, tags })
      navigate('/notices', { replace: true })
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
          {(['notice', 'news', 'event'] as NoticeType[]).map((t) => (
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
          {/* 미리보기 토글 */}
          <button
            onClick={togglePreview}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-500 transition-colors"
          >
            {previewMode ? <EyeOff size={13} /> : <Eye size={13} />}
            {previewMode ? '편집 모드' : '미리보기'}
          </button>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* 서식 도구 모음 */}
          {!previewMode && (
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
              {/* 제목 */}
              <button
                onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', 'h2') }}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                title="제목2"
              >
                <Heading2 size={15} />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', 'h3') }}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                title="제목3"
              >
                <Heading3 size={15} />
              </button>

              {/* 구분선 */}
              <div className="w-px h-4 bg-gray-300 mx-1" />

              {/* 글자 서식 */}
              <button
                onMouseDown={(e) => { e.preventDefault(); applyFormat('bold') }}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 font-bold text-sm"
                title="굵게"
              >
                <Bold size={15} />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); applyFormat('italic') }}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                title="기울임"
              >
                <Italic size={15} />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); applyFormat('underline') }}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                title="밑줄"
              >
                <Underline size={15} />
              </button>

              {/* 구분선 */}
              <div className="w-px h-4 bg-gray-300 mx-1" />

              {/* 목록 */}
              <button
                onMouseDown={(e) => { e.preventDefault(); applyFormat('insertUnorderedList') }}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                title="글머리 기호"
              >
                <List size={15} />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); applyFormat('insertOrderedList') }}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                title="번호 목록"
              >
                <ListOrdered size={15} />
              </button>

              {/* 구분선 */}
              <div className="w-px h-4 bg-gray-300 mx-1" />

              {/* 링크 */}
              <button
                onMouseDown={(e) => { e.preventDefault(); insertLink() }}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                title="링크 삽입"
              >
                <Link2 size={15} />
              </button>
            </div>
          )}

          {/* 편집 영역 */}
          {previewMode ? (
            // 미리보기
            <div
              className="min-h-[240px] px-4 py-3 prose prose-sm max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            // 편집 (contenteditable)
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="min-h-[240px] px-4 py-3 text-sm text-gray-800 focus:outline-none leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-0.5 [&_a]:text-primary-600 [&_a]:underline"
              data-placeholder="내용을 입력하세요..."
              style={{ position: 'relative' }}
              onFocus={(e) => {
                if (e.currentTarget.innerHTML === '') {
                  // 포커스 시 placeholder 제거
                }
              }}
            />
          )}
        </div>

        {/* placeholder 스타일 (빈 에디터) */}
        <style>{`
          [data-placeholder]:empty::before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `}</style>
      </div>

      {/* 이미지 첨부 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-gray-600">이미지 첨부</label>
          <span className={cn(
            'text-xs font-medium',
            images.length >= MAX_IMAGES ? 'text-red-500' : 'text-gray-400'
          )}>
            {images.length} / {MAX_IMAGES}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* 추가 버튼 */}
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

          {/* 썸네일 */}
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

      {/* 태그 */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          태그 <span className="font-normal text-gray-400">(콤마로 구분)</span>
        </label>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="예: 이벤트, 세일, 공지"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
        />
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {editId !== null ? '수정 완료' : '등록'}
        </button>
      </div>
    </div>
  )
}
