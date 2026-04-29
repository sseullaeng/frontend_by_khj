import { useParams } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useChatRoom } from '@/features/chat/hooks'
import { useAuthStore } from '@/features/auth/store'
import { toChatTimestamp } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { messages, sendMessage } = useChatRoom(Number(roomId))
  const currentUser = useAuthStore((s) => s.user)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // 새 메시지 도착 시 스크롤 하단 이동
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage(text.trim())
    setText('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-4">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.id
          return (
            <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[70%] px-3 py-2 rounded-2xl text-sm',
                  isMine
                    ? 'bg-primary-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                )}
              >
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
      <div className="flex items-center gap-2 p-3 border-t border-gray-200 bg-white">
        <input
          className="flex-1 h-10 rounded-full border border-gray-300 px-4 text-sm outline-none focus:border-primary-500"
          placeholder="메시지를 입력해 주세요"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center disabled:bg-gray-300"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
