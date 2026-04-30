import { useParams, Link } from 'react-router-dom'
import { Calendar, Megaphone, ArrowLeft } from 'lucide-react'

interface NoticeItem {
  id: number
  title: string
  content: string
  type: 'notice' | 'event'
  date: string
  isRead: boolean
  tags?: string[]
}

const mockNotices: NoticeItem[] = [
  {
    id: 1,
    title: '2024 여름 세일',
    content: '이번 여름, 엄선된 품목을 최대 50% 할인된 가격으로 만나보세요!',
    type: 'event',
    date: '2024-04-15',
    isRead: false
  },
  {
    id: 2,
    title: '새로운 기능 추가',
    content: '더 나은 사용자 경험을 위해 새로운 기능이 추가되었습니다.',
    type: 'notice',
    date: '2024-04-10',
    isRead: true
  },
  {
    id: 3,
    title: '시스템 점검 공지',
    content: '4월 20일 예정된 시스템 점검이 있습니다.',
    type: 'notice',
    date: '2024-04-08',
    isRead: true
  }
]

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const noticeId = parseInt(id || '1')
  
  const notice = mockNotices.find((n: NoticeItem) => n.id === noticeId)
  
  if (!notice) {
    return (
      <div className="text-center py-12">
        <Megaphone size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">새소식/이벤트</p>
        <p className="text-gray-500">새소식/이벤트</p>
        <Link 
          to="/notices" 
          className="inline-block mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          새소식/이벤트
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link 
        to="/notices"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>새소식/이벤트</span>
      </Link>

      {/* Notice Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              notice.type === 'event'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {notice.type === 'event' ? '이벤트' : '공지사항'}
          </span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={16} />
            <span>{notice.date}</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {notice.title}
        </h1>
        
        
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {notice.content}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link 
          to="/notices"
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          목록으로
        </Link>
      </div>
    </div>
  )
}
