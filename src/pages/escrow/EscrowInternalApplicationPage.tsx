// 채팅방 내부 거래대행 신청 — 판매자 draft (라운드13 디자인)
//
// URL: /escrow/internal/new?chatRoomId=&itemId=
//   - 채팅방 [거래대행 신청] 버튼 (판매자만) 에서 진입
//   - 판매자 영역만 입력 (pickup / 물품 / 무게·부피·취급 / 메모 / 사진)
//   - 구매자 delivery 좌표는 PATCH /buyer-info (EscrowBuyerInfoPage)
//   - 제출: POST /escrow/applications/internal/draft → status="정보입력대기"
//
// 좌우 2칸 + 공통 FeeCalculator. delivery 좌표 없어 preview 호출 불가 → fees=null.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarClock, ChevronLeft, MapPin, Plus, X, AlertTriangle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateEscrowDraft, useEscrowFeeSettings } from '@/features/escrow/hooks'
import { useItemDetail } from '@/features/item/hooks'
import { useChatRoom } from '@/features/chat/hooks'
import type {
  EscrowFragilityCode,
  EscrowVolumeCode,
  EscrowWeightCode,
  FeePayer,
} from '@/features/escrow/types'
import type { RentalUnit } from '@/features/item/types'
import { uploadImages, validateImageFile } from '@/shared/api/upload'
import { formatKst } from '@/shared/lib/date'
import KakaoAddressSearch from '@/shared/ui/KakaoAddressSearch'
import type { AddressResult } from '@/shared/ui/KakaoAddressSearch'
import { Button } from '@/shared/ui/Button'
import { BusinessError } from '@/shared/types'
import { cn } from '@/shared/lib/cn'
import FeeCalculator from '@/features/escrow/components/FeeCalculator'

const FEE_PAYER_OPTIONS: { code: FeePayer; label: string }[] = [
  { code: 'both',   label: '50:50 부담' },
  { code: 'seller', label: '판매자 전액' },
  { code: 'buyer',  label: '구매자 전액' },
]

const MAX_IMAGES = 5

