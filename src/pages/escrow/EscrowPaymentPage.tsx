// 에스크로 결제 페이지 컴포넌트: 에스크로 서비스 수수료 결제 처리
import { useState } from 'react'  // React 상태 훅
import { useLocation, useNavigate } from 'react-router-dom'  // React Router 훅
import { ArrowLeft, Receipt, Building2, MapPin, Package, Smartphone } from 'lucide-react'  // Lucide 아이콘들
import { Button } from '@/shared/ui/Button'  // 버튼 컴포넌트

// 결제 상태 인터페이스: 결제 페이지로 전달되는 데이터 타입
interface PaymentState {
  itemPrice: number        // 물품 가격
  itemDescription: string  // 물품 설명
  imageUrl: string         // 물품 이미지
  pickupAddress: string   // 픽업 주소
  deliveryAddress: string  // 배달 주소
  distanceKm: number      // 거리 (km)
  weightLabel: string     // 무게 라벨
  volumeLabel: string     // 부피 라벨
  fragilityLabel?: string // 파손 위험 라벨
  isVan?: boolean         // 용달차 사용 여부
  deliveryFee: number     // 배달비
  commissionFee: number   // 수수료
  totalFee: number        // 총 비용
  deliveryNotes: string   // 배달 메모
  linkId: string          // 링크 ID
}

// 결제 방식 타입: 은행 송금 또는 간편 결제
type Method = 'bank' | 'pay'

// 간편 결제 브랜드 타입: 지원하는 간편 결제 서비스
type PayBrand = 'kakao' | 'naver' | 'toss'

// 간편 결제 브랜드 설정: 브랜드별 라벨 및 스타일
const PAY_BRANDS: { value: PayBrand; label: string; bg: string; text: string }[] = [
  { value: 'kakao', label: '카카오페이', bg: 'bg-yellow-400',  text: 'text-gray-900' },  // 카카오페이: 노란색 배경
  { value: 'naver', label: '네이버페이', bg: 'bg-green-500',   text: 'text-white'   },  // 네이버페이: 초록색 배경
  { value: 'toss',  label: '토스',       bg: 'bg-blue-500',    text: 'text-white'   },  // 토스: 파란색 배경
]

