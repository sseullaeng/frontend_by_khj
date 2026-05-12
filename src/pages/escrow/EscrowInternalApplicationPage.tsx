// 채팅방 내부 거래대행 신청 — 판매자 draft (라운드13 디자인)
//
// URL: /escrow/internal/new?chatRoomId=&itemId=
//   - 채팅방 [거래대행 신청] 버튼 (판매자만) 에서 진입
//   - 판매자 영역만 입력 (pickup / 물품 / 무게·부피·취급 / 메모 / 사진)
//   - 구매자 delivery 좌표는 PATCH /buyer-info (EscrowBuyerInfoPage)
//   - 제출: POST /escrow/applications/internal/draft → status="정보입력대기"
//
// 좌우 2칸 + 공통 FeeCalculator. delivery 좌표 없어 preview 호출 불가 → fees=null.
import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Plus, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateEscrowDraft, useEscrowFeeSettings } from '@/features/escrow/hooks'
import type {
  EscrowFragilityCode,
  EscrowVolumeCode,
  EscrowWeightCode,
  FeePayer,
} from '@/features/escrow/types'
import { uploadImages, validateImageFile } from '@/shared/api/upload'
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
  const [feePayer,        setFeePayer]        = useState<FeePayer>('both')

  const [pickupAddr,  setPickupAddr]  = useState<AddressResult | null>(null)
  const [addressOpen, setAddressOpen] = useState(false)

  const [weight,    setWeight]    = useState<EscrowWeightCode | null>('1to3')
  const [volume,    setVolume]    = useState<EscrowVolumeCode | null>('m')
  const [fragility, setFragility] = useState<EscrowFragilityCode | null>('f1')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: feeSettings } = useEscrowFeeSettings()
  const create = useCreateEscrowDraft()

  const handleSubmit = async () => {
    if (!chatRoomId || !itemId) {
      toast.error('잘못된 진입이에요. 채팅방에서 다시 시작해 주세요.')
      return
    }
    // 라운드13 PR #128 — 나눔 거래는 0원 허용. 음수만 거부.
    if (itemPrice < 0)                       { toast.error('물품 가격은 0원 이상이어야 해요.'); return }
    if (!itemDescription.trim())              { toast.error('물품 설명을 입력해 주세요.'); return }
    if (!pickupAddr)                          { toast.error('픽업 주소를 검색해 주세요.'); return }
    if (!weight || !volume || !fragility)     { toast.error('옵션을 모두 선택해 주세요.'); return }

    try {
      const imageUrls = imageFiles.length > 0
        ? (await uploadImages('ESCROW', imageFiles)).map((u) => u.getUrl)
        : []

      const app = await create.mutateAsync({
        chatRoomId,
        itemId,
        tradeMode: 'INTERNAL',
        feePayer,
        itemPrice,
        itemDescription: itemDescription.trim(),
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

          {/* 사진 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              물품 사진 <span className="text-xs font-normal text-gray-400">({imageFiles.length}/{MAX_IMAGES}, 선택)</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {imageFiles.map((file, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageFiles((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {imageFiles.length < MAX_IMAGES && (
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
                      setImageFiles((prev) => [...prev, ...valid].slice(0, MAX_IMAGES))
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
