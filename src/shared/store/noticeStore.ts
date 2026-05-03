// 공지/이벤트/새소식 전역 상태: NoticePage·NoticeDetailPage·NoticeWritePage 간 공유
import { create } from 'zustand'

/** 공지 유형 */
export type NoticeType = 'event' | 'news' | 'notice'

/** 공지 아이템 */
export interface NoticeItem {
  id: number
  title: string
  content: string        // HTML 문자열 (편집기 출력)
  type: NoticeType
  date: string
  isRead: boolean
  tags?: string[]
  imageUrl?: string      // 상세 페이지 대표 이미지
}

interface NoticeStore {
  notices: NoticeItem[]
  nextId: number
  /** 공지 추가 */
  addNotice: (notice: Omit<NoticeItem, 'id' | 'date' | 'isRead'>) => void
  /** 공지 수정 */
  updateNotice: (id: number, updates: Partial<Omit<NoticeItem, 'id'>>) => void
  /** 공지 삭제 */
  deleteNotice: (id: number) => void
}

export const useNoticeStore = create<NoticeStore>((set) => ({
  notices: [
    {
      id: 1,
      title: '2024 여름 세일',
      content: '<p>이번 여름, 엄선된 품목을 <strong>최대 50% 할인</strong>된 가격으로 만나보세요!</p><p>기간: 2024년 6월 1일 ~ 8월 31일</p><p>참여 방법: 앱 내 이벤트 배너 클릭 후 응모</p>',
      type: 'event',
      date: '2024-04-15',
      isRead: false,
      tags: ['세일', '여름'],
      imageUrl: '/event1.png',
    },
    {
      id: 2,
      title: '새로운 기능 추가',
      content: '<p>더 나은 사용자 경험을 위해 새로운 기능이 추가되었습니다.</p><ul><li>채팅 이미지 전송 지원</li><li>신뢰 점수 실시간 반영</li><li>거래 대행 서비스 오픈</li></ul>',
      type: 'news',
      date: '2024-04-10',
      isRead: true,
      tags: ['업데이트', '기능'],
    },
    {
      id: 3,
      title: '시스템 점검 공지',
      content: '<p>4월 20일 오전 2시~4시 예정된 시스템 점검이 있습니다.</p><p>점검 시간 동안 서비스 이용이 일시 중단됩니다.</p>',
      type: 'notice',
      date: '2024-04-08',
      isRead: true,
      tags: ['점검'],
    },
  ],
  nextId: 4,

  addNotice: (notice) => set((state) => ({
    notices: [
      {
        ...notice,
        id: state.nextId,
        date: new Date().toISOString().split('T')[0],
        isRead: false,
      },
      ...state.notices,
    ],
    nextId: state.nextId + 1,
  })),

  updateNotice: (id, updates) => set((state) => ({
    notices: state.notices.map((n) => n.id === id ? { ...n, ...updates } : n),
  })),

  deleteNotice: (id) => set((state) => ({
    notices: state.notices.filter((n) => n.id !== id),
  })),
}))
