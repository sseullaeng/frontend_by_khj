import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserProfileFloat from '@/shared/ui/UserProfileFloat'  // 유저 프로필 플로팅 패널
import { X, MessageCircle, Bell, CheckCheck, ChevronLeft, Send, Flag, Ban, ShieldCheck, Star } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDrawerStore } from '@/shared/store/drawerStore'
import { useAuthStore } from '@/features/auth/store'
import { chatApi } from '@/features/chat/api'
import { useChatRoom } from '@/features/chat/hooks'
import { useChatStore } from '@/features/chat/store'
import { useTransactionStore } from '@/features/transaction/store'
import { useReviewStore } from '@/features/review/store'
import { notificationApi } from '@/features/notification/api'
import { fromNow, toChatTimestamp } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'
import type { ChatRoom } from '@/features/chat/types'

const isMock = import.meta.env.VITE_MSW_ENABLED === 'true'

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

const REPORT_REASONS = [
  '사기 및 허위 거래',
  '음란물 / 불건전한 내용',
  '욕설 및 비방',
  '개인정보 요청',
  '불법 물품 거래',
  '스팸 / 반복 도배',
  '기타',
]

/* ── 채팅방 뷰 ── */
function ChatRoomView({ roomId, room, onBack }: { roomId: number; room?: ChatRoom; onBack: () => void }) {
  const navigate = useNavigate()
  const currentUser = useAuthStore(s => s.user)
  const { close, pendingFirstMessage, setPendingFirstMessage } = useDrawerStore()
  const { messages, sendMessage } = useChatRoom(roomId)
  const { appendMessage } = useChatStore()
  const { statusByRoom, useEscrowByRoom, setStatus, setUseEscrow } = useTransactionStore()
  const { hasReviewed } = useReviewStore()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // 모달 상태
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [blockOpen, setBlockOpen] = useState(false)
  const [escrowOpen, setEscrowOpen] = useState(false)
  const [escrowChoice, setEscrowChoice] = useState<boolean | null>(null)
  // 프로필 플로팅 패널에 표시할 유저 ID (null이면 닫힘)
  const [profileUserId, setProfileUserId] = useState<number | null>(null)

  const txStatus = statusByRoom[roomId] ?? 'none'
  const useEscrow = useEscrowByRoom[roomId] ?? false
  const alreadyReviewed = currentUser ? hasReviewed(roomId, currentUser.id) : false
  // 관리자는 거래예약·신고·차단 기능 없이 채팅만 가능
  const isAdmin = currentUser?.role === 'ADMIN'

  // 채팅방 첫 진입 시 구매/대여 선택 안내 메시지 자동 전송
  useEffect(() => {
    if (!pendingFirstMessage) return
    const content = pendingFirstMessage
    setPendingFirstMessage(null)  // 중복 전송 방지를 위해 즉시 초기화
    if (isMock) {
      appendMessage(roomId, {
        id: Date.now(),
        roomId,
        senderId: currentUser?.id ?? 0,
        content,
        imageUrl: null,
        sentAt: new Date().toISOString(),
      })
    } else {
      sendMessage(content)
    }
  // pendingFirstMessage가 바뀔 때만 실행 (roomId 변경 시 재실행 방지)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFirstMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    if (isMock) {
      appendMessage(roomId, {
        id: Date.now(),
        roomId,
        senderId: currentUser?.id ?? 0,
        content,
        imageUrl: null,
        sentAt: new Date().toISOString(),
      })
    } else {
      sendMessage(content)
    }
  }

  const handleReservation = () => setEscrowOpen(true)

  const handleReservationConfirm = () => {
    setStatus(roomId, 'reserved')
    setUseEscrow(roomId, escrowChoice === true)
    setEscrowOpen(false)
    setEscrowChoice(null)
  }

  const handleCancelReservation = () => setStatus(roomId, 'none')

  const handleComplete = () => setStatus(roomId, 'completed')

  const handleReviewNav = () => {
    close()
    navigate('/reviews/write', {
      state: {
        roomId,
        itemId: room?.itemId,
        itemTitle: room?.itemTitle,
        opponentId: room?.opponentId,
        opponentNickname: room?.opponentNickname,
      },
    })
  }

  const handleReport = () => {
    setReportOpen(false)
    setReportReason('')
  }

  const handleBlock = () => {
    setBlockOpen(false)
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden">

      {/* ── 신고 모달 ── */}
      {reportOpen && (
        <div className="absolute inset-0 z-10 bg-white flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <button onClick={() => setReportOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
              <ChevronLeft size={20} />
            </button>
            <p className="text-sm font-semibold text-gray-900">신고 사유 선택</p>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {REPORT_REASONS.map((reason) => (
              <li key={reason}>
                <button
                  onClick={() => setReportReason(reason)}
                  className={cn(
                    'w-full flex items-center justify-between px-5 py-4 text-sm transition-colors',
                    reportReason === reason ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {reason}
                  {reportReason === reason && <span className="w-2 h-2 rounded-full bg-red-500" />}
                </button>
              </li>
            ))}
          </ul>
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleReport}
              disabled={!reportReason}
              className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl text-sm font-semibold transition-colors"
            >
              신고하기
            </button>
          </div>
        </div>
      )}

      {/* ── 차단 확인 모달 ── */}
      {blockOpen && (
        <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <Ban size={18} className="text-red-500" />
              <h3 className="text-base font-bold text-gray-900">차단하시겠어요?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-medium text-gray-700">{room?.opponentNickname}</span> 님을 차단하면 이 사용자의 글을 볼 수 없게 돼요.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setBlockOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleBlock}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                차단
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 거래 예약 — 거래대행 선택 모달 ── */}
      {escrowOpen && (
        <div className="absolute inset-0 z-10 bg-black/40 flex items-end">
          <div className="bg-white rounded-t-2xl p-5 w-full shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={18} className="text-primary-500" />
              <h3 className="text-base font-bold text-gray-900">거래 방식을 선택해 주세요</h3>
            </div>
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setEscrowChoice(true)}
                className={cn(
                  'flex-1 py-4 rounded-xl border-2 text-sm font-semibold transition-colors flex flex-col items-center gap-1',
                  escrowChoice === true
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <ShieldCheck size={20} />
                거래대행
                <span className="text-xs font-normal text-gray-400">쓸랭이 중간에서 도와줘요</span>
              </button>
              <button
                onClick={() => setEscrowChoice(false)}
                className={cn(
                  'flex-1 py-4 rounded-xl border-2 text-sm font-semibold transition-colors flex flex-col items-center gap-1',
                  escrowChoice === false
                    ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <span className="text-lg">🤝</span>
                직접 거래
                <span className="text-xs font-normal text-gray-400">직접 만나서 거래해요</span>
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEscrowOpen(false); setEscrowChoice(null) }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleReservationConfirm}
                disabled={escrowChoice === null}
                className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl text-sm font-semibold transition-colors"
              >
                예약 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 채팅방 헤더 */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0">
          <ChevronLeft size={20} />
        </button>

        {room && (
          <>
            {/* 상대방 프로필 — 클릭 시 프로필 플로팅 패널 오픈 */}
            <button
              onClick={() => setProfileUserId(room.opponentId)}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity shrink-0"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                {room.opponentProfileImageUrl ? (
                  <img src={room.opponentProfileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-gray-500">{room.opponentNickname[0]}</span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900">{room.opponentNickname}</p>
            </button>

            {/* 물품 이미지 + 제목 */}
            <Link
              to={`/items/${room.itemId}`}
              onClick={close}
              className="flex items-center gap-1.5 ml-1 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors min-w-0 max-w-[140px]"
            >
              <div className="w-7 h-7 rounded-md bg-gray-200 overflow-hidden shrink-0">
                {room.itemImageUrl && (
                  <img src={room.itemImageUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <span className="text-xs text-gray-700 font-medium truncate">{room.itemTitle}</span>
            </Link>
          </>
        )}

        {/* 신고 + 차단 — 관리자는 표시하지 않음 */}
        {!isAdmin && (
          <div className="flex items-center gap-0.5 ml-auto shrink-0">
            <button
              onClick={() => setReportOpen(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="신고"
            >
              <Flag size={15} />
            </button>
            <button
              onClick={() => setBlockOpen(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="차단"
            >
              <Ban size={15} />
            </button>
          </div>
        )}
      </div>

      {/* 판매자 전용 — 거래 상태 바 (관리자는 표시하지 않음) */}
      {!isAdmin && room?.isSeller && txStatus !== 'completed' && (
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0 flex flex-col gap-2">
          {txStatus === 'none' && (
            <button
              onClick={handleReservation}
              className="w-full py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white text-xs font-semibold transition-colors"
            >
              거래 예약
            </button>
          )}
          {txStatus === 'reserved' && (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelReservation}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors"
                >
                  거래예약취소
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-colors"
                >
                  거래완료
                </button>
              </div>
              {useEscrow && (
                <Link
                  to="/escrow/apply"
                  onClick={close}
                  className="text-center text-xs text-primary-500 font-medium py-1 hover:underline"
                >
                  거래대행 신청하기 →
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {/* 거래 완료 후 — 판매자 리뷰 버튼 (관리자는 표시하지 않음) */}
      {!isAdmin && room?.isSeller && txStatus === 'completed' && (
        <div className="px-4 py-2.5 bg-green-50 border-b border-green-100 shrink-0">
          {alreadyReviewed ? (
            <p className="text-center text-xs text-green-600 font-medium py-1">리뷰를 남겼어요 ✓</p>
          ) : (
            <button
              onClick={handleReviewNav}
              className="w-full py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Star size={13} /> 리뷰 남기기
            </button>
          )}
        </div>
      )}

      {/* 구매자 — 거래 완료 후 리뷰 버튼 (관리자는 표시하지 않음) */}
      {!isAdmin && !room?.isSeller && txStatus === 'completed' && (
        <div className="px-4 py-2.5 bg-green-50 border-b border-green-100 shrink-0">
          {alreadyReviewed ? (
            <p className="text-center text-xs text-green-600 font-medium py-1">리뷰를 남겼어요 ✓</p>
          ) : (
            <button
              onClick={handleReviewNav}
              className="w-full py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Star size={13} /> 리뷰 남기기
            </button>
          )}
        </div>
      )}

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

      {/* 유저 프로필 플로팅 패널 */}
      {profileUserId !== null && (
        <UserProfileFloat
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
        />
      )}
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
