// 거래대행 — 구매자 수령지 입력 페이지 (PR-B-4 Phase 2)
//
// URL: /escrow/{id}/buyer-info
//   - 판매자가 draft 생성 후 채팅방 시스템 메시지로 안내된 구매자가 진입
//   - 본인 영역만 입력 (delivery 주소/좌표/연락처)
//   - 입력 변경 시 preview 호출 (판매자의 pickup 좌표 + 구매자의 delivery 좌표로 계산)
//   - PATCH /buyer-info → 백엔드가 양쪽 filled 확인 + 자동 결제대기 전환
//
// 권한: applications.detail 에서 받은 buyerId === currentUser.id 여야 진입 가능
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import {
  useEscrowApplicationDetail,
  useEscrowPreview,
  usePatchEscrowBuyerInfo,
} from '@/features/escrow/hooks'
import { useAuthStore } from '@/features/auth/store'
import KakaoAddressSearch from '@/shared/ui/KakaoAddressSearch'
import { Button } from '@/shared/ui/Button'
import { BusinessError } from '@/shared/types'
import { cn } from '@/shared/lib/cn'

export default function EscrowBuyerInfoPage() {
  const { id } = useParams<{ id: string }>()
  const applicationId = Number(id)
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)

  const { data: app, isLoading } = useEscrowApplicationDetail(applicationId)

  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryLat,     setDeliveryLat]     = useState<number | null>(null)
  const [deliveryLng,     setDeliveryLng]     = useState<number | null>(null)
  const [receiverPhone,   setReceiverPhone]   = useState('')
  const [addressOpen,     setAddressOpen]     = useState(false)

  // ── preview (debounce) — 판매자 pickup 좌표 + 구매자 delivery 좌표 ──
  const preview = useEscrowPreview()
  const previewBody = useMemo(() => {
    if (!app || deliveryLat == null || deliveryLng == null) return null
    return {
      tradeMode: app.tradeMode,
      itemPrice: app.itemPrice,
      pickupLat:   app.pickupLat,
      pickupLng:   app.pickupLng,
      deliveryLat, deliveryLng,
      weight:    app.weight,
      volume:    app.volume,
      fragility: app.fragility,
      feePayer:  app.feePayer,
    }
  }, [app, deliveryLat, deliveryLng])

  useEffect(() => {
    if (!previewBody) return
    const t = setTimeout(() => preview.mutate(previewBody), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewBody])

  const patch = usePatchEscrowBuyerInfo(applicationId)

  if (isLoading) {
    return <p className="py-20 text-center text-sm text-gray-400">불러오는 중...</p>
  }
  if (!app) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-400 mb-3">신청을 찾을 수 없어요.</p>
        <button onClick={() => navigate('/escrow/list')} className="text-primary-500 text-sm">목록으로</button>
      </div>
    )
  }

  // 권한 검증 — 구매자 본인만
  if (currentUser && currentUser.id !== app.buyerId) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-400 mb-3">구매자만 수령지를 입력할 수 있어요.</p>
        <button onClick={() => navigate('/escrow/list')} className="text-primary-500 text-sm">목록으로</button>
      </div>
    )
  }
  // 이미 입력 완료 상태면 진입 X — 결제대기면 결제로, 그 외엔 상세로
  if (app.status !== '정보입력대기' || app.buyerInfoFilled) {
    const next = app.status === '결제대기'
      ? `/escrow/${applicationId}/pay`
      : `/escrow/list/${applicationId}`
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-400 mb-3">
          이미 수령지가 입력됐어요. 다음 단계로 진행하세요.
        </p>
        <button onClick={() => navigate(next)} className="text-primary-500 text-sm">
          {app.status === '결제대기' ? '결제하러 가기' : '신청 상세로'}
        </button>
      </div>
    )
  }

  const phoneOk = /^[0-9+\-]+$/.test(receiverPhone) && receiverPhone.length >= 9

  const handleSubmit = async () => {
    if (!deliveryAddress || deliveryLat == null || deliveryLng == null) {
      toast.error('수령지 주소를 검색해 주세요.')
      return
    }
    if (!phoneOk) {
      toast.error('연락처를 올바르게 입력해 주세요.')
      return
    }
    try {
      const next = await patch.mutateAsync({
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        receiverPhone,
      })
      // 양쪽 filled → 결제대기 자동 전환. 결제대기면 결제로 직행.
      if (next.status === '결제대기') {
        navigate(`/escrow/${applicationId}/pay`)
      } else {
        navigate(`/escrow/list/${applicationId}`)
      }
    } catch (err) {
      if (err instanceof BusinessError) toast.error(err.message)
      else if (err instanceof Error)    toast.error(err.message)
    }
  }

  const previewData = preview.data

  return (
    <div className="max-w-lg mx-auto w-full pb-24">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-gray-600" aria-label="뒤로">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">수령지 입력 (구매자)</h1>
      </div>

      <div className="flex flex-col gap-4">

        {/* 판매자 입력 요약 */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm">
          <p className="text-xs font-semibold text-gray-500 mb-2">판매자 입력 정보</p>
          <ul className="space-y-1 text-gray-700">
            <li>물품 — {app.itemPrice.toLocaleString()}원</li>
            <li>픽업 — {app.pickupAddress}</li>
            <li>옵션 — 무게 {app.weight} · 부피 {app.volume} · 취급 {app.fragility}</li>
            <li>수수료 부담 — {feePayerLabel(app.feePayer)}</li>
          </ul>
        </div>

        {/* 수령지 */}
        <Section title="수령지 주소">
          <button
            type="button"
            onClick={() => setAddressOpen(true)}
            className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-left flex items-center gap-2 hover:border-primary-400"
          >
            <MapPin size={14} className="text-gray-400" />
            <span className={deliveryAddress ? 'text-gray-700 truncate' : 'text-gray-400'}>
              {deliveryAddress || '수령지 검색'}
            </span>
          </button>
        </Section>

        {/* 연락처 */}
        <Section title="수령인 연락처">
          <input
            type="tel"
            inputMode="tel"
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
            placeholder="010-1234-5678"
            maxLength={20}
            className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
          />
          {receiverPhone && !phoneOk && (
            <p className="text-[11px] text-red-500 mt-1">숫자와 - / + 만 입력 가능, 9자 이상.</p>
          )}
        </Section>

        {/* 미리보기 */}
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-primary-700 mb-2">예상 수수료</p>
          {previewData ? (
            <div className="space-y-1 text-sm">
              <Row label="거리"   value={`${previewData.distanceKm.toFixed(2)}km`} />
              <Row label="배달비" value={`${previewData.deliveryFee.toLocaleString()}원`} />
              <Row label={`대행 수수료 (${(previewData.commissionRate * 100).toFixed(1)}%)`}
                   value={`${previewData.commissionFee.toLocaleString()}원`} />
              <hr className="my-2 border-primary-200" />
              <Row label="총 청구액" value={`${previewData.totalFee.toLocaleString()}원`} bold />
              <Row label="내 부담"   value={`${previewData.buyerPayable.toLocaleString()}원`} />
              {app.feePayer === 'both' && (
                <p className="text-[11px] text-primary-700/70 mt-1">
                  판매자도 {previewData.sellerPayable.toLocaleString()}원 부담해요.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-primary-700/70">
              수령지 주소를 입력하면 자동 계산돼요.
            </p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          isLoading={patch.isPending}
          disabled={!previewData}
          fullWidth
        >
          입력 완료 — 결제 단계로 진행
        </Button>
      </div>

      <KakaoAddressSearch
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        onSelect={(r) => {
          setDeliveryAddress(r.address || r.region)
          setDeliveryLat(r.lat); setDeliveryLng(r.lng)
          setAddressOpen(false)
        }}
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <p className="text-xs font-semibold text-gray-700 mb-2.5">{title}</p>
      {children}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-primary-700/80">{label}</span>
      <span className={cn(bold ? 'font-bold text-primary-900' : 'text-primary-900')}>{value}</span>
    </div>
  )
}

function feePayerLabel(p: 'buyer' | 'seller' | 'both'): string {
  if (p === 'both') return '50:50'
  if (p === 'buyer') return '구매자 전액'
  return '판매자 전액'
}
