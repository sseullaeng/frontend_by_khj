import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { notificationApi } from '../api'
import { fromNow } from '@/shared/lib/date'

interface NotificationDropdownProps {
  onClose: () => void
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['notifications', 'dropdown'],
    queryFn: () => notificationApi.getList({ size: 10 }).then((r) => r.data),
  })

  const { mutate: markAllRead } = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

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
        {data?.content.length === 0 && (
          <li className="py-8 text-center text-sm text-gray-400">알림이 없어요</li>
        )}
        {data?.content.map((n) => (
          <li key={n.id}>
            <Link
              to={n.linkUrl ?? '/notifications'}
              onClick={onClose}
              className={`flex flex-col gap-0.5 px-4 py-3 hover:bg-gray-50 ${
                !n.isRead ? 'bg-primary-50' : ''
              }`}
            >
              <span className="text-sm font-medium text-gray-900">{n.title}</span>
              <span className="text-xs text-gray-500 line-clamp-1">{n.body}</span>
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
