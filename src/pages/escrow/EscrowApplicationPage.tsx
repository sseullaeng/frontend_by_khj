// 거래대행 신청서 — 외부 link 분리 입력 수신자 폼 (라운드13 PR #130)
//
// 흐름:
//   POST /escrow/links             — 발급자가 본인 영역까지 입력 (EscrowStartPage)
//   GET /escrow/links/{linkToken}  — 수신자가 link 진입 → 발급자 영역 확인
//   POST /escrow/applications/preview  — 양쪽 영역 합쳐서 fee 계산
//   POST /escrow/applications/by-link  — 수신자 본인 영역 + fee snapshot → 결제대기 진입
//
// link.initiatorRole === 'seller' → 발급자가 판매자, 수신자는 buyer (delivery + 연락처 입력)
// link.initiatorRole === 'buyer'  → 발급자가 구매자, 수신자는 seller (pickup + 물품 + 옵션 입력)
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Upload, X, MapPin, AlertTriangle, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/Button'
import KakaoAddressSearch from '@/shared/ui/KakaoAddressSearch'
import type { AddressResult } from '@/shared/ui/KakaoAddressSearch'
import { uploadImages, validateImageFile } from '@/shared/api/upload'
import { useAuthStore } from '@/features/auth/store'
import {
  useCreateEscrowByLink,
  useEscrowLink,
  useEscrowFeeSettings,
  useEscrowPreview,
} from '@/features/escrow/hooks'
import type {
  EscrowApplication,
  EscrowByLinkRequest,
  EscrowLink,
  FragilityKey,
  VolumeKey,
  WeightKey,
} from '@/features/escrow/types'
import { BusinessError } from '@/shared/types/api'
import FeeCalculator from '@/features/escrow/components/FeeCalculator'

const MAX_IMAGES = 10

