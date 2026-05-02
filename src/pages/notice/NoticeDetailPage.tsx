// 공지사항 상세 페이지: 내용 열람 + 관리자는 수정·삭제 가능
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, Megaphone, ArrowLeft, ChevronUp, ChevronDown, PenLine, Trash2, Tag } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { useNoticeStore, type NoticeType } from '@/shared/store/noticeStore'
import { cn } from '@/shared/lib/cn'

// 타입별 라벨·색상
const TYPE_MAP: Record<NoticeType, { label: string; cls: string }> = {
  event:  { label: '이벤트',   cls: 'bg-orange-100 text-orange-700' },
  news:   { label: '새소식',   cls: 'bg-emerald-100 text-emerald-700' },
  notice: { label: '공지사항', cls: 'bg-blue-100 text-blue-700' },
}

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const noticeId = parseInt(id ?? '1')

  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.role === 'ADMIN'

  const { notices, deleteNotice } = useNoticeStore()

  // 삭제 확인 모달
  const [deleteOpen, setDeleteOpen] = useState(false)

  const notice = notices.find((n) => n.id === noticeId)
  const currentIndex = notices.findIndex((n) => n.id === noticeId)
  const previousNotice = currentIndex > 0 ? notices[currentIndex - 1] : null
  const nextNotice = currentIndex < notices.length - 1 ? notices[currentIndex + 1] : null

  /** 삭제 확인 후 목록으로 이동 */
  const handleDelete = () => {
    deleteNotice(noticeId)
    navigate('/notices', { replace: true })
  }

  if (!notice) {
    return (
      <div className="text-center py-12">
        <Megaphone size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">게시글을 찾을 수 없어요.</p>
        <Link
          to="/notices"
          className="inline-block mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          목록으로
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* 뒤로 가기 + 관리자 액션 */}
      <div className="flex items-center justify-between">
        <Link
          to="/notices"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>새소식/이벤트</span>
        </Link>

        {/* 관리자 수정·삭제 버튼 */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/notices/${noticeId}/edit`)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <PenLine size={14} />
              수정
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 공지 본문 카드 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* 대표 이미지 (있을 경우만) */}
        {notice.imageUrl && (
          <div className="w-full">
            <img
              src={notice.imageUrl}
              alt={notice.title}
              className="w-full h-auto object-contain"
            />
          </div>
        )}

        <div className="p-6">
          {/* 타입 배지 + 날짜 */}
          <div className="flex items-center gap-3 mb-4">
            <span className={cn('px-3 py-1 text-sm font-medium rounded-full', TYPE_MAP[notice.type].cls)}>
              {TYPE_MAP[notice.type].label}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>{notice.date}</span>
            </div>
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{notice.title}</h1>

          {/* 태그 */}
          {notice.tags && notice.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Tag size={14} className="text-gray-400" />
              <div className="flex gap-1 flex-wrap">
                {notice.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* HTML 내용 렌더링 */}
          <div
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-0.5 [&_a]:text-primary-600 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: notice.content }}
          />
        </div>
      </div>

      {/* 이전 / 다음 + 목록 */}
      <div className="flex gap-4 items-center">
        <Link
          to="/notices"
          className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm shrink-0"
        >
          목록으로
        </Link>

        <div className="flex flex-col gap-2 flex-1">
          {previousNotice && (
            <Link
              to={`/notices/${previousNotice.id}`}
              className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs min-w-0"
            >
              <ChevronUp size={14} className="shrink-0" />
              <span className="font-medium text-gray-900 line-clamp-1">{previousNotice.title}</span>
            </Link>
          )}
          {nextNotice && (
            <Link
              to={`/notices/${nextNotice.id}`}
              className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs min-w-0"
            >
              <ChevronDown size={14} className="shrink-0" />
              <span className="font-medium text-gray-900 line-clamp-1">{nextNotice.title}</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── 삭제 확인 모달 ── */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">게시글을 삭제할까요?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제된 게시글은 복구할 수 없어요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
