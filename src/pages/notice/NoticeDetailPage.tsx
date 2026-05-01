// 공지사항 상세 페이지 컴포넌트: 특정 공지사항의 전체 내용을 표시하는 페이지
import { useParams, Link } from 'react-router-dom'  // React Router 훅 및 컴포넌트
import { Calendar, Megaphone, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react'  // Lucide 아이콘들

// 공지사항 아이템 인터페이스: 공지사항 데이터 구조 정의
interface NoticeItem {
  id: number                    // 공지사항 고유 ID
  title: string                 // 공지사항 제목
  content: string               // 공지사항 내용
  type: 'notice' | 'event'     // 공지사항 타입 (공지/이벤트)
  date: string                  // 게시일
  isRead: boolean              // 읽음 여부
  tags?: string[]              // 태그 목록 (선택사항)
}

// 모의 공지사항 데이터: 개발용 샘플 데이터
const mockNotices: NoticeItem[] = [
  {
    id: 1,
    title: '2024 여름 세일',
    content: '이번 여름, 엄선된 품목을 최대 50% 할인된 가격으로 만나보세요!',
    type: 'event',  // 이벤트 타입
    date: '2024-04-15',
    isRead: false   // 읽지 않은 상태
  },
  {
    id: 2,
    title: '새로운 기능 추가',
    content: '더 나은 사용자 경험을 위해 새로운 기능이 추가되었습니다.',
    type: 'notice',  // 공지 타입
    date: '2024-04-10',
    isRead: true    // 읽은 상태
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
  const currentIndex = mockNotices.findIndex((n: NoticeItem) => n.id === noticeId)
  const previousNotice = currentIndex > 0 ? mockNotices[currentIndex - 1] : null
  const nextNotice = currentIndex < mockNotices.length - 1 ? mockNotices[currentIndex + 1] : null
  
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

      {/* Navigation */}
      <div className="flex gap-4 items-center">
        <Link 
          to="/notices"
          className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          목록으로
        </Link>
        
        {/* Previous/Next Navigation */}
        <div className="flex flex-col gap-2 flex-1">
          {previousNotice && (
            <Link
              to={`/notices/${previousNotice.id}`}
              className="flex items-center gap-2 px-4 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs min-w-0"
            >
              <ChevronUp size={14} />
              <div className="text-left flex-1">
                <div className="font-medium text-gray-900 line-clamp-1">{previousNotice.title}</div>
              </div>
            </Link>
          )}
          
          {nextNotice && (
            <Link
              to={`/notices/${nextNotice.id}`}
              className="flex items-center gap-2 px-4 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs min-w-0"
            >
              <ChevronDown size={14} />
              <div className="text-left flex-1">
                <div className="font-medium text-gray-900 line-clamp-1">{nextNotice.title}</div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