export default function EscrowApplicationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { linkId } = useParams<{ linkId: string }>()
  const linkToken = linkId ?? ''

  // 로그인 가드 — 외부 링크 받은 사용자가 비로그인 상태면 먼저 로그인.
  //   sessionStorage 에 next 저장해서 SocialCallbackPage (OAuth redirect 후) 도 복귀 가능.
  const isLoggedIn = useAuthStore((s) => !!s.user)
  const next = `${location.pathname}${location.search}`
  useEffect(() => {
    if (!isLoggedIn) sessionStorage.setItem('postLoginNext', next)
  }, [isLoggedIn, next])

  const stateLink = (location.state as { link?: EscrowLink } | null)?.link
  const { data: fetchedLink } = useEscrowLink(stateLink ? undefined : linkToken)
  const link = stateLink ?? fetchedLink

  const { data: feeSettings } = useEscrowFeeSettings()
  const preview = useEscrowPreview()
  const create = useCreateEscrowByLink()

  // 발급자가 seller 면 수신자가 buyer 입력, 그 반대도 마찬가지
  const initiatorRole = link?.initiatorRole
  const isReceiverBuyer  = initiatorRole === 'seller'
  const isReceiverSeller = initiatorRole === 'buyer'

  // 수신자 본인 영역 — buyer 면
  const [deliveryAddr,  setDeliveryAddr]  = useState<AddressResult | null>(null)
  const [deliveryOpen,  setDeliveryOpen]  = useState(false)
  const [receiverPhone, setReceiverPhone] = useState('')

  // 수신자 본인 영역 — seller 면
  const [pickupAddr,       setPickupAddr]       = useState<AddressResult | null>(null)
  const [pickupOpen,       setPickupOpen]       = useState(false)
  const [itemPrice,        setItemPrice]        = useState<number>(0)
  const [itemDescription,  setItemDescription]  = useState('')
  const [weight,           setWeight]           = useState<WeightKey | null>(null)
  const [volume,           setVolume]           = useState<VolumeKey | null>(null)
  const [fragility,        setFragility]        = useState<FragilityKey | null>(null)
  const [deliveryNotes,    setDeliveryNotes]    = useState('')
  const [imageFiles,       setImageFiles]       = useState<File[]>([])

  const [agreedCancel, setAgreedCancel] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 발급자가 보낸 본인 영역 (link 응답에서)
  const initiator = useMemo(() => {
    if (!link) return null
    if (isReceiverBuyer) {
      // 발급자=seller. pickup/물품/옵션 영역
      return {
        pickupAddress:   link.initiatorPickupAddress,
        pickupLat:       link.initiatorPickupLat,
        pickupLng:       link.initiatorPickupLng,
        itemPrice:       link.initiatorItemPrice ?? 0,
        itemDescription: link.initiatorItemDescription,
        weight:          link.initiatorWeight,
        volume:          link.initiatorVolume,
        fragility:       link.initiatorFragility,
        deliveryNotes:   link.initiatorDeliveryNotes,
        imageUrls:       link.initiatorImageUrls,
      }
    } else {
      // 발급자=buyer. delivery/연락처 영역
      return {
        deliveryAddress: link.initiatorDeliveryAddress,
        deliveryLat:     link.initiatorDeliveryLat,
        deliveryLng:     link.initiatorDeliveryLng,
        receiverPhone:   link.initiatorReceiverPhone,
      }
    }
  }, [link, isReceiverBuyer])

  // ── preview 호출 — 양쪽 좌표/옵션/가격 모두 모이면 ──
  // ⚠️ feeSettings 는 표시용(요율 카드)일 뿐 preview 호출에는 필요 X.
  //    /admin/.../fee-settings 는 관리자 전용이라 일반 사용자는 401/403 → undefined.
  //    여기서 feeSettings 로 게이팅하면 일반 사용자는 preview 가 영영 안 돌아 배달료가 "—" 로 남는다.
  const previewBody = useMemo(() => {
    if (!link) return null

    // 발급자가 seller: pickup/옵션은 initiator, delivery 는 본인
    if (isReceiverBuyer) {
      if (!deliveryAddr) return null
      if (initiator?.pickupLat == null || initiator?.pickupLng == null) return null
      if (!initiator.weight || !initiator.volume || !initiator.fragility) return null
      return {
        tradeMode: link.tradeMode,
        itemPrice: initiator.itemPrice ?? 0,
        pickupLat: initiator.pickupLat,
        pickupLng: initiator.pickupLng,
        deliveryLat: deliveryAddr.lat,
        deliveryLng: deliveryAddr.lng,
        weight: initiator.weight,
        volume: initiator.volume,
        fragility: initiator.fragility,
        feePayer: link.feePayer,
      }
    }
    // 발급자가 buyer: delivery 는 initiator, pickup/옵션은 본인
    if (!pickupAddr || !weight || !volume || !fragility) return null
    if (initiator?.deliveryLat == null || initiator?.deliveryLng == null) return null
    return {
      tradeMode: link.tradeMode,
      itemPrice,
      pickupLat: pickupAddr.lat,
      pickupLng: pickupAddr.lng,
      deliveryLat: initiator.deliveryLat,
      deliveryLng: initiator.deliveryLng,
      weight, volume, fragility,
      feePayer: link.feePayer,
    }
  }, [link, isReceiverBuyer, initiator, deliveryAddr, pickupAddr, weight, volume, fragility, itemPrice])

  useEffect(() => {
    if (!previewBody) return
    const t = setTimeout(() => preview.mutate(previewBody), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewBody])

  const fees = preview.data ?? null

  // 검증 — 버튼 활성 조건은 "필수 입력 채워졌는지" 만. fees 는 submit 클릭 시점에 fresh preview 로 확보.
  // (useEffect 자동 preview 는 FeeCalculator 표시용 — 실패해도 버튼은 잠그지 않음)
  const phoneOk = /^[0-9+\-]+$/.test(receiverPhone) && receiverPhone.length >= 9
  const buyerAreaReady  = !!deliveryAddr && phoneOk
  const sellerAreaReady = !!pickupAddr && itemPrice >= 0 && itemDescription.trim().length > 0 && !!weight && !!volume && !!fragility

  const isValid =
    !!link && agreedCancel &&
    (isReceiverBuyer ? buyerAreaReady : sellerAreaReady) &&
    (isReceiverSeller ? imageFiles.length > 0 : true)   // seller 라면 이미지 1장 이상

  const handleSubmit = async () => {
    if (!isValid || !link) return

    setSubmitting(true)
    try {
      // seller 면 이미지 업로드
      let imageUrls: string[] | undefined = undefined
      if (isReceiverSeller && imageFiles.length > 0) {
        const uploaded = await uploadImages('ESCROW', imageFiles)
        imageUrls = uploaded.map(u => u.getUrl)
      }

      // submit 클릭 시점에 fresh preview snapshot 확보 (백엔드 atomic 정책)
      const previewReq = isReceiverBuyer
        ? deliveryAddr && initiator?.pickupLat != null && initiator?.pickupLng != null
          && initiator.weight && initiator.volume && initiator.fragility
          ? {
              tradeMode: link.tradeMode,
              itemPrice: initiator.itemPrice ?? 0,
              pickupLat: initiator.pickupLat,
              pickupLng: initiator.pickupLng,
              deliveryLat: deliveryAddr.lat,
              deliveryLng: deliveryAddr.lng,
              weight: initiator.weight,
              volume: initiator.volume,
              fragility: initiator.fragility,
              feePayer: link.feePayer,
            }
          : null
        : pickupAddr && weight && volume && fragility
          && initiator?.deliveryLat != null && initiator?.deliveryLng != null
          ? {
              tradeMode: link.tradeMode,
              itemPrice,
              pickupLat: pickupAddr.lat,
              pickupLng: pickupAddr.lng,
              deliveryLat: initiator.deliveryLat,
              deliveryLng: initiator.deliveryLng,
              weight, volume, fragility,
              feePayer: link.feePayer,
            }
          : null

      if (!previewReq) {
        toast.error('상대방 정보가 부족해 수수료를 계산할 수 없어요.')
        return
      }
      const freshFees = await preview.mutateAsync(previewReq)

      const body: EscrowByLinkRequest = {
        linkToken,
        deliveryFee:   freshFees.deliveryFee,
        commissionFee: freshFees.commissionFee,
        totalFee:      freshFees.totalFee,
        distanceKm:    freshFees.distanceKm,
        ...(isReceiverBuyer && deliveryAddr ? {
          deliveryAddress: deliveryAddr.address,
          deliveryLat:     deliveryAddr.lat,
          deliveryLng:     deliveryAddr.lng,
          receiverPhone,
          // 구매자도 배달기사 요청사항 전달 가능
          deliveryNotes:   deliveryNotes.trim() || undefined,
        } : {}),
        ...(isReceiverSeller && pickupAddr && weight && volume && fragility ? {
          pickupAddress:   pickupAddr.address,
          pickupLat:       pickupAddr.lat,
          pickupLng:       pickupAddr.lng,
          itemPrice,
          itemDescription: itemDescription.trim(),
          weight,
          volume,
          fragility,
          deliveryNotes:   deliveryNotes.trim() || undefined,
          imageUrls,
        } : {}),
      }

      const application: EscrowApplication = await create.mutateAsync(body)
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

  // 로그인 가드 — 모든 hook 호출 이후의 안전한 위치에서 redirect
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ next }} replace />
  }

  if (!link) {
    return <p className="py-20 text-center text-sm text-gray-400">링크 정보 불러오는 중...</p>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">거래 대행 신청서</h1>
        <p className="text-sm text-gray-500">
          {link.tradeMode === 'INTERNAL' ? '쓸랭 거래' : '외부 거래'} ·
          {link.initiatorNickname} ({initiatorRole === 'seller' ? '판매자' : '구매자'}) 가 보낸 링크
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">

        {/* ── 좌측: 발급자 영역 요약 + 수신자 본인 영역 입력 ─────── */}
        <div className="flex flex-col gap-6">

          {/* 발급자 영역 요약 */}
          {isReceiverBuyer && initiator?.pickupAddress && (
            <section className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3 inline-flex items-center gap-1.5">
                <Package size={14} /> 판매자 입력 정보
              </p>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li>물품 — {(initiator.itemPrice ?? 0).toLocaleString()}원</li>
                {initiator.itemDescription && <li className="text-xs text-gray-500">{initiator.itemDescription}</li>}
                <li>픽업 — {initiator.pickupAddress}</li>
                <li className="text-xs text-gray-500">
                  옵션 — 무게 {initiator.weight} · 부피 {initiator.volume} · 취급 {initiator.fragility}
                </li>
                {initiator.deliveryNotes && <li className="text-xs text-gray-500">메모 — {initiator.deliveryNotes}</li>}
              </ul>
              {(initiator.imageUrls?.length ?? 0) > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {initiator.imageUrls!.slice(0, 5).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="" className="aspect-square w-full object-cover rounded-lg border border-gray-200" />
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          {isReceiverSeller && initiator?.deliveryAddress && (
            <section className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3 inline-flex items-center gap-1.5">
                <MapPin size={14} /> 구매자 입력 정보
              </p>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li>수령지 — {initiator.deliveryAddress}</li>
                {initiator.receiverPhone && <li>연락처 — {initiator.receiverPhone}</li>}
              </ul>
            </section>
          )}

          {/* 수신자 = buyer: delivery + 연락처 입력 */}
          {isReceiverBuyer && (
            <>
              <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  수령지 주소 <span className="text-red-500">*</span>
                </p>
                <button
                  type="button"
                  onClick={() => setDeliveryOpen(true)}
                  className="w-full flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-left hover:border-primary-400"
                >
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  <span className={deliveryAddr ? 'text-gray-900 truncate' : 'text-gray-400'}>
                    {deliveryAddr?.address ?? '수령지 주소 검색'}
                  </span>
                </button>
              </section>
              <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  받는 사람 연락처 <span className="text-red-500">*</span>
                </p>
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
              </section>
              <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                <label className="text-sm font-semibold text-gray-900 mb-2 block">배달기사 요청사항 (선택)</label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="예: 부재 시 경비실에 맡겨 주세요"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
                />
              </section>
            </>
          )}

          {/* 수신자 = seller: pickup + 물품 + 옵션 + 사진 입력 */}
          {isReceiverSeller && (
            <>
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
                        onClick={() => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {imageFiles.length < MAX_IMAGES && (
                    <label className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
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
                        }}
                        className="hidden"
                      />
                      <Upload className="text-gray-400 mb-1" size={18} />
                      <span className="text-xs text-gray-400">{imageFiles.length}/{MAX_IMAGES}</span>
                    </label>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col gap-3">
                <p className="text-sm font-semibold text-gray-900">물품 정보</p>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">물품 가격 (원) — 나눔은 0</label>
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={itemPrice || ''}
                    onChange={e => setItemPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500"
                  />
                </div>
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

              <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  픽업 주소 <span className="text-red-500">*</span>
                </p>
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
              </section>

              <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                <label className="text-sm font-semibold text-gray-900 mb-2 block">배달원에게 요청사항</label>
                <textarea
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  placeholder="배달원에게 전달할 사항 (선택, ≤500자)"
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500 resize-none"
                />
              </section>
            </>
          )}
        </div>

        {/* ── 우측: 계산기 (수신자=seller 면 옵션 입력 포함, =buyer 면 옵션은 발급자가 정함) ── */}
        <FeeCalculator
          weight={isReceiverSeller ? weight : (initiator?.weight ?? null)}
          volume={isReceiverSeller ? volume : (initiator?.volume ?? null)}
          fragility={isReceiverSeller ? fragility : (initiator?.fragility ?? null)}
          onWeightChange={isReceiverSeller ? setWeight : () => {}}
          onVolumeChange={isReceiverSeller ? setVolume : () => {}}
          onFragilityChange={isReceiverSeller ? setFragility : () => {}}
          itemPrice={isReceiverSeller ? itemPrice : (initiator?.itemPrice ?? 0)}
          fees={fees}
          isLoadingFees={preview.isPending}
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

      {/* 신청 후 수정 불가 안내 */}
      <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
        ⚠ 한 번 신청한 거래대행은 수정할 수 없어요. 입력 내용을 다시 한 번 확인해 주세요.
      </p>

      <div className="mt-3">
        <Button type="button" fullWidth disabled={!isValid || submitting} isLoading={submitting} onClick={handleSubmit}>
          신청하기
        </Button>
        {!fees && previewBody && !submitting && (
          <p className="text-xs text-gray-400 text-center mt-2">예상 수수료 계산 중...</p>
        )}
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
