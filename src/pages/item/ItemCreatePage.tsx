// 물품 등록 페이지 — PR #66 정합 단순화 폼
//
// ⚠️ 카테고리·지역은 mock/텍스트 입력으로 임시 처리. 향후:
//   - 카테고리: GET /api/v1/categories 트리 dropdown
//   - 지역: 카카오 주소검색 SDK 결과를 region 텍스트로 저장

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { itemCreateSchema, type ItemCreateRequest, type TradeType, type RentalUnit } from '@/features/item/types'
import { useCreateItem, useUploadImages } from '@/features/item/hooks'
import { useEmailGuard } from '@/features/auth/emailGuard'
import CategoryPicker from '@/features/category/CategoryPicker'
import KakaoAddressSearch from '@/shared/ui/KakaoAddressSearch'
import { reverseGeocodeCurrentPosition } from '@/shared/lib/kakaoMap'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { MapPin, LocateFixed } from 'lucide-react'

const TRADE_TYPES: TradeType[] = ['판매', '대여', '나눔']
const RENTAL_UNITS: RentalUnit[] = ['시간', '일', '주', '월']
const MAX_IMAGES = 5

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
      price: 0,
      tradeType: '판매',
      hashtags: [],
    },
  })

  const tradeType = watch('tradeType')
  const isRental = tradeType === '대여'
  const isShare = tradeType === '나눔'

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
    // 백엔드 정책: 이미지 1장 이상 필수
    if (imageFiles.length === 0) {
      toast.error('이미지를 1장 이상 등록해 주세요.')
      return
    }
    // 나눔이면 price=0 강제
    const price = isShare ? 0 : data.price

    try {
      const imageUrls = await uploadImagesAsync(imageFiles)

      const body: ItemCreateRequest = {
        title: data.title,
        description: data.description,
        price,
        tradeType: data.tradeType,
        region: data.region || undefined,
        hashtags: data.hashtags,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        // 대여만
        ...(isRental && data.deposit != null ? { deposit: data.deposit } : {}),
        ...(isRental && data.rentalUnit ? { rentalUnit: data.rentalUnit } : {}),
      }

      await createItemAsync(body)
      navigate('/items')
    } catch {
      // 토스트는 hook 에서
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <h1 className="text-xl font-bold">상품 등록</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* 사진 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            사진 ({imageFiles.length}/{MAX_IMAGES})
          </label>
          <div className="grid grid-cols-5 gap-2">
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

        {/* 거래 유형 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">거래 유형</label>
          <div className="flex gap-2">
            {TRADE_TYPES.map((t) => (
              <label key={t} className="flex-1">
                <input type="radio" value={t} {...register('tradeType')} className="sr-only peer" />
                <div className="text-center py-2 border border-gray-300 rounded-lg text-sm cursor-pointer peer-checked:bg-primary-500 peer-checked:text-white peer-checked:border-primary-500 transition-colors">
                  {t}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 가격 (나눔이 아닐 때만) — 음수/지수 입력 차단 */}
        {!isShare && (
          <Input
            label={isRental ? '대여 단가' : '판매 가격'}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault() }}
            error={errors.price?.message}
            {...register('price', { valueAsNumber: true, min: 0 })}
          />
        )}

        {/* 대여 옵션 */}
        {isRental && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">대여 단위</label>
              <select
                {...register('rentalUnit')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                defaultValue="일"
              >
                {RENTAL_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="보증금 (원)"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="0"
              onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault() }}
              {...register('deposit', { valueAsNumber: true, min: 0 })}
            />
          </>
        )}

        {/* 카테고리 — GET /api/v1/categories 트리 dropdown */}
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

        {/* 거래 희망 지역 — 카카오 주소 검색 + 현재 위치 */}
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
            // 표시·저장 모두 풀 주소(도로명 우선) 로 — 시도+시군구 만 보이면 거래 위치를 알기 어려움.
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

        {/* 해시태그 — 콤마 구분 입력 → 배열 변환 */}
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
