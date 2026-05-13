// 알림 페이지 — 가이드 §10.10
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCheck, ChevronLeft, Bell } from 'lucide-react'
import { useNotifications, useMarkAllRead, useMarkRead } from '@/features/notification/hooks'
import type { Notification, NotificationCategory, NotificationLinkType } from '@/features/notification/types'
import { fromNow } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

// 라운드13 PR #116 — 카테고리 탭
type TabKey = 'ALL' | NotificationCategory
const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL',     label: '전체' },
  { key: 'SYSTEM',  label: '시스템' },
  { key: 'REPORT',  label: '신고' },
  { key: 'INQUIRY', label: '문의' },
  { key: 'USER',    label: '활동' },
]

function notificationToHref(noti: Notification): string {
  if (!noti.linkType || noti.linkId == null) return '/notifications'
  const map: Record<NotificationLinkType, string> = {
    CHAT_ROOM:   `/notifications`,                  // 채팅 드로워 진입은 별도 트리거
    TRANSACTION: `/trades/${noti.linkId}`,
    ESCROW:      `/escrow/list/${noti.linkId}`,      // 거래대행 신청
    DELIVERY:    `/delivery/${noti.linkId}/track`,
    ITEM:        `/items/${noti.linkId}`,
    REVIEW:      `/reviews`,
    PAYMENT:     `/point`,
    INQUIRY:     `/mypage/inquiries/${noti.linkId}`,  // 라운드8: 고객지원 답변 알림
  }
  return map[noti.linkType] ?? '/notifications'
}

export default function NotificationPage() {
  const navigate = useNavigate()
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications()
  const { mutate: markAllRead } = useMarkAllRead()
  const { mutate: markRead } = useMarkRead()

  const [tab, setTab] = useState<TabKey>('ALL')

  // 채팅 메시지는 별도 채팅 탭에서 확인 — 알림 페이지에서는 제외
  const all: Notification[] = (data?.pages.flatMap((p) => p.content) ?? []).filter(
    (n) => n.type !== 'CHAT' && n.type !== 'MESSAGE',
  )
  const items = tab === 'ALL' ? all : all.filter((n) => n.category === tab)
  const unreadCountByTab = (key: TabKey) =>
    (key === 'ALL' ? all : all.filter((n) => n.category === key)).filter((n) => !n.read).length

  const handleClick = (noti: Notification) => {
    if (!noti.read) markRead(noti.id)
    const href = notificationToHref(noti)
    if (href !== '/notifications') navigate(href)
  }

  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">알림</h1>
        <button
          onClick={() => markAllRead()}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-primary-500"
        >
          <CheckCheck size={13} /> 모두 읽음
        </button>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-1 overflow-x-auto mb-3 -mx-2 px-2 pb-1">
        {TABS.map((t) => {
          const unread = unreadCountByTab(t.key)
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                active
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300',
              )}
            >
              {t.label}
              {unread > 0 && (
                <span className={cn('ml-1 text-[10px]', active ? 'text-white/90' : 'text-primary-500')}>
                  {unread}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <Bell size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">알림이 없어요</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => handleClick(n)}
                className={cn(
                  'w-full flex flex-col gap-0.5 px-2 py-3 hover:bg-gray-50 transition-colors text-left',
                  !n.read && 'bg-primary-50',
                )}
              >
                <span className="text-sm font-medium text-gray-900">{n.title}</span>
                <span className="text-xs text-gray-500 line-clamp-2">{n.content}</span>
                <span className="text-xs text-gray-400 mt-0.5">{fromNow(n.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-sm text-gray-500 underline"
          >
            {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
          </button>
        </div>
      )}
    </div>
  )
}
