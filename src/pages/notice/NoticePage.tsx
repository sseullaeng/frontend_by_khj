import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, Tag, ChevronRight } from 'lucide-react'

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
    content: '선택된 상품 최대 50% 할인을 즐겨보세요!',
    type: 'event',
    date: '2024-04-15',
    isRead: false,
    tags: ['세일', '여름']
  },
  {
    id: 2,
    title: '새로운 기능 추가',
    content: '더 나은 사용자 경험을 위해 새로운 기능이 추가되었습니다.',
    type: 'notice',
    date: '2024-04-10',
    isRead: true,
    tags: ['업데이트', '기능']
  },
  {
    id: 3,
    title: '시스템 점검 공지',
    content: '4월 20일 예정된 시스템 점검이 있습니다.',
    type: 'notice',
    date: '2024-04-08',
    isRead: true,
    tags: ['점검']
  }
]

export default function NoticePage() {
  const [selectedType, setSelectedType] = useState<'all' | 'notice' | 'event'>('all')

  const filteredNotices = mockNotices.filter(notice => 
    selectedType === 'all' || notice.type === selectedType
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <div className="flex items-center gap-3">
          <Megaphone className="text-primary-500" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">새소식/이벤트</h1>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            selectedType === 'all'
              ? 'text-primary-500 border-primary-500'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setSelectedType('event')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            selectedType === 'event'
              ? 'text-primary-500 border-primary-500'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          이벤트/새소식
        </button>
        <button
          onClick={() => setSelectedType('notice')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            selectedType === 'notice'
              ? 'text-primary-500 border-primary-500'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          공지사항
        </button>
      </div>

      {/* Notice List */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => (
          <Link
            key={notice.id}
            to={`/notices/${notice.id}`}
            className="block bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        notice.type === 'event'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {notice.type === 'event' ? '이벤트' : '공지사항'}
                    </span>
                    {!notice.isRead && (
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                    )}
                    <span className="text-sm text-gray-500">{notice.date}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {notice.title}
                  </h3>
                  
                  {notice.tags && (
                    <div className="flex items-center gap-2 mb-3">
                      <Tag size={14} className="text-gray-400" />
                      <div className="flex gap-1">
                        {notice.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-gray-600 line-clamp-2">
                    {notice.content}
                  </p>
                </div>
                
                <div className="ml-4">
                  <ChevronRight
                    size={20}
                    className="text-gray-400"
                  />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredNotices.length === 0 && (
        <div className="text-center py-12">
          <Megaphone size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">New & Events</p>
        </div>
      )}
    </div>
  )
}
