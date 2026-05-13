// 거래대행 시작 — 발급자 본인 영역 입력 후 link 발급 (외부 거래 전용)
//
// 라운드13 PR #130 — 외부 link 분리 입력 흐름. 발급자가 본인 영역까지 한 번에 입력.
//   role=seller : pickup + 물품 + 옵션 + 사진
//   role=buyer  : delivery + 연락처
//   수신자는 link 받아서 본인 영역만 입력 → /escrow/applications/by-link
//
// ⚠ 네비게이션 바의 [거래대행 신청] 은 EXTERNAL 거래 전용.
//   쓸랭 내부(INTERNAL) 거래대행은 채팅방 안 [거래대행 신청] 으로만.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateEscrowLink } from '@/features/escrow/hooks'
import type {
  EscrowFragilityCode,
  EscrowStartRequest,
  EscrowVolumeCode,
  EscrowWeightCode,
  EscrowRole,
  FeePayer,
} from '@/features/escrow/types'
import { uploadImages, validateImageFile } from '@/shared/api/upload'
import KakaoAddressSearch from '@/shared/ui/KakaoAddressSearch'
import type { AddressResult } from '@/shared/ui/KakaoAddressSearch'
import { Button } from '@/shared/ui/Button'
import { BusinessError } from '@/shared/types/api'
import { cn } from '@/shared/lib/cn'

