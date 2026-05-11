// 채팅방 내부 거래대행 신청 페이지 (라운드12 PR #102 + #105)
//
// URL: /escrow/internal/new?chatRoomId=&itemId=
//   - 채팅방 안 [거래대행 신청] 버튼 (판매자만) 에서 진입
//   - 폼 작성 중 POST /escrow/applications/preview 실시간 호출 → 수수료/배달비 미리보기
//   - 제출: POST /escrow/applications/internal — preview 결과 그대로 submitted* 로 전달
//
// 기존 외부 link 흐름 (EscrowApplicationPage) 과는 별도. linkToken 사용 X.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  useEscrowPreview,
  useCreateInternalEscrowApplication,
} from '@/features/escrow/hooks'
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
  { code: 'R1TO3',   label: '1~3kg' },
  { code: 'R3TO5',   label: '3~5kg' },
  { code: 'R5TO10',  label: '5~10kg' },
  { code: 'R10PLUS', label: '10kg 이상' },
]
const VOLUME_OPTIONS: { code: EscrowVolumeCode; label: string }[] = [
  { code: 'S', label: 'Small' },
  { code: 'M', label: 'Medium' },
  { code: 'L', label: 'Large' },
]
const FRAGILITY_OPTIONS: { code: EscrowFragilityCode; label: string }[] = [
  { code: 'F1', label: '일반' },
  { code: 'F2', label: '주의' },
  { code: 'F3', label: '취급주의' },
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

  // 기본 필드
  const [itemPrice,       setItemPrice]       = useState<number>(0)
  const [itemDescription, setItemDescription] = useState('')
  const [feePayer,        setFeePayer]        = useState<FeePayer>('both')

  // 주소 + 좌표
  const [pickupAddress,   setPickupAddress]   = useState('')
  const [pickupLat,       setPickupLat]       = useState<number | null>(null)
  const [pickupLng,       setPickupLng]       = useState<number | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryLat,     setDeliveryLat]     = useState<number | null>(null)
  const [deliveryLng,     setDeliveryLng]     = useState<number | null>(null)

  const [addressTarget, setAddressTarget] = useState<'pickup' | 'delivery' | null>(null)

  // 옵션
  const [weight,    setWeight]    = useState<EscrowWeightCode>('R1TO3')
  const [volume,    setVolume]    = useState<EscrowVolumeCode>('S')
  const [fragility, setFragility] = useState<EscrowFragilityCode>('F1')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  // 이미지
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── preview (debounce 300ms, 필수 필드 모두 채워졌을 때만) ──
  const preview = useEscrowPreview()
  const previewBody = useMemo(() => {
    if (!itemPrice || !pickupLat || !pickupLng || !deliveryLat || !deliveryLng) return null
    return {
      tradeMode: 'INTERNAL' as const,
      itemPrice,
      pickupLat, pickupLng,
      deliveryLat, deliveryLng,
      weight, fragility,
      feePayer,
    }
  }, [itemPrice, pickupLat, pickupLng, deliveryLat, deliveryLng, weight, fragility, feePayer])

  useEffect(() => {
    if (!previewBody) return
    const t = setTimeout(() => {
      preview.mutate(previewBody)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewBody])

  const previewData = preview.data

  // ── 제출 ──
  const create = useCreateInternalEscrowApplication()

  const handleSubmit = async () => {
    if (!chatRoomId || !itemId) {
      toast.error('잘못된 진입이에요. 채팅방에서 다시 시작해 주세요.')
      return
    }
    if (!itemPrice || itemPrice <= 0) {
      toast.error('물품 가격을 입력해 주세요.')
      return
    }
    if (!itemDescription.trim()) {
      toast.error('물품 설명을 입력해 주세요.')
      return
    }
    if (!pickupAddress || pickupLat == null || pickupLng == null) {
      toast.error('픽업 주소를 검색해 주세요.')
      return
    }
    if (!deliveryAddress || deliveryLat == null || deliveryLng == null) {
      toast.error('배달 주소를 검색해 주세요.')
      return
    }
    if (imageFiles.length === 0) {
      toast.error('물품 사진을 1장 이상 등록해 주세요.')
      return
    }
    if (!previewData) {
      toast.error('수수료 미리보기가 아직 안 떴어요. 잠시 후 다시 시도해 주세요.')
      return
    }

    try {
      const uploaded = await uploadImages('ESCROW', imageFiles)
      const imageUrls = uploaded.map((u) => u.getUrl)

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
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        weight,
        volume,
        fragility,
        deliveryNotes: deliveryNotes.trim() || undefined,
        submittedDeliveryFee:   previewData.deliveryFee,
        submittedCommissionFee: previewData.commissionFee,
        submittedTotalFee:      previewData.totalFee,
        submittedDistanceKm:    previewData.distanceKm,
        imageUrls,
      })
      navigate(`/escrow/list?highlight=${app.id}`)
    } catch (err) {
      if (err instanceof BusinessError) {
        toast.error(err.message)
      } else if (err instanceof Error) {
        toast.error(err.message)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full pb-24">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-gray-400 hover:text-gray-600"
          aria-label="뒤로"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">거래대행 신청 (내부)</h1>
      </div>

      <div className="flex flex-col gap-4">

        {/* 수수료 부담 */}
        <Section title="수수료 부담">
          <div className="grid grid-cols-3 gap-2">
            {FEE_PAYER_OPTIONS.map((o) => (
              <button
                key={o.code}
                type="button"
                onClick={() => setFeePayer(o.code)}
                className={chip(feePayer === o.code)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Section>

        {/* 물품 가격 / 설명 */}
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
              placeholder="예: 맥북 프로 13인치 2020 — 정상 작동"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
            />
          </div>
        </Section>

        {/* 주소 */}
        <Section title="픽업·배달 주소">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setAddressTarget('pickup')}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-left flex items-center gap-2 hover:border-primary-400"
            >
              <MapPin size={14} className="text-gray-400" />
              <span className={pickupAddress ? 'text-gray-700 truncate' : 'text-gray-400'}>
                {pickupAddress || '픽업 주소 검색'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAddressTarget('delivery')}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-left flex items-center gap-2 hover:border-primary-400"
            >
              <MapPin size={14} className="text-gray-400" />
              <span className={deliveryAddress ? 'text-gray-700 truncate' : 'text-gray-400'}>
                {deliveryAddress || '배달 주소 검색'}
              </span>
            </button>
          </div>
        </Section>

        {/* 옵션 */}
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

        {/* 메모 */}
        <Section title="배달 메모 (선택)">
          <textarea
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            rows={2}
            placeholder="예: 부서지기 쉬워요. 세워서 배달 부탁드려요."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
          />
        </Section>

        {/* 이미지 */}
        <Section title={`사진 (${imageFiles.length}/${MAX_IMAGES})`}>
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

        {/* 미리보기 */}
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-primary-700 mb-2">수수료 미리보기</p>
          {previewData ? (
            <div className="space-y-1 text-sm">
              <Row label="거리"        value={`${previewData.distanceKm.toFixed(2)}km`} />
              <Row label="배달비"      value={`${previewData.deliveryFee.toLocaleString()}원`} />
              <Row label={`대행 수수료 (${(previewData.commissionRate * 100).toFixed(1)}%)`}
                   value={`${previewData.commissionFee.toLocaleString()}원`} />
              <hr className="my-2 border-primary-200" />
              <Row label="총 청구액" value={`${previewData.totalFee.toLocaleString()}원`} bold />
              <Row label="구매자 부담"  value={`${previewData.buyerPayable.toLocaleString()}원`} />
              <Row label="판매자 부담"  value={`${previewData.sellerPayable.toLocaleString()}원`} />
            </div>
          ) : (
            <p className="text-xs text-primary-700/70">
              물품 가격 + 픽업·배달 주소 + 옵션 입력 후 자동 계산돼요.
            </p>
          )}
        </div>

        {/* 제출 */}
        <Button
          onClick={handleSubmit}
          isLoading={create.isPending}
          disabled={!previewData}
          fullWidth
        >
          {previewData ? `${previewData.totalFee.toLocaleString()}원 거래대행 신청` : '신청'}
        </Button>
      </div>

      {/* 주소 검색 모달 */}
      <KakaoAddressSearch
        open={addressTarget != null}
        onClose={() => setAddressTarget(null)}
        onSelect={(r) => {
          if (addressTarget === 'pickup') {
            setPickupAddress(r.address || r.region)
            setPickupLat(r.lat); setPickupLng(r.lng)
          } else if (addressTarget === 'delivery') {
            setDeliveryAddress(r.address || r.region)
            setDeliveryLat(r.lat); setDeliveryLng(r.lng)
          }
          setAddressTarget(null)
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

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-primary-700/80">{label}</span>
      <span className={cn(bold ? 'font-bold text-primary-900' : 'text-primary-900')}>{value}</span>
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
