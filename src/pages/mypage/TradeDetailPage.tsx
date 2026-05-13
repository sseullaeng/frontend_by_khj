// 거래 상세 페이지 — 라운드 11 (Tx-Hold)
//
// 권한 매트릭스
//   채팅중   → seller [예약], 양쪽 [취소]
//   예약     → seller [인계 확인], 양쪽 [취소]            (buyer 포인트 hold 중)
//   인계완료 → buyer  [인수 확인]                          (취소 불가)
//   거래완료 → 액션 없음 (정산: hold → seller)
//   취소     → 액션 없음 (hold 환불 완료)

import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ChevronLeft, Calendar, ShoppingBag, Hash,
  ShieldCheck, PackageCheck, Truck, AlertCircle,
} from 'lucide-react'
import { useTransactionDetail, usePatchTransaction } from '@/features/trade/hooks'
import { useItemDetail } from '@/features/item/hooks'
import { useUserProfile } from '@/features/user/hooks'
import { useAuthStore } from '@/features/auth/store'
import { usePointBalance } from '@/features/payment/hooks'
import { fromNow, formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { BusinessError } from '@/shared/types'
import type { TransactionStatus } from '@/features/trade/types'

const STATUS_BADGE: Record<TransactionStatus, { color: string }> = {
  '채팅중':   { color: 'text-amber-700 bg-amber-100' },
  '예약':     { color: 'text-yellow-700 bg-yellow-100' },
  '인계완료': { color: 'text-indigo-700 bg-indigo-100' },
  '반납요청': { color: 'text-orange-700 bg-orange-100' },
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

  // buyer 본인일 때만 잔액 미리 검사 (예약 단계에서 충전 유도)
  const isBuyerSelf = !!tx && currentUser?.id === tx.buyerId
  const { data: balanceData } = usePointBalance({ enabled: isBuyerSelf && tx?.status === '채팅중' })

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [chargeOpen, setChargeOpen] = useState(false)

  if (isLoading) {
    return <div className="py-20 text-center text-gray-500">거래 내역을 불러오는 중...</div>
  }
  if (!tx) {
    return <div className="py-20 text-center text-gray-500">거래 내역을 찾을 수 없어요.</div>
  }

  const isSeller = currentUser?.id === tx.sellerId
  const isBuyer  = currentUser?.id === tx.buyerId
  const status   = STATUS_BADGE[tx.status]
  const typeColor = TYPE_COLOR[tx.tradeType] ?? 'bg-gray-100 text-gray-700'

  // 라운드 11 권한 매트릭스 + 라운드14 4-D 반납 흐름
  const canReserve  = isSeller && tx.status === '채팅중'
  const canHandover = isSeller && tx.status === '예약'
  const canReceive  = isBuyer  && tx.status === '인계완료' && tx.tradeType !== '대여'
  const canReturn   = isBuyer  && tx.status === '인계완료' && tx.tradeType === '대여'   // 대여만
  const canConfirmReturn = isSeller && tx.status === '반납요청'
  const canCancel   = (isSeller || isBuyer) && (tx.status === '채팅중' || tx.status === '예약')

  // buyer 본인 잔액이 가격보다 적으면 충전 유도 (채팅중 단계)
  const buyerNeedsCharge =
    isBuyerSelf && tx.status === '채팅중' && balanceData != null && balanceData.balance < tx.price

  const handleReserveClick = () => {
    // seller 가 누름. buyer 잔액 검증은 백엔드 hold 시점에 수행.
    // hold 실패(TRANSACTION_HOLD_FAILED) 시 충전 안내 모달.
    patch({ action: '예약' }, {
      onError: (err) => {
        if (err instanceof BusinessError && err.code === 'TRANSACTION_HOLD_FAILED') {
          setChargeOpen(true)
        }
      },
    })
  }

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
      <div className="flex items-center gap-2 mb-4 flex-wrap">
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

      {/* 단계별 안내 배너 */}
      <StatusBanner tx={tx} isSeller={isSeller} isBuyer={isBuyer} />

      {/* buyer 잔액 부족 안내 (채팅중 단계) */}
      {buyerNeedsCharge && (
        <div className="flex items-start gap-2 px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-red-700 mb-0.5">포인트가 부족해요</p>
            <p className="text-red-600/90">
              현재 사용 가능 {balanceData?.balance.toLocaleString()}P / 거래 금액 {tx.price.toLocaleString()}P.
              예약 전에 충전이 필요해요.
            </p>
          </div>
          <Link
            to="/point/charge"
            className="shrink-0 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600"
          >
            충전
          </Link>
        </div>
      )}

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
          {tx.handoverConfirmedAt && (
            <Row icon={<PackageCheck size={16} />} label="인계 확인" value={fromNow(tx.handoverConfirmedAt)} />
          )}
          {tx.receiveConfirmedAt && (
            <Row icon={<Truck size={16} />} label="인수 확인" value={fromNow(tx.receiveConfirmedAt)} />
          )}
          {tx.returnRequestedAt && (
            <Row icon={<PackageCheck size={16} />} label="반납 요청" value={fromNow(tx.returnRequestedAt)} />
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
          {tx.escrowHoldAmount > 0 && (tx.status === '예약' || tx.status === '인계완료') && (
            <Row
              icon={<ShieldCheck size={16} />}
              label="보관 중"
              value={`${tx.escrowHoldAmount.toLocaleString()}P (인수 확인 시 정산)`}
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
      {(canReserve || canHandover || canReceive || canReturn || canConfirmReturn || canCancel) && (
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
            <Button fullWidth isLoading={isPatching} onClick={handleReserveClick}>
              예약하기
            </Button>
          )}
          {canHandover && (
            <Button
              fullWidth
              isLoading={isPatching}
              onClick={() => patch({ action: '인계확인' })}
            >
              인계 확인
            </Button>
          )}
          {canReceive && (
            <Button
              fullWidth
              isLoading={isPatching}
              onClick={() => patch({ action: '인수확인' })}
            >
              인수 확인
            </Button>
          )}
          {canReturn && (
            <Button
              fullWidth
              isLoading={isPatching}
              onClick={() => patch({ action: '반납요청' })}
            >
              반납하기
            </Button>
          )}
          {canConfirmReturn && (
            <Button
              fullWidth
              isLoading={isPatching}
              onClick={() => patch({ action: '회신확인' })}
            >
              회신 확인 (거래 완료)
            </Button>
          )}
        </div>
      )}

      {/* 취소 모달 */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">거래를 취소할까요?</h3>
            <p className="text-sm text-gray-500 mb-3">
              {tx.status === '예약'
                ? '예약 시 보관된 포인트는 즉시 환불돼요.'
                : '취소 사유를 입력해 주세요.'}
            </p>
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

      {/* 충전 유도 모달 (잔액 부족 onError 백업) */}
      {chargeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl text-center">
            <AlertCircle size={32} className="text-red-500 mx-auto mb-2" />
            <h3 className="font-bold text-gray-900 mb-1">포인트가 부족해요</h3>
            <p className="text-sm text-gray-500 mb-4">
              충전 후 다시 시도해 주세요.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setChargeOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
              >
                닫기
              </button>
              <Link
                to="/point/charge"
                className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold text-center"
              >
                충전하기
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBanner({
  tx, isSeller, isBuyer,
}: {
  tx: { status: TransactionStatus; escrowHoldAmount: number; price: number; tradeType: string; returnRequestedAt: string | null }
  isSeller: boolean
  isBuyer:  boolean
}) {
  if (tx.status === '예약') {
    if (isSeller) {
      return (
        <Banner tone="indigo" icon={<PackageCheck size={18} />}
          title="물품을 인계하셨나요?"
          desc="구매자에게 물품을 전달한 후 [인계 확인]을 눌러 주세요. 구매자의 인수 확인까지 완료되면 정산돼요." />
      )
    }
    if (isBuyer) {
      return (
        <Banner tone="amber" icon={<ShieldCheck size={18} />}
          title={`${tx.escrowHoldAmount.toLocaleString()}P 보관 중`}
          desc="판매자가 인계를 확인하면 알림으로 안내드려요. 그 다음 인수 확인을 누르시면 거래가 완료돼요." />
      )
    }
  }
  if (tx.status === '인계완료') {
    const isRental = tx.tradeType === '대여'
    if (isSeller) {
      return (
        <Banner tone="indigo" icon={<Truck size={18} />}
          title={isRental ? '구매자의 반납 대기 중' : '구매자의 인수 확인 대기 중'}
          desc={isRental
            ? '대여 기간이 끝나면 구매자가 [반납하기] 를 눌러요. 그 후 [회신 확인]을 눌러 거래를 마무리해 주세요.'
            : '구매자가 인수를 확인하면 자동으로 정산되어 포인트가 입금돼요.'} />
      )
    }
    if (isBuyer) {
      return (
        <Banner tone="emerald" icon={<PackageCheck size={18} />}
          title={isRental ? '물품을 사용 중이에요' : '물품을 받으셨나요?'}
          desc={isRental
            ? '대여 기간이 끝났으면 [반납하기]를 눌러 판매자에게 알려 주세요. 판매자 회신 확인 시 거래가 마무리돼요.'
            : '물품 확인 후 [인수 확인]을 눌러 주세요. 거래가 완료되고 보관된 포인트가 판매자에게 전달돼요.'} />
      )
    }
  }
  if (tx.status === '반납요청' && tx.returnRequestedAt) {
    const remain = remainUntilAutoComplete(tx.returnRequestedAt)
    if (isSeller) {
      return (
        <Banner tone="orange" icon={<PackageCheck size={18} />}
          title="구매자가 반납을 알렸어요"
          desc={`물품 상태 확인 후 [회신 확인] 을 눌러 거래를 마무리해 주세요. ${remain} 후 자동 거래완료 처리돼요.`} />
      )
    }
    if (isBuyer) {
      return (
        <Banner tone="orange" icon={<ShieldCheck size={18} />}
          title="판매자 회신 대기 중"
          desc={`판매자가 [회신 확인] 을 누르면 거래가 완료돼요. ${remain} 후엔 자동으로 완료 처리돼요.`} />
      )
    }
  }
  return null
}

/** 반납요청 후 자동완료까지 남은 시간 텍스트 */
function remainUntilAutoComplete(returnRequestedAt: string): string {
  const deadline = new Date(returnRequestedAt).getTime() + 7 * 24 * 60 * 60 * 1000
  const diff = deadline - Date.now()
  if (diff <= 0) return '곧'
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (days >= 1) return `${days}일`
  const hours = Math.max(1, Math.floor(diff / (60 * 60 * 1000)))
  return `${hours}시간`
}

function Banner({
  tone, icon, title, desc,
}: {
  tone: 'amber' | 'indigo' | 'emerald' | 'orange'
  icon: React.ReactNode
  title: string
  desc: string
}) {
  const palette = {
    amber:   'bg-amber-50 border-amber-200 text-amber-700',
    indigo:  'bg-indigo-50 border-indigo-200 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    orange:  'bg-orange-50 border-orange-200 text-orange-700',
  }[tone]
  return (
    <div className={cn('flex items-start gap-2 px-4 py-3 mb-4 border rounded-xl', palette)}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 text-sm">
        <p className="font-semibold mb-0.5">{title}</p>
        <p className="opacity-90">{desc}</p>
      </div>
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
