import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { chatApi } from '@/features/chat/api'
import { fromNow } from '@/shared/lib/date'

export default function ChatListPage() {
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['chat', 'rooms'],
    queryFn: () => chatApi.getRooms().then((r) => r.data),
  })

  if (isLoading) return <div className="py-20 text-center text-gray-400">불러오는 중...</div>

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">채팅</h1>
      {!rooms?.length ? (
        <p className="text-center text-gray-400 py-12">진행 중인 채팅이 없어요</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                to={`/chats/${room.id}`}
                className="flex items-center gap-3 py-3 hover:bg-gray-50 px-1 rounded-lg"
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0">
                  {room.opponentProfileImageUrl && (
                    <img
                      src={room.opponentProfileImageUrl}
                      alt={room.opponentNickname}
                      className="w-full h-full rounded-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-sm">{room.opponentNickname}</span>
                    {room.lastMessageAt && (
                      <span className="text-xs text-gray-400">{fromNow(room.lastMessageAt)}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{room.lastMessage ?? ''}</p>
                </div>
                {room.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                    {room.unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
