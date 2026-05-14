// 물품 상세 페이지 — ItemDetailResponse 기반 (PR #66 정합)
//
// 단일 tradeType (판매/대여/나눔) 모델로 단순화.
// 대여의 시작/종료일 입력은 Transaction 도메인 (POST /transactions)에서 처리 — 추후 분리.

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Heart, MapPin, Eye, Clock, ChevronLeft, ChevronRight, Flag,
  Pencil, Trash2, MessageCircle,
} from 'lucide-react'
import {
  useItemDetail, useToggleWish, useDeleteItem, useAdminDeleteItem,
  useRentalBlocks, useRequestRental,
} from '@/features/item/hooks'
import RentalDatePicker, { type RentalRange } from '@/features/item/RentalDatePicker'
import { useUserProfile } from '@/features/user/hooks'
import { useDrawerStore } from '@/shared/store/drawerStore'
import { useAuthStore } from '@/features/auth/store'
import { useEmailGuard } from '@/features/auth/emailGuard'
import { chatApi } from '@/features/chat/api'
import ReportModal from '@/shared/ui/ReportModal'
import UserProfileFloat from '@/shared/ui/UserProfileFloat'
import { cn } from '@/shared/lib/cn'
import { fromNow } from '@/shared/lib/date'
import { toast } from 'sonner'
import { BusinessError } from '@/shared/types'
import { getErrorMessage } from '@/shared/lib/errorMessages'
import type { ItemStatus, TradeType } from '@/features/item/types'

// 상태 배지 (판매중은 미표시 → undefined)
const STATUS_BADGE: Partial<Record<ItemStatus, { label: string; cls: string }>> = {
  '예약':     { label: '예약중',  cls: 'bg-yellow-100 text-yellow-700' },
  '거래완료': { label: '거래완료', cls: 'bg-gray-100 text-gray-500' },
  '비공개':   { label: '비공개',  cls: 'bg-red-100 text-red-600' },
}

