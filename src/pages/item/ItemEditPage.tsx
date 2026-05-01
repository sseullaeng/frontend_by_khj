// 물품 수정 페이지 컴포넌트: 등록된 물품 정보 수정 기능 제공
import { useForm } from 'react-hook-form'  // React Hook Form 라이브러리
import { zodResolver } from '@hookform/resolvers/zod'  // Zod 리졸버
import { useNavigate, useParams } from 'react-router-dom'  // React Router 훅
import React, { useState, useCallback } from 'react'  // React 훅들
import { itemCreateSchema, type ItemCreateRequest } from '@/features/item/types'  // 물품 관련 타입
import { useItemDetail, useUpdateItem } from '@/features/item/hooks'  // 물품 관련 훅
import { Search, X, Plus, MapPin, ChevronLeft } from 'lucide-react'  // Lucide 아이콘들
import { Button } from '@/shared/ui/Button'  // 버튼 컴포넌트
import { Input } from '@/shared/ui/Input'  // 입력 필드 컴포넌트

// 폼 데이터 타입: 이미지 키를 제외한 물품 생성 요청 타입
type ItemFormValues = Omit<ItemCreateRequest, 'imageKeys'>

/**
 * 물품 수정 페이지 컴포넌트
 * 
 * 기능:
 * - 기존 물품 정보 불러오기
 * - 물품 정보 수정 폼 표시
 * - 이미지 업로드 및 관리
 * - 카테고리 및 위치 선택
 * - 수정 정보 API 전송
 * - 수정 완료 후 상세 페이지로 이동
 */
export default function ItemEditPage() {
  const { id } = useParams<{ id: string }>()  // URL 파라미터에서 물품 ID 추출
  const navigate = useNavigate()  // 페이지 네비게이션 함수
  const { data: item, isLoading } = useItemDetail(Number(id))  // 물품 상세 정보 조회
  const { mutate: updateItem, isPending: isUpdating } = useUpdateItem(Number(id))  // 물품 업데이트 훅

  // 로딩 중 상태 표시
  if (isLoading) return <div className="py-20 text-center text-gray-400">불러오는 중...</div>
  
  // 물품이 없을 경우 에러 메시지 표시
  if (!item) return <div className="py-20 text-center text-gray-400">상품을 찾을 수 없어요</div>

  // 수정 폼 컴포넌트 렌더링
  return <ItemEditForm item={item} onUpdate={updateItem} isUpdating={isUpdating} navigate={navigate} />
}

