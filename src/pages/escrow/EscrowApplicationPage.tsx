// 거래대행 신청서 작성 — 수신자 폼 + Kakao 주소 + 이미지 업로드 + fee 계산
//
// 백엔드 spec 5/11:
//   POST /escrow/applications  — atomic claim (중복 응답 방지)
//   백엔드가 fee 재계산 후 ±10원 검증 → ESCROW_FEE_MISMATCH
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Upload, X, MapPin, Info, AlertTriangle, Truck, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/Button'
import KakaoAddressSearch from '@/shared/ui/KakaoAddressSearch'
import type { AddressResult } from '@/shared/ui/KakaoAddressSearch'
import { uploadImages, validateImageFile } from '@/shared/api/upload'
import { useCreateEscrowApplication, useEscrowLink } from '@/features/escrow/hooks'
import { useEscrowFeeSettings } from '@/features/escrow/hooks'
import type {
  EscrowApplication,
  EscrowApplicationCreateRequest,
  EscrowLink,
  FragilityKey,
  VolumeKey,
  WeightKey,
} from '@/features/escrow/types'
import { BusinessError } from '@/shared/types/api'

// ── 옵션 (백엔드 fee_settings.multipliers 키와 동일) ─────────────────────

const WEIGHT_OPTIONS = [
  { value: 'LT1'    as WeightKey, label: '1kg 미만',  isVan: false },
  { value: 'R1TO3'  as WeightKey, label: '1~3kg',     isVan: false },
  { value: 'R3TO5'  as WeightKey, label: '3~5kg',     isVan: false },
  { value: 'R5TO10' as WeightKey, label: '5~10kg',    isVan: true  },
  { value: 'GT10'   as WeightKey, label: '10kg 이상', isVan: true  },
]
const VOLUME_OPTIONS = [
  { value: 'S' as VolumeKey, label: '소형', sub: '30cm 미만', isVan: false },
  { value: 'M' as VolumeKey, label: '중형', sub: '50cm 미만', isVan: false },
  { value: 'L' as VolumeKey, label: '대형', sub: '50cm 이상', isVan: true  },
]
const FRAGILITY_OPTIONS = [
  { value: 'F1' as FragilityKey, label: '안전',       examples: '의류·책·플라스틱',  color: 'bg-green-500 border-green-500' },
  { value: 'F2' as FragilityKey, label: '낮음',       examples: '목재·금속',          color: 'bg-lime-500 border-lime-500' },
  { value: 'F3' as FragilityKey, label: '보통',       examples: '전자제품·악기',      color: 'bg-yellow-500 border-yellow-500' },
  { value: 'F4' as FragilityKey, label: '높음',       examples: '도자기·식기·액자',   color: 'bg-orange-500 border-orange-500' },
  { value: 'F5' as FragilityKey, label: '매우 높음',  examples: '유리·미술품·앤티크', color: 'bg-red-500 border-red-500' },
]

const MAX_IMAGES = 10

// ── fee 계산 (백엔드 fee_settings 값으로 동작) ──────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

interface FeeSettings {
  commissionRate: number
  fuelPricePerL: number
  baseFuelPrice: number
  baseDeliveryFee: number
  baseKmRate: number
  fuelEfficiency: number
  minDeliveryFee: number
  truckBaseDeliveryFee: number
  truckBaseKmRate: number
  truckFuelEfficiency: number
  truckMinDeliveryFee: number
}

// 무게/부피/취급 multiplier — admin fee_settings 의 dictionary 와 동일하게 하드코딩
// (백엔드가 multipliers 를 fee_settings 에 포함시키지 않은 경우 대비 — 라운드 9 schema 는 11개 필드)
const WEIGHT_MUL: Record<WeightKey, number>      = { LT1: 1.0, R1TO3: 1.2, R3TO5: 1.5, R5TO10: 2.0, GT10: 2.5 }
const VOLUME_MUL: Record<VolumeKey, number>      = { S: 1.0, M: 1.2, L: 1.5 }
const FRAGILITY_MUL: Record<FragilityKey, number> = { F1: 1.0, F2: 1.1, F3: 1.3, F4: 1.5, F5: 2.0 }

