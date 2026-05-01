// 물품 상세 페이지: 물품 정보 표시, 구매/대여 선택 후 채팅 시작
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, MapPin, Eye, Clock, ChevronLeft, Flag, Pencil, Trash2, ShoppingCart, RefreshCw, Pencil as PencilEdit } from 'lucide-react'
import { useItemDetail, useToggleWish, useDeleteItem } from '@/features/item/hooks'
import { useDrawerStore } from '@/shared/store/drawerStore'
import { useAuthStore } from '@/features/auth/store'
import { chatApi } from '@/features/chat/api'
import { cn } from '@/shared/lib/cn'
import { fromNow } from '@/shared/lib/date'

// 물품 상태별 라벨·색상 맵핑
const STATUS_MAP = {
  ACTIVE:   { label: '판매중',   cls: 'bg-green-100 text-green-700' },
  RESERVED: { label: '예약중',   cls: 'bg-yellow-100 text-yellow-700' },
  SOLD:     { label: '판매완료', cls: 'bg-gray-100 text-gray-500' },
  HIDDEN:   { label: '숨김',     cls: 'bg-red-100 text-red-600' },
} as const

// 거래 유형별 라벨·색상 맵핑
const TYPE_MAP = {
  SELL:  { label: '중고거래', cls: 'bg-orange-50 text-orange-500 border border-orange-200' },
  RENT:  { label: '대여',     cls: 'bg-blue-50 text-blue-500 border border-blue-200' },
  SHARE: { label: '나눔',     cls: 'bg-green-50 text-green-600 border border-green-200' },
} as const

// 구매/대여 선택 타입: null이면 미선택
type TradeChoice = 'buy' | 'rent'

