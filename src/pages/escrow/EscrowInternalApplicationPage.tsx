// 채팅방 내부 거래대행 신청 — Phase 1: 판매자 draft 작성 (라운드12 PR-B-4 #108)
//
// URL: /escrow/internal/new?chatRoomId=&itemId=
//   - 채팅방 안 [거래대행 신청] 버튼 (판매자만) 에서 진입
//   - 판매자 본인 영역만 입력 (pickup / 물품 / 무게/부피/취급 / 메모 / 사진)
//   - 구매자의 delivery 좌표는 별도 단계 (PATCH /buyer-info, EscrowBuyerInfoPage)
//   - 제출: POST /escrow/applications/internal/draft → status="정보입력대기"
//
// preview 호출은 delivery 좌표 필수라 draft 단계에선 호출 X.
// 정확한 금액은 buyer-info 단계에서 표시.
import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateEscrowDraft } from '@/features/escrow/hooks'
import type {
  EscrowFragilityCode,
  EscrowVolumeCode,
  EscrowWeightCode,
  FeePayer,
} from '@/features/escrow/types'
import { uploadImages, validateImageFile } from '@/shared/api/upload'
import KakaoAddressSearch from '@/shared/ui/KakaoAddressSearch'
import { Button } from '@/shared/ui/Button'
import { BusinessError } from '@/shared/types'
import { cn } from '@/shared/lib/cn'

const WEIGHT_OPTIONS: { code: EscrowWeightCode; label: string }[] = [
  { code: 'lt1',   label: '1kg 미만' },
  { code: '1to3',  label: '1~3kg' },
  { code: '3to5',  label: '3~5kg' },
  { code: '5to10', label: '5~10kg' },
  { code: 'gt10',  label: '10kg 이상' },
]
const VOLUME_OPTIONS: { code: EscrowVolumeCode; label: string }[] = [
  { code: 's', label: 'Small' },
  { code: 'm', label: 'Medium' },
  { code: 'l', label: 'Large' },
]
const FRAGILITY_OPTIONS: { code: EscrowFragilityCode; label: string }[] = [
  { code: 'f1', label: '일반' },
  { code: 'f2', label: '보통' },
  { code: 'f3', label: '주의' },
  { code: 'f4', label: '취급주의' },
  { code: 'f5', label: '극취급주의' },
]
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

  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupLat,     setPickupLat]     = useState<number | null>(null)
  const [pickupLng,     setPickupLng]     = useState<number | null>(null)
  const [addressOpen,   setAddressOpen]   = useState(false)

  const [weight,    setWeight]    = useState<EscrowWeightCode>('1to3')
  const [volume,    setVolume]    = useState<EscrowVolumeCode>('m')
  const [fragility, setFragility] = useState<EscrowFragilityCode>('f1')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const create = useCreateEscrowDraft()

  const handleSubmit = async () => {
    if (!chatRoomId || !itemId) {
      toast.error('잘못된 진입이에요. 채팅방에서 다시 시작해 주세요.')
      return
    }
    if (!itemPrice || itemPrice <= 0)       { toast.error('물품 가격을 입력해 주세요.'); return }
    if (!itemDescription.trim())            { toast.error('물품 설명을 입력해 주세요.'); return }
    if (!pickupAddress || pickupLat == null || pickupLng == null) {
      toast.error('픽업 주소를 검색해 주세요.'); return
    }

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
        pickupAddress,
        pickupLat,
        pickupLng,
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
    <div className="max-w-2xl mx-auto w-full pb-24">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-gray-600" aria-label="뒤로">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">거래대행 신청 (판매자)</h1>
      </div>

      <div className="flex flex-col gap-4">

        {/* 안내 */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">판매자 단계예요</p>
          <p className="text-xs text-amber-700/90 leading-relaxed">
            여기서는 픽업 주소 · 물품 정보까지만 입력해요.
            제출 후 구매자가 수령지를 입력하면 정확한 수수료가 계산되고 결제 단계로 넘어가요.
          </p>
        </div>

        <Section title="수수료 부담">
          <div className="grid grid-cols-3 gap-2">
            {FEE_PAYER_OPTIONS.map((o) => (
              <button key={o.code} type="button" onClick={() => setFeePayer(o.code)} className={chip(feePayer === o.code)}>
                {o.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="물품 정보">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">물품 가격 (원)</label>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={itemPrice || ''}
              onChange={(e) => setItemPrice(Number(e.target.value) || 0)}
              onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault() }}
              placeholder="0"
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
            />
            <label className="text-xs text-gray-500 mt-1">물품 설명</label>
            <textarea
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="예: 맥북 프로 13인치 2020 — 정상 작동"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
            />
          </div>
        </Section>

        <Section title="픽업 주소">
          <button
            type="button"
            onClick={() => setAddressOpen(true)}
            className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-left flex items-center gap-2 hover:border-primary-400"
          >
            <MapPin size={14} className="text-gray-400" />
            <span className={pickupAddress ? 'text-gray-700 truncate' : 'text-gray-400'}>
              {pickupAddress || '픽업 주소 검색'}
            </span>
          </button>
        </Section>

        <Section title="무게·부피·취급">
          <div className="space-y-3">
            <OptionRow label="무게">
              {WEIGHT_OPTIONS.map((o) => (
                <button key={o.code} type="button" onClick={() => setWeight(o.code)} className={chip(weight === o.code)}>
                  {o.label}
                </button>
              ))}
            </OptionRow>
            <OptionRow label="부피">
              {VOLUME_OPTIONS.map((o) => (
                <button key={o.code} type="button" onClick={() => setVolume(o.code)} className={chip(volume === o.code)}>
                  {o.label}
                </button>
              ))}
            </OptionRow>
            <OptionRow label="취급">
              {FRAGILITY_OPTIONS.map((o) => (
                <button key={o.code} type="button" onClick={() => setFragility(o.code)} className={chip(fragility === o.code)}>
                  {o.label}
                </button>
              ))}
            </OptionRow>
          </div>
        </Section>

        <Section title="배달 메모 (선택)">
          <textarea
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="예: 부서지기 쉬워요. 세워서 배달 부탁드려요."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
          />
        </Section>

        <Section title={`사진 (${imageFiles.length}/${MAX_IMAGES}) — 선택`}>
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
                <Plus className="text-gray-400" size={24} />
              </label>
            )}
          </div>
        </Section>

        <Button onClick={handleSubmit} isLoading={create.isPending} fullWidth>
          신청 접수 (구매자에게 알림 전송)
        </Button>
      </div>

      <KakaoAddressSearch
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        onSelect={(r) => {
          setPickupAddress(r.address || r.region)
          setPickupLat(r.lat); setPickupLng(r.lng)
          setAddressOpen(false)
        }}
      />
    </div>
  )
}

// ── 보조 컴포넌트 ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <p className="text-xs font-semibold text-gray-700 mb-2.5">{title}</p>
      {children}
    </div>
  )
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-gray-500 mb-1">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function chip(active: boolean): string {
  return cn(
    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
    active
      ? 'bg-primary-500 text-white border-primary-500'
      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300',
  )
}