function calcFees(
  itemPrice: number, distKm: number, weight: WeightKey, volume: VolumeKey, fragility: FragilityKey,
  isVan: boolean, settings: FeeSettings,
) {
  const commissionFee = Math.floor(itemPrice * settings.commissionRate)
  const wtMul = WEIGHT_MUL[weight], vlMul = VOLUME_MUL[volume], fragMul = FRAGILITY_MUL[fragility]

  let deliveryFee: number
  if (isVan) {
    const mpkm = settings.baseFuelPrice / settings.truckFuelEfficiency
    const fc = settings.fuelPricePerL / settings.baseFuelPrice
    const kmRate = settings.truckBaseKmRate - mpkm + mpkm * fc
    const raw = (settings.truckBaseDeliveryFee + kmRate * distKm) * fragMul
    deliveryFee = Math.round(Math.max(settings.truckMinDeliveryFee, Math.round(raw / 100) * 100))
  } else {
    const mpkm = settings.baseFuelPrice / settings.fuelEfficiency
    const fc = settings.fuelPricePerL / settings.baseFuelPrice
    const kmRate = settings.baseKmRate - mpkm + mpkm * fc
    const raw = (settings.baseDeliveryFee + kmRate * distKm) * wtMul * vlMul * fragMul
    deliveryFee = Math.round(Math.max(settings.minDeliveryFee, Math.round(raw / 100) * 100))
  }
  return { deliveryFee, commissionFee, totalFee: itemPrice + commissionFee + deliveryFee }
}

// ── 컴포넌트 ────────────────────────────────────────────────────────────