const ROLE_OPTIONS = [
  { value: 'buyer'  as const, label: '구매자', desc: '상대방에게 물품을 구매합니다.' },
  { value: 'seller' as const, label: '판매자', desc: '상대방에게 물품을 판매합니다.' },
]
const FEE_OPTIONS = [
  { value: 'buyer'  as const, label: '구매자 부담', desc: '수수료 전액을 구매자가 냅니다.' },
  { value: 'seller' as const, label: '판매자 부담', desc: '수수료 전액을 판매자가 냅니다.' },
  { value: 'both'   as const, label: '반반 부담',   desc: '수수료를 양쪽이 절반씩 냅니다.' },
]
const WEIGHT_OPTIONS: { code: EscrowWeightCode; label: string }[] = [
  { code: 'lt1',    label: '1kg 미만' },
  { code: '1to3',   label: '1~3kg' },
  { code: '3to5',   label: '3~5kg' },
  { code: '5to10',  label: '5~10kg' },
  { code: 'over10', label: '10kg 이상' },
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
const MAX_IMAGES = 5

export default function EscrowStartPage() {
  const navigate = useNavigate()
  const create = useCreateEscrowLink()

  const [role, setRole] = useState<EscrowRole | null>(null)
  const [feePayer, setFeePayer] = useState<FeePayer | null>(null)

  // seller 본인 영역
  const [pickupAddr, setPickupAddr] = useState<AddressResult | null>(null)
  const [pickupOpen, setPickupOpen] = useState(false)
  const [itemPrice, setItemPrice] = useState<number>(0)
  const [itemDescription, setItemDescription] = useState('')
  const [weight, setWeight] = useState<EscrowWeightCode>('1to3')
  const [volume, setVolume] = useState<EscrowVolumeCode>('m')
  const [fragility, setFragility] = useState<EscrowFragilityCode>('f1')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])

  // buyer 본인 영역
  const [deliveryAddr, setDeliveryAddr] = useState<AddressResult | null>(null)
  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const [receiverPhone, setReceiverPhone] = useState('')

  const [submitting, setSubmitting] = useState(false)

  const phoneOk = /^[0-9+\-]+$/.test(receiverPhone) && receiverPhone.length >= 9

  // 발급자 본인 영역 — role 별 입력 완성 검증 (외부 판매 신청은 사진 1장 이상 필수)
  const sellerAreaReady =
    !!pickupAddr && itemPrice >= 0 && itemDescription.trim().length > 0 && imageFiles.length > 0
  const buyerAreaReady  = !!deliveryAddr && phoneOk

  const canSubmit =
    !!role && !!feePayer &&
    (role === 'seller' ? sellerAreaReady : buyerAreaReady)

  const handleSubmit = async () => {
    if (!role || !feePayer) return
    if (role === 'seller' && !sellerAreaReady) {
      if (imageFiles.length === 0) {
        toast.error('물품 사진을 1장 이상 첨부해 주세요.')
      } else {
        toast.error('판매자 영역 (픽업 주소·물품 정보) 을 입력해 주세요.')
      }
      return
    }
    if (role === 'buyer' && !buyerAreaReady) {
      toast.error('구매자 영역 (수령지·연락처) 을 입력해 주세요.')
      return
    }

    setSubmitting(true)
    try {
      // seller 면 이미지 업로드
      let imageUrls: string[] | undefined = undefined
      if (role === 'seller' && imageFiles.length > 0) {
        const uploaded = await uploadImages('ESCROW', imageFiles)
        imageUrls = uploaded.map(u => u.getUrl)
      }

      const body: EscrowStartRequest = {
        role,
        feePayer,
        tradeMode: 'EXTERNAL',
        // role 에 맞는 영역만
        ...(role === 'seller' && pickupAddr ? {
          initiatorPickupAddress:   pickupAddr.address,
          initiatorPickupLat:       pickupAddr.lat,
          initiatorPickupLng:       pickupAddr.lng,
          initiatorItemPrice:       itemPrice,
          initiatorItemDescription: itemDescription.trim(),
          initiatorWeight:          weight,
          initiatorVolume:          volume,
          initiatorFragility:       fragility,
          initiatorDeliveryNotes:   deliveryNotes.trim() || undefined,
          initiatorImageUrls:       imageUrls,
        } : {}),
        ...(role === 'buyer' && deliveryAddr ? {
          initiatorDeliveryAddress: deliveryAddr.address,
          initiatorDeliveryLat:     deliveryAddr.lat,
          initiatorDeliveryLng:     deliveryAddr.lng,
          initiatorReceiverPhone:   receiverPhone,
        } : {}),
      }

      const link = await create.mutateAsync(body)
      navigate('/escrow/apply/link', { state: { link } })
    } catch (err) {
      if (err instanceof BusinessError) toast.error(err.message)
      else toast.error(err instanceof Error ? err.message : '링크 생성에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-32">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-gray-600">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">대행 신청 (외부 거래)</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        쓸랭 외부 거래에 대행 서비스를 신청해요. 본인 영역까지 입력하면 상대방에게 공유할 링크가 생성됩니다.<br />
        <span className="text-xs text-gray-400">쓸랭 내 거래는 채팅방에서 [거래대행 신청] 으로 시작해 주세요.</span>
      </p>

      <div className="flex flex-col gap-6">

        {/* 역할 */}
        <Section title="나는 어떤 역할인가요?">
          <div className="flex flex-col gap-2">
            {ROLE_OPTIONS.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition-colors',
                  role === value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50',
                )}
              >
                <p className="font-medium text-gray-900 mb-0.5">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* 수수료 */}
        {role && (
          <Section title="대행 수수료 부담">
            <div className="grid grid-cols-3 gap-2">
              {FEE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFeePayer(value)}
                  className={cn(
                    'py-2 rounded-lg text-xs font-medium border transition-colors',
                    feePayer === value
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* 판매자 영역 — role=seller */}
        {role === 'seller' && feePayer && (
          <>
            <Section title="픽업 주소 *">
              <button
                type="button"
                onClick={() => setPickupOpen(true)}
                className="w-full flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-left hover:border-primary-400"
              >
                <MapPin size={14} className="text-gray-400 shrink-0" />
                <span className={pickupAddr ? 'text-gray-900 truncate' : 'text-gray-400'}>
                  {pickupAddr?.address ?? '픽업 주소 검색'}
                </span>
              </button>
            </Section>

            <Section title="물품 정보 *">
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
                  placeholder="예: 맥북 프로 13인치 — 정상 작동"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
                />
              </div>
            </Section>

            <Section title="무게·부피·취급 *">
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
                placeholder="예: 부서지기 쉬워요"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
              />
            </Section>

            <Section title={`물품 사진 (${imageFiles.length}/${MAX_IMAGES}) *`}>
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
            </Section>
          </>
        )}

        {/* 구매자 영역 — role=buyer */}
        {role === 'buyer' && feePayer && (
          <>
            <Section title="수령지 주소 *">
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
            </Section>

            <Section title="받는 사람 연락처 *">
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
          </>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="max-w-lg mx-auto">
            <p className="mb-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
              ⚠ 한 번 신청한 거래대행은 수정할 수 없어요. 내용을 한 번 더 확인해 주세요.
            </p>
            <Button type="button" onClick={handleSubmit} fullWidth disabled={!canSubmit || submitting} isLoading={submitting}>
              링크 생성하기
            </Button>
          </div>
        </div>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <p className="text-sm font-semibold text-gray-900 mb-2.5">{title}</p>
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
