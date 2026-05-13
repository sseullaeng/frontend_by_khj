// 물품 수정 페이지 — 라운드13 PR #118 + PR-G 정합
//
// 라운드13 변경:
//   - tradeTypes (다중) 수정 가능 — 칩 토글
//   - 판매·대여 동시 가능. 모드별 가격 입력 섹션 노출.
//   - 보증금 단위 토글 (AMOUNT / PERCENT). PERCENT 면 환산 미리보기.
//
// 이미지: 한 번이라도 수정하면 imageUrls 전체 교체. 미수정이면 미포함(유지).

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Plus, X, ChevronLeft, MapPin, LocateFixed } from 'lucide-react'
import { toast } from 'sonner'
import { useItemDetail, useUpdateItem, useUploadImages } from '@/features/item/hooks'
import { useEmailGuard } from '@/features/auth/emailGuard'
import CategoryPicker from '@/features/category/CategoryPicker'
import KakaoAddressSearch from '@/shared/ui/KakaoAddressSearch'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { reverseGeocodeCurrentPosition } from '@/shared/lib/kakaoMap'
import type {
  ItemUpdateRequest,
  RentalUnit,
  TradeType,
  DepositType,
} from '@/features/item/types'
import { cn } from '@/shared/lib/cn'

const TRADE_TYPES: TradeType[] = ['판매', '대여', '나눔']
const RENTAL_UNITS: RentalUnit[] = ['시간', '일', '주', '월']
const MAX_IMAGES = 10

interface FormValues {
  title: string
  description: string
  tradeTypes: TradeType[]
  categoryId?: number
  region?: string
  hashtagsText?: string
  salePrice?: number
  rentalPrice?: number
  rentalUnit?: RentalUnit
  deposit?: number
  depositType?: DepositType
}

