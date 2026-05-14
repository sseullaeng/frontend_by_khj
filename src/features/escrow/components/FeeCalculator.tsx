// 거래대행 수수료/배달료 계산기 + 청구금액 내역 — 외부 link / 내부 draft 공용
//
// 외부 link  : 부모가 POST /escrow/applications/preview 호출 → 결과(EscrowPreviewResponse) 를 props 로 전달
// 내부 draft : 구매자 수령지 미상 → fees=null. 옵션 multiplier 정보만 안내.
//
// 컴포넌트는 stateless 표시 + 옵션 선택 핸들러만. preview mutation 은 부모가 관리.
import { Info, Truck, ShieldAlert } from 'lucide-react'
import type {
  FragilityKey,
  VolumeKey,
  WeightKey,
  EscrowPreviewResponse,
} from '@/features/escrow/types'
import { cn } from '@/shared/lib/cn'

// ── 옵션 정의 (백엔드 multipliers 와 동일) ──────────────────────────────────

export const WEIGHT_OPTIONS = [
  { value: 'lt1'   as WeightKey, label: '1kg 미만',  multiplier: 1.0, isVan: false },
  { value: '1to3'  as WeightKey, label: '1~3kg',     multiplier: 1.2, isVan: false },
  { value: '3to5'  as WeightKey, label: '3~5kg',     multiplier: 1.5, isVan: false },
  { value: '5to10' as WeightKey, label: '5~10kg',    multiplier: 2.0, isVan: true  },
  { value: 'gt10' as WeightKey, label: '10kg 이상', multiplier: 2.5, isVan: true  },
] as const

export const VOLUME_OPTIONS = [
  { value: 's' as VolumeKey, label: '소형', sub: '30cm 미만', multiplier: 1.0, isVan: false },
  { value: 'm' as VolumeKey, label: '중형', sub: '50cm 미만', multiplier: 1.2, isVan: false },
  { value: 'l' as VolumeKey, label: '대형', sub: '50cm 이상', multiplier: 1.5, isVan: true  },
] as const

export const FRAGILITY_OPTIONS = [
  { value: 'f1' as FragilityKey, label: '안전',      examples: '의류·책·플라스틱',  multiplier: 1.0, color: 'bg-green-500 border-green-500' },
  { value: 'f2' as FragilityKey, label: '낮음',      examples: '목재·금속',          multiplier: 1.1, color: 'bg-lime-500 border-lime-500' },
  { value: 'f3' as FragilityKey, label: '보통',      examples: '전자제품·악기',      multiplier: 1.3, color: 'bg-yellow-500 border-yellow-500' },
  { value: 'f4' as FragilityKey, label: '높음',      examples: '도자기·식기·액자',   multiplier: 1.5, color: 'bg-orange-500 border-orange-500' },
  { value: 'f5' as FragilityKey, label: '매우 높음', examples: '유리·미술품·앤티크', multiplier: 2.0, color: 'bg-red-500 border-red-500' },
] as const

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

interface Props {
  weight: WeightKey | null
  volume: VolumeKey | null
  fragility: FragilityKey | null
  onWeightChange:    (v: WeightKey) => void
  onVolumeChange:    (v: VolumeKey) => void
  onFragilityChange: (v: FragilityKey) => void

  itemPrice: number

  /** preview 결과 — 외부 link 일 때만 채워짐. 내부 draft 는 null. */
  fees: EscrowPreviewResponse | null
  /** preview 진행 중 표시용 */
  isLoadingFees?: boolean
  /** preview 호출 불가 안내 (내부 draft 흐름) */
  showPreviewUnavailableHint?: boolean
  /** 상대방이 입력한 옵션을 보여줄 때 선택 버튼을 읽기 전용으로 표시 */
  readOnly?: boolean
}

