// 알림 드롭다운 — 가이드 §10.10 정합
import { Link } from 'react-router-dom'
import { useNotifications, useMarkAllRead } from '../hooks'
import { fromNow } from '@/shared/lib/date'
import type { Notification, NotificationLinkType } from '../types'

interface Props {
  onClose: () => void
}

// linkType + linkId → 라우트 매핑
function notificationToHref(noti: Notification): string {
  if (!noti.linkType || noti.linkId == null) return '/notifications'
  const map: Record<NotificationLinkType, string> = {
    CHAT_ROOM:   `/notifications`,                  // 채팅 드로워 진입은 별도 트리거
    TRANSACTION: `/trades/${noti.linkId}`,
    DELIVERY:    `/delivery/${noti.linkId}/track`,
    ITEM:        `/items/${noti.linkId}`,
    REVIEW:      `/reviews`,
    PAYMENT:     `/point`,
  }
  return map[noti.linkType] ?? '/notifications'
}

export default function NotificationDropdown({ onClose }: Props) {
  const { data } = useNotifications()
  const { mutate: markAllRead } = useMarkAllRead()
  const recent = data?.pages[0]?.content?.slice(0, 10) ?? []

  return (
    <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-sm">알림</span>
        <button
          onClick={() => markAllRead()}
          className="text-xs text-gray-400 hover:text-primary-500"
        >
          모두 읽음
        </button>
      </div>

      <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100">
        {recent.length === 0 && (
          <li className="py-8 text-center text-sm text-gray-400">알림이 없어요</li>
        )}
        {recent.map((n) => (
          <li key={n.id}>
            <Link
              to={notificationToHref(n)}
              onClick={onClose}
              className={`flex flex-col gap-0.5 px-4 py-3 hover:bg-gray-50 ${
                !n.read ? 'bg-primary-50' : ''
              }`}
            >
              <span className="text-sm font-medium text-gray-900">{n.title}</span>
              <span className="text-xs text-gray-500 line-clamp-1">{n.content}</span>
              <span className="text-xs text-gray-400">{fromNow(n.createdAt)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to="/notifications"
        onClick={onClose}
        className="block text-center py-3 text-sm text-primary-500 font-medium border-t border-gray-100 hover:bg-gray-50"
      >
        전체 알림 보기
      </Link>
    </div>
  )
}
