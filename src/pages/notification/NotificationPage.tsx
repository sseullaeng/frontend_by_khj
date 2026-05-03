// 알림 페이지 — 가이드 §10.10
import { useNavigate } from 'react-router-dom'
import { CheckCheck, ChevronLeft, Bell } from 'lucide-react'
import { useNotifications, useMarkAllRead, useMarkRead } from '@/features/notification/hooks'
import type { Notification, NotificationLinkType } from '@/features/notification/types'
import { fromNow } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

function notificationToHref(noti: Notification): string {
  if (!noti.linkType || noti.linkId == null) return '/notifications'
  const map: Record<NotificationLinkType, string> = {
    CHAT_ROOM:   `/notifications`,                  // 채팅 드로워 진입은 별도 트리거
    TRANSACTION: `/trades/${noti.linkId}`,
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

  const items: Notification[] = data?.pages.flatMap((p) => p.content) ?? []

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