function ItemEditForm({
  item,
  onUpdate,
  isUpdating,
  navigate,
}: {
  item: NonNullable<ReturnType<typeof useItemDetail>['data']>
  onUpdate: ReturnType<typeof useUpdateItem>['mutate']
  isUpdating: boolean
  navigate: ReturnType<typeof useNavigate>
}) {
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [categorySearch, setCategorySearch] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<{ id: number; name: string } | null>(
    item.category ? { id: 0, name: item.category } : null
  )
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lng: number } | null>(null)
  const [rentalPeriod, setRentalPeriod] = useState('일')
  const [customRentalDate, setCustomRentalDate] = useState('')
  const [agreedToDamagePolicy, setAgreedToDamagePolicy] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemCreateSchema),
    defaultValues: {
      title: item.title,
      description: item.description,
      sellPrice: item.price,
      rentPrice: item.rentPrice,
      depositRate: 0,
      categoryId: 0,
      categoryName: item.category,
      category: item.category,
      locationName: '',
      locationLat: 0,
      locationLng: 0,
      hashtags: item.hashtags,
      imageFiles: [],
      isEscrow: item.isEscrow,
    },
  })

  const rentPrice = watch('rentPrice')
  const depositRate = watch('depositRate')
  const watchTitle = watch('title')
  const watchDescription = watch('description')

  const isFormValid =
    !!watchTitle && watchTitle.length > 0 &&
    !!selectedCategory &&
    !!watchDescription && watchDescription.length >= 10

  const calculateDeposit = () => {
    if (rentPrice > 0 && depositRate > 0) {
      let multiplier = 1
      if (rentalPeriod === '주') multiplier = 7
      else if (rentalPeriod === '월') multiplier = 30
      else if (rentalPeriod === '날짜지정') {
        const days = parseInt(customRentalDate) || 1
        multiplier = days
      }
      return rentPrice * multiplier * (depositRate / 100)
    }
    return 0
  }

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

  const handleCategorySelect = useCallback((category: { id: number; name: string }) => {
    setSelectedCategory(category)
    setValue('categoryId', category.id)
    setValue('categoryName', category.name)
    setValue('category', category.name)
    setShowCategoryDropdown(false)
    setCategorySearch('')
  }, [setValue])

  const handleLocationSelect = useCallback((location: { name: string; lat: number; lng: number }) => {
    setSelectedLocation(location)
    setValue('locationName', location.name)
    setValue('locationLat', location.lat)
    setValue('locationLng', location.lng)
    setShowLocationDropdown(false)
    setLocationSearch('')
  }, [setValue])

  const onSubmit = (data: ItemFormValues) => {
    onUpdate({ ...data, imageKeys: [] }, {
      onSuccess: () => navigate(`/items/${item.id}`),
    })
  }

  const mockCategories = [
    { id: 1, name: '디지털 기기' }, { id: 2, name: '생활가전' },
    { id: 3, name: '가구/인테리어' }, { id: 4, name: '의류/잡화' },
    { id: 5, name: '뷰티/미용' }, { id: 6, name: '스포츠/레저' },
    { id: 7, name: '자동차용품' }, { id: 8, name: '도서/티켓' },
    { id: 9, name: '문구/오피스' }, { id: 10, name: '식품' },
  ]
  const filteredCategories = mockCategories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

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
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">상품 수정</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* 기존 이미지 */}
        {item.imageUrls.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">등록된 사진</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {item.imageUrls.map((url, i) => (
                <div key={i} className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 이미지 추가 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">사진 추가 ({imageFiles.length}/10)</label>
          <div className="flex gap-2 flex-wrap">
            {imageFiles.map((file, index) => (
              <div key={index} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                <img src={URL.createObjectURL(file)} alt={`이미지 ${index + 1}`} className="w-full h-full object-cover" />
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
              <label className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200">
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
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
          {...register('sellPrice', { valueAsNumber: true, min: 0 })}
        />

        <Input
          label="대여금액"
          type="number"
          placeholder="0"
          helperText="대여할 경우에만 입력"
          error={errors.rentPrice?.message}
          {...register('rentPrice', { valueAsNumber: true, min: 0 })}
        />

        {/* 거래대행 사용 여부 */}
        <div className="flex items-start gap-3 p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg">
          <input
            type="checkbox"
            id="isEscrow"
            {...register('isEscrow')}
            className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <div>
            <label htmlFor="isEscrow" className="text-sm font-medium text-indigo-900 cursor-pointer">
              거래대행 사용
            </label>
            <p className="text-xs text-indigo-600 mt-0.5">쓸랭이 중간에서 안전하게 거래를 도와드려요</p>
          </div>
        </div>

        {/* 대여 기간 선택 */}
        {rentPrice > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">대여 기간</label>
            <div className="flex gap-2">
              <select
                value={rentalPeriod}
                onChange={(e) => setRentalPeriod(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500"
              >
                <option value="일">일</option>
                <option value="주">주</option>
                <option value="월">월</option>
                <option value="날짜지정">날짜지정</option>
              </select>
              {rentalPeriod === '날짜지정' && (
                <input
                  type="number"
                  placeholder="며칠"
                  value={customRentalDate}
                  onChange={(e) => setCustomRentalDate(e.target.value)}
                  min="1"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500"
                />
              )}
            </div>
          </div>
        )}

        <Input
          label="보증금율 (%)"
          type="number"
          placeholder="0"
          step="1"
          min="0"
          max="100"
          helperText="대여 시 보증금 비율"
          error={errors.depositRate?.message}
          {...register('depositRate', { valueAsNumber: true })}
        />

        {rentPrice > 0 && depositRate > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              보증금: {calculateDeposit().toLocaleString()}원
            </p>
          </div>
        )}

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
                onChange={(e) => { setCategorySearch(e.target.value); setShowCategoryDropdown(true) }}
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
                    <div key={category.id} onClick={() => handleCategorySelect(category)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                      {category.name}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm">검색 결과가 없습니다</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 거래 희망 장소 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">거래 희망 장소</label>
          <div className="relative">
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
              <MapPin size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="장소 검색"
                value={locationSearch}
                onChange={(e) => { setLocationSearch(e.target.value); setShowLocationDropdown(true) }}
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
                    <div key={index} onClick={() => handleLocationSelect(location)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                      {location.name}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm">검색 결과가 없습니다</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 상세 설명 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">상세 설명</label>
          <textarea
            className="h-32 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
            placeholder="상품에 대한 설명을 입력해 주세요 (최소 10자)"
            {...register('description')}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        {/* 대여 파손/고장 보증금 청구 동의 */}
        {rentPrice > 0 && (
          <div className="space-y-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToDamagePolicy}
                onChange={(e) => setAgreedToDamagePolicy(e.target.checked)}
                className="mt-1 w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-orange-900 leading-relaxed">
                대여로 인한 파손, 고장 등 발생시 보증금을 청구할 수 있습니다.
              </span>
            </label>
          </div>
        )}

        {/* 수정 완료 버튼 */}
        <Button
          type="submit"
          fullWidth
          isLoading={isUpdating}
          disabled={!isFormValid || (rentPrice > 0 && !agreedToDamagePolicy)}
        >
          수정 완료
        </Button>
      </form>
    </div>
  )
}
