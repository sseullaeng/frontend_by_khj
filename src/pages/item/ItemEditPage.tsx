// 물품 수정 페이지 — PR #66 정합 단순화 폼
//
// 백엔드 정책 (가이드 §6 - 4번):
//   - tradeType 변경 불가 (등록 시점 고정)
//   - title/description/price 필수
//   - imageUrls non-null = 전체 교체, null/생략 = 유지
//   - hashtags 동일
//
// 이미지 부분 갱신 endpoint (POST/DELETE/PATCH /items/{id}/images) 는
// 5/4 PR 머지 후 분리 적용 예정. 현재는 전체 교체 또는 유지로 처리.

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Plus, X, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useItemDetail, useUpdateItem, useUploadImages } from '@/features/item/hooks'
import { useEmailGuard } from '@/features/auth/emailGuard'
import CategoryPicker from '@/features/category/CategoryPicker'
import KakaoAddressSearch from '@/shared/ui/KakaoAddressSearch'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { MapPin, LocateFixed } from 'lucide-react'
import { reverseGeocodeCurrentPosition } from '@/shared/lib/kakaoMap'
import type { ItemUpdateRequest, RentalUnit } from '@/features/item/types'

const RENTAL_UNITS: RentalUnit[] = ['시간', '일', '주', '월']
const MAX_IMAGES = 5

interface FormValues {
  title: string
  description: string
  price: number
  categoryId?: number
  region?: string
  hashtagsText?: string
  deposit?: number
  rentalUnit?: RentalUnit
}

export default function ItemEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const itemId = Number(id)

  const { data: item, isLoading } = useItemDetail(itemId)
  const { isVerified } = useEmailGuard()
  const { mutateAsync: updateItemAsync, isPending: isUpdating } = useUpdateItem(itemId)
  const { mutateAsync: uploadImagesAsync, isPending: isUploading } = useUploadImages()

  // 새로 추가할 이미지(File) — 비어있으면 imageUrls 미포함 (기존 유지)
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  // 기존 이미지 URL 유지/삭제 결정 — 사용자가 ✕ 누르면 제외
  const [keepImageUrls, setKeepImageUrls] = useState<string[]>([])
  const [addressOpen, setAddressOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [imagesEdited, setImagesEdited] = useState(false)  // 한 번이라도 수정했나

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>()

  // 상세 로드되면 폼 초기화
  useEffect(() => {
    if (!item) return
    setValue('title', item.title)
    setValue('description', item.description)
    setValue('price', item.price)
    setValue('categoryId', item.categoryId ?? undefined)
    setValue('region', item.region ?? '')
    setValue('hashtagsText', item.hashtags.join(', '))
    setValue('deposit', item.deposit ?? undefined)
    setValue('rentalUnit', item.rentalUnit ?? undefined)
    setKeepImageUrls(item.images.map((i) => i.imageUrl))
  }, [item, setValue])

  if (isLoading) return <div className="py-20 text-center text-gray-400">불러오는 중...</div>
  if (!item) return <div className="py-20 text-center text-gray-400">상품을 찾을 수 없어요</div>

  const isRental = item.tradeType === '대여'
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

  const watchPrice = watch('price')

  const onSubmit = async (data: FormValues) => {
    if (!isVerified) {
      toast.error('이메일 인증 후 수정할 수 있어요.')
      return
    }

    try {
      // 이미지: 한 번이라도 수정했으면 전체 교체, 아니면 미포함 (유지)
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
        price: data.price,
        categoryId: data.categoryId,
        region: data.region || undefined,
        hashtags,
        imageUrls,
        ...(isRental && data.deposit != null ? { deposit: data.deposit } : {}),
        ...(isRental && data.rentalUnit ? { rentalUnit: data.rentalUnit } : {}),
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
        <span className="ml-auto text-xs text-gray-400">거래 유형: {item.tradeType} (변경 불가)</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* 사진 — 기존 + 신규 */}
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

        {item.tradeType !== '나눔' && (
          <Input
            label={isRental ? '대여 단가' : '판매 가격'}
            type="number"
            min={0}
            inputMode="numeric"
            onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault() }}
            error={errors.price?.message}
            {...register('price', { valueAsNumber: true, min: 0, required: true })}
          />
        )}

        {isRental && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">대여 단위</label>
              <select
                {...register('rentalUnit')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
              onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault() }}
              {...register('deposit', { valueAsNumber: true, min: 0 })}
            />
          </>
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
          disabled={!isVerified || !watchPrice && item.tradeType !== '나눔'}
        >
          수정 완료
        </Button>
      </form>
    </div>
  )
}
