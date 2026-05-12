// 거래대행 신청서 작성 — 외부 link 흐름 (라운드13 디자인)
//
// 백엔드 spec:
//   POST /escrow/applications  — atomic claim, ±10원 fee 검증
//
// 라운드13 — 좌우 2칸 레이아웃 + 공통 FeeCalculator 컴포넌트.
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Upload, X, MapPin, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/Button'
import KakaoAddressSearch from '@/shared/ui/KakaoAddressSearch'
import type { AddressResult } from '@/shared/ui/KakaoAddressSearch'
import { uploadImages, validateImageFile } from '@/shared/api/upload'
import { useCreateEscrowApplication, useEscrowLink, useEscrowFeeSettings } from '@/features/escrow/hooks'
import type {
  EscrowApplication,
  EscrowApplicationCreateRequest,
  EscrowLink,
  FragilityKey,
  VolumeKey,
  WeightKey,
} from '@/features/escrow/types'
import { BusinessError } from '@/shared/types/api'
import FeeCalculator, {
  WEIGHT_OPTIONS,
  VOLUME_OPTIONS,
  FRAGILITY_OPTIONS,
  haversineKm,
  calcFees,
} from '@/features/escrow/components/FeeCalculator'

const MAX_IMAGES = 10

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
  const [itemDescription, setItemDescription] = useState('')

  const [pickupOpen,   setPickupOpen]   = useState(false)
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

  const price = typeof itemPrice === 'number' ? itemPrice : 0

  const wOpt = WEIGHT_OPTIONS.find(o => o.value === weight)
  const vOpt = VOLUME_OPTIONS.find(o => o.value === volume)
  const fOpt = FRAGILITY_OPTIONS.find(o => o.value === fragility)
  const isVan = (wOpt?.isVan ?? false) || (vOpt?.isVan ?? false)

  const isValid =
    imageFiles.length > 0 &&
    (isExternal || price > 0) &&
    itemDescription.trim().length > 0 &&
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
    if (!isValid || !link || !weight || !volume || !fragility || !pickupAddr || !deliveryAddr || !feeSettings || !wOpt || !vOpt || !fOpt) return

    const distanceKm = haversineKm(pickupAddr.lat, pickupAddr.lng, deliveryAddr.lat, deliveryAddr.lng)
    const fees = calcFees(price, distanceKm, wOpt.multiplier, vOpt.multiplier, fOpt.multiplier, isVan, feeSettings)

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

      // 3) 결제 페이지로 이동 — application id 기반 포인트 결제 (PR-B-5)
      navigate(`/escrow/${application.id}/pay`)
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">거래 대행 신청서</h1>
        <p className="text-sm text-gray-500">
          {link.tradeMode === 'INTERNAL' ? '쓸랭 거래' : '외부 거래'} · 신청자: {link.initiatorNickname}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">

        {/* ── 좌측: 입력 ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* 물품 이미지 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              물품 이미지 <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {imageFiles.map((file, i) => (
                <div key={i} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {imageFiles.length < MAX_IMAGES && (
                <label className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Upload className="text-gray-400 mb-1" size={18} />
                  <span className="text-xs text-gray-400">{imageFiles.length}/{MAX_IMAGES}</span>
                </label>
              )}
            </div>
          </section>

          {/* 물품 정보 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-900">물품 정보</p>
            {!isExternal && (
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  거래 금액 (원) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min={0}
                  value={itemPrice}
                  onChange={e => setItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                물품 설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={itemDescription}
                onChange={e => setItemDescription(e.target.value)}
                placeholder="물품 상태, 특이사항 등을 입력해 주세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500 resize-none"
              />
            </div>
          </section>

          {/* 픽업·배달 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                물품 수령지 <span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-500 mb-2">배달원이 물품을 가져갈 장소</p>
              <button
                type="button"
                onClick={() => setPickupOpen(true)}
                className="w-full flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-left hover:border-primary-400"
              >
                <MapPin size={14} className="text-gray-400 shrink-0" />
                <span className={pickupAddr ? 'text-gray-900 truncate' : 'text-gray-400'}>
                  {pickupAddr?.address ?? '주소 검색'}
                </span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                물품 배달지 <span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-500 mb-2">물품을 전달할 장소</p>
              <button
                type="button"
                onClick={() => setDeliveryOpen(true)}
                className="w-full flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-left hover:border-primary-400"
              >
                <MapPin size={14} className="text-gray-400 shrink-0" />
                <span className={deliveryAddr ? 'text-gray-900 truncate' : 'text-gray-400'}>
                  {deliveryAddr?.address ?? '주소 검색'}
                </span>
              </button>
            </div>
          </div>

          {/* 배달원 요청사항 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <label className="text-sm font-semibold text-gray-900 mb-2 block">배달원에게 요청사항</label>
            <textarea
              value={deliveryNotes}
              onChange={e => setDeliveryNotes(e.target.value)}
              placeholder="배달원에게 전달할 사항을 입력해 주세요 (선택, ≤500자)"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500 resize-none"
            />
          </section>
        </div>

        {/* ── 우측: 계산기 + 청구금액 ──────────────────────────────── */}
        <FeeCalculator
          weight={weight} volume={volume} fragility={fragility}
          onWeightChange={setWeight}
          onVolumeChange={setVolume}
          onFragilityChange={setFragility}
          itemPrice={price}
          pickupAddr={pickupAddr}
          deliveryAddr={deliveryAddr}
          settings={feeSettings}
        />
      </div>

      {/* 취소 수수료 경고 */}
      <section className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5 mt-6">
        <div className="flex items-start gap-2 mb-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
          <p className="text-sm font-semibold text-red-900">취소 수수료 안내</p>
        </div>
        <p className="text-xs text-red-700 mb-3 leading-relaxed">
          배달기사 배정 후 취소 시 <strong>취소 수수료가 부과</strong>됩니다.<br />
          결제 완료 전(결제 대기) 까지만 본인 취소 가능, 매칭 후엔 취소 불가.
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedCancel}
            onChange={e => setAgreedCancel(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-red-600 rounded focus:ring-red-500"
          />
          <span className="text-sm text-red-900">위 취소 수수료 정책에 동의합니다.</span>
        </label>
      </section>

      <div className="mt-4">
        <Button type="button" fullWidth disabled={!isValid || submitting} isLoading={submitting} onClick={handleSubmit}>
          신청하기
        </Button>
      </div>

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
