// 공지사항/새소식/이벤트 목록 페이지: 관리자는 글쓰기(페이지 이동)·삭제 가능
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Megaphone, Tag, ChevronRight, PenLine, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { useNoticeStore, type NoticeType } from '@/shared/store/noticeStore'
import { cn } from '@/shared/lib/cn'

// 타입별 라벨·색상 맵
const TYPE_MAP: Record<NoticeType, { label: string; cls: string }> = {
  event:  { label: '이벤트',   cls: 'bg-orange-100 text-orange-700' },
  news:   { label: '새소식',   cls: 'bg-emerald-100 text-emerald-700' },
  notice: { label: '공지사항', cls: 'bg-blue-100 text-blue-700' },
}

// 필터 탭 목록
const FILTER_TABS: { key: 'all' | NoticeType; label: string }[] = [
  { key: 'all',    label: '전체' },
  { key: 'event',  label: '이벤트' },
  { key: 'news',   label: '새소식' },
  { key: 'notice', label: '공지사항' },
]

export default function NoticePage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.role === 'ADMIN'

  const { notices, deleteNotice } = useNoticeStore()

  // 필터 탭 상태
  const [selectedType, setSelectedType] = useState<'all' | NoticeType>('all')
  // 삭제 확인 모달 대상
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  // 필터 적용
  const filteredNotices = notices.filter(
    (n) => selectedType === 'all' || n.type === selectedType
  )

  /** 공지 삭제 처리 */
  const handleDelete = (id: number) => {
    deleteNotice(id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">

      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="text-primary-500" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">새소식/이벤트</h1>
        </div>
        {/* 관리자 글쓰기 버튼 → 글쓰기 페이지로 이동 */}
        {isAdmin && (
          <button
            onClick={() => navigate('/notices/write')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <PenLine size={15} /> 글쓰기
          </button>
        )}
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 border-b border-gray-200">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2',
              selectedType === key
                ? 'text-primary-500 border-primary-500'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 공지 목록 */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => (
          <div key={notice.id} className="relative group">
            <Link
              to={`/notices/${notice.id}`}
              className="block bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 타입 배지 + 읽음 여부 + 날짜 */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', TYPE_MAP[notice.type].cls)}>
                        {TYPE_MAP[notice.type].label}
                      </span>
                      {!notice.isRead && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                      <span className="text-sm text-gray-500">{notice.date}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{notice.title}</h3>
                    {notice.tags && notice.tags.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
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
                    {/* HTML 내용 미리보기 (태그 제거) */}
                    <p className="text-gray-600 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: notice.content.replace(/<[^>]+>/g, ' ').substring(0, 120)
                      }}
                    />
                  </div>
                  <ChevronRight size={20} className="text-gray-400 ml-4 flex-shrink-0" />
                </div>
              </div>
            </Link>

            {/* 관리자 삭제 버튼 (카드 우상단 오버레이) */}
            {isAdmin && (
              <button
                onClick={(e) => { e.preventDefault(); setDeleteTarget(notice.id) }}
                className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg"
                aria-label="삭제"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredNotices.length === 0 && (
        <div className="text-center py-12">
          <Megaphone size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">게시글이 없습니다</p>
        </div>
      )}

      {/* ── 삭제 확인 모달 ── */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">게시글을 삭제할까요?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제된 게시글은 복구할 수 없어요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
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
