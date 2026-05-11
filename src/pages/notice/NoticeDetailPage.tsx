// 공지/이벤트 상세 — 가이드 §10.9 (viewCount 자동 +1)
import { useParams, Link } from 'react-router-dom'
import { Calendar, Megaphone, ArrowLeft, Eye } from 'lucide-react'
import { useNoticeDetail } from '@/features/notice/hooks'
import { formatKst } from '@/shared/lib/date'

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const noticeId = Number(id)
  const { data: notice, isLoading, isError } = useNoticeDetail(noticeId)

  if (isLoading) {
    return <p className="text-center py-12 text-sm text-gray-400">불러오는 중...</p>
  }

  if (isError || !notice) {
    return (
      <div className="text-center py-12">
        <Megaphone size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">게시물을 찾을 수 없어요.</p>
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
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <Link
        to="/notices"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>새소식/이벤트</span>
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              notice.type === '이벤트'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {notice.type}
          </span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={16} />
            <span>{formatKst(notice.createdAt, 'yyyy.MM.dd')}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Eye size={14} />
            <span>{notice.viewCount.toLocaleString()}</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{notice.title}</h1>

        {notice.imageUrl && (
          <img
            src={notice.imageUrl}
            alt={notice.title}
            className="w-full max-h-96 object-cover rounded-lg mb-4"
          />
        )}

        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
        </div>
      </div>

      <div>
        <Link
          to="/notices"
          className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          목록으로
        </Link>
      </div>
    </div>
  )
}
