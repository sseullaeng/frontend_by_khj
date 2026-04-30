import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { escrowApplicationSchema, type EscrowApplicationRequest } from '@/features/escrow/types'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { MapPin, Upload, X } from 'lucide-react'

const MOCK_LOCATIONS = [
  { name: '서울 강남구 테헤란로', lat: 37.5665, lng: 126.9780 },
  { name: '서울 서초구 반포대로', lat: 37.5172, lng: 127.0473 },
  { name: '서울 송파구 올림픽로', lat: 37.5144, lng: 127.1058 },
  { name: '경기 성남시 분당구 판교로', lat: 37.4017, lng: 127.1086 },
  { name: '경기 수원시 팔달구 인계로', lat: 37.2636, lng: 127.0286 },
]

export default function EscrowApplicationPage() {
  const navigate = useNavigate()
  const { linkId } = useParams<{ linkId: string }>()
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [locationSearch, setLocationSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lng: number } | null>(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EscrowApplicationRequest>({
    resolver: zodResolver(escrowApplicationSchema),
    defaultValues: { itemPrice: 0, deliveryLat: 0, deliveryLng: 0 },
  })

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (imageFiles.length + files.length > 10) {
      alert('이미지는 최대 10장까지 업로드할 수 있습니다.')
      return
    }
    const next = [...imageFiles, ...files]
    setImageFiles(next)
    setValue('itemImageUrl', URL.createObjectURL(next[0]))
  }, [imageFiles, setValue])

  const removeImage = useCallback((index: number) => {
    const next = imageFiles.filter((_, i) => i !== index)
    setImageFiles(next)
    setValue('itemImageUrl', next.length > 0 ? URL.createObjectURL(next[0]) : '')
  }, [imageFiles, setValue])

  const handleLocationSelect = useCallback((loc: { name: string; lat: number; lng: number }) => {
    setSelectedLocation(loc)
    setValue('deliveryAddress', loc.name)
    setValue('deliveryLat', loc.lat)
    setValue('deliveryLng', loc.lng)
    setShowDropdown(false)
    setLocationSearch('')
  }, [setValue])

  const filteredLocations = MOCK_LOCATIONS.filter(loc =>
    loc.name.includes(locationSearch)
  )

  const onSubmit = (data: EscrowApplicationRequest) => {
    // TODO: API 연동
    console.log('escrow application:', data, imageFiles, linkId)
    navigate('/escrow/list')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-28">
      <h1 className="text-xl font-bold text-gray-900 mb-1">물품 등록 및 배달지 설정</h1>
      <p className="text-sm text-gray-500 mb-8">대행 서비스에 필요한 물품 정보와 배달지를 입력해 주세요.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* 이미지 업로드 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">물품 이미지</p>
          <div className="grid grid-cols-3 gap-2">
            {imageFiles.map((file, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={URL.createObjectURL(file)} alt={`물품 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {imageFiles.length < 10 && (
              <label className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                <Upload className="text-gray-400 mb-1" size={20} />
                <span className="text-xs text-gray-500">추가</span>
              </label>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">({imageFiles.length}/10)</p>
          {errors.itemImageUrl && <p className="text-xs text-red-500 mt-1">{errors.itemImageUrl.message}</p>}
        </div>

        {/* 물품 정보 */}
        <Input
          label="물품명"
          placeholder="물품 이름을 입력해 주세요"
          error={errors.itemTitle?.message}
          {...register('itemTitle')}
        />

        <Input
          label="거래 금액 (원)"
          type="number"
          placeholder="0"
          error={errors.itemPrice?.message}
          {...register('itemPrice', { valueAsNumber: true })}
        />

        {/* 배달지 검색 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">배달지</p>
          <div className="relative">
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500">
              <MapPin size={16} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="주소를 검색하세요"
                value={locationSearch}
                onChange={(e) => { setLocationSearch(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                className="flex-1 outline-none text-sm bg-transparent"
              />
            </div>

            {showDropdown && locationSearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => handleLocationSelect(loc)}
                      className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors"
                    >
                      {loc.name}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-400">검색 결과가 없습니다.</p>
                )}
              </div>
            )}
          </div>

          {selectedLocation && (
            <div className="mt-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm">
              선택됨: {selectedLocation.name}
            </div>
          )}
          {errors.deliveryAddress && <p className="text-xs text-red-500 mt-1">{errors.deliveryAddress.message}</p>}
        </div>

        {/* 안내 */}
        <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-medium text-amber-900 mb-2">신청 전 확인하세요</p>
          <ul className="space-y-1">
            <li>· 입력한 금액을 기준으로 대행 수수료(5%)가 계산됩니다.</li>
            <li>· 물품 이미지 첫 번째 사진이 대표 이미지로 사용됩니다.</li>
            <li>· 신청 후에는 정보 수정이 어려울 수 있습니다.</li>
          </ul>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="max-w-lg mx-auto">
            <Button type="submit" fullWidth>
              대행 신청 완료
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