export default function FeeCalculator({
  weight, volume, fragility,
  onWeightChange, onVolumeChange, onFragilityChange,
  itemPrice, fees, isLoadingFees,
  showPreviewUnavailableHint,
  readOnly,
}: Props) {
  const wOpt = WEIGHT_OPTIONS.find(o => o.value === weight)
  const vOpt = VOLUME_OPTIONS.find(o => o.value === volume)
  const fOpt = FRAGILITY_OPTIONS.find(o => o.value === fragility)

  const isVan = (wOpt?.isVan ?? false) || (vOpt?.isVan ?? false)

  return (
    <div className="flex flex-col gap-6">

      {/* ── 옵션 선택 + 관리자 설정 표 ─────────────────────────────────── */}
      <section className="bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">수수료 · 배달료 계산기</p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Info size={12} />
            <span>예상 수수료 미리보기</span>
          </div>
        </div>

        {/* 예상 거리 — preview 결과 있을 때만 */}
        <div className="flex justify-between items-center px-3 py-2.5 bg-white rounded-lg border border-gray-200 text-sm">
          <span className="text-xs text-gray-600">예상 거리 (자동 계산)</span>
          {fees
            ? <span className="font-semibold text-gray-900">{fees.distanceKm.toFixed(2)} km</span>
            : isLoadingFees
              ? <span className="text-xs text-primary-500">계산 중...</span>
              : <span className="text-xs text-gray-400">
                  {showPreviewUnavailableHint ? '수령지 입력 후 산정' : '픽업·수령지 + 옵션 선택 후 산정'}
                </span>
          }
        </div>

        {isVan && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 text-xs text-orange-700">
            <Truck size={14} className="shrink-0" />
            <span>무게 또는 부피 기준 초과 → <strong>용달차</strong>로 자동 전환됩니다.</span>
          </div>
        )}

        {/* 무게 */}
        <div>
          <p className="text-xs text-gray-600 mb-2">무게 <span className="text-red-500">*</span></p>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5 gap-1.5">
            {WEIGHT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                disabled={readOnly}
                onClick={() => onWeightChange(opt.value)}
                className={cn(
                  'py-2 px-1 rounded-lg text-xs font-medium border transition-colors flex flex-col items-center gap-0.5 disabled:cursor-default',
                  weight === opt.value
                    ? opt.isVan
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-primary-500 text-white border-primary-500'
                    : cn('bg-white text-gray-600 border-gray-200', !readOnly && 'hover:border-primary-400'),
                )}
              >
                <span>{opt.label}</span>
                {opt.isVan && (
                  <Truck size={11} className={weight === opt.value ? 'text-white' : 'text-orange-400'} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 부피 */}
        <div>
          <p className="text-xs text-gray-600 mb-2">부피 <span className="text-red-500">*</span></p>
          <div className="grid grid-cols-3 gap-1.5">
            {VOLUME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                disabled={readOnly}
                onClick={() => onVolumeChange(opt.value)}
                className={cn(
                  'py-2.5 px-2 rounded-lg text-xs font-medium border transition-colors flex flex-col items-center gap-0.5 disabled:cursor-default',
                  volume === opt.value
                    ? opt.isVan
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-primary-500 text-white border-primary-500'
                    : cn('bg-white text-gray-600 border-gray-200', !readOnly && 'hover:border-primary-400'),
                )}
              >
                <span className="font-semibold">{opt.label}</span>
                <span className={cn('text-[10px]', volume === opt.value ? 'text-white/80' : 'text-gray-400')}>
                  {opt.sub}
                </span>
                {opt.isVan && (
                  <Truck size={11} className={volume === opt.value ? 'text-white' : 'text-orange-400'} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 파손 위험도 */}
        <div>
          <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
            <ShieldAlert size={12} />
            파손 위험도 <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5 gap-1.5">
            {FRAGILITY_OPTIONS.map(opt => {
              const sel = fragility === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onFragilityChange(opt.value)}
                  className={cn(
                    'py-2.5 px-1 rounded-lg text-xs font-medium border transition-colors flex flex-col items-center gap-0.5 disabled:cursor-default',
                    sel ? `${opt.color} text-white` : cn('bg-white text-gray-600 border-gray-200', !readOnly && 'hover:border-gray-400'),
                  )}
                >
                  <span className="font-semibold leading-tight text-center">{opt.label}</span>
                  <span className={cn('text-[10px] leading-tight text-center', sel ? 'text-white/80' : 'text-gray-400')}>
                    {opt.examples}
                  </span>
                </button>
              )
            })}
          </div>
          {fOpt && fOpt.multiplier > 1 && (
            <p className="text-xs text-gray-500 mt-1.5">
              파손 위험 계수 ×{fOpt.multiplier} 적용
            </p>
          )}
        </div>
      </section>

      {/* ── 청구금액 내역 ────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">청구금액 내역</p>
        <div className="space-y-2.5 text-sm">
          {itemPrice > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>물품 금액</span>
              <span>{itemPrice.toLocaleString()}원</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>대행 수수료 {fees && `(${(fees.commissionRate * 100).toFixed(0)}%)`}</span>
            <span>{fees ? `${fees.commissionFee.toLocaleString()}원` : '—'}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span className="flex items-center gap-1.5 flex-wrap">
              배달료
              {fees && (
                <>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded font-medium',
                    isVan ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700',
                  )}>
                    {isVan ? '용달차' : '오토바이'}
                  </span>
                  {fOpt && fOpt.multiplier > 1 && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-700">
                      위험도 ×{fOpt.multiplier}
                    </span>
                  )}
                </>
              )}
            </span>
            <span>
              {fees
                ? `${fees.deliveryFee.toLocaleString()}원`
                : isLoadingFees
                  ? <span className="text-xs text-primary-500">계산 중...</span>
                  : showPreviewUnavailableHint
                    ? <span className="text-xs text-gray-400">수령지 입력 후 산정</span>
                    : '—'}
            </span>
          </div>
          <div className="border-t pt-2.5 flex justify-between font-semibold">
            <span className="text-gray-900">합계</span>
            <span className={fees ? 'text-primary-600 text-base' : 'text-gray-400'}>
              {fees ? `${fees.totalFee.toLocaleString()}원` : '—'}
            </span>
          </div>
        </div>
        {showPreviewUnavailableHint && (
          <p className="text-[11px] text-amber-600 mt-3 leading-relaxed">
            구매자 수령지가 입력되면 거리·배달비가 자동 산정돼요.<br />
            (현재 표시된 금액은 옵션 선택 결과만 반영)
          </p>
        )}
      </section>
    </div>
  )
}
