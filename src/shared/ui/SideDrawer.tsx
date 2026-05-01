import { useEffect, useRef, useState } from 'react'
import { X, MessageCircle, Bell, CheckCheck, ChevronLeft, Send } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDrawerStore } from '@/shared/store/drawerStore'
import { useAuthStore } from '@/features/auth/store'
import { chatApi } from '@/features/chat/api'
import { useChatRoom } from '@/features/chat/hooks'
import { notificationApi } from '@/features/notification/api'
import { fromNow, toChatTimestamp } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'
import type { ChatRoom } from '@/features/chat/types'

export default function SideDrawer() {
  const { activeTab, open, close } = useDrawerStore()
  const isOpen = activeTab !== null

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [close])

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
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'chat'         && <ChatPanel />}
          {activeTab === 'notification' && <NotificationPanel />}
        </div>
      </aside>
    </>
  )
}

/* ── 채팅 패널 ── */
function ChatPanel() {
  const { activeChatRoomId, openChatRoom, closeChatRoom } = useDrawerStore()

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['chat', 'rooms'],
    queryFn: () => chatApi.getRooms().then(r => r.data),
  })

  if (activeChatRoomId) {
    const room = rooms?.find(r => r.id === activeChatRoomId)
    return <ChatRoomView roomId={activeChatRoomId} room={room} onBack={closeChatRoom} />
  }

  if (isLoading) return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>

  if (!rooms?.length) return (
    <p className="py-16 text-center text-sm text-gray-400">진행 중인 채팅이 없어요</p>
  )

  return (
    <ul className="divide-y divide-gray-100 overflow-y-auto flex-1">
      {rooms.map(room => (
        <li key={room.id}>
          <button
            onClick={() => openChatRoom(room.id)}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
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
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ── 채팅방 뷰 ── */
function ChatRoomView({ roomId, room, onBack }: { roomId: number; room?: ChatRoom; onBack: () => void }) {
  const currentUser = useAuthStore(s => s.user)
  const { messages, sendMessage } = useChatRoom(roomId)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage(text.trim())
    setText('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* 채팅방 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft size={20} />
        </button>
        {room && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
              {room.opponentProfileImageUrl && (
                <img src={room.opponentProfileImageUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{room.opponentNickname}</p>
              {room.itemTitle && (
                <p className="text-xs text-gray-400 truncate max-w-[180px]">{room.itemTitle}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-4">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.id
          return (
            <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[75%] px-3 py-2 rounded-2xl text-sm',
                isMine ? 'bg-primary-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              )}>
                <p>{msg.content}</p>
                <p className={cn('text-xs mt-0.5', isMine ? 'text-primary-200' : 'text-gray-400')}>
                  {toChatTimestamp(msg.sentAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="flex items-center gap-2 p-3 border-t border-gray-200 bg-white shrink-0">
        <input
          className="flex-1 h-10 rounded-full border border-gray-300 px-4 text-sm outline-none focus:border-primary-500"
          placeholder="메시지를 입력해 주세요"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center disabled:bg-gray-300 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
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
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
        <span className="text-xs text-gray-500">{data?.content.length ?? 0}개의 알림</span>
        <button
          onClick={() => markAllRead()}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-500 transition-colors"
        >
          <CheckCheck size={13} />
          모두 읽음
        </button>
      </div>

      <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto">
        {!data?.content.length && (
          <li className="py-16 text-center text-sm text-gray-400">알림이 없어요</li>
        )}
        {data?.content.map(n => (
          <li key={n.id}>
            <button
              onClick={close}
              className={`w-full flex flex-col gap-0.5 px-5 py-4 hover:bg-gray-50 transition-colors text-left ${
                !n.isRead ? 'bg-primary-50' : ''
              }`}
            >
              {!n.isRead && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block mb-0.5" />
              )}
              <span className="text-sm font-medium text-gray-900">{n.title}</span>
              <span className="text-xs text-gray-500 line-clamp-2">{n.body}</span>
              <span className="text-xs text-gray-400 mt-0.5">{fromNow(n.createdAt)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