export default function EscrowInternalApplicationPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const chatRoomId = Number(params.get('chatRoomId'))
  const itemId     = Number(params.get('itemId'))

  const [itemPrice,       setItemPrice]       = useState<number>(0)
  const [itemDescription, setItemDescription] = useState('')
  const [rentalStartAt,   setRentalStartAt]   = useState('')   // 라운드14 V43
  const [rentalEndAt,     setRentalEndAt]     = useState('')
  const [feePayer,        setFeePayer]        = useState<FeePayer>('both')

  const [pickupAddr,  setPickupAddr]  = useState<AddressResult | null>(null)
  const [addressOpen, setAddressOpen] = useState(false)

  const [weight,    setWeight]    = useState<EscrowWeightCode | null>('1to3')
  const [volume,    setVolume]    = useState<EscrowVolumeCode | null>('m')
  const [fragility, setFragility] = useState<EscrowFragilityCode | null>('f1')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  const [imageFiles, setImageFiles] = useState<File[]>([])
  // 라운드13 — Item 의 기존 이미지 (URL) 도 함께 전송. 사용자가 X 누르면 제외.
  const [keepImageUrls, setKeepImageUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: feeSettings } = useEscrowFeeSettings()
  const create = useCreateEscrowDraft()

  // 라운드13 — 채팅방의 거래 모드 + Item 정보로 폼 prefill (판매/대여 자동 분기)
  const { data: chatRoom } = useChatRoom(chatRoomId || 0)
  const { data: item } = useItemDetail(itemId || 0)
  const [prefilled, setPrefilled] = useState(false)
  // 반납 기한 입력은 백엔드 spec 기준 — item.tradeTypes 에 '대여' 가 포함된 모든 신청 폼에 노출.
  //   (대여+판매 겸용 item 이라도 백엔드가 대여 거래대행 lifecycle 을 적용할 수 있도록)
  const isRentalEscrow = item?.tradeTypes?.includes('대여') ?? false

  // 라운드14 V43 통합 — buyer 의 사전 대여 신청이 chatRoom 에 있으면 백엔드가 그 기간을 자동 재사용.
  //   ChatRoomCard.rentalStart/End 가 채워져 있으면 picker 비활성화 + 사전 기간 안내.
  const presetStart = chatRoom?.card?.rentalStart ?? null
  const presetEnd   = chatRoom?.card?.rentalEnd ?? null
  const hasPresetPeriod = !!(isRentalEscrow && presetStart && presetEnd)

  // 라운드14 V43 — 대여 itemPrice 는 백엔드가 rentalPrice × duration 으로 자동 산정·검증.
  //   FE 가 임의 가격 못 보냄 (위변조 차단). 사용자에게는 미리 계산해서 표시만.
  //   사전 기간이 있으면 그 기간으로, 없으면 입력값으로 계산.
  const rentalAuto = useMemo(() => {
    if (!isRentalEscrow) return null
    if (!item?.rentalUnit || !item.rentalPrice) return null
    const s = hasPresetPeriod ? presetStart! : rentalStartAt
    const e = hasPresetPeriod ? presetEnd!   : rentalEndAt
    if (!s || !e) return null
    return computeRentalPrice(s, e, item.rentalUnit, item.rentalPrice)
  }, [isRentalEscrow, hasPresetPeriod, presetStart, presetEnd, rentalStartAt, rentalEndAt, item?.rentalUnit, item?.rentalPrice])

  // 자동 산정 결과를 itemPrice state 에 반영 (송신용 — 백엔드는 무시하지만 정합성 유지)
  useEffect(() => {
    if (rentalAuto) setItemPrice(rentalAuto.total)
  }, [rentalAuto])

  useEffect(() => {
    if (prefilled) return
    if (!chatRoom || !item) return

    // 채팅방의 tradeMode 기준으로 가격 선택 (판매 → salePrice, 대여 → rentalPrice, 나눔 → 0)
    const mode = chatRoom.tradeMode
    const price =
      mode === '나눔' ? 0 :
      mode === '대여' ? (item.rentalPrice ?? item.price ?? 0) :
                        (item.salePrice   ?? item.price ?? 0)

    setItemPrice(price)
    // 물품 설명 — Item 의 description 우선, 없으면 title
    setItemDescription(item.description?.trim() || item.title || '')
    // 기존 Item 이미지 (썸네일 우선 정렬) → URL 그대로 유지
    const urls = [...item.images]
      .sort((a, b) => Number(b.thumbnail) - Number(a.thumbnail))
      .map((img) => img.imageUrl)
      .slice(0, MAX_IMAGES)
    setKeepImageUrls(urls)

    setPrefilled(true)
  }, [chatRoom, item, prefilled])

  const handleSubmit = async () => {
    if (!chatRoomId || !itemId) {
      toast.error('잘못된 진입이에요. 채팅방에서 다시 시작해 주세요.')
      return
    }
    // 라운드13 PR #128 — 나눔 거래는 0원 허용. 음수만 거부.
    if (itemPrice < 0)                       { toast.error('물품 가격은 0원 이상이어야 해요.'); return }
    if (!itemDescription.trim())              { toast.error('물품 설명을 입력해 주세요.'); return }
    // 라운드14 V43 — 대여 거래는 rentalStartAt + rentalEndAt 둘 다 필수, start < end
    //   (chatRoom 에 buyer 사전 신청이 있으면 백엔드가 그 기간을 자동 재사용하지만,
    //    FE 는 입력값 보내고 백엔드가 우선순위에 따라 처리한다.)
    if (isRentalEscrow && !hasPresetPeriod) {
      // 사전 신청 기간이 chatRoom 에 있으면 picker 누락 가능 (백엔드가 그 기간 자동 사용)
      if (!rentalStartAt)              { toast.error('대여 시작 일시를 입력해 주세요.'); return }
      if (!rentalEndAt)                { toast.error('반납 예정 일시를 입력해 주세요.'); return }
      if (rentalStartAt >= rentalEndAt) { toast.error('반납 일시는 시작 일시보다 늦어야 해요.'); return }
    }
    if (!pickupAddr)                          { toast.error('픽업 주소를 검색해 주세요.'); return }
    if (!weight || !volume || !fragility)     { toast.error('옵션을 모두 선택해 주세요.'); return }

    try {
      // 새로 추가한 사진 업로드 + 기존 Item 이미지 URL 합치기
      const uploaded = imageFiles.length > 0
        ? (await uploadImages('ESCROW', imageFiles)).map((u) => u.getUrl)
        : []
      const imageUrls = [...keepImageUrls, ...uploaded].slice(0, MAX_IMAGES)

      const app = await create.mutateAsync({
        chatRoomId,
        itemId,
        tradeMode: 'INTERNAL',
        feePayer,
        itemPrice,
        itemDescription: itemDescription.trim(),
        rentalStartAt: isRentalEscrow ? toApiLocalDateTime(rentalStartAt) : undefined,
        rentalEndAt:   isRentalEscrow ? toApiLocalDateTime(rentalEndAt)   : undefined,
        pickupAddress: pickupAddr.address,
        pickupLat:     pickupAddr.lat,
        pickupLng:     pickupAddr.lng,
        weight,
        volume,
        fragility,
        deliveryNotes: deliveryNotes.trim() || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      })
      navigate(`/escrow/list?highlight=${app.id}`)
    } catch (err) {
      if (err instanceof BusinessError) toast.error(err.message)
      else if (err instanceof Error)    toast.error(err.message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-gray-600" aria-label="뒤로">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">거래대행 신청 (판매자)</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">채팅방 #{chatRoomId} · 물품 #{itemId}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">

        {/* ── 좌측: 판매자 입력 ──────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* 안내 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 mb-1">판매자 단계예요</p>
              <p className="text-xs text-amber-700/90 leading-relaxed">
                여기서는 픽업 주소·물품 정보까지만 입력해요.<br />
                제출 후 구매자가 수령지를 입력하면 정확한 거리·배달비가 자동 산정돼요.
              </p>
            </div>
          </div>

          {/* 수수료 부담 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">수수료 부담</p>
            <div className="grid grid-cols-3 gap-2">
              {FEE_PAYER_OPTIONS.map((o) => (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => setFeePayer(o.code)}
                  className={cn(
                    'py-2 rounded-lg text-xs font-medium border transition-colors',
                    feePayer === o.code
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          {/* 물품 정보 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-900">물품 정보</p>
            {isRentalEscrow ? (
              // 라운드14 V43 — 대여는 itemPrice 를 백엔드가 자동 산정 (rentalPrice × duration).
              //   FE 는 미리보기만 표시, 입력 받지 않음 (위변조 차단).
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm">
                <p className="text-xs text-sky-700 font-semibold mb-1 inline-flex items-center gap-1">
                  <Info size={12} /> 대여료 자동 산정
                </p>
                {rentalAuto ? (
                  <>
                    <p className="text-sky-900">
                      <b>{(item?.rentalPrice ?? 0).toLocaleString()}원</b>
                      <span className="text-xs text-sky-700"> / {item?.rentalUnit}</span>
                      <span className="text-sky-700 mx-1">×</span>
                      <b>{rentalAuto.duration}{item?.rentalUnit}</b>
                      <span className="text-sky-700 mx-1">=</span>
                      <b className="text-base">{rentalAuto.total.toLocaleString()}원</b>
                    </p>
                    <p className="text-[11px] text-sky-700 mt-1">
                      기간이 단위에 딱 맞지 않으면 올림(ceil) 처리돼요.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-sky-700">반납 기한을 입력하면 자동으로 계산돼요.</p>
                )}
              </div>
            ) : (
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  물품 가격 (원) <span className="text-red-500">*</span>
                  <span className="text-[10px] text-gray-400 ml-1">(나눔은 0원)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={itemPrice || ''}
                  onChange={(e) => setItemPrice(Number(e.target.value) || 0)}
                  onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault() }}
                  placeholder="0"
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
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="예: 맥북 프로 13인치 2020 — 정상 작동"
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500 resize-none"
              />
            </div>
          </section>

          {/* 대여 기간 (라운드14 V43) — 사전 신청 있으면 안내, 없으면 picker */}
          {isRentalEscrow && (
            <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <p className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                <CalendarClock size={15} className="text-gray-500" />
                대여 기간 {!hasPresetPeriod && <span className="text-red-500">*</span>}
              </p>
              {hasPresetPeriod ? (
                <div className="mt-2 rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm">
                  <p className="text-xs text-primary-700 font-medium mb-1 inline-flex items-center gap-1">
                    <Info size={12} /> 구매자 사전 신청 기간 적용
                  </p>
                  <p className="text-primary-900 font-semibold">
                    {formatKst(presetStart, 'yyyy.MM.dd HH:mm')}
                    <span className="text-primary-600 mx-1.5">~</span>
                    {formatKst(presetEnd, 'yyyy.MM.dd HH:mm')}
                  </p>
                  <p className="text-[11px] text-primary-700/80 mt-1">
                    구매자가 채팅방에서 미리 신청한 기간이라 입력이 필요 없어요.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    구매자가 채팅방에서 미리 대여 신청한 기간이 있으면 그 기간이 우선 적용돼요.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="block text-xs">
                      <span className="text-gray-600 mb-0.5 block">시작</span>
                      <input
                        type="datetime-local"
                        min={nowLocalInputValue()}
                        value={rentalStartAt}
                        onChange={(e) => setRentalStartAt(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                      />
                    </label>
                    <label className="block text-xs">
                      <span className="text-gray-600 mb-0.5 block">반납</span>
                      <input
                        type="datetime-local"
                        min={rentalStartAt || nowLocalInputValue()}
                        value={rentalEndAt}
                        onChange={(e) => setRentalEndAt(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                      />
                    </label>
                  </div>
                </>
              )}
              {item?.deposit != null && item.deposit > 0 && (
                <p className="mt-3 text-xs text-gray-500">
                  물품 보증금: {item.deposit.toLocaleString()}{item.depositType === 'PERCENT' ? '%' : '원'}
                  <span className="text-gray-400 ml-1">(결제 시 자동 hold)</span>
                </p>
              )}
            </section>
          )}

          {/* 픽업 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              픽업 주소 <span className="text-red-500">*</span>
            </p>
            <p className="text-xs text-gray-500 mb-2">배달원이 물품을 가져갈 장소</p>
            <button
              type="button"
              onClick={() => setAddressOpen(true)}
              className="w-full flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-left hover:border-primary-400"
            >
              <MapPin size={14} className="text-gray-400 shrink-0" />
              <span className={pickupAddr ? 'text-gray-900 truncate' : 'text-gray-400'}>
                {pickupAddr?.address ?? '픽업 주소 검색'}
              </span>
            </button>
          </section>

          {/* 사진 — 기존 Item 사진(URL) + 새로 추가한 사진(File) */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              물품 사진 <span className="text-xs font-normal text-gray-400">({keepImageUrls.length + imageFiles.length}/{MAX_IMAGES}, 선택)</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {keepImageUrls.map((url, index) => (
                <div key={`url-${index}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setKeepImageUrls((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    aria-label="기존 사진 제거"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {imageFiles.map((file, index) => (
                <div key={`new-${index}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageFiles((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    aria-label="추가 사진 제거"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {(keepImageUrls.length + imageFiles.length) < MAX_IMAGES && (
                <label className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? [])
                      e.target.value = ''
                      const valid: File[] = []
                      for (const f of files) {
                        const err = validateImageFile(f)
                        if (err) { toast.error(err); continue }
                        valid.push(f)
                      }
                      const slots = MAX_IMAGES - keepImageUrls.length
                      setImageFiles((prev) => [...prev, ...valid].slice(0, Math.max(0, slots)))
                    }}
                    className="hidden"
                  />
                  <Plus className="text-gray-400" size={20} />
                </label>
              )}
            </div>
          </section>

          {/* 배달 메모 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <label className="text-sm font-semibold text-gray-900 mb-2 block">배달 메모 (선택)</label>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="예: 부서지기 쉬워요. 세워서 배달 부탁드려요."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
            />
          </section>
        </div>

        {/* ── 우측: 계산기 (옵션 + 안내) ────────────────────── */}
        <FeeCalculator
          weight={weight}
          volume={volume}
          fragility={fragility}
          onWeightChange={setWeight}
          onVolumeChange={setVolume}
          onFragilityChange={setFragility}
          itemPrice={itemPrice}
          fees={null}                         // draft 단계엔 delivery 없어 preview 호출 불가
          settings={feeSettings}
          showPreviewUnavailableHint
        />
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
          ⚠ 한 번 신청한 거래대행은 수정할 수 없어요. 내용을 한 번 더 확인해 주세요.
        </p>
        <Button onClick={handleSubmit} isLoading={create.isPending} fullWidth>
          신청 접수 (구매자에게 알림 전송)
        </Button>
      </div>

      <KakaoAddressSearch
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        onSelect={(r) => { setPickupAddr(r); setAddressOpen(false) }}
      />
    </div>
  )
}

function toApiLocalDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value
}

function nowLocalInputValue(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

// 라운드14 V43 — 백엔드 RentalDurationCalculator 와 동일 공식 (사용자 미리보기용).
//   duration = ceil((end - start) / unit), 최소 1.  단위: 시간 / 일 / 주 / 월(=30일 근사)
const UNIT_MS: Record<RentalUnit, number> = {
  '시간':           60 * 60 * 1000,
  '일':        24 * 60 * 60 * 1000,
  '주':    7 * 24 * 60 * 60 * 1000,
  '월':   30 * 24 * 60 * 60 * 1000,
}
function computeRentalPrice(
  startInput: string,
  endInput: string,
  unit: RentalUnit,
  rentalPrice: number,
): { duration: number; total: number } {
  const start = new Date(startInput).getTime()
  const end   = new Date(endInput).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { duration: 0, total: 0 }
  }
  const duration = Math.max(1, Math.ceil((end - start) / UNIT_MS[unit]))
  return { duration, total: rentalPrice * duration }
}
