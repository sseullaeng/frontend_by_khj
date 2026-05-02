// 물품 상세 페이지 — ItemDetailResponse 기반 (PR #66 정합)
//
// 단일 tradeType (판매/대여/나눔) 모델로 단순화.
// 대여의 시작/종료일 입력은 Transaction 도메인 (POST /transactions)에서 처리 — 추후 분리.

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Heart, MapPin, Eye, Clock, ChevronLeft, Flag,
  Pencil, Trash2,
} from 'lucide-react'
import { useItemDetail, useToggleWish, useDeleteItem } from '@/features/item/hooks'
import { useUserProfile } from '@/features/user/hooks'
import { useCreateTransaction } from '@/features/trade/hooks'
import { useDrawerStore } from '@/shared/store/drawerStore'
import { useAuthStore } from '@/features/auth/store'
import { useEmailGuard } from '@/features/auth/emailGuard'
import { chatApi } from '@/features/chat/api'
import ReportModal from '@/shared/ui/ReportModal'
import { cn } from '@/shared/lib/cn'
import { fromNow } from '@/shared/lib/date'
import { toast } from 'sonner'
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
  const { mutate: deleteItem } = useDeleteItem()
  const { mutateAsync: createTransactionAsync, isPending: isCreatingTx } = useCreateTransaction()
  const { open, openChatRoom, setPendingFirstMessage } = useDrawerStore()
  const currentUser = useAuthStore((s) => s.user)
  const { requireVerified } = useEmailGuard()

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [rentalOpen, setRentalOpen] = useState(false)
  const [rentalStart, setRentalStart] = useState('')
  const [rentalEnd, setRentalEnd] = useState('')

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
  const status = STATUS_BADGE[item.status]
  const typeBadge = TRADE_TYPE_BADGE[item.tradeType]
  const mainImage = item.images.find((img) => img.thumbnail)?.imageUrl ?? item.images[0]?.imageUrl
  const otherImages = item.images.filter((img) => img.imageUrl !== mainImage)

  const handleDelete = () => {
    deleteItem(item.id, { onSuccess: () => navigate('/items') })
  }

  // 채팅하기 — 이메일 인증 필요 (가이드 §2.5)
  const handleChat = () =>
    requireVerified(async () => {
      try {
        const room = await chatApi.createRoom(item.id)
        const message = `${item.title} 관련 문의드립니다.`
        setPendingFirstMessage(message)
        openChatRoom(room.data.id)
        open()
      } catch {
        toast.error('채팅을 시작하지 못했어요.')
      }
    })

  // 거래 시작 — 판매/나눔: itemId만 / 대여: 시작·종료일 모달
  const handleStartTransaction = () =>
    requireVerified(async () => {
      if (item.tradeType === '대여') {
        setRentalOpen(true)
        return
      }
      try {
        const { id: txId } = await createTransactionAsync({ itemId: item.id })
        navigate(`/trades/${txId}`)
      } catch {
        // 토스트는 hook 에서
      }
    })

  // datetime-local: "2026-05-03T10:00" → 백엔드 LocalDateTime: "2026-05-03T10:00:00"
  const toBackendDateTime = (v: string) => (v.length === 16 ? `${v}:00` : v)

  const submitRentalTransaction = async () => {
    if (!rentalStart || !rentalEnd || rentalEnd <= rentalStart) {
      toast.error('시작·종료 일시를 올바르게 입력해 주세요.')
      return
    }
    try {
      const { id: txId } = await createTransactionAsync({
        itemId: item.id,
        rentalStart: toBackendDateTime(rentalStart),
        rentalEnd: toBackendDateTime(rentalEnd),
      })
      setRentalOpen(false)
      navigate(`/trades/${txId}`)
    } catch {
      // 토스트는 hook 에서
    }
  }

  // 가격 표시
  const priceLabel =
    item.tradeType === '나눔'
      ? '무료 나눔'
      : item.tradeType === '대여'
        ? `${item.price.toLocaleString()}원${item.rentalUnit ? ` / ${item.rentalUnit}` : ''}`
        : `${item.price.toLocaleString()}원`

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
        {/* 이미지 영역 */}
        <div className="mb-6 lg:mb-0">
          <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
            {mainImage ? (
              <img src={mainImage} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200" />
            )}
          </div>

          {otherImages.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {otherImages.map((img, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200"
                >
                  <img src={img.imageUrl} alt={`이미지 ${i + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 정보 영역 */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', typeBadge.cls)}>
              {item.tradeType}
            </span>
            {status && (
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', status.cls)}>
                {status.label}
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-gray-900 leading-snug">{item.title}</h1>

          {/* 가격 */}
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                'text-2xl font-bold',
                item.tradeType === '나눔' ? 'text-green-600' : 'text-gray-900',
              )}
            >
              {priceLabel}
            </span>
            {item.tradeType === '대여' && item.deposit != null && item.deposit > 0 && (
              <span className="text-xs text-gray-500">
                보증금 {item.deposit.toLocaleString()}원
              </span>
            )}
          </div>

          {/* 판매자 프로필 — GET /api/v1/users/{id}/profile */}
          <Link
            to={`/users/${item.sellerId}`}
            className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
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
          </Link>

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
            ) : (
              <>
                <button
                  onClick={() => toggleWish()}
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
                <button
                  onClick={handleChat}
                  className="flex-1 py-3 border border-primary-500 text-primary-600 hover:bg-primary-50 rounded-xl text-sm font-semibold"
                >
                  채팅하기
                </button>
                <button
                  onClick={handleStartTransaction}
                  disabled={isCreatingTx || item.status !== '판매중'}
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {item.status === '판매중' ? '거래 시작' : '거래 불가'}
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
        ) : (
          <>
            <button
              onClick={() => toggleWish()}
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
              className="flex-1 py-3 border border-primary-500 text-primary-600 rounded-xl text-sm font-semibold"
            >
              채팅
            </button>
            <button
              onClick={handleStartTransaction}
              disabled={isCreatingTx || item.status !== '판매중'}
              className="flex-1 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {item.status === '판매중' ? '거래 시작' : '거래 불가'}
            </button>
          </>
        )}
      </div>

      {/* 대여 날짜 선택 모달 */}
      {rentalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">대여 기간 선택</h3>
            <p className="text-sm text-gray-500 mb-4">
              {item.tradeType === '대여' && item.rentalUnit
                ? `단가: ${item.price.toLocaleString()}원/${item.rentalUnit}`
                : ''}
            </p>

            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">시작 일시</label>
                <input
                  type="datetime-local"
                  value={rentalStart}
                  onChange={(e) => setRentalStart(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">종료 일시</label>
                <input
                  type="datetime-local"
                  value={rentalEnd}
                  min={rentalStart}
                  onChange={(e) => setRentalEnd(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRentalOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
              >
                취소
              </button>
              <button
                onClick={submitRentalTransaction}
                disabled={isCreatingTx || !rentalStart || !rentalEnd}
                className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                거래 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 모달 */}
      {reportOpen && (
        <ReportModal
          target={{ kind: 'item', itemId: item.id }}
          onClose={() => setReportOpen(false)}
        />
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
