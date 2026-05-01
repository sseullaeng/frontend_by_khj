import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, MessageCircle, Bell, CheckCheck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDrawerStore } from '@/shared/store/drawerStore'
import { chatApi } from '@/features/chat/api'
import { notificationApi } from '@/features/notification/api'
import { fromNow } from '@/shared/lib/date'

export default function SideDrawer() {
  const { activeTab, open, close } = useDrawerStore()
  const isOpen = activeTab !== null

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [close])

  // 드로어 열릴 때 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* 블러 오버레이 */}
      <div
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 슬라이드 패널 */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-1/2 bg-white shadow-2xl z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* 헤더 탭 */}
        <div className="flex items-center border-b border-gray-200 shrink-0">
          <button
            onClick={() => open('chat')}
            className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageCircle size={16} />
            채팅
          </button>
          <button
            onClick={() => open('notification')}
            className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'notification'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bell size={16} />
            알림
          </button>
          <button
            onClick={close}
            className="ml-auto px-4 py-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chat'         && <ChatPanel />}
          {activeTab === 'notification' && <NotificationPanel />}
        </div>
      </aside>
    </>
  )
}

/* ── 채팅 패널 ── */
function ChatPanel() {
  const close = useDrawerStore(s => s.close)

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['chat', 'rooms'],
    queryFn: () => chatApi.getRooms().then(r => r.data),
  })

  if (isLoading) return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>

  if (!rooms?.length) return (
    <p className="py-16 text-center text-sm text-gray-400">진행 중인 채팅이 없어요</p>
  )

  return (
    <ul className="divide-y divide-gray-100">
      {rooms.map(room => (
        <li key={room.id}>
          <Link
            to={`/chats/${room.id}`}
            onClick={close}
            className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0 overflow-hidden">
              {room.opponentProfileImageUrl && (
                <img src={room.opponentProfileImageUrl} alt={room.opponentNickname} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-sm text-gray-900">{room.opponentNickname}</span>
                {room.lastMessageAt && (
                  <span className="text-xs text-gray-400 shrink-0 ml-2">{fromNow(room.lastMessageAt)}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate mt-0.5">{room.lastMessage ?? ''}</p>
            </div>
            {room.unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center shrink-0">
                {room.unreadCount}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/* ── 알림 패널 ── */
function NotificationPanel() {
  const close = useDrawerStore(s => s.close)
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['notifications', 'drawer'],
    queryFn: () => notificationApi.getList({ size: 20 }).then(r => r.data),
  })

  const { mutate: markAllRead } = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="text-xs text-gray-500">{data?.content.length ?? 0}개의 알림</span>
        <button
          onClick={() => markAllRead()}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-500 transition-colors"
        >
          <CheckCheck size={13} />
          모두 읽음
        </button>
      </div>

      <ul className="flex-1 divide-y divide-gray-100">
        {!data?.content.length && (
          <li className="py-16 text-center text-sm text-gray-400">알림이 없어요</li>
        )}
        {data?.content.map(n => (
          <li key={n.id}>
            <Link
              to={n.linkUrl ?? '/notifications'}
              onClick={close}
              className={`flex flex-col gap-0.5 px-5 py-4 hover:bg-gray-50 transition-colors ${
                !n.isRead ? 'bg-primary-50' : ''
              }`}
            >
              {!n.isRead && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block mb-0.5" />
              )}
              <span className="text-sm font-medium text-gray-900">{n.title}</span>
              <span className="text-xs text-gray-500 line-clamp-2">{n.body}</span>
              <span className="text-xs text-gray-400 mt-0.5">{fromNow(n.createdAt)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
