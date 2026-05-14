import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserProfileFloat from '@/shared/ui/UserProfileFloat' // 유저 프로필 플로팅 패널
import {
  X,
  MessageCircle,
  Bell,
  CheckCheck,
  ChevronLeft,
  Send,
  Flag,
  Ban,
  Star,
  Image as ImageIcon,
  Receipt,
  LogOut,
  Truck,
} from 'lucide-react'
import { uploadSingleImage, validateImageFile } from '@/shared/api/upload'
import { compressImage } from '@/shared/lib/imageCompress'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useDrawerStore } from '@/shared/store/drawerStore'
import { useAuthStore } from '@/features/auth/store'
import { chatApi } from '@/features/chat/api'
import { useChatMessages, useLeaveChatRoom } from '@/features/chat/hooks'
import { useCreateTransaction, usePatchTransaction } from '@/features/trade/hooks'
import { useReviewStore } from '@/features/review/store'
import { useNotifications, useMarkAllRead, useMarkRead } from '@/features/notification/hooks'
import { useBlock, useReportUser } from '@/features/block/hooks'
import { formatKst, fromNow, toChatTimestamp } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'
import type { ChatRoom } from '@/features/chat/types'

export default function SideDrawer() {
  const { activeTab, open, close } = useDrawerStore()
  const isOpen = activeTab !== null

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [close])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
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
          {activeTab === 'chat' && <ChatPanel />}
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
    queryFn: () => chatApi.getRooms().then((r) => r.data),
  })
  const rooms = data?.content ?? []

  if (activeChatRoomId) {
    const room = rooms.find((r) => r.id === activeChatRoomId)
    return <ChatRoomView roomId={activeChatRoomId} room={room} onBack={closeChatRoom} />
  }

  if (isLoading) return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>

  if (!rooms.length)
    return <p className="py-16 text-center text-sm text-gray-400">진행 중인 채팅이 없어요</p>

  return (
    <ul className="divide-y divide-gray-100 overflow-y-auto flex-1">
      {rooms.map((room) => (
        <li key={room.id}>
          <DrawerListRow
            onClick={() => openChatRoom(room.id)}
            avatar={
              <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                {room.opponentProfileImage && (
                  <img
                    src={room.opponentProfileImage}
                    alt={room.opponentNickname}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            }
            title={room.opponentNickname}
            time={room.lastMessageAt ? fromNow(room.lastMessageAt) : undefined}
            description={room.lastMessage ?? ''}
            trailing={
              room.myUnread > 0 ? (
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center shrink-0">
                  {room.myUnread}
                </span>
              ) : null
            }
          />
        </li>
      ))}
    </ul>
  )
}

function DrawerListRow({
  avatar,
  title,
  time,
  description,
  meta,
  trailing,
  unread,
  onClick,
}: {
  avatar: ReactNode
  title: ReactNode
  time?: ReactNode
  description?: ReactNode
  meta?: ReactNode
  trailing?: ReactNode
  unread?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left',
        unread && 'bg-primary-50/70'
      )}
    >
      {avatar}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2">
          <span className="font-medium text-sm text-gray-900 truncate">{title}</span>
          {time && <span className="text-xs text-gray-400 shrink-0">{time}</span>}
        </div>
        {description && <p className="text-sm text-gray-500 truncate mt-0.5">{description}</p>}
        {meta && <div className="mt-1">{meta}</div>}
      </div>
      {trailing}
    </button>
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
function ChatRoomView({
  roomId,
  room,
  onBack,
}: {
  roomId: number
  room?: ChatRoom
  onBack: () => void
}) {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const { close } = useDrawerStore()
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
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  // 프로필 플로팅 패널에 표시할 유저 ID (null이면 닫힘)
  const [profileUserId, setProfileUserId] = useState<number | null>(null)

  const alreadyReviewed = currentUser ? hasReviewed(roomId, currentUser.id) : false
  // 관리자는 거래예약·신고·차단 기능 없이 채팅만 가능
  const isAdmin = currentUser?.role === 'ADMIN'

  // 라운드12 — 채팅방 leave 상태 + 거래 시작 mutation
  const opponentLeft = room?.opponentLeft ?? false
  const iLeft = room?.iLeft ?? false
  const chatBlocked = opponentLeft || iLeft // 입력 / 액션 버튼 모두 disable
  const { mutateAsync: leaveAsync, isPending: isLeaving } = useLeaveChatRoom()
  const { mutateAsync: createTxAsync, isPending: isCreatingTx } = useCreateTransaction()

  // 라운드13 PR #131 — 거래 상태 (room.card 에서) + [거래 완료] action='완료'
  const txId = room?.card?.transactionId ?? null
  const txStatus = room?.card?.transactionStatus ?? null
  const isTxStarted = !!txId && txStatus !== '거래완료' && txStatus !== '취소'
  const isTxCompleted = txStatus === '거래완료'
  const patchTx = usePatchTransaction(txId ?? 0)

  // 라운드13 PR #132 — 거래대행 카드 (INTERNAL 거래대행 진행 중일 때)
  const cardKind = room?.card?.cardKind
  const escrowAppId = room?.card?.escrowApplicationId ?? null
  const escrowStatus = room?.card?.escrowStatus ?? null
  const isEscrowCard = cardKind === 'EscrowApplication'
  const isEscrowCompleted = isEscrowCard && escrowStatus === '완료'
  const isEscrowCanceled = isEscrowCard && escrowStatus === '취소'

  // 라운드14 — 거래대행 페어 시 단일 진입 (액션은 모두 EscrowDetailPage 에서)
  //   채팅방엔 [거래대행 페이지로] 한 줄만 노출.

  // 라운드14 — 대여 거래 매트릭스 (예약 → 인계 → 반납 → 회신)
  const tradeMode = room?.card?.tradeMode ?? room?.tradeMode
  const isRental = tradeMode === '대여'
  const presetRentalStart = room?.card?.rentalStart ?? null
  const presetRentalEnd = room?.card?.rentalEnd ?? null
  const hasPresetRentalPeriod = !!(presetRentalStart && presetRentalEnd)

  // 직거래 매트릭스 권한
  const canCreateTrade = isSeller && !isRental && !isTxStarted && !isTxCompleted && !isEscrowCard
  const canStartRequestedRental =
    isSeller && isRental && !isTxStarted && !isTxCompleted && !isEscrowCard && hasPresetRentalPeriod
  // 대여 단계별
  const canReserve = isSeller && isRental && txStatus === '채팅중'
  const canHandover = isSeller && isRental && txStatus === '예약'
  const canReturn = !isSeller && isRental && txStatus === '인계완료'
  const canConfirmReturn = isSeller && isRental && txStatus === '반납요청'
  // 직거래·나눔 — [거래 완료] 한 번에 (action='완료', 백엔드 가드: 대여 거부)
  const canComplete = isSeller && !isRental && isTxStarted
  // 취소 — 양쪽, 채팅중·예약 까지 (인계완료 이후 차단)
  const canCancel = isTxStarted && (txStatus === '채팅중' || txStatus === '예약')
  // 거래대행 시작 — 일반 거래는 채팅중, 대여는 판매자가 예약 확정한 뒤부터 노출.
  const canStartEscrow =
    isSeller &&
    isTxStarted &&
    !isEscrowCard &&
    (isRental ? txStatus === '예약' : txStatus === '채팅중')
  // 거래 진행 중에는 [나가기] 숨김
  const showLeaveButton = !isTxStarted && !(isEscrowCard && !isEscrowCompleted && !isEscrowCanceled)

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const content = text.trim()
    if (!content && !pendingImage) return
    if (chatBlocked) {
      toast.error(
        opponentLeft ? '상대방이 채팅방을 나갔어요.' : '나간 채팅방에는 메시지를 보낼 수 없어요.'
      )
      return
    }

    // 이미지 첨부 있으면 업로드 후 imageUrls 와 함께 전송
    if (pendingImage) {
      try {
        setUploading(true)
        const { getUrl } = await uploadSingleImage('MESSAGE', pendingImage)
        setText('')
        clearPendingImage()
        sendMessage(content, [getUrl])
      } catch (err) {
        // 진단 로그 — presigned 발급 / S3 PUT / send 중 어디서 실패하는지 콘솔로 확인 가능
        console.error('chat image upload failed', err)
        const msg = err instanceof Error ? err.message : '이미지 업로드에 실패했어요.'
        toast.error(msg)
      } finally {
        setUploading(false)
      }
      return
    }

    setText('')
    sendMessage(content)
  }

  // 라운드13 PR #133 — 거래대행도 paired Transaction 자동 생성되어 동일 흐름.
  //   card.transactionId 는 직거래(즉시) / 거래대행(완료 시점에 채워짐) 둘 다 활용.
  const handleReviewNav = () => {
    if (!txId || !room) return
    close()
    navigate('/reviews/write', {
      state: {
        transactionId: txId,
        itemId: room.itemId, // 거래대행은 null 가능 (EXTERNAL)
        revieweeId: room.opponentId,
      },
    })
  }

  // 라운드14 — 신고/차단 실제 API 호출 (이전엔 모달만 닫고 동작 없었음)
  const reportMut = useReportUser()
  const blockMut = useBlock()

  const handleReport = () => {
    if (!room || !reportReason) {
      toast.error('신고 사유를 선택해 주세요.')
      return
    }
    reportMut.mutate(
      { userId: room.opponentId, reason: reportReason },
      {
        onSuccess: () => {
          toast.success('신고가 접수됐어요. 검토 후 조치됩니다.')
          setReportOpen(false)
          setReportReason('')
        },
        onError: () => toast.error('신고 접수에 실패했어요.'),
      }
    )
  }

  const handleBlock = () => {
    if (!room) return
    blockMut.mutate(room.opponentId, {
      onSuccess: () => setBlockOpen(false),
      onError: () => toast.error('차단에 실패했어요.'),
    })
  }

  const toBackendDateTime = (v: string) => (v.length === 16 ? `${v}:00` : v)

  const handleStartTrade = async (dates?: { rentalStart: string; rentalEnd: string }) => {
    if (!room) return
    try {
      await createTxAsync({
        itemId: room.itemId,
        chatRoomId: room.id,
        transactionType: dates ? '대여' : isRental ? '대여' : (tradeMode ?? '판매'),
        ...(dates
          ? {
              rentalStart: toBackendDateTime(dates.rentalStart),
              rentalEnd: toBackendDateTime(dates.rentalEnd),
            }
          : {}),
      } as Parameters<typeof createTxAsync>[0])
    } catch {
      // hook onError 토스트
    }
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* ── 신고 모달 ── */}
      {reportOpen && (
        <div className="absolute inset-0 z-10 bg-white flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => setReportOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
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
                    reportReason === reason
                      ? 'bg-red-50 text-red-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
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
              <span className="font-medium text-gray-700">{room?.opponentNickname}</span> 님을
              차단하면 이 사용자의 글을 볼 수 없게 돼요.
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

      {/* ── 채팅방 나가기 확인 모달 ── */}
      {leaveConfirmOpen && (
        <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <LogOut size={18} className="text-red-500" />
              <h3 className="text-base font-bold text-gray-900">채팅방을 나갈까요?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              나가면 채팅 목록에서 제거되고, 상대방에게는 "나갔습니다" 안내가 표시돼요.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLeaveConfirmOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  try {
                    await leaveAsync(roomId)
                    setLeaveConfirmOpen(false)
                    onBack() // 채팅방 목록으로 복귀
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : '나가지 못했어요.')
                  }
                }}
                disabled={isLeaving}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 채팅방 헤더 */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 shrink-0">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0"
        >
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
                  <img
                    src={room.opponentProfileImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-gray-500">
                    {room.opponentNickname[0]}
                  </span>
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

      {/* 거래 진입 — 라운드14 매트릭스: 4 거래 유형 × 시점별 버튼 */}
      {!isAdmin && !chatBlocked && (
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0 flex flex-col gap-1.5">
          {/* 거래대행 페어 — 단일 진입 ([거래대행 페이지로]) */}
          {isEscrowCard && !isEscrowCompleted && !isEscrowCanceled && (
            <>
              <button
                onClick={() => {
                  if (escrowAppId == null) return
                  close()
                  navigate(`/escrow/list/${escrowAppId}`)
                }}
                className="w-full py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Truck size={13} />
                거래대행 페이지로
              </button>
              <p className="text-[11px] text-purple-700/80 text-center">
                거래대행 진행 중 — 인계/반납/완료는 거래대행 페이지에서 진행해요
              </p>
            </>
          )}

          {/* 거래대행 완료/취소 — 직거래와 동일하게 리뷰 안내 + 나가기 */}
          {isEscrowCard && (isEscrowCompleted || isEscrowCanceled) && (
            <div className="w-full py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium text-center">
              ✓ 거래대행이 {isEscrowCompleted ? '완료' : '취소'}됐어요
            </div>
          )}

          {/* 일반 거래 — cardKind !== 'EscrowApplication' */}
          {!isEscrowCard && (
            <>
              {/* 거래완료 — 양쪽 안내 */}
              {isTxCompleted && (
                <div className="w-full py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium text-center">
                  ✓ 거래가 완료됐어요
                </div>
              )}
              {/* 리뷰 작성 — 거래완료 후 양쪽 각자 1건씩 (alreadyReviewed 분기는 아래 영역에서) */}
              {isTxCompleted && !alreadyReviewed && (
                <button
                  onClick={handleReviewNav}
                  className="w-full py-2 rounded-lg bg-white border border-green-500 text-green-600 hover:bg-green-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Star size={13} />
                  리뷰 남기기
                </button>
              )}

              {/* 거래 시작 (판매자, 거래 시작 전) */}
              {(canCreateTrade || canStartRequestedRental) && (
                <>
                  <button
                    onClick={() => {
                      if (canStartRequestedRental && presetRentalStart && presetRentalEnd) {
                        void handleStartTrade({
                          rentalStart: presetRentalStart,
                          rentalEnd: presetRentalEnd,
                        })
                        return
                      }
                      void handleStartTrade()
                    }}
                    disabled={isCreatingTx}
                    className="w-full py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Receipt size={13} />
                    {canStartRequestedRental ? '대여 거래 시작' : '거래 시작'}
                  </button>
                  {canStartRequestedRental && presetRentalStart && presetRentalEnd && (
                    <p className="text-[11px] text-primary-700/80 text-center">
                      구매자 신청 기간: {formatKst(presetRentalStart, 'M/d HH:mm')} ~{' '}
                      {formatKst(presetRentalEnd, 'M/d HH:mm')}
                    </p>
                  )}
                </>
              )}

              {/* 직거래·나눔 — [거래 완료] 한 번에 */}
              {canComplete && (
                <button
                  onClick={async () => {
                    try {
                      await patchTx.mutateAsync({ action: '완료' })
                      toast.success('거래가 완료됐어요.')
                    } catch {
                      // hook 에서 토스트
                    }
                  }}
                  disabled={patchTx.isPending}
                  className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Receipt size={13} />
                  {patchTx.isPending ? '완료 처리 중...' : '거래 완료'}
                </button>
              )}

              {/* 대여 — 단계별 액션 */}
              {canReserve && (
                <button
                  onClick={async () => {
                    try {
                      await patchTx.mutateAsync({ action: '예약' })
                    } catch {}
                  }}
                  disabled={patchTx.isPending}
                  className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Receipt size={13} />
                  대여 거래 시작
                </button>
              )}
              {canHandover && (
                <button
                  onClick={async () => {
                    try {
                      await patchTx.mutateAsync({ action: '인계확인' })
                    } catch {}
                  }}
                  disabled={patchTx.isPending}
                  className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Truck size={13} />
                  인계 완료
                </button>
              )}
              {canReturn && (
                <button
                  onClick={async () => {
                    try {
                      await patchTx.mutateAsync({ action: '반납요청' })
                    } catch {}
                  }}
                  disabled={patchTx.isPending}
                  className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Receipt size={13} />
                  반납하기
                </button>
              )}
              {canConfirmReturn && (
                <button
                  onClick={async () => {
                    try {
                      await patchTx.mutateAsync({ action: '회신확인' })
                    } catch {}
                  }}
                  disabled={patchTx.isPending}
                  className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Receipt size={13} />
                  회신 확인
                </button>
              )}

              {/* 거래대행 시작 — 거래 진행 중인 판매자 (채팅중 단계까지) */}
              {canStartEscrow && (
                <button
                  onClick={() => {
                    if (!room) return
                    close()
                    navigate(`/escrow/internal/new?chatRoomId=${room.id}&itemId=${room.itemId}`)
                  }}
                  className="w-full py-2 rounded-lg bg-white border border-primary-300 text-primary-600 hover:bg-primary-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Truck size={13} />
                  거래대행 시작
                </button>
              )}

              {/* 거래 취소 — 양쪽, 채팅중·예약 단계까지 */}
              {canCancel && (
                <button
                  onClick={async () => {
                    if (!window.confirm('거래를 취소할까요?')) return
                    try {
                      await patchTx.mutateAsync({ action: '취소', cancelReason: '채팅방에서 취소' })
                    } catch {}
                  }}
                  disabled={patchTx.isPending}
                  className="w-full py-2 rounded-lg bg-white border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  거래 취소
                </button>
              )}
            </>
          )}

          {/* 채팅방 나가기 — 거래 진행 중엔 숨김 */}
          {showLeaveButton && (
            <button
              onClick={() => setLeaveConfirmOpen(true)}
              disabled={isLeaving}
              className="w-full py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-red-500 hover:bg-white transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <LogOut size={11} />
              채팅방 나가기
            </button>
          )}
        </div>
      )}

      {/* 상대 / 본인 leave 안내 — 입력 자체가 disable 됨.
          상대만 나간 경우(iLeft=false) 본인도 [채팅방 나가기] 가능. */}
      {!isAdmin && chatBlocked && (
        <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 flex flex-col items-center gap-2">
          <p className="text-xs text-gray-600 font-medium text-center">
            {iLeft
              ? '나간 채팅방이에요. 메시지를 보낼 수 없어요.'
              : '상대방이 채팅방을 나갔어요. 메시지를 보낼 수 없어요.'}
          </p>
          {!iLeft && (
            <button
              onClick={() => setLeaveConfirmOpen(true)}
              disabled={isLeaving}
              className="px-3 py-1.5 rounded-lg text-[11px] text-gray-600 hover:text-red-600 hover:bg-white transition-colors inline-flex items-center gap-1 disabled:opacity-50"
            >
              <LogOut size={11} />
              채팅방 나가기
            </button>
          )}
        </div>
      )}

      {/* 거래대행 완료 후 리뷰 영역 (직거래는 위쪽 영역에서 처리) */}
      {!isAdmin && isEscrowCompleted && !alreadyReviewed && (
        <div className="px-4 py-2.5 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={handleReviewNav}
            className="w-full py-2 rounded-lg border border-green-500 text-green-600 hover:bg-green-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Star size={13} /> 거래 후 리뷰 남기기
          </button>
        </div>
      )}
      {/* 이미 작성됨 안내 — 직거래/거래대행 모두 */}
      {!isAdmin && (isTxCompleted || isEscrowCompleted) && alreadyReviewed && (
        <div className="px-4 py-2.5 bg-green-50 border-b border-green-100 shrink-0">
          <p className="text-center text-xs text-green-600 font-medium py-1">리뷰를 남겼어요 ✓</p>
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-4">
        {/* 라운드13 PR-C #6 — 시스템 카드 (첫 메시지 send 시 백엔드 생성, 메시지 위에 노출) */}
        {room?.card && (
          <Link
            to={`/items/${room.card.itemId}`}
            onClick={close}
            className="block bg-white border border-primary-200 rounded-2xl p-3 mb-1 hover:bg-primary-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {room.card.itemThumbnailUrl && (
                  <img
                    src={room.card.itemThumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary-100 text-primary-700">
                    {room.card.tradeMode}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {room.card.itemTitle}
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {room.card.tradeMode === '나눔'
                    ? '무료 나눔'
                    : `${room.card.price.toLocaleString()}원`}
                </p>
                {/* 라운드14 V43 — 대여 기간 노출 (rental-request / Transaction / Escrow 진입 시 백엔드가 채워옴) */}
                {room.card.rentalStart && room.card.rentalEnd && (
                  <p className="text-[11px] text-primary-600 mt-0.5">
                    {formatKst(room.card.rentalStart, 'M/d HH:mm')}
                    <span className="text-gray-400 mx-1">~</span>
                    {formatKst(room.card.rentalEnd, 'M/d HH:mm')}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.id
          return (
            <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl text-sm overflow-hidden',
                  isMine
                    ? 'bg-primary-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                )}
              >
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
                <p
                  className={cn(
                    'text-xs px-3 pb-1.5',
                    isMine ? 'text-primary-200' : 'text-gray-400'
                  )}
                >
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
            disabled={uploading || !!pendingImage || chatBlocked}
            className="w-10 h-10 rounded-full text-gray-500 hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
            aria-label="이미지 첨부"
          >
            <ImageIcon size={20} />
          </button>
          <input
            className="flex-1 h-10 rounded-full border border-gray-300 px-4 text-sm outline-none focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
            placeholder={
              chatBlocked ? '메시지를 보낼 수 없는 채팅방이에요' : '메시지를 입력해 주세요'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // IME 가드 — 한글/일본어/중국어 등 조합 입력 중 Enter 가 발생하면 마지막
              // 음절이 한 번 더 send 되는 버그가 있어 isComposing / keyCode 229 차단.
              if (e.key !== 'Enter' || e.shiftKey) return
              if (e.nativeEvent.isComposing || e.keyCode === 229) return
              if (uploading || chatBlocked) return
              e.preventDefault()
              handleSend()
            }}
            disabled={uploading || chatBlocked}
          />
          <button
            onClick={handleSend}
            disabled={uploading || chatBlocked || (!text.trim() && !pendingImage)}
            className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center disabled:bg-gray-300 transition-colors"
            aria-label="전송"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* 유저 프로필 플로팅 패널 */}
      {profileUserId !== null && (
        <UserProfileFloat userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}
    </div>
  )
}

/* ── 알림 패널 ── */
function NotificationPanel() {
  const navigate = useNavigate()
  const close = useDrawerStore((s) => s.close)
  const openChatRoom = useDrawerStore((s) => s.openChatRoom)

  const { data } = useNotifications()
  const { mutate: markAllRead } = useMarkAllRead()
  const { mutate: markRead } = useMarkRead()
  const items = data?.pages[0]?.content ?? []
  const timelineItems = [...items].reverse()

  /** 알림 클릭 → linkType 별 라우팅. 라운드8: INQUIRY 추가 */
  const handleNotificationClick = (n: (typeof items)[number]) => {
    if (!n.read) markRead(n.id)
    if (n.linkType === 'CHAT_ROOM') {
      if (n.linkId != null) openChatRoom(n.linkId)
      return
    }
    close()
    if (!n.linkType || n.linkId == null) return
    const path = (() => {
      switch (n.linkType) {
        case 'TRANSACTION':
          return `/trades/${n.linkId}`
        // 라운드14 3-D — buyer-info 로 직접 분기 (페이지에 안전 redirect 가드 있음)
        case 'ESCROW':
          return `/escrow/${n.linkId}/buyer-info`
        case 'DELIVERY':
          return `/delivery/${n.linkId}/track`
        case 'ITEM':
          return `/items/${n.linkId}`
        case 'REVIEW':
          return '/reviews'
        case 'PAYMENT':
          return '/point'
        case 'INQUIRY':
          return `/mypage/inquiries/${n.linkId}`
        case 'OVERDUE':
          return '/mypage/overdue'
        default:
          return null
      }
    })()
    if (path) navigate(path)
  }

  return (
    <div className="flex flex-col h-full">
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

      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-5">
        {items.length === 0 && (
          <p className="py-16 text-center text-sm text-gray-400">알림이 없어요</p>
        )}
        {timelineItems.length > 0 && (
          <ol className="flex min-h-full flex-col justify-end gap-4">
            {timelineItems.map((n) => (
              <li key={n.id}>
                <NotificationBubble
                  notification={n}
                  onClick={() => handleNotificationClick(n)}
                />
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

function NotificationBubble({
  notification,
  onClick,
}: {
  notification: {
    type: string
    linkType: string | null
    title: string
    content: string
    read: boolean
    createdAt: string
  }
  onClick: () => void
}) {
  return (
    <div className="flex items-end gap-2">
      <NotificationAvatar type={notification.type} linkType={notification.linkType} unread={!notification.read} />
      <div className="min-w-0 max-w-[78%]">
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'group w-full rounded-2xl rounded-bl-md border px-3.5 py-3 text-left shadow-sm transition-colors',
            notification.read
              ? 'border-gray-200 bg-white hover:bg-gray-50'
              : 'border-primary-100 bg-white hover:bg-primary-50'
          )}
        >
          <div className="mb-1 flex items-center gap-2">
            <NotificationBadge type={notification.type} linkType={notification.linkType} />
            {!notification.read && (
              <span className="rounded-full bg-primary-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                새 알림
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 line-clamp-2">{notification.title}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600 line-clamp-4">
            {notification.content}
          </p>
          <p className="mt-2 text-[11px] font-medium text-primary-500 opacity-0 transition-opacity group-hover:opacity-100">
            자세히 보기
          </p>
        </button>
        <p className="mt-1 px-1 text-[11px] text-gray-400">{fromNow(notification.createdAt)}</p>
      </div>
    </div>
  )
}

function NotificationAvatar({
  type,
  linkType,
  unread,
}: {
  type: string
  linkType: string | null
  unread: boolean
}) {
  const cfg = (() => {
    if (linkType === 'INQUIRY') return { icon: <Bell size={18} />, className: 'bg-violet-100 text-violet-700' }
    if (type === 'TRANSACTION') return { icon: <Receipt size={18} />, className: 'bg-amber-100 text-amber-700' }
    if (type === 'ESCROW' || linkType === 'ESCROW') return { icon: <Receipt size={18} />, className: 'bg-orange-100 text-orange-700' }
    if (type === 'DELIVERY') return { icon: <Truck size={18} />, className: 'bg-sky-100 text-sky-700' }
    if (type === 'REVIEW') return { icon: <Star size={18} />, className: 'bg-pink-100 text-pink-700' }
    if (type === 'CHAT' || type === 'MESSAGE') return { icon: <MessageCircle size={18} />, className: 'bg-blue-100 text-blue-700' }
    return { icon: <Bell size={18} />, className: 'bg-gray-100 text-gray-600' }
  })()

  return (
    <div className={cn('relative w-11 h-11 rounded-full shrink-0 flex items-center justify-center', cfg.className)}>
      {cfg.icon}
      {unread && (
        <span className="absolute -right-0.5 -top-0.5 w-3 h-3 rounded-full bg-primary-500 border-2 border-white" />
      )}
    </div>
  )
}

// 알림 종류별 배지 — 시스템/문의/신고/거래/기타 분기
function NotificationBadge({ type, linkType }: { type: string; linkType: string | null }) {
  // INQUIRY linkType 은 백엔드 type 이 SYSTEM 등 다양한데, 사용자 시각상 '문의' 가 더 의미 있음 → 우선
  if (linkType === 'INQUIRY') {
    return (
      <span className="text-[11px] font-medium bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">
        문의
      </span>
    )
  }
  if (type === 'SYSTEM') {
    return (
      <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
        시스템
      </span>
    )
  }
  // 신고 알림은 백엔드에 type 이 없음 — title 에 '[신고]' 같은 prefix 가 들어오면 추정.
  // 정식 type 추가되면 확장.
  if (type === 'NOTICE') {
    return (
      <span className="text-[11px] font-medium bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
        공지
      </span>
    )
  }
  if (type === 'TRANSACTION') {
    return (
      <span className="text-[11px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
        거래
      </span>
    )
  }
  // ESCROW (linkType 도 동일) — '거래 신청' 으로 명시
  if (type === 'ESCROW' || linkType === 'ESCROW') {
    return (
      <span className="text-[11px] font-medium bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
        거래 신청
      </span>
    )
  }
  if (type === 'DELIVERY') {
    return (
      <span className="text-[11px] font-medium bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">
        배달
      </span>
    )
  }
  if (type === 'POINT') {
    return (
      <span className="text-[11px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
        포인트
      </span>
    )
  }
  if (type === 'REVIEW') {
    return (
      <span className="text-[11px] font-medium bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded">
        리뷰
      </span>
    )
  }
  if (type === 'CHAT' || type === 'MESSAGE') {
    return (
      <span className="text-[11px] font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
        채팅
      </span>
    )
  }
  return null
}
