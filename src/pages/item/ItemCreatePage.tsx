import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { itemCreateSchema, type ItemCreateRequest } from '@/features/item/types'
import { useCreateItem, useUploadImages } from '@/features/item/hooks'
import { Search, X, Plus, MapPin } from 'lucide-react'

type ItemFormValues = Omit<ItemCreateRequest, 'imageKeys'>
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export default function ItemCreatePage() {
  const navigate = useNavigate()
  const { isPending: isUploading } = useUploadImages()
  const { mutate: createItem, isPending: isCreating } = useCreateItem()
  
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [categorySearch, setCategorySearch] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<{id: number, name: string} | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{name: string, lat: number, lng: number} | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemCreateSchema),
    defaultValues: { 
      hashtags: [], 
      sellPrice: 0, 
      rentPrice: 0,
      depositRate: 0,
      categoryId: 0,
      categoryName: '',
      locationName: '',
      locationLat: 0,
      locationLng: 0,
      imageFiles: []
    },
  })

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (imageFiles.length + files.length > 10) {
      alert('사진은 최대 10장까지 가능합니다.')
      return
    }
    setImageFiles(prev => [...prev, ...files])
    setValue('imageFiles', [...imageFiles, ...files])
  }, [imageFiles, setValue])

  const removeImage = useCallback((index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index)
    setImageFiles(newFiles)
    setValue('imageFiles', newFiles)
  }, [imageFiles, setValue])

  const handleCategorySelect = useCallback((category: {id: number, name: string}) => {
    setSelectedCategory(category)
    setValue('categoryId', category.id)
    setValue('categoryName', category.name)
    setValue('category', category.name)
    setShowCategoryDropdown(false)
    setCategorySearch('')
  }, [setValue])

  const handleLocationSelect = useCallback((location: {name: string, lat: number, lng: number}) => {
    setSelectedLocation(location)
    setValue('locationName', location.name)
    setValue('locationLat', location.lat)
    setValue('locationLng', location.lng)
    setShowLocationDropdown(false)
    setLocationSearch('')
  }, [setValue])

  const onSubmit = async (data: ItemFormValues) => {
    // TODO: 이미지 파일 업로드 후 imageKeys 전달
    createItem({ ...data, imageKeys: [] })
    navigate('/')
  }

  // Mock categories data (실제로는 API 호출)
  const mockCategories = [
    { id: 1, name: '디지털 기기' },
    { id: 2, name: '생활가전' },
    { id: 3, name: '가구/인테리어' },
    { id: 4, name: '의류/잡화' },
    { id: 5, name: '뷰티/미용' },
    { id: 6, name: '스포츠/레저' },
    { id: 7, name: '자동차용품' },
    { id: 8, name: '도서/티켓' },
    { id: 9, name: '문구/오피스' },
    { id: 10, name: '식품' },
  ]

  const filteredCategories = mockCategories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  // Mock locations data (실제로는 지도 API 호출)
  const mockLocations = [
    { name: '서울 강남구', lat: 37.5172, lng: 127.0473 },
    { name: '서울 서초구', lat: 37.4837, lng: 127.0324 },
    { name: '서울 송파구', lat: 37.5146, lng: 127.1056 },
    { name: '서울 마포구', lat: 37.5663, lng: 126.9013 },
    { name: '서울 영등포구', lat: 37.5256, lng: 126.8948 },
  ]

  const filteredLocations = mockLocations.filter(loc => 
    loc.name.toLowerCase().includes(locationSearch.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4 pb-24">
      <h1 className="text-xl font-bold">상품 등록</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* 이미지 업로드 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">사진 ({imageFiles.length}/10)</label>
          <div className="grid grid-cols-3 gap-2">
            {imageFiles.map((file, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`이미지 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {imageFiles.length < 10 && (
              <label className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Plus className="text-gray-400" size={24} />
              </label>
            )}
          </div>
        </div>

        <Input label="제목" error={errors.title?.message} {...register('title')} />

        <Input
          label="판매금액"
          type="number"
          placeholder="0"
          helperText="판매할 경우에만 입력"
          error={errors.sellPrice?.message}
          {...register('sellPrice', { valueAsNumber: true })}
        />

        <Input
          label="대여금액"
          type="number"
          placeholder="0"
          helperText="대여할 경우에만 입력"
          error={errors.rentPrice?.message}
          {...register('rentPrice', { valueAsNumber: true })}
        />

        <Input
          label="보증금율 (%)"
          type="number"
          placeholder="0"
          step="1"
          min="0"
          max="100"
          helperText="대여 시 보증금 비율 (1% 단위)"
          error={errors.depositRate?.message}
          {...register('depositRate', { valueAsNumber: true })}
        />

        {/* 카테고리 검색 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">카테고리</label>
          <div className="relative">
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="카테고리 검색"
                value={categorySearch}
                onChange={(e) => {
                  setCategorySearch(e.target.value)
                  setShowCategoryDropdown(true)
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                className="flex-1 outline-none text-sm"
              />
            </div>
            
            {selectedCategory && (
              <div className="mt-2 p-2 bg-primary-50 text-primary-700 rounded-lg text-sm">
                선택된 카테고리: {selectedCategory.name}
              </div>
            )}

            {showCategoryDropdown && categorySearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {category.name}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            )}
          </div>
          {errors.categoryId && (
            <p className="text-xs text-red-500">{errors.categoryId.message}</p>
          )}
        </div>

        {/* 거래 희망 장소 검색 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">거래 희망 장소</label>
          <div className="relative">
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
              <MapPin size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="장소 검색"
                value={locationSearch}
                onChange={(e) => {
                  setLocationSearch(e.target.value)
                  setShowLocationDropdown(true)
                }}
                onFocus={() => setShowLocationDropdown(true)}
                className="flex-1 outline-none text-sm"
              />
            </div>
            
            {selectedLocation && (
              <div className="mt-2 p-2 bg-primary-50 text-primary-700 rounded-lg text-sm">
                선택된 장소: {selectedLocation.name}
              </div>
            )}

            {showLocationDropdown && locationSearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((location, index) => (
                    <div
                      key={index}
                      onClick={() => handleLocationSelect(location)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {location.name}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            )}
          </div>
          {errors.locationName && (
            <p className="text-xs text-red-500">{errors.locationName.message}</p>
          )}
        </div>

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