const TRADE_TYPE_BADGE: Record<TradeType, { cls: string }> = {
  '판매': { cls: 'bg-orange-50 text-orange-500 border border-orange-200' },
  '대여': { cls: 'bg-blue-50 text-blue-500 border border-blue-200' },
  '나눔': { cls: 'bg-green-50 text-green-600 border border-green-200' },
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: item, isLoading } = useItemDetail(Number(id))
  const { data: seller } = useUserProfile(item?.sellerId)
  const { mutate: toggleWish } = useToggleWish(Number(id))
  const { mutate: deleteItem }      = useDeleteItem()
  const { mutate: deleteByAdmin }   = useAdminDeleteItem()
  const { open, openChatRoom } = useDrawerStore()
  const currentUser = useAuthStore((s) => s.user)
  const { requireVerified } = useEmailGuard()

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [profileFloatOpen, setProfileFloatOpen] = useState(false)
  const [tradeModeOpen, setTradeModeOpen] = useState(false)   // 라운드13 #5 — 채팅 시작 시 거래방식 모달
  const [imageIndex, setImageIndex] = useState(0)

  // 라운드14 4-C — 대여 달력 + 신청
  //   hook 은 early return 위에서 호출 (React error #310 회피)
  const rentalItemId = Number(id) || 0
  const rentalBlocksQ = useRentalBlocks(rentalItemId || undefined)
  const requestRental = useRequestRental(rentalItemId)
  const [rentalRange, setRentalRange] = useState<RentalRange | null>(null)

  // 로딩/에러 가드
  if (isLoading) {
    return <div className="py-20 text-center text-gray-400">불러오는 중...</div>
  }
  if (!item) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400 mb-3">상품을 찾을 수 없어요</p>
        <button onClick={() => navigate(-1)} className="text-primary-500 text-sm">
          ← 돌아가기
        </button>
      </div>
    )
  }

  const isOwner = !!currentUser && item.sellerId === currentUser.id
  const isAdmin = currentUser?.role === 'ADMIN'
  // admin 은 본인 아닌 물품도 삭제 가능 (백엔드 가드 별도). 수정은 본인만.
  const showAdminActions = isAdmin && !isOwner
  const status = STATUS_BADGE[item.status]
  // 썸네일 우선 정렬 (대표 이미지가 [0] 에 오도록)
  const orderedImages = [...item.images].sort((a, b) => Number(b.thumbnail) - Number(a.thumbnail))
  const safeIndex = Math.min(imageIndex, Math.max(orderedImages.length - 1, 0))
  const currentImage = orderedImages[safeIndex]?.imageUrl
  const hasMultiple = orderedImages.length > 1
  const goPrev = () => setImageIndex((i) => (i - 1 + orderedImages.length) % orderedImages.length)
  const goNext = () => setImageIndex((i) => (i + 1) % orderedImages.length)

  const handleDelete = () => {
    // 본인: 일반 endpoint / admin (본인 아닌 물품): admin endpoint
    const onSuccess = () => navigate('/items')
    if (showAdminActions) {
      deleteByAdmin(item.id, { onSuccess })
    } else {
      deleteItem(item.id, { onSuccess })
    }
  }

  // 라운드13 — tradeTypes 우선, legacy 단일 모드면 [tradeType] 으로 폴백
  const modes: TradeType[] = item.tradeTypes?.length ? item.tradeTypes : [item.tradeType]
  const isShare = modes.includes('나눔')

  // 라운드13 #5 — 채팅 시작 시 거래방식 선택
  //   다중 모드(판매+대여) 면 선택 모달 → 선택된 mode 로 채팅방 생성
  //   단일 모드면 바로 채팅방 (모달 X)
  const startChatWithMode = async (mode: TradeType) => {
    try {
      const room = await chatApi.createRoom(item.id, mode)
      openChatRoom(room.data.id)
      open('chat')
    } catch {
      toast.error('채팅을 시작하지 못했어요.')
    }
  }

  const handleChat = () =>
    requireVerified(async () => {
      if (modes.length === 1) {
        await startChatWithMode(modes[0])
      } else {
        setTradeModeOpen(true)   // 모달 열기
      }
    })

  // 라운드14 4-C — 대여 신청: 채팅방 만들고 그 위에 rental-request 전송
  const handleRentalRequest = () =>
    requireVerified(async () => {
      if (!rentalRange || !rentalRange.start || !rentalRange.end) {
        toast.error('대여 기간(시작·종료)을 모두 선택해 주세요.')
        return
      }
      try {
        const room = await chatApi.createRoom(item.id, '대여')
        await requestRental.mutateAsync({
          rentalStart: `${rentalRange.start}T00:00:00`,
          rentalEnd:   `${rentalRange.end}T23:59:59`,
          chatRoomId:  room.data.id,
        })
        openChatRoom(room.data.id)
        open('chat')
        setRentalRange(null)
        toast.success('대여 신청을 보냈어요. 판매자가 확인 후 예약돼요.')
      } catch (err) {
        if (err instanceof BusinessError) toast.error(getErrorMessage(err.code, err.message))
        else toast.error('대여 신청에 실패했어요.')
      }
    })

  return (
    <div className="max-w-5xl mx-auto pb-28">
      {/* 상단 네비 */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700"
        >
          <ChevronLeft size={16} /> 목록으로
        </button>
        {!isOwner && (
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
          >
            <Flag size={13} /> 신고
          </button>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-10">
        {/* 이미지 영역 — 캐러셀 (좌/우 버튼 + 인덱스 + 썸네일 클릭 전환) */}
        <div className="mb-6 lg:mb-0">
          <div className="relative aspect-square rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
            {currentImage ? (
              <img src={currentImage} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200" />
            )}
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="이전 사진"
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow text-gray-700"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="다음 사진"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow text-gray-700"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute right-3 bottom-3 px-2 py-0.5 rounded-full bg-black/55 text-white text-xs font-medium">
                  {safeIndex + 1} / {orderedImages.length}
                </div>
              </>
            )}
          </div>

          {hasMultiple && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {orderedImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={`사진 ${i + 1}`}
                  className={cn(
                    'w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border-2 transition-colors',
                    i === safeIndex ? 'border-primary-500' : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 정보 영역 */}
        <div className="flex flex-col gap-5">
          {/* 거래 방식 태그 — 다중 등록이면 여러 개 */}
          <div className="flex items-center gap-2 flex-wrap">
            {modes.map((m) => (
              <span key={m} className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', TRADE_TYPE_BADGE[m].cls)}>
                {m}
              </span>
            ))}
            {status && (
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', status.cls)}>
                {status.label}
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-gray-900 leading-snug">{item.title}</h1>

          {/* 가격 — 모드별 한 줄씩 */}
          <div className="flex flex-col gap-1.5">
            {isShare ? (
              <span className="text-2xl font-bold text-green-600">무료 나눔</span>
            ) : (
              <>
                {modes.includes('판매') && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-500 w-8">판매</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {(item.salePrice ?? item.price).toLocaleString()}원
                    </span>
                  </div>
                )}
                {modes.includes('대여') && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-500 w-8">대여</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {(item.rentalPrice ?? item.price).toLocaleString()}원
                      {item.rentalUnit && <span className="text-sm text-gray-500 ml-1">/ {item.rentalUnit}</span>}
                    </span>
                  </div>
                )}
                {modes.includes('대여') && item.deposit != null && item.deposit > 0 && (() => {
                  // 라운드14 B-1 — PERCENT 일 때 환산 base = salePrice ?? rentalPrice (백엔드 공식 일치)
                  if (item.depositType !== 'PERCENT') {
                    return (
                      <span className="text-xs text-gray-500">
                        보증금 {item.deposit.toLocaleString()}원
                      </span>
                    )
                  }
                  const base = item.salePrice ?? item.rentalPrice ?? 0
                  const computed = Math.ceil(base * item.deposit / 100)
                  return (
                    <span className="text-xs text-gray-500">
                      보증금 {item.deposit}% ≒ {computed.toLocaleString()}원
                      <span className="text-gray-400"> (거래 시 자동 환산)</span>
                    </span>
                  )
                })()}
              </>
            )}
          </div>

          {/* 판매자 프로필 — 클릭 시 플로팅 패널, GET /api/v1/users/{id}/profile */}
          <button
            type="button"
            onClick={() => setProfileFloatOpen(true)}
            className="w-full flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {seller?.profileImage ? (
                <img src={seller.profileImage} alt={seller.nickname} className="w-full h-full object-cover" />
              ) : (
                <span className="text-indigo-600 font-bold text-sm">
                  {seller?.nickname?.[0] ?? '#'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {seller?.nickname ?? '불러오는 중...'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {seller
                  ? `리뷰 ${seller.reviewCount}건${seller.trustScore != null ? ` · 신뢰 ${seller.trustScore.toFixed(1)}점` : ''}`
                  : ''}
              </p>
            </div>
            <span className="text-xs text-primary-500 font-medium flex-shrink-0">
              프로필 보기
            </span>
          </button>

          <hr className="border-gray-100" />

          {/* 라운드14 4-C — 대여 가능 기간 + 신청 (대여 모드 + 본인 아님 한정) */}
          {modes.includes('대여') && !isOwner && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">대여 기간 선택</h3>
              <RentalDatePicker
                blocks={rentalBlocksQ.data?.blocks ?? []}
                value={rentalRange}
                onChange={setRentalRange}
              />
              {rentalRange?.start && rentalRange?.end && (
                <p className="text-xs text-gray-500">
                  선택 기간: <span className="font-medium text-gray-900">{rentalRange.start} ~ {rentalRange.end}</span>
                </p>
              )}
              <button
                type="button"
                onClick={handleRentalRequest}
                disabled={!rentalRange?.start || !rentalRange?.end || requestRental.isPending}
                className="w-full mt-1 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {requestRental.isPending ? '신청 중...' : '대여 신청'}
              </button>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                회색 날짜는 이미 다른 사용자가 예약한 기간이에요. 판매자가 신청을 확인하면 예약으로 전환됩니다.
              </p>
            </div>
          )}

          <hr className="border-gray-100" />

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">상품 설명</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.hashtags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 메타 정보 */}
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {item.region ?? '지역 미설정'}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {fromNow(item.createdAt)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Eye size={12} /> 조회 {item.viewCount}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Heart size={12} /> 관심 {item.wishlistCount}
            </span>
          </div>

          {/* 데스크탑 액션 */}
          <div className="hidden lg:flex items-center gap-2 pt-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => navigate(`/items/${id}/edit`)}
                  className="flex items-center gap-1.5 px-4 py-3 border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 rounded-xl text-sm font-semibold flex-1"
                >
                  <Pencil size={16} /> 수정
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-3 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold flex-1"
                >
                  <Trash2 size={16} /> 삭제
                </button>
              </>
            ) : showAdminActions ? (
              <>
                {/* admin 은 구매/대여 선택 없이 바로 채팅방 오픈 + 삭제 권한 */}
                <button
                  onClick={handleChat}
                  className="flex items-center gap-1.5 px-4 py-3 border border-primary-300 text-primary-600 hover:bg-primary-50 rounded-xl text-sm font-semibold flex-1"
                >
                  <MessageCircle size={16} /> 채팅하기
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-3 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold flex-1"
                >
                  <Trash2 size={16} /> 삭제
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => toggleWish({ current: item.isWishlisted })}
                  className={cn(
                    'p-3 border rounded-xl transition-colors flex-shrink-0',
                    item.isWishlisted
                      ? 'border-red-300 text-red-500 bg-red-50'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300',
                  )}
                  aria-label="찜하기"
                >
                  <Heart size={20} fill={item.isWishlisted ? 'currentColor' : 'none'} />
                </button>
                {/* 라운드12 — [거래 시작] 은 채팅방 안에서만. 물품 상세에는 [채팅하기] 만. */}
                <button
                  onClick={handleChat}
                  disabled={item.status !== '판매중'}
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {item.status === '판매중' ? '채팅하기' : '거래 불가'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 모바일 하단 고정 액션 */}
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
        ) : showAdminActions ? (
          <>
            <button
              onClick={handleChat}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-primary-300 text-primary-600 rounded-xl text-sm font-semibold"
            >
              <MessageCircle size={16} /> 채팅하기
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
              onClick={() => toggleWish({ current: item.isWishlisted })}
              className={cn(
                'p-3 border rounded-xl transition-colors flex-shrink-0',
                item.isWishlisted
                  ? 'border-red-300 text-red-500 bg-red-50'
                  : 'border-gray-200 text-gray-400',
              )}
              aria-label="찜하기"
            >
              <Heart size={20} fill={item.isWishlisted ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleChat}
              disabled={item.status !== '판매중'}
              className="flex-1 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {item.status === '판매중' ? '채팅하기' : '거래 불가'}
            </button>
          </>
        )}
      </div>


      {/* 신고 모달 */}
      {reportOpen && (
        <ReportModal
          target={{ kind: 'item', itemId: item.id }}
          onClose={() => setReportOpen(false)}
        />
      )}

      {/* 판매자 프로필 플로팅 패널 */}
      {profileFloatOpen && (
        <UserProfileFloat
          userId={item.sellerId}
          onClose={() => setProfileFloatOpen(false)}
        />
      )}

      {/* 라운드13 #5 — 채팅 시작 시 거래방식 선택 모달 (다중 모드 물품) */}
      {tradeModeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">어떤 거래로 채팅하시겠어요?</h3>
            <p className="text-sm text-gray-500 mb-4">이 물품은 여러 거래 방식으로 등록되어 있어요. 채팅방은 거래 방식별로 분리됩니다.</p>
            <div className="flex flex-col gap-2">
              {modes.map((m) => (
                <button
                  key={m}
                  onClick={async () => {
                    setTradeModeOpen(false)
                    await startChatWithMode(m)
                  }}
                  className={cn('w-full py-3 rounded-xl text-sm font-semibold border-2 transition-colors text-left px-4',
                    TRADE_TYPE_BADGE[m].cls)}
                >
                  {m}
                  {m === '판매'  && item.salePrice   != null && ` — ${item.salePrice.toLocaleString()}원`}
                  {m === '대여'  && item.rentalPrice != null && ` — ${item.rentalPrice.toLocaleString()}원${item.rentalUnit ? ` / ${item.rentalUnit}` : ''}`}
                  {m === '나눔'  && ' — 무료 나눔'}
                </button>
              ))}
              <button
                onClick={() => setTradeModeOpen(false)}
                className="w-full py-2 mt-1 text-sm text-gray-500"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">상품을 삭제할까요?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제 후에는 복구할 수 없어요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
