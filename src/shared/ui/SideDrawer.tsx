import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserProfileFloat from '@/shared/ui/UserProfileFloat'  // 유저 프로필 플로팅 패널
import { X, MessageCircle, Bell, CheckCheck, ChevronLeft, Send, Flag, Ban, Star, Image as ImageIcon, Receipt } from 'lucide-react'
import { uploadSingleImage, validateImageFile } from '@/shared/api/upload'
import { compressImage } from '@/shared/lib/imageCompress'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useDrawerStore } from '@/shared/store/drawerStore'
import { useAuthStore } from '@/features/auth/store'
import { chatApi } from '@/features/chat/api'
import { useChatMessages } from '@/features/chat/hooks'
import { useReviewStore } from '@/features/review/store'
import { useNotifications, useMarkAllRead } from '@/features/notification/hooks'
import { useBroadcastNotification } from '@/features/admin/hooks'
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

  const { data, isLoading } = useQuery({
    queryKey: ['chat', 'rooms'],
    queryFn: () => chatApi.getRooms().then(r => r.data),
  })
  const rooms = data?.content ?? []

  if (activeChatRoomId) {
    const room = rooms.find(r => r.id === activeChatRoomId)
    return <ChatRoomView roomId={activeChatRoomId} room={room} onBack={closeChatRoom} />
  }

  if (isLoading) return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>

  if (!rooms.length) return (
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
              {room.opponentProfileImage && (
                <img src={room.opponentProfileImage} alt={room.opponentNickname} className="w-full h-full object-cover" />
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
            {room.myUnread > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center shrink-0">
                {room.myUnread}
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
  const { messages, sendMessage } = useChatMessages(roomId)
  // 라운드9: ChatRoom.isSeller 백엔드 응답 사용 (이전엔 useItemDetail 추가 호출)
  const isSeller = room?.isSeller ?? false
  const { hasReviewed } = useReviewStore()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // 모달 상태
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [blockOpen, setBlockOpen] = useState(false)
  // 프로필 플로팅 패널에 표시할 유저 ID (null이면 닫힘)
  const [profileUserId, setProfileUserId] = useState<number | null>(null)

  const alreadyReviewed = currentUser ? hasReviewed(roomId, currentUser.id) : false
  // 관리자는 거래예약·신고·차단 기능 없이 채팅만 가능
  const isAdmin = currentUser?.role === 'ADMIN'

  // 이미지 첨부 — 단일 이미지 (백엔드 spec 은 배열 지원)
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pickImage = async (file: File) => {
    const err = validateImageFile(file)
    if (err) {
      toast.error(err)
      return
    }
    try {
      const compressed = await compressImage(file)
      setPendingImage(compressed)
      if (pendingPreview) URL.revokeObjectURL(pendingPreview)
      setPendingPreview(URL.createObjectURL(compressed))
    } catch {
      toast.error('이미지 처리 중 문제가 발생했어요.')
    }
  }

  const clearPendingImage = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingImage(null)
    setPendingPreview(null)
  }

  // 채팅방 첫 진입 시 구매/대여 선택 안내 메시지 자동 전송
  useEffect(() => {
    if (!pendingFirstMessage) return
    const content = pendingFirstMessage
    setPendingFirstMessage(null)  // 중복 전송 방지를 위해 즉시 초기화
    sendMessage(content)
  // pendingFirstMessage가 바뀔 때만 실행 (roomId 변경 시 재실행 방지)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFirstMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const content = text.trim()
    if (!content && !pendingImage) return

    // 이미지 첨부 있으면 업로드 후 imageUrls 와 함께 전송
    if (pendingImage) {
      try {
        setUploading(true)
        const { getUrl } = await uploadSingleImage('MESSAGE', pendingImage)
        setText('')
        clearPendingImage()
        sendMessage(content, [getUrl])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '이미지 업로드에 실패했어요.')
      } finally {
        setUploading(false)
      }
      return
    }

    setText('')
    sendMessage(content)
  }

  // 라운드11: 거래 흐름은 마이페이지 → 거래 상세에서 처리.
  //   채팅방에선 진입 단축키만 제공 (zustand 가짜 상태바 제거)
  const handleOpenTrades = () => {
    close()
    navigate('/mypage/items')
  }

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
                {room.opponentProfileImage ? (
                  <img src={room.opponentProfileImage} alt="" className="w-full h-full object-cover" />
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
                {room.itemThumbnailUrl && (
                  <img src={room.itemThumbnailUrl} alt="" className="w-full h-full object-cover" />
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

      {/* 거래 진입 단축 — 라운드 11: 실제 거래 상세에서 예약/인계/인수 처리 */}
      {!isAdmin && (
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0">
          <button
            onClick={handleOpenTrades}
            className="w-full py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Receipt size={13} />
            {isSeller ? '판매 거래 관리' : '구매 거래 관리'}
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-1">
            예약 · 인계 · 인수 확인은 거래 상세 페이지에서 진행해요.
          </p>
        </div>
      )}

      {/* 거래 완료 후 리뷰 버튼 (관리자는 표시하지 않음) */}
      {!isAdmin && alreadyReviewed && (
        <div className="px-4 py-2.5 bg-green-50 border-b border-green-100 shrink-0">
          <p className="text-center text-xs text-green-600 font-medium py-1">리뷰를 남겼어요 ✓</p>
        </div>
      )}
      {!isAdmin && !alreadyReviewed && (
        <div className="px-4 py-2.5 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={handleReviewNav}
            className="w-full py-2 rounded-lg border border-green-500 text-green-600 hover:bg-green-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Star size={13} /> 거래 후 리뷰 남기기
          </button>
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-4">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.id
          return (
            <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[75%] rounded-2xl text-sm overflow-hidden',
                isMine ? 'bg-primary-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              )}>
                {msg.imageUrls.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {msg.imageUrls.map((url, i) => (
                      <a key={`${msg.id}-${i}`} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt="첨부 이미지"
                          className="block w-full max-w-xs object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
                {msg.content && (
                  <p className="px-3 py-2 whitespace-pre-wrap break-words">{msg.content}</p>
                )}
                <p className={cn(
                  'text-xs px-3 pb-1.5',
                  isMine ? 'text-primary-200' : 'text-gray-400',
                )}>
                  {toChatTimestamp(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="border-t border-gray-200 bg-white shrink-0">
        {/* 첨부 이미지 미리보기 */}
        {pendingPreview && (
          <div className="px-3 pt-2">
            <div className="relative inline-block">
              <img
                src={pendingPreview}
                alt="첨부 미리보기"
                className="h-20 w-20 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={clearPendingImage}
                disabled={uploading}
                className="absolute -top-1 -right-1 bg-gray-700 text-white rounded-full w-5 h-5 flex items-center justify-center"
                aria-label="첨부 취소"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) pickImage(file)
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !!pendingImage}
            className="w-10 h-10 rounded-full text-gray-500 hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
            aria-label="이미지 첨부"
          >
            <ImageIcon size={20} />
          </button>
          <input
            className="flex-1 h-10 rounded-full border border-gray-300 px-4 text-sm outline-none focus:border-primary-500"
            placeholder="메시지를 입력해 주세요"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !uploading) handleSend() }}
            disabled={uploading}
          />
          <button
            onClick={handleSend}
            disabled={uploading || (!text.trim() && !pendingImage)}
            className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center disabled:bg-gray-300 transition-colors"
            aria-label="전송"
          >
            <Send size={18} />
          </button>
        </div>
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
  const currentUser = useAuthStore(s => s.user)
  const isAdmin = currentUser?.role === 'ADMIN'
  const navigate = useNavigate()
  const close = useDrawerStore(s => s.close)

  // 관리자 전체 발송 폼 (라운드9 — POST /admin/notifications/broadcast)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastBody,  setBroadcastBody]  = useState('')
  const [sent, setSent] = useState(false)
  const broadcast = useBroadcastNotification()

  const { data } = useNotifications()
  const { mutate: markAllRead } = useMarkAllRead()
  const items = data?.pages[0]?.content ?? []

  /** 알림 클릭 → linkType 별 라우팅. 라운드8: INQUIRY 추가 */
  const handleNotificationClick = (n: typeof items[number]) => {
    close()
    if (!n.linkType || n.linkId == null) return
    const path = (() => {
      switch (n.linkType) {
        case 'TRANSACTION': return `/trades/${n.linkId}`
        case 'DELIVERY':    return `/delivery/${n.linkId}/track`
        case 'ITEM':        return `/items/${n.linkId}`
        case 'REVIEW':      return '/reviews'
        case 'PAYMENT':     return '/point'
        case 'INQUIRY':     return `/mypage/inquiries/${n.linkId}`
        default:            return null
      }
    })()
    if (path) navigate(path)
  }

  /** 전체 발송 — 라운드9: POST /admin/notifications/broadcast */
  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return
    try {
      await broadcast.mutateAsync({
        title: broadcastTitle.trim(),
        content: broadcastBody.trim(),
      })
      setSent(true)
      setBroadcastTitle('')
      setBroadcastBody('')
      window.setTimeout(() => setSent(false), 3000)
    } catch {
      // hook 에서 토스트
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* 관리자 전용 — 전체 알림 발송 폼 */}
      {isAdmin && (
        <div className="px-4 py-3 border-b border-indigo-100 bg-indigo-50 shrink-0">
          <p className="text-xs font-semibold text-indigo-700 mb-2">전체 유저 알림 발송</p>
          <input
            type="text"
            value={broadcastTitle}
            onChange={e => setBroadcastTitle(e.target.value)}
            placeholder="제목"
            className="w-full mb-1.5 px-3 py-1.5 text-sm border border-indigo-200 rounded-lg outline-none focus:border-indigo-400 bg-white"
          />
          <textarea
            value={broadcastBody}
            onChange={e => setBroadcastBody(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={2}
            className="w-full px-3 py-1.5 text-sm border border-indigo-200 rounded-lg outline-none focus:border-indigo-400 resize-none bg-white"
          />
          {sent ? (
            // 발송 완료 피드백
            <p className="mt-1.5 text-xs text-emerald-600 font-medium text-center">✓ 전체 발송 완료</p>
          ) : (
            <button
              onClick={handleBroadcast}
              disabled={!broadcastTitle.trim() || !broadcastBody.trim()}
              className="mt-1.5 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Send size={12} />
              전체 발송
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
        <span className="text-xs text-gray-500">{items.length}개의 알림</span>
        <button
          onClick={() => markAllRead()}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-500 transition-colors"
        >
          <CheckCheck size={13} />
          모두 읽음
        </button>
      </div>

      <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto">
        {items.length === 0 && (
          <li className="py-16 text-center text-sm text-gray-400">알림이 없어요</li>
        )}
        {items.map(n => (
          <li key={n.id}>
            <button
              onClick={() => handleNotificationClick(n)}
              className={`w-full flex flex-col gap-0.5 px-5 py-4 hover:bg-gray-50 transition-colors text-left ${
                !n.read ? 'bg-primary-50' : ''
              }`}
            >
              {!n.read && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block mb-0.5" />
              )}
              <span className="text-sm font-medium text-gray-900">
                {n.type === 'SYSTEM' && (
                  <span className="mr-1 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">시스템</span>
                )}
                {n.title}
              </span>
              <span className="text-xs text-gray-500 line-clamp-2">{n.content}</span>
              <span className="text-xs text-gray-400 mt-0.5">{fromNow(n.createdAt)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