export default function EscrowApplicationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { linkId } = useParams<{ linkId: string }>()
  const linkToken = linkId ?? ''

  // EscrowInvitePage 에서 state 로 전달받은 link (없으면 다시 fetch)
  const stateLink = (location.state as { link?: EscrowLink } | null)?.link
  const { data: fetchedLink } = useEscrowLink(stateLink ? undefined : linkToken)
  const link = stateLink ?? fetchedLink

  const { data: feeSettings } = useEscrowFeeSettings()
  const create = useCreateEscrowApplication()

  // 폼 상태
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [itemPrice, setItemPrice]   = useState<number | ''>('')
  const [pickupOpen, setPickupOpen]     = useState(false)
  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const [pickupAddr,   setPickupAddr]   = useState<AddressResult | null>(null)
  const [deliveryAddr, setDeliveryAddr] = useState<AddressResult | null>(null)
  const [weight,    setWeight]    = useState<WeightKey | null>(null)
  const [volume,    setVolume]    = useState<VolumeKey | null>(null)
  const [fragility, setFragility] = useState<FragilityKey | null>(null)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [agreedCancel,  setAgreedCancel]  = useState(false)
  const [submitting,    setSubmitting]    = useState(false)

  // EXTERNAL 모드면 itemPrice 강제 0
  const isExternal = link?.tradeMode === 'EXTERNAL'
  useEffect(() => {
    if (isExternal) setItemPrice(0)
  }, [isExternal])

  const distanceKm = useMemo(() => {
    if (!pickupAddr || !deliveryAddr) return 0
    return haversineKm(pickupAddr.lat, pickupAddr.lng, deliveryAddr.lat, deliveryAddr.lng)
  }, [pickupAddr, deliveryAddr])

  const isVan = (WEIGHT_OPTIONS.find(w => w.value === weight)?.isVan ?? false)
            || (VOLUME_OPTIONS.find(v => v.value === volume)?.isVan ?? false)

  const price = typeof itemPrice === 'number' ? itemPrice : 0
  const fees = useMemo(() => {
    if (!feeSettings || !weight || !volume || !fragility || !pickupAddr || !deliveryAddr) {
      return { deliveryFee: 0, commissionFee: 0, totalFee: 0 }
    }
    return calcFees(price, distanceKm, weight, volume, fragility, isVan, feeSettings)
  }, [feeSettings, price, distanceKm, weight, volume, fragility, isVan, pickupAddr, deliveryAddr])

  const isValid =
    imageFiles.length > 0 &&
    (isExternal || price > 0) &&
    pickupAddr !== null &&
    deliveryAddr !== null &&
    weight !== null && volume !== null && fragility !== null &&
    agreedCancel

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (imageFiles.length + files.length > MAX_IMAGES) {
      toast.error(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있어요.`)
      return
    }
    const valid: File[] = []
    for (const f of files) {
      const err = validateImageFile(f)
      if (err) { toast.error(err); continue }
      valid.push(f)
    }
    setImageFiles(prev => [...prev, ...valid])
  }, [imageFiles.length])

  const removeImage = (idx: number) => setImageFiles(prev => prev.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    if (!isValid || !link || !weight || !volume || !fragility || !pickupAddr || !deliveryAddr) return

    setSubmitting(true)
    try {
      // 1) S3 업로드
      const uploaded = await uploadImages('ESCROW', imageFiles)
      const imageUrls = uploaded.map(u => u.getUrl)

      // 2) application 생성
      const body: EscrowApplicationCreateRequest = {
        linkToken,
        itemPrice: price,
        pickupAddress: pickupAddr.address,
        pickupLat: pickupAddr.lat,
        pickupLng: pickupAddr.lng,
        deliveryAddress: deliveryAddr.address,
        deliveryLat: deliveryAddr.lat,
        deliveryLng: deliveryAddr.lng,
        weight, volume, fragility,
        deliveryNotes: deliveryNotes.trim() || undefined,
        deliveryFee: fees.deliveryFee,
        commissionFee: fees.commissionFee,
        totalFee: fees.totalFee,
        distanceKm,
        imageUrls,
      }

      const application: EscrowApplication = await create.mutateAsync(body)

      // 3) 결제 페이지로 이동 — 본인 share 만 결제
      navigate(`/escrow/join/${linkToken}/payment`, { state: { application } })
    } catch (err) {
      const msg = err instanceof BusinessError ? err.message
                : err instanceof Error ? err.message
                : '신청 등록에 실패했어요.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!link) {
    return <p className="py-20 text-center text-sm text-gray-400">링크 정보 불러오는 중...</p>
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-32">
      <h1 className="text-xl font-bold text-gray-900 mb-1">신청서 작성</h1>
      <p className="text-sm text-gray-500 mb-6">
        {link.tradeMode === 'INTERNAL' ? '쓸랭 거래' : '외부 거래'} · 신청자: {link.initiatorNickname}
      </p>

      {/* 이미지 첨부 */}
      <Section title="물품 사진" icon={<Upload size={16} />} required>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {imageFiles.map((f, i) => (
            <div key={i} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                <X size={11} />
              </button>
            </div>
          ))}
          {imageFiles.length < MAX_IMAGES && (
            <label className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200">
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              <Upload className="text-gray-400" size={20} />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-400">{imageFiles.length}/{MAX_IMAGES}장</p>
      </Section>

      {/* 물품 가격 (INTERNAL 만) */}
      {!isExternal && (
        <Section title="물품 가격" icon={<Info size={16} />} required>
          <input
            type="number" inputMode="numeric"
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="원"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
          />
        </Section>
      )}

      {/* 픽업 / 배달 */}
      <Section title="픽업 위치" icon={<MapPin size={16} />} required>
        <button
          type="button" onClick={() => setPickupOpen(true)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-left hover:border-primary-400"
        >
          {pickupAddr ? <span className="text-gray-900">{pickupAddr.address}</span> : <span className="text-gray-400">주소 검색</span>}
        </button>
      </Section>

      <Section title="배달 위치" icon={<MapPin size={16} />} required>
        <button
          type="button" onClick={() => setDeliveryOpen(true)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-left hover:border-primary-400"
        >
          {deliveryAddr ? <span className="text-gray-900">{deliveryAddr.address}</span> : <span className="text-gray-400">주소 검색</span>}
        </button>
        {pickupAddr && deliveryAddr && (
          <p className="text-xs text-gray-400 mt-1">예상 거리: {distanceKm.toFixed(1)} km</p>
        )}
      </Section>

      {/* 옵션 */}
      <Section title="무게" icon={<Truck size={16} />} required>
        <div className="grid grid-cols-5 gap-2">
          {WEIGHT_OPTIONS.map(w => (
            <button key={w.value} onClick={() => setWeight(w.value)}
              className={`py-2 text-xs rounded-lg border ${weight === w.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>
              {w.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="부피" icon={<Truck size={16} />} required>
        <div className="grid grid-cols-3 gap-2">
          {VOLUME_OPTIONS.map(v => (
            <button key={v.value} onClick={() => setVolume(v.value)}
              className={`py-3 text-xs rounded-lg border flex flex-col ${volume === v.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>
              <span className="font-medium">{v.label}</span>
              <span className="text-[10px] opacity-70">{v.sub}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="취급 주의" icon={<AlertTriangle size={16} />} required>
        <div className="grid grid-cols-5 gap-2">
          {FRAGILITY_OPTIONS.map(f => (
            <button key={f.value} onClick={() => setFragility(f.value)}
              className={`py-2 text-[11px] rounded-lg border flex flex-col ${fragility === f.value ? `${f.color} text-white` : 'border-gray-200 text-gray-600'}`}>
              <span className="font-medium">{f.label}</span>
              <span className="text-[9px] opacity-80">{f.examples}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="배송 메모" icon={<Info size={16} />}>
        <textarea
          value={deliveryNotes}
          onChange={(e) => setDeliveryNotes(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="추가 요청사항 (≤500자)"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 resize-none"
        />
      </Section>

      {/* 비용 미리보기 */}
      {pickupAddr && deliveryAddr && weight && volume && fragility && (
        <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm">
          <p className="font-medium text-blue-900 mb-2">비용 미리보기</p>
          <Row label="배달비" value={`${fees.deliveryFee.toLocaleString()}원`} />
          <Row label="대행 수수료" value={`${fees.commissionFee.toLocaleString()}원`} />
          {!isExternal && <Row label="물품가" value={`${price.toLocaleString()}원`} />}
          <hr className="my-2 border-blue-200" />
          <Row label="총액" value={`${fees.totalFee.toLocaleString()}원`} bold />
          <p className="text-xs text-blue-700 mt-2">
            ※ 백엔드가 ±10원 범위로 검증해요. 정책 변경 시 다시 시도 메시지가 떠요.
          </p>
        </div>
      )}

      {/* 취소 정책 동의 */}
      <label className="flex items-start gap-2 mb-6 cursor-pointer">
        <input
          type="checkbox" checked={agreedCancel}
          onChange={(e) => setAgreedCancel(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-xs text-gray-700">
          <span className="font-medium">취소 정책 동의</span> — 결제 완료 전(결제 대기) 까지만 본인 취소 가능. 매칭 후엔 취소 불가.
          <ShieldAlert size={12} className="inline ml-1 text-gray-400" />
        </span>
      </label>

      {/* 제출 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-lg mx-auto">
          <Button onClick={handleSubmit} fullWidth disabled={!isValid || submitting} isLoading={submitting}>
            결제 진행하기
          </Button>
        </div>
      </div>

      {/* 주소 검색 모달 */}
      <KakaoAddressSearch
        open={pickupOpen}
        onClose={() => setPickupOpen(false)}
        onSelect={(r) => { setPickupAddr(r); setPickupOpen(false) }}
      />
      <KakaoAddressSearch
        open={deliveryOpen}
        onClose={() => setDeliveryOpen(false)}
        onSelect={(r) => { setDeliveryAddr(r); setDeliveryOpen(false) }}
      />
    </div>
  )
}

function Section({ title, icon, children, required }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; required?: boolean
}) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
        {icon}
        {title}
        {required && <span className="text-red-500">*</span>}
      </h3>
      {children}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-blue-700">{label}</span>
      <span className={bold ? 'font-bold text-blue-900' : 'text-blue-900'}>{value}</span>
    </div>
  )
}
