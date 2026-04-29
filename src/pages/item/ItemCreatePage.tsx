import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { itemCreateSchema, type ItemCreateRequest } from '@/features/item/types'
import { useCreateItem, useUploadImages } from '@/features/item/hooks'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export default function ItemCreatePage() {
  const navigate = useNavigate()
  const { mutateAsync: uploadImages, isPending: isUploading } = useUploadImages()
  const { mutate: createItem, isPending: isCreating } = useCreateItem()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ItemCreateRequest>({
    resolver: zodResolver(itemCreateSchema),
    defaultValues: { itemType: 'SELL', hashtags: [], price: 0 },
  })

  const onSubmit = async (data: Omit<ItemCreateRequest, 'imageKeys'>) => {
    // TODO: 이미지 파일 업로드 후 imageKeys 전달
    createItem({ ...data, imageKeys: [] })
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <h1 className="text-xl font-bold">상품 등록</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* TODO: 이미지 업로드 (react-dropzone) */}
        <div className="h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
          사진 추가 (최대 10장)
        </div>

        <Input label="제목" error={errors.title?.message} {...register('title')} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">거래 방식</label>
          <Controller
            name="itemType"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2">
                {(['SELL', 'RENT', 'SHARE'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => field.onChange(type)}
                    className={`flex-1 py-2 text-sm rounded-lg border ${
                      field.value === type
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    {{ SELL: '판매', RENT: '대여', SHARE: '나눔' }[type]}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <Input
          label="가격"
          type="number"
          error={errors.price?.message}
          {...register('price', { valueAsNumber: true })}
        />

        <Input label="카테고리" error={errors.category?.message} {...register('category')} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">상세 설명</label>
          <textarea
            className="h-32 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
            placeholder="상품에 대한 설명을 입력해 주세요"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 max-w-screen-md mx-auto">
          <Button
            type="submit"
            fullWidth
            isLoading={isUploading || isCreating}
          >
            등록하기
          </Button>
        </div>
      </form>
    </div>
  )
}