export default function ItemDetailPage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const { data: item, isLoading } = useItemDetail(Number(id))
  const { mutate: toggleWish }    = useToggleWish(Number(id))
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem()
  const { open, openChatRoom, setPendingFirstMessage } = useDrawerStore()
  const currentUser = useAuthStore((s) => s.user)

  // 삭제 확인 모달 상태
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  // 구매/대여 선택 상태: null이면 아직 선택 안 함
  const [tradeChoice, setTradeChoice] = useState<TradeChoice | null>(null)
  // 구매/대여 선택 모달 열림 여부
  const [tradeSelectOpen, setTradeSelectOpen] = useState(false)
  // 모달 내 임시 선택값 (확인 전까지 반영 안 함)
  const [tempChoice, setTempChoice] = useState<TradeChoice>('buy')

  const isOwner = !!currentUser && item?.sellerId === currentUser.id

  // 구매가와 대여가가 모두 있는 물품인지 확인 (선택 모달 표시 조건)
  const hasBothOptions = !!item && item.price > 0 && item.rentPrice > 0

  const handleDelete = () => {
    deleteItem(Number(id), { onSuccess: () => navigate('/items') })
  }

  // 채팅하기 버튼 핸들러: 구매/대여 미선택 시 모달 먼저 표시
  const handleChat = async (choice?: TradeChoice) => {
    const finalChoice = choice ?? tradeChoice

    // 둘 다 있는 물품인데 선택을 안 했으면 모달 열기
    if (hasBothOptions && !finalChoice) {
      setTempChoice('buy')
      setTradeSelectOpen(true)
      return
    }

    // 선택이 확정된 경우 채팅방 열기
    open('chat')
    try {
      const res = await chatApi.createRoom(item!.id)
      const roomId = res.data.id

      // 구매/대여 선택이 있으면 판매자에게 자동 첫 메시지 설정
      if (finalChoice) {
        const label = finalChoice === 'buy' ? '구매' : '대여'
        setPendingFirstMessage(`안녕하세요! ${label}로 문의드립니다 😊`)
      }

      openChatRoom(roomId)
    } catch {
      // 채팅방 생성 실패 시 채팅 목록만 표시
    }
  }

  // 모달에서 선택 확인
  const handleTradeSelectConfirm = () => {
    setTradeChoice(tempChoice)
    setTradeSelectOpen(false)
    handleChat(tempChoice)
  }

  // 선택 변경 버튼: 기존 선택 초기화 후 모달 다시 열기
  const handleChangeChoice = () => {
    setTempChoice(tradeChoice ?? 'buy')
    setTradeSelectOpen(true)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-gray-400 text-sm">불러오는 중...</p>
    </div>
  )
  if (!item) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <p className="text-gray-700 font-semibold">상품을 찾을 수 없어요</p>
      <button onClick={() => navigate(-1)} className="text-primary-500 text-sm">← 돌아가기</button>
    </div>
  )

  const status = STATUS_MAP[item.status]
  const type   = TYPE_MAP[item.itemType]

  return (
    <div className="max-w-5xl mx-auto pb-28">

      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={16} /> 목록으로
        </button>
        <button
          onClick={() => navigate(`/items/${id}/report`)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <Flag size={13} /> 신고
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-10">

        {/* 물품 이미지 영역 */}
        <div className="mb-6 lg:mb-0">
          <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
            {item.imageUrls[0] ? (
              <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200" />
            )}
          </div>

          {item.imageUrls.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {item.imageUrls.slice(1).map((url, i) => (
                <div key={i} className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 물품 정보 영역 */}
        <div className="flex flex-col gap-5">

          {/* 유형·상태 배지 */}
          <div className="flex items-center gap-2">
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', type.cls)}>
              {type.label}
            </span>
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', status.cls)}>
              {status.label}
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 leading-snug">{item.title}</h1>

          {/* 가격 영역: 구매가·대여가 모두 표시 */}
          <div className="flex flex-col gap-1">
            {item.itemType === 'SHARE' ? (
              <span className="text-2xl font-bold text-green-600">무료 나눔</span>
            ) : (
              <>
                {item.price > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-12">구매가</span>
                    <span className="text-2xl font-bold text-gray-900">{item.price.toLocaleString()}원</span>
                  </div>
                )}
                {item.rentPrice > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-12">대여가</span>
                    <span className={cn(
                      'font-bold',
                      item.price > 0 ? 'text-xl text-blue-600' : 'text-2xl text-gray-900'
                    )}>
                      {item.rentPrice.toLocaleString()}원
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 구매/대여 선택 표시 (선택했을 때만, 둘 다 있는 물품에만) */}
          {hasBothOptions && !isOwner && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              {tradeChoice ? (
                <>
                  <span className="text-sm text-blue-700 font-medium">
                    {tradeChoice === 'buy' ? '🛒 구매로 문의' : '🔄 대여로 문의'}
                  </span>
                  {/* 선택 변경 버튼 */}
                  <button
                    onClick={handleChangeChoice}
                    className="ml-auto flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                  >
                    <PencilEdit size={12} /> 변경
                  </button>
                </>
              ) : (
                <span className="text-sm text-blue-600">
                  채팅 전 구매 또는 대여를 선택해 주세요
                </span>
              )}
            </div>
          )}

          {/* 판매자 정보 */}
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.sellerProfileImageUrl ? (
                <img src={item.sellerProfileImageUrl} alt={item.sellerNickname} className="w-full h-full object-cover" />
              ) : (
                <span className="text-indigo-600 font-bold text-sm">
                  {item.sellerNickname[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.sellerNickname}</p>
              <p className="text-xs text-gray-400 mt-0.5">거래 12건 · ★ 4.8</p>
            </div>
            <Link
              to={`/users/${item.sellerId}`}
              className="text-xs text-primary-500 font-medium hover:underline flex-shrink-0"
            >
              프로필 보기
            </Link>
          </div>

          <hr className="border-gray-100" />

          {/* 상품 설명 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">상품 설명</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* 해시태그 */}
          {item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.hashtags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 메타 정보: 위치·시간·조회·관심 */}
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={12} /> 서울</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {fromNow(item.createdAt)}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Eye size={12} /> 조회 {item.viewCount}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Heart size={12} /> 관심 {item.wishCount}
            </span>
          </div>

          {/* 데스크탑 액션 버튼 */}
          <div className="hidden lg:flex items-center gap-2 pt-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => navigate(`/items/${id}/edit`)}
                  className="flex items-center gap-1.5 px-4 py-3 border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 rounded-xl text-sm font-semibold transition-colors flex-1"
                >
                  <Pencil size={16} /> 수정
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-3 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors flex-1"
                >
                  <Trash2 size={16} /> 삭제
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => toggleWish()}
                  className={cn(
                    'p-3 border rounded-xl transition-colors flex-shrink-0',
                    item.isWished
                      ? 'border-red-300 text-red-500 bg-red-50'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  )}
                  aria-label="찜하기"
                >
                  <Heart size={20} fill={item.isWished ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => handleChat()}
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {/* 선택 상태에 따라 버튼 라벨 변경 */}
                  {hasBothOptions && !tradeChoice ? '거래 방법 선택 후 채팅' : '채팅하기'}
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* 모바일 액션 버튼 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-2">
        {isOwner ? (
          <>
            <button
              onClick={() => navigate(`/items/${id}/edit`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold"
            >
              <Pencil size={16} /> 수정
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-red-200 text-red-500 rounded-xl text-sm font-semibold"
            >
              <Trash2 size={16} /> 삭제
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => toggleWish()}
              className={cn(
                'p-3 border rounded-xl transition-colors flex-shrink-0',
                item.isWished ? 'border-red-300 text-red-500 bg-red-50' : 'border-gray-200 text-gray-400'
              )}
              aria-label="찜하기"
            >
              <Heart size={20} fill={item.isWished ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => handleChat()}
              className="flex-1 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold"
            >
              {hasBothOptions && !tradeChoice ? '거래 방법 선택 후 채팅' : '채팅하기'}
            </button>
          </>
        )}
      </div>

      {/* ── 구매/대여 선택 모달 ── */}
      {tradeSelectOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">거래 방법을 선택해 주세요</h3>
              <p className="text-sm text-gray-500 mt-1">채팅 시 판매자에게 선택한 방법이 전달돼요</p>
            </div>

            {/* 구매 선택 */}
            <button
              onClick={() => setTempChoice('buy')}
              className={cn(
                'w-full flex items-center gap-4 p-5 border-b border-gray-100 transition-colors text-left',
                tempChoice === 'buy' ? 'bg-orange-50' : 'hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                tempChoice === 'buy' ? 'bg-orange-100' : 'bg-gray-100'
              )}>
                <ShoppingCart size={18} className={tempChoice === 'buy' ? 'text-orange-500' : 'text-gray-400'} />
              </div>
              <div className="flex-1">
                <p className={cn('font-semibold', tempChoice === 'buy' ? 'text-orange-600' : 'text-gray-800')}>
                  구매
                </p>
                <p className="text-sm text-gray-400">{item.price.toLocaleString()}원</p>
              </div>
              {/* 선택 표시 원 */}
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                tempChoice === 'buy' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
              )}>
                {tempChoice === 'buy' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>

            {/* 대여 선택 */}
            <button
              onClick={() => setTempChoice('rent')}
              className={cn(
                'w-full flex items-center gap-4 p-5 transition-colors text-left',
                tempChoice === 'rent' ? 'bg-blue-50' : 'hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                tempChoice === 'rent' ? 'bg-blue-100' : 'bg-gray-100'
              )}>
                <RefreshCw size={18} className={tempChoice === 'rent' ? 'text-blue-500' : 'text-gray-400'} />
              </div>
              <div className="flex-1">
                <p className={cn('font-semibold', tempChoice === 'rent' ? 'text-blue-600' : 'text-gray-800')}>
                  대여
                </p>
                <p className="text-sm text-gray-400">{item.rentPrice.toLocaleString()}원</p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                tempChoice === 'rent' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              )}>
                {tempChoice === 'rent' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>

            {/* 확인·취소 버튼 */}
            <div className="flex gap-2 p-4">
              <button
                onClick={() => setTradeSelectOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleTradeSelectConfirm}
                className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달 ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">상품을 삭제할까요?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제된 상품은 복구할 수 없어요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