export default function ItemEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const itemId = Number(id)

  const { data: item, isLoading } = useItemDetail(itemId)
  const { isVerified } = useEmailGuard()
  const { mutateAsync: updateItemAsync, isPending: isUpdating } = useUpdateItem(itemId)
  const { mutateAsync: uploadImagesAsync, isPending: isUploading } = useUploadImages()

  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [keepImageUrls, setKeepImageUrls] = useState<string[]>([])
  const [addressOpen, setAddressOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [imagesEdited, setImagesEdited] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: { tradeTypes: [], depositType: 'AMOUNT', rentalUnit: '일' },
  })

  // 상세 로드 시 폼 초기화
  useEffect(() => {
    if (!item) return
    setValue('title', item.title)
    setValue('description', item.description)
    // legacy 단일 모드 응답도 처리 — tradeTypes 비어있으면 tradeType 으로 폴백
    setValue('tradeTypes', item.tradeTypes?.length ? item.tradeTypes : [item.tradeType])
    setValue('salePrice',   item.salePrice   ?? (item.tradeType === '판매' ? item.price : undefined))
    setValue('rentalPrice', item.rentalPrice ?? (item.tradeType === '대여' ? item.price : undefined))
    setValue('rentalUnit',  item.rentalUnit ?? '일')
    setValue('deposit',     item.deposit ?? undefined)
    setValue('depositType', item.depositType ?? 'AMOUNT')
    setValue('categoryId',  item.categoryId ?? undefined)
    setValue('region',      item.region ?? '')
    setValue('hashtagsText', item.hashtags.join(', '))
    setKeepImageUrls(item.images.map((i) => i.imageUrl))
  }, [item, setValue])

  if (isLoading) return <div className="py-20 text-center text-gray-400">불러오는 중...</div>
  if (!item) return <div className="py-20 text-center text-gray-400">상품을 찾을 수 없어요</div>

  const tradeTypes = watch('tradeTypes') ?? []
  const hasSale  = tradeTypes.includes('판매')
  const hasRent  = tradeTypes.includes('대여')
  const hasShare = tradeTypes.includes('나눔')
  const rentalPrice = Number(watch('rentalPrice')) || 0
  const depositType = watch('depositType') ?? 'AMOUNT'

  const toggleTradeType = (t: TradeType) => {
    let next: TradeType[]
    if (t === '나눔') {
      next = tradeTypes.includes('나눔') ? [] : ['나눔']
    } else {
      const withoutShare = tradeTypes.filter((x) => x !== '나눔')
      next = withoutShare.includes(t)
        ? withoutShare.filter((x) => x !== t)
        : [...withoutShare, t]
    }
    setValue('tradeTypes', next, { shouldValidate: true })
    if (!next.includes('판매')) setValue('salePrice', undefined)
    if (!next.includes('대여')) {
      setValue('rentalPrice', undefined)
      setValue('deposit', undefined)
    }
  }

  const totalImageCount = keepImageUrls.length + newImageFiles.length

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (totalImageCount + files.length > MAX_IMAGES) {
      toast.error(`사진은 최대 ${MAX_IMAGES}장까지 가능해요.`)
      return
    }
    setNewImageFiles((prev) => [...prev, ...files])
    setImagesEdited(true)
  }
  const removeKeepImage = (url: string) => {
    setKeepImageUrls((prev) => prev.filter((u) => u !== url))
    setImagesEdited(true)
  }
  const removeNewImage = (idx: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const onSubmit = async (data: FormValues) => {
    if (!isVerified) {
      toast.error('이메일 인증 후 수정할 수 있어요.')
      return
    }
    if (data.tradeTypes.length === 0) {
      toast.error('거래 방식을 1개 이상 선택해 주세요.')
      return
    }
    if (data.tradeTypes.includes('판매') && (data.salePrice == null || data.salePrice <= 0)) {
      toast.error('판매 가격을 입력해 주세요.')
      return
    }
    if (data.tradeTypes.includes('대여')) {
      if (data.rentalPrice == null || data.rentalPrice <= 0) {
        toast.error('대여 단가를 입력해 주세요.')
        return
      }
      if (data.deposit == null || !data.depositType) {
        toast.error('보증금을 입력해 주세요.')
        return
      }
      if (data.depositType === 'PERCENT' && (data.deposit < 1 || data.deposit > 100)) {
        toast.error('보증금 퍼센트는 1~100 사이로 입력해 주세요.')
        return
      }
    }

    try {
      let imageUrls: string[] | undefined = undefined
      if (imagesEdited) {
        const uploaded = newImageFiles.length > 0 ? await uploadImagesAsync(newImageFiles) : []
        imageUrls = [...keepImageUrls, ...uploaded]
      }

      const hashtags = data.hashtagsText
        ? data.hashtagsText.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 5)
        : undefined

      const body: ItemUpdateRequest = {
        title: data.title,
        description: data.description,
        tradeTypes: data.tradeTypes,
        categoryId: data.categoryId,
        region: data.region || undefined,
        hashtags,
        imageUrls,
        salePrice:   data.tradeTypes.includes('판매') ? data.salePrice   : undefined,
        rentalPrice: data.tradeTypes.includes('대여') ? data.rentalPrice : undefined,
        rentalUnit:  data.tradeTypes.includes('대여') ? data.rentalUnit  : undefined,
        deposit:     data.tradeTypes.includes('대여') ? data.deposit     : undefined,
        depositType: data.tradeTypes.includes('대여') ? data.depositType : undefined,
      }

      await updateItemAsync(body)
      navigate(`/items/${itemId}`)
    } catch {
      // 토스트는 hook 에서
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">상품 수정</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* 사진 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            사진 ({totalImageCount}/{MAX_IMAGES})
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {keepImageUrls.map((url) => (
              <div key={url} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeKeepImage(url)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                  aria-label="이미지 제거"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {newImageFiles.map((file, idx) => (
              <div key={`new-${idx}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                  aria-label="이미지 제거"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {totalImageCount < MAX_IMAGES && (
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

        <Input label="제목" error={errors.title?.message} {...register('title', { required: true })} />

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
            {...register('salePrice', { valueAsNumber: true, min: 0 })}
          />
        )}

        {/* 대여 옵션 */}
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
            </div>

            <DepositField
              type={depositType}
              value={watch('deposit')}
              rentalPrice={rentalPrice}
              onTypeChange={(t) => {
                setValue('depositType', t, { shouldValidate: true })
                setValue('deposit', undefined)
              }}
              onValueChange={(n) => setValue('deposit', n, { shouldValidate: true })}
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">카테고리</label>
          <CategoryPicker
            value={watch('categoryId')}
            onChange={(id) => setValue('categoryId', id, { shouldValidate: true })}
          />
        </div>

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

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">상세 설명</label>
          <textarea
            className="h-32 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
            {...register('description', { required: true })}
          />
        </div>

        <Input label="해시태그 (콤마 구분, 최대 5개)" {...register('hashtagsText')} />

        <Button
          type="submit"
          fullWidth
          isLoading={isUpdating || isUploading}
          disabled={!isVerified}
        >
          수정 완료
        </Button>
      </form>
    </div>
  )
}

function DepositField({
  type, value, rentalPrice, onTypeChange, onValueChange,
}: {
  type: DepositType
  value: number | undefined
  rentalPrice: number
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
    </div>
  )
}
