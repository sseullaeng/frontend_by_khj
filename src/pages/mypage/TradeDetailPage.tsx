// 거래 상세 페이지 — Transaction 모델 (백엔드 spec 정합)
//
// 액션:
//   seller: 채팅중 → 예약, 예약 → 거래완료
//   양쪽:   채팅중/예약 → 취소

import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeft, Calendar, ShoppingBag, Hash } from 'lucide-react'
import { useTransactionDetail, usePatchTransaction } from '@/features/trade/hooks'
import { useItemDetail } from '@/features/item/hooks'
import { useUserProfile } from '@/features/user/hooks'
import { useAuthStore } from '@/features/auth/store'
import { fromNow, formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import type { TransactionStatus } from '@/features/trade/types'

const STATUS_BADGE: Record<TransactionStatus, { color: string }> = {
  '채팅중':   { color: 'text-amber-700 bg-amber-100' },
  '예약':     { color: 'text-yellow-700 bg-yellow-100' },
  '거래완료': { color: 'text-blue-700 bg-blue-100' },
  '취소':     { color: 'text-red-600 bg-red-100' },
}

const TYPE_COLOR: Record<string, string> = {
  '판매': 'bg-blue-100 text-blue-700',
  '대여': 'bg-green-100 text-green-700',
  '나눔': 'bg-purple-100 text-purple-700',
}

export default function TradeDetailPage() {
  const navigate = useNavigate()
  const { tradeId } = useParams<{ tradeId: string }>()
  const id = Number(tradeId)
  const currentUser = useAuthStore((s) => s.user)

  const { data: tx, isLoading } = useTransactionDetail(id)
  const { data: item } = useItemDetail(tx?.itemId ?? 0)
  const counterpartId =
    tx && currentUser
      ? tx.sellerId === currentUser.id
        ? tx.buyerId
        : tx.sellerId
      : null
  const { data: counterpart } = useUserProfile(counterpartId ?? undefined)

  const { mutate: patch, isPending: isPatching } = usePatchTransaction(id)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  if (isLoading) {
    return <div className="py-20 text-center text-gray-500">거래 내역을 불러오는 중...</div>
  }
  if (!tx) {
    return <div className="py-20 text-center text-gray-500">거래 내역을 찾을 수 없어요.</div>
  }

  const isSeller = currentUser?.id === tx.sellerId
  const isBuyer = currentUser?.id === tx.buyerId
  const status = STATUS_BADGE[tx.status]
  const typeColor = TYPE_COLOR[tx.tradeType] ?? 'bg-gray-100 text-gray-700'

  // 가능한 액션
  const canReserve  = isSeller && tx.status === '채팅중'
  const canComplete = isSeller && tx.status === '예약'
  const canCancel   = (isSeller || isBuyer) && (tx.status === '채팅중' || tx.status === '예약')

  return (
    <div className="pb-10">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">거래 내역</h1>
      </div>

      {/* 상태 배지 */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className={cn('px-3 py-1 text-sm font-medium rounded-full', status.color)}>
          {tx.status}
        </span>
        <span className={cn('px-3 py-1 text-sm font-medium rounded-full', typeColor)}>
          {tx.tradeType}
        </span>
        <span
          className={cn(
            'px-3 py-1 text-sm font-medium rounded-full',
            isBuyer ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
          )}
        >
          {isBuyer ? '구매' : '판매'}
        </span>
      </div>

      {/* 물품 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">물품 정보</h2>
        <Link
          to={`/items/${tx.itemId}`}
          className="flex items-start gap-4 hover:bg-gray-50 p-2 rounded-lg transition-colors"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
            {item?.images[0] ? (
              <img src={item.images[0].imageUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag size={20} className="text-gray-300" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 mb-1 truncate">
              {item?.title ?? `물품 #${tx.itemId}`}
            </p>
            <p className="text-lg font-bold text-primary-600">
              {tx.tradeType === '나눔' ? '무료 나눔' : `${tx.price.toLocaleString()}원`}
            </p>
          </div>
        </Link>
      </div>

      {/* 거래 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">거래 정보</h2>
        <div className="space-y-2.5 text-sm">
          <Row icon={<Hash size={16} />} label="거래 번호" value={`#${tx.id}`} />
          <Row icon={<Calendar size={16} />} label="시작" value={fromNow(tx.createdAt)} />
          {tx.reservedAt && (
            <Row icon={<Calendar size={16} />} label="예약" value={fromNow(tx.reservedAt)} />
          )}
          {tx.completedAt && (
            <Row icon={<Calendar size={16} />} label="완료" value={fromNow(tx.completedAt)} />
          )}
          {tx.canceledAt && (
            <Row
              icon={<Calendar size={16} />}
              label="취소"
              value={`${fromNow(tx.canceledAt)} · ${tx.cancelReason ?? '사유 없음'}`}
            />
          )}
          {tx.tradeType === '대여' && tx.rentalStart && tx.rentalEnd && (
            <Row
              icon={<Calendar size={16} />}
              label="대여기간"
              value={`${formatKst(tx.rentalStart, 'yyyy.MM.dd HH:mm')} ~ ${formatKst(tx.rentalEnd, 'yyyy.MM.dd HH:mm')}`}
            />
          )}
          {tx.deposit != null && tx.deposit > 0 && (
            <Row icon={<Hash size={16} />} label="보증금" value={`${tx.deposit.toLocaleString()}원`} />
          )}
        </div>
      </div>

      {/* 거래 상대방 */}
      {counterpartId && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">거래 상대방</h2>
          <Link
            to={`/users/${counterpartId}`}
            className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
              {counterpart?.profileImage ? (
                <img
                  src={counterpart.profileImage}
                  alt={counterpart.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">#</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {counterpart?.nickname ?? `사용자 #${counterpartId}`}
              </p>
              {counterpart && (
                <p className="text-sm text-gray-600">
                  리뷰 {counterpart.reviewCount}건
                  {counterpart.trustScore != null && ` · 신뢰 ${counterpart.trustScore.toFixed(1)}점`}
                </p>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* 액션 버튼 */}
      {(canReserve || canComplete || canCancel) && (
        <div className="flex gap-2 fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 lg:static lg:border-0 lg:px-0">
          {canCancel && (
            <Button
              variant="outline"
              fullWidth
              isLoading={isPatching}
              onClick={() => setCancelOpen(true)}
            >
              취소하기
            </Button>
          )}
          {canReserve && (
            <Button
              fullWidth
              isLoading={isPatching}
              onClick={() => patch({ action: '예약' })}
            >
              예약하기
            </Button>
          )}
          {canComplete && (
            <Button
              fullWidth
              isLoading={isPatching}
              onClick={() => patch({ action: '거래완료' })}
            >
              거래완료
            </Button>
          )}
        </div>
      )}

      {/* 취소 모달 */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">거래를 취소할까요?</h3>
            <p className="text-sm text-gray-500 mb-3">취소 사유를 입력해 주세요.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="예: 구매자 변심"
              maxLength={200}
              className="w-full h-20 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setCancelOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
              >
                돌아가기
              </button>
              <button
                onClick={() => {
                  patch({ action: '취소', cancelReason: cancelReason || '사유 없음' })
                  setCancelOpen(false)
                }}
                disabled={isPatching}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                취소하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400">{icon}</span>
      <span className="text-gray-500 w-20 shrink-0">{label}</span>
      <span className="font-medium text-gray-900 flex-1 break-words">{value}</span>
    </div>
  )
}
