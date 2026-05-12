// 거래대행 신청 상세 — 백엔드 hook 연동
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Receipt, Package, Clock, CheckCircle, XCircle, Truck, PackageCheck } from 'lucide-react'
import {
  useEscrowApplicationDetail,
  useCancelEscrowApplication,
  useConfirmEscrowReceipt,
} from '@/features/escrow/hooks'
import { useDeliveryDetail } from '@/features/delivery/hooks'
import { getEscrowDisplayStatus, ESCROW_DISPLAY_COLOR, type EscrowDisplayStatus } from '@/features/escrow/displayStatus'
import { useAuthStore } from '@/features/auth/store'
import { Button } from '@/shared/ui/Button'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

// 라운드13 — 통합 라벨 7단계용 아이콘 매핑
const DISPLAY_ICON: Record<EscrowDisplayStatus, typeof Clock> = {
  '신청중':   Clock,
  '신청완료': CheckCircle,
  '매칭중':   Clock,
  '픽업중':   PackageCheck,
  '배달중':   Truck,
  '배달완료': CheckCircle,
  '취소':     XCircle,
}

export default function EscrowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const applicationId = id ? parseInt(id) : undefined
  const currentUser = useAuthStore((s) => s.user)

  const { data: app, isLoading } = useEscrowApplicationDetail(applicationId)
  // 라운드13 PR #121 — 진행중일 때 deliveryId 가 있으면 sub-status 조회해서 7단계 라벨로 표시
  const { data: delivery } = useDeliveryDetail(app?.deliveryId ?? 0)
  const cancelMut = useCancelEscrowApplication()
  const confirmMut = useConfirmEscrowReceipt()
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (isLoading) return <div className="py-20 text-center text-gray-400">불러오는 중...</div>
  if (!app) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="text-sm">신청을 찾을 수 없어요.</p>
        <Link to="/escrow/list" className="text-sm text-primary-500 mt-2 inline-block">신청 목록으로</Link>
      </div>
    )
  }

  const isBuyer = currentUser?.id === app.buyerId
  const displayStatus = getEscrowDisplayStatus(app.status, delivery?.status)
  const StatusIcon = DISPLAY_ICON[displayStatus]
  // 결제대기 상태에서만 본인 취소 가능 (백엔드 정책: 매칭 후 차단)
  const canCancel = app.status === '결제대기'
  // Mode B (INTERNAL) buyer 만 진행중에 수령 확인 가능
  const canConfirm = app.tradeMode === 'INTERNAL' && isBuyer && app.status === '진행중'
  // PR-B-4: buyer 가 정보입력대기 상태에서 본인 수령지 미입력이면 진입 유도
  const needsBuyerInfo = isBuyer && app.status === '정보입력대기' && !app.buyerInfoFilled
  // PR-B-5: 결제대기 상태에서 본인이 결제 부담이 있으면 결제 진입
  const needsPay = app.status === '결제대기' && (
    (isBuyer  && (app.feePayer === 'buyer'  || app.feePayer === 'both' || app.tradeMode === 'INTERNAL')) ||
    (!isBuyer && (app.feePayer === 'seller' || app.feePayer === 'both'))
  )

  const handleCancel = async () => {
    if (!applicationId) return
    try {
      await cancelMut.mutateAsync({ id: applicationId, body: { reason: '단순 변심' } })
      setConfirmCancel(false)
      navigate('/escrow/list')
    } catch {
      setConfirmCancel(false)
    }
  }

  const handleConfirm = async () => {
    if (!applicationId) return
    try {
      await confirmMut.mutateAsync(applicationId)
    } catch {
      // hook 에서 토스트
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6 pb-24">
      <Link
        to="/escrow/list"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors text-sm"
      >
        <ArrowLeft size={18} />
        신청 목록으로
      </Link>

      {/* 상태 헤더 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500 font-mono">#{app.id}</p>
          <span className={cn('inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full', ESCROW_DISPLAY_COLOR[displayStatus])}>
            <StatusIcon size={12} />
            {displayStatus}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div>
            <span className="text-gray-500">내 역할</span>
            <span className="ml-2 font-medium text-gray-900">{isBuyer ? '구매자' : '판매자'}</span>
          </div>
          <div>
            <span className="text-gray-500">거래 모드</span>
            <span className="ml-2 font-medium text-gray-900">
              {app.tradeMode === 'INTERNAL' ? '쓸랭 거래' : '외부 거래'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">수수료</span>
            <span className="ml-2 font-medium text-gray-900">
              {app.feePayer === 'both' ? '반반' : app.feePayer === 'buyer' ? '구매자 부담' : '판매자 부담'}
            </span>
          </div>
        </div>
      </div>

      {/* 물품 정보 */}
      {app.tradeMode === 'INTERNAL' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Package size={16} className="text-gray-500" /> 물품 정보
          </h2>
          {app.imageUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {app.imageUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`첨부 ${i + 1}`} className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                </a>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-700">
            물품 가격: <span className="font-bold">{(app.itemPrice ?? 0).toLocaleString()}원</span>
          </p>
        </div>
      )}

      {/* 픽업/배달 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <MapPin size={16} className="text-gray-500" /> 픽업·배달
        </h2>
        <div className="text-sm">
          <p className="text-xs text-gray-500 mb-0.5">픽업</p>
          <p className="text-gray-900">{app.pickupAddress}</p>
        </div>
        <div className="text-sm">
          <p className="text-xs text-gray-500 mb-0.5">배달</p>
          <p className="text-gray-900">{app.deliveryAddress || <span className="text-gray-400">아직 입력 전</span>}</p>
        </div>
        <div className="text-xs text-gray-500">
          {/* 정보입력대기 단계는 거리 미산정 → 거리 생략 */}
          {app.appliedDistanceKm != null && <>거리: {app.appliedDistanceKm.toFixed(1)} km · </>}
          무게 {app.weight} · 부피 {app.volume} · 취급 {app.fragility}
        </div>
        {app.deliveryNotes && (
          <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 whitespace-pre-wrap">
            메모: {app.deliveryNotes}
          </p>
        )}
      </div>

      {/* 비용 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Receipt size={16} className="text-gray-500" /> 비용
        </h2>
        {/* 정보입력대기 단계는 fee 미산정 — 양쪽 입력 후 안내 */}
        {app.appliedTotalFee == null ? (
          <p className="text-xs text-gray-400">양쪽 정보 입력 후 비용이 산정돼요.</p>
        ) : (
          <dl className="text-sm space-y-1.5">
            {app.tradeMode === 'INTERNAL' && (
              <div className="flex justify-between">
                <dt className="text-gray-500">물품가</dt>
                <dd className="text-gray-900">{(app.itemPrice ?? 0).toLocaleString()}원</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">배달비</dt>
              <dd className="text-gray-900">{(app.appliedDeliveryFee ?? 0).toLocaleString()}원</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">대행 수수료 ({((app.appliedCommissionRate ?? 0) * 100).toFixed(1)}%)</dt>
              <dd className="text-gray-900">{(app.appliedCommissionFee ?? 0).toLocaleString()}원</dd>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-semibold">
              <dt className="text-gray-900">총액</dt>
              <dd className="text-primary-600">{app.appliedTotalFee.toLocaleString()}원</dd>
            </div>
            {app.feePayer === 'both' && (
              <p className="text-xs text-gray-400 mt-1">
                반반 부담 — 신청자 {(app.initiatorShare ?? 0).toLocaleString()}원 / 수신자 {(app.receiverShare ?? 0).toLocaleString()}원
              </p>
            )}
          </dl>
        )}
      </div>

      {/* PR-B-4: buyer 수령지 입력 유도 안내 + 진입 */}
      {needsBuyerInfo && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-700 mb-1 text-sm">수령지 입력이 필요해요</p>
          <p className="text-xs text-amber-700/90 mb-3">
            판매자가 정보를 입력했어요. 수령지·연락처를 입력하면 결제 단계로 진행됩니다.
          </p>
          <Button fullWidth onClick={() => navigate(`/escrow/${app.id}/buyer-info`)}>
            수령지 입력하기
          </Button>
        </div>
      )}

      {/* PR-B-5: 결제대기 상태 — 본인 결제 진입 */}
      {needsPay && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4">
          <p className="font-semibold text-primary-700 mb-1 text-sm">결제할 차례에요</p>
          <p className="text-xs text-primary-700/90 mb-3">
            본인 부담분을 포인트로 결제하면, 상대방 결제 완료 시 라이더 매칭이 자동 시작돼요.
          </p>
          <Button fullWidth onClick={() => navigate(`/escrow/${app.id}/pay`)}>
            결제하기
          </Button>
        </div>
      )}

      {/* 액션 */}
      <div className="flex gap-2">
        {canCancel && (
          <Button variant="outline" fullWidth onClick={() => setConfirmCancel(true)} disabled={cancelMut.isPending}>
            취소하기
          </Button>
        )}
        {canConfirm && (
          <Button fullWidth onClick={handleConfirm} disabled={confirmMut.isPending} isLoading={confirmMut.isPending}>
            수령 확인
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        신청 {formatKst(app.createdAt, 'yyyy.MM.dd HH:mm')} · 갱신 {formatKst(app.updatedAt, 'yyyy.MM.dd HH:mm')}
      </p>

      {/* 취소 확인 모달 */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">신청을 취소할까요?</h3>
            <p className="text-sm text-gray-500 mb-5">취소된 신청은 되돌릴 수 없어요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmCancel(false)}
                disabled={cancelMut.isPending}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-50"
              >
                돌아가기
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelMut.isPending}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
