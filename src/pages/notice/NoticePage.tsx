// 공지 / 이벤트 목록 — 가이드 §10.9
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, ChevronRight, Pin, Plus } from 'lucide-react'
import { useNotices } from '@/features/notice/hooks'
import type { NoticeType } from '@/features/notice/api'
import { useAuthStore } from '@/features/auth/store'
import { formatKst } from '@/shared/lib/date'

export default function NoticePage() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN')
  const [type, setType] = useState<NoticeType | 'all'>('all')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useNotices({
    type: type === 'all' ? undefined : type,
    page,
    size: 20,
  })
  const items = data?.content ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="flex items-center gap-3">
          <Megaphone className="text-primary-500" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">새소식/이벤트</h1>
        </div>
        {isAdmin && (
          <Link
            to="/notices/write"
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={14} /> 글 작성
          </Link>
        )}
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['all', '이벤트', '공지'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t)
              setPage(0)
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              type === t
                ? 'text-primary-500 border-primary-500'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {t === 'all' ? '전체' : t === '이벤트' ? '이벤트/새소식' : '공지사항'}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <p className="text-center py-12 text-sm text-gray-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">등록된 게시물이 없어요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((notice) => (
            <Link
              key={notice.id}
              to={`/notices/${notice.id}`}
              className="block bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          notice.type === '이벤트'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {notice.type}
                      </span>
                      {notice.pinned && (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                          <Pin size={10} /> 고정
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatKst(notice.createdAt, 'yyyy.MM.dd')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{notice.title}</h3>
                    <p className="text-gray-600 line-clamp-2">{notice.content}</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 ml-4 mt-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-3 py-1 text-sm text-gray-500">
            {page + 1} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.hasNext}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