export default function EscrowPaymentPage() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const data = state as PaymentState | null

  const [method,    setMethod]    = useState<Method | null>(null)
  const [payBrand,  setPayBrand]  = useState<PayBrand | null>(null)
  const [isPaying,  setIsPaying]  = useState(false)

  if (!data) {
    navigate('/escrow', { replace: true })
    return null
  }

  const canPay =
    method === 'bank' ||
    (method === 'pay' && payBrand !== null)

  const handlePay = async () => {
    if (!canPay) return
    setIsPaying(true)
    // TODO: 실제 결제 API 연동
    await new Promise(r => setTimeout(r, 1_200))
    navigate(`/escrow/join/${data.linkId}/complete`, {
      replace: true,
      state: {
        totalFee: data.totalFee,
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
      },
    })
  }

  const buttonLabel =
    method === 'bank' ? `${data.totalFee.toLocaleString()}원 입금 완료`
    : method === 'pay' && payBrand
      ? `${data.totalFee.toLocaleString()}원 ${PAY_BRANDS.find(b => b.value === payBrand)!.label}로 결제`
      : `${data.totalFee.toLocaleString()}원 결제하기`

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-10 flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors text-sm"
      >
        <ArrowLeft size={18} />
        신청서로 돌아가기
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">결제</h1>
        <p className="text-sm text-gray-500">청구 내역을 확인하고 결제 수단을 선택해 주세요.</p>
      </div>

      {/* 영수증 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Receipt size={18} className="text-primary-600" />
          영수증
        </h2>

        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>물품 금액</span>
            <span>{data.itemPrice.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>대행 수수료</span>
            <span>{data.commissionFee.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>배달료</span>
            <span>{data.deliveryFee.toLocaleString()}원</span>
          </div>
          <div className="border-t pt-3 flex justify-between font-bold">
            <span className="text-gray-900">합계</span>
            <span className="text-primary-600 text-lg">{data.totalFee.toLocaleString()}원</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t space-y-2 text-xs text-gray-500">
          <div className="flex items-start justify-between gap-4">
            <span className="flex items-center gap-1 shrink-0"><MapPin size={11} />수령지</span>
            <span className="text-right">{data.pickupAddress}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="flex items-center gap-1 shrink-0"><MapPin size={11} />배달지</span>
            <span className="text-right">{data.deliveryAddress}</span>
          </div>
          <div className="flex justify-between">
            <span>예상 거리</span>
            <span>{data.distanceKm}km</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1"><Package size={11} />무게 / 부피</span>
            <span>{data.weightLabel} / {data.volumeLabel}</span>
          </div>
          {data.fragilityLabel && (
            <div className="flex justify-between">
              <span>파손 위험도</span>
              <span>{data.fragilityLabel}</span>
            </div>
          )}
          {data.deliveryNotes && (
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0">요청사항</span>
              <span className="text-right line-clamp-2">{data.deliveryNotes}</span>
            </div>
          )}
        </div>
      </section>

      {/* 결제 수단 선택 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-gray-900">결제 수단</h2>

        {/* 계좌이체 */}
        <div
          onClick={() => setMethod('bank')}
          className={`rounded-xl border-2 transition-colors cursor-pointer ${
            method === 'bank'
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Building2 size={20} className={method === 'bank' ? 'text-primary-600' : 'text-gray-400'} />
              <div>
                <p className="font-medium text-gray-900 text-sm">계좌이체</p>
                <p className="text-xs text-gray-500">국민은행 123-456-789012</p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              method === 'bank' ? 'border-primary-500' : 'border-gray-300'
            }`}>
              {method === 'bank' && <div className="w-3 h-3 rounded-full bg-primary-500" />}
            </div>
          </div>

          {/* 계좌 상세 — 선택 시 펼침 */}
          {method === 'bank' && (
            <div className="px-4 pb-4 pt-0 border-t border-primary-100 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 pt-3">
                <span>은행</span>
                <span className="font-medium text-gray-900">국민은행</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>계좌번호</span>
                <span className="font-medium text-gray-900">123-456-789012</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>예금주</span>
                <span className="font-medium text-gray-900">(주)씀씀이</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>입금 금액</span>
                <span className="font-bold text-primary-600">{data.totalFee.toLocaleString()}원</span>
              </div>
              <p className="text-xs text-gray-400 pt-1">
                입금자명을 신청자 이름으로 기재해 주세요. 확인 후 처리됩니다.
              </p>
            </div>
          )}
        </div>

        {/* 페이 */}
        <div
          onClick={() => setMethod('pay')}
          className={`rounded-xl border-2 transition-colors cursor-pointer ${
            method === 'pay'
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Smartphone size={20} className={method === 'pay' ? 'text-primary-600' : 'text-gray-400'} />
              <div>
                <p className="font-medium text-gray-900 text-sm">간편결제 (페이)</p>
                <p className="text-xs text-gray-500">카카오페이 · 네이버페이 · 토스</p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              method === 'pay' ? 'border-primary-500' : 'border-gray-300'
            }`}>
              {method === 'pay' && <div className="w-3 h-3 rounded-full bg-primary-500" />}
            </div>
          </div>

          {/* 페이 브랜드 선택 — 선택 시 펼침 */}
          {method === 'pay' && (
            <div className="px-4 pb-4 pt-0 border-t border-primary-100">
              <p className="text-xs text-gray-500 pt-3 mb-2">결제 수단을 선택하세요</p>
              <div className="grid grid-cols-3 gap-2">
                {PAY_BRANDS.map(brand => (
                  <button
                    key={brand.value}
                    type="button"
                    onClick={e => { e.stopPropagation(); setPayBrand(brand.value) }}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                      payBrand === brand.value
                        ? `${brand.bg} ${brand.text} border-transparent`
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {brand.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Button
        type="button"
        fullWidth
        disabled={!canPay}
        isLoading={isPaying}
        onClick={handlePay}
      >
        {buttonLabel}
      </Button>
    </div>
  )
}
