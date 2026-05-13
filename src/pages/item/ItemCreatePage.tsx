// 물품 등록 페이지 — 라운드13 PR #118 + PR-G 정합
//
// 라운드13 변경:
//   - tradeType (단일) → tradeTypes (다중) — 칩 다중 토글
//   - 판매·대여 동시 등록 가능. 모드별 가격 입력 섹션 노출.
//   - 보증금 단위 토글 (AMOUNT / PERCENT). PERCENT 면 환산 미리보기.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X, MapPin, LocateFixed } from 'lucide-react'
import { toast } from 'sonner'
import {
  itemCreateSchema,
  type ItemCreateRequest,
  type TradeType,
  type RentalUnit,
  type DepositType,
} from '@/features/item/types'
import { useCreateItem, useUploadImages } from '@/features/item/hooks'
import { useEmailGuard } from '@/features/auth/emailGuard'
import CategoryPicker from '@/features/category/CategoryPicker'
import KakaoAddressSearch from '@/shared/ui/KakaoAddressSearch'
import { reverseGeocodeCurrentPosition } from '@/shared/lib/kakaoMap'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/lib/cn'

const TRADE_TYPES: TradeType[] = ['판매', '대여', '나눔']
const RENTAL_UNITS: RentalUnit[] = ['시간', '일', '주', '월']
const MAX_IMAGES = 10

type FormValues = ItemCreateRequest

export default function ItemCreatePage() {
  const navigate = useNavigate()
  const { isVerified } = useEmailGuard()
  const { mutateAsync: uploadImagesAsync, isPending: isUploading } = useUploadImages()
  const { mutateAsync: createItemAsync, isPending: isCreating } = useCreateItem()

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [addressOpen, setAddressOpen] = useState(false)
  const [locating, setLocating] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(itemCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      tradeTypes: ['판매'],
      depositType: 'AMOUNT',
      rentalUnit: '일',
      hashtags: [],
    },
  })

  const tradeTypes = watch('tradeTypes')
  const hasSale  = tradeTypes.includes('판매')
  const hasRent  = tradeTypes.includes('대여')
  const hasShare = tradeTypes.includes('나눔')
  const rentalPrice = Number(watch('rentalPrice')) || 0
  const depositType = watch('depositType') ?? 'AMOUNT'

  const toggleTradeType = (t: TradeType) => {
    let next: TradeType[]
    if (t === '나눔') {
      // 나눔은 단독. 켜면 다른 모드 해제, 끄면 빈 배열.
      next = tradeTypes.includes('나눔') ? [] : ['나눔']
    } else {
      // 판매/대여 토글. 나눔이 있으면 자동 해제.
      const withoutShare = tradeTypes.filter((x) => x !== '나눔')
      next = withoutShare.includes(t)
        ? withoutShare.filter((x) => x !== t)
        : [...withoutShare, t]
    }
    setValue('tradeTypes', next, { shouldValidate: true })
    // 모드 해제 시 관련 필드 초기화
    if (!next.includes('판매')) setValue('salePrice', undefined)
    if (!next.includes('대여')) {
      setValue('rentalPrice', undefined)
      setValue('deposit', undefined)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (imageFiles.length + files.length > MAX_IMAGES) {
      toast.error(`사진은 최대 ${MAX_IMAGES}장까지 가능해요.`)
      return
    }
    setImageFiles((prev) => [...prev, ...files])
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: FormValues) => {
    if (!isVerified) {
      toast.error('이메일 인증 후 물품을 등록할 수 있어요.')
      return
    }
    if (imageFiles.length === 0) {
      toast.error('이미지를 1장 이상 등록해 주세요.')
      return
    }

    try {
      const imageUrls = await uploadImagesAsync(imageFiles)

      const body: ItemCreateRequest = {
        title: data.title,
        description: data.description,
        tradeTypes: data.tradeTypes,
        categoryId: data.categoryId,
        region: data.region || undefined,
        hashtags: data.hashtags,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        // 모드별 — 백엔드가 모드 미포함 시 무시
        salePrice:   data.tradeTypes.includes('판매') ? data.salePrice   : undefined,
        rentalPrice: data.tradeTypes.includes('대여') ? data.rentalPrice : undefined,
        rentalUnit:  data.tradeTypes.includes('대여') ? data.rentalUnit  : undefined,
        deposit:     data.tradeTypes.includes('대여') ? data.deposit     : undefined,
        depositType: data.tradeTypes.includes('대여') ? data.depositType : undefined,
      }

      await createItemAsync(body)
      navigate('/items')
    } catch {
      // 토스트는 hook 에서
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-2xl mx-auto w-full">
      <h1 className="text-xl font-bold">상품 등록</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* 사진 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            사진 ({imageFiles.length}/{MAX_IMAGES})
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {imageFiles.map((file, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
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
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Plus className="text-gray-400" size={24} />
              </label>
            )}
          </div>
        </div>

        {/* 제목 */}
        <Input label="제목" error={errors.title?.message} {...register('title')} />

        {/* 거래 방식 — 다중 토글 칩 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            거래 방식 {hasShare && <span className="text-xs text-gray-400">(나눔은 단독 선택)</span>}
          </label>
          <div className="flex gap-2">
            {TRADE_TYPES.map((t) => {
              const active = tradeTypes.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTradeType(t)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                    active
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-primary-300',
                  )}
                >
                  {t}
                </button>
              )
            })}
          </div>
          {errors.tradeTypes && (
            <p className="text-xs text-red-500">{errors.tradeTypes.message as string}</p>
          )}
        </div>

        {/* 판매 가격 */}
        {hasSale && (
          <Input
            label="판매 가격"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault() }}
            error={errors.salePrice?.message}
            {...register('salePrice', { valueAsNumber: true, min: 0 })}
          />
        )}

        {/* 대여 옵션 — 단가/단위/보증금 */}
        {hasRent && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 flex flex-col gap-3">
            <p className="text-xs font-semibold text-blue-700">대여 옵션</p>
            <Input
              label="대여 단가"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="0"
              onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault() }}
              error={errors.rentalPrice?.message}
              {...register('rentalPrice', { valueAsNumber: true, min: 0 })}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">대여 단위</label>
              <select
                {...register('rentalUnit')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {RENTAL_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              {errors.rentalUnit && (
                <p className="text-xs text-red-500">{errors.rentalUnit.message as string}</p>
              )}
            </div>

            <DepositField
              type={depositType}
              value={watch('deposit')}
              rentalPrice={rentalPrice}
              error={errors.deposit?.message}
              onTypeChange={(t) => {
                setValue('depositType', t, { shouldValidate: true })
                setValue('deposit', undefined)
              }}
              onValueChange={(n) => setValue('deposit', n, { shouldValidate: true })}
            />
          </div>
        )}

        {/* 카테고리 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">카테고리</label>
          <CategoryPicker
            value={watch('categoryId')}
            onChange={(id) => setValue('categoryId', id, { shouldValidate: true })}
          />
          {errors.categoryId && (
            <p className="text-xs text-red-500">{errors.categoryId.message}</p>
          )}
        </div>

        {/* 거래 희망 지역 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">거래 희망 지역</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddressOpen(true)}
              className="flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm text-left flex items-center gap-2 hover:border-primary-400"
            >
              <MapPin size={14} className="text-gray-400" />
              <span className={watch('region') ? 'text-gray-700 truncate' : 'text-gray-400'}>
                {watch('region') || '주소 검색'}
              </span>
            </button>
            <button
              type="button"
              onClick={async () => {
                setLocating(true)
                try {
                  const addr = await reverseGeocodeCurrentPosition()
                  setValue('region', addr, { shouldValidate: true })
                  toast.success('현재 위치를 입력했어요.')
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : '현재 위치를 가져오지 못했어요.')
                } finally {
                  setLocating(false)
                }
              }}
              disabled={locating}
              className="shrink-0 h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-primary-400 disabled:opacity-50 inline-flex items-center gap-1.5"
              aria-label="현재 위치"
            >
              <LocateFixed size={14} />
              <span className="hidden sm:inline">{locating ? '위치 확인 중' : '현재 위치'}</span>
            </button>
          </div>
        </div>

        <KakaoAddressSearch
          open={addressOpen}
          onClose={() => setAddressOpen(false)}
          onSelect={(r) => {
            setValue('region', r.address || r.region, { shouldValidate: true })
            setAddressOpen(false)
          }}
        />

        {/* 상세 설명 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">상세 설명</label>
          <textarea
            className="h-32 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
            placeholder="상품에 대한 설명을 10자 이상 입력해 주세요"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* 해시태그 */}
        <Input
          label="해시태그 (콤마로 구분, 최대 5개)"
          placeholder="아이폰, 미개봉"
          onBlur={(e) => {
            const tags = e.target.value
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .slice(0, 5)
            setValue('hashtags', tags, { shouldValidate: true })
          }}
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isUploading || isCreating}
          disabled={!isVerified || imageFiles.length === 0}
        >
          {!isVerified
            ? '이메일 인증 후 등록 가능'
            : imageFiles.length === 0
            ? '이미지 1장 이상 등록해 주세요'
            : '등록하기'}
        </Button>
      </form>
    </div>
  )
}

// 보증금 입력 — 원/% 토글. 백엔드로 raw 값 + depositType 그대로 전송.
//   PERCENT 면 환산 미리보기: Math.ceil(rentalPrice × pct / 100)
function DepositField({
  type, value, rentalPrice, error, onTypeChange, onValueChange,
}: {
  type: DepositType
  value: number | undefined
  rentalPrice: number
  error?: string
  onTypeChange: (t: DepositType) => void
  onValueChange: (n: number | undefined) => void
}) {
  const computed = (() => {
    if (type !== 'PERCENT' || value == null) return null
    if (rentalPrice <= 0) return null
    return Math.ceil(rentalPrice * Math.min(value, 100) / 100)
  })()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">보증금</label>
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => onTypeChange('AMOUNT')}
            className={type === 'AMOUNT'
              ? 'px-3 py-1 bg-primary-500 text-white'
              : 'px-3 py-1 text-gray-600 hover:bg-gray-50 bg-white'}
          >
            원
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('PERCENT')}
            className={type === 'PERCENT'
              ? 'px-3 py-1 bg-primary-500 text-white'
              : 'px-3 py-1 text-gray-600 hover:bg-gray-50 bg-white'}
          >
            %
          </button>
        </div>
      </div>
      <div className="relative">
        <input
          type="number"
          min={0}
          max={type === 'PERCENT' ? 100 : undefined}
          inputMode="numeric"
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') { onValueChange(undefined); return }
            const n = Number(raw)
            if (!Number.isFinite(n)) { onValueChange(undefined); return }
            onValueChange(Math.floor(n))
          }}
          onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault() }}
          placeholder={type === 'PERCENT' ? '예: 10' : '0'}
          className="w-full h-10 rounded-lg border border-gray-300 px-3 pr-10 text-sm outline-none focus:border-primary-500 bg-white"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          {type === 'PERCENT' ? '%' : '원'}
        </span>
      </div>
      {type === 'PERCENT' && (
        <p className="text-[11px] text-gray-500">
          {computed != null
            ? `대여가 ${rentalPrice.toLocaleString()}원 × ${value}% = ${computed.toLocaleString()}원 (거래 시 환산)`
            : '대여가에 곱해서 보증금이 환산돼요.'}
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
