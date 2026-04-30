import { useState, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload, X, MapPin, Info, AlertTriangle, Truck, ShieldAlert } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { getAdminConfig } from '@/features/escrow/adminConfig'

const ADMIN_CONFIG = getAdminConfig()

const WEIGHT_OPTIONS = [
  { value: 'lt1',   label: '1kg 미만',  multiplier: 1.0, isVan: false },
  { value: '1to3',  label: '1~3kg',     multiplier: 1.2, isVan: false },
  { value: '3to5',  label: '3~5kg',     multiplier: 1.5, isVan: false },
  { value: '5to10', label: '5~10kg',    multiplier: 2.0, isVan: true  },
  { value: 'gt10',  label: '10kg 이상', multiplier: 2.5, isVan: true  },
] as const

const VOLUME_OPTIONS = [
  { value: 's', label: '소형', sub: '30cm 미만', multiplier: 1.0, isVan: false },
  { value: 'm', label: '중형', sub: '50cm 미만', multiplier: 1.2, isVan: false },
  { value: 'l', label: '대형', sub: '50cm 이상', multiplier: 1.5, isVan: true  },
] as const

const FRAGILITY_OPTIONS = [
  {
    value: 'f1',
    label: '안전',
    examples: '의류·책·플라스틱',
    multiplier: 1.0,
    color: { active: 'bg-green-500 border-green-500', icon: 'text-green-400' },
  },
  {
    value: 'f2',
    label: '낮음',
    examples: '목재·금속',
    multiplier: 1.1,
    color: { active: 'bg-lime-500 border-lime-500', icon: 'text-lime-400' },
  },
  {
    value: 'f3',
    label: '보통',
    examples: '전자제품·악기',
    multiplier: 1.3,
    color: { active: 'bg-yellow-500 border-yellow-500', icon: 'text-yellow-400' },
  },
  {
    value: 'f4',
    label: '높음',
    examples: '도자기·식기·액자',
    multiplier: 1.5,
    color: { active: 'bg-orange-500 border-orange-500', icon: 'text-orange-400' },
  },
  {
    value: 'f5',
    label: '매우 높음',
    examples: '유리·미술품·앤티크',
    multiplier: 2.0,
    color: { active: 'bg-red-500 border-red-500', icon: 'text-red-400' },
  },
] as const

const MOCK_LOCATIONS = [
  { name: '서울 강남구 테헤란로 123', lat: 37.5065, lng: 127.0530 },
  { name: '서울 서초구 반포대로 45',  lat: 37.5172, lng: 127.0473 },
  { name: '서울 송파구 올림픽로 300', lat: 37.5144, lng: 127.1058 },
  { name: '경기 성남시 분당구 판교로', lat: 37.4017, lng: 127.1086 },
  { name: '경기 수원시 팔달구 인계로', lat: 37.2636, lng: 127.0286 },
]

type Location     = { name: string; lat: number; lng: number }
type WeightKey    = typeof WEIGHT_OPTIONS[number]['value']
type VolumeKey    = typeof VOLUME_OPTIONS[number]['value']
type FragilityKey = typeof FRAGILITY_OPTIONS[number]['value']

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

function calcFees(
  itemPrice: number,
  distKm: number,
  wtMul: number,
  vlMul: number,
  fragMul: number,
  isVan: boolean,
) {
  const { commissionRate, fuelPricePerL, baseFuelPrice } = ADMIN_CONFIG
  const commissionFee = Math.floor(itemPrice * commissionRate)

  let deliveryFee: number
  if (isVan) {
    const { truckBaseDeliveryFee, truckBaseKmRate, truckFuelEfficiency, truckMinDeliveryFee } =
      ADMIN_CONFIG
    const mpkm = baseFuelPrice / truckFuelEfficiency
    const fc = fuelPricePerL / baseFuelPrice
    const kmRate = truckBaseKmRate - mpkm + mpkm * fc
    const rawDel = (truckBaseDeliveryFee + kmRate * distKm) * fragMul
    deliveryFee = Math.round(Math.max(truckMinDeliveryFee, Math.round(rawDel / 100) * 100))
  } else {
    const { baseDeliveryFee, baseKmRate, fuelEfficiency, minDeliveryFee } = ADMIN_CONFIG
    const mpkm = baseFuelPrice / fuelEfficiency
    const fc = fuelPricePerL / baseFuelPrice
    const kmRate = baseKmRate - mpkm + mpkm * fc
    const rawDel = (baseDeliveryFee + kmRate * distKm) * wtMul * vlMul * fragMul
    deliveryFee = Math.round(Math.max(minDeliveryFee, Math.round(rawDel / 100) * 100))
  }

  return { deliveryFee, commissionFee, totalFee: itemPrice + commissionFee + deliveryFee }
}

export default function EscrowApplicationPage() {
  const navigate = useNavigate()
  const { linkId } = useParams<{ linkId: string }>()

  const [imageFiles, setImageFiles]           = useState<File[]>([])
  const [itemPrice, setItemPrice]             = useState<number | ''>('')
  const [itemDescription, setItemDescription] = useState('')

  const [pickupSearch, setPickupSearch]       = useState('')
  const [showPickupDrop, setShowPickupDrop]   = useState(false)
  const [pickupLocation, setPickupLocation]   = useState<Location | null>(null)

  const [deliverySearch, setDeliverySearch]     = useState('')
  const [showDeliveryDrop, setShowDeliveryDrop] = useState(false)
  const [deliveryLocation, setDeliveryLocation] = useState<Location | null>(null)

  const [weightKey,    setWeightKey]    = useState<WeightKey | null>(null)
  const [volumeKey,    setVolumeKey]    = useState<VolumeKey | null>(null)
  const [fragilityKey, setFragilityKey] = useState<FragilityKey | null>(null)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [agreedCancel,  setAgreedCancel]  = useState(false)

  const price = typeof itemPrice === 'number' ? itemPrice : 0

  const distanceKm = useMemo(() => {
    if (!pickupLocation || !deliveryLocation) return 0
    return haversineKm(
      pickupLocation.lat, pickupLocation.lng,
      deliveryLocation.lat, deliveryLocation.lng,
    )
  }, [pickupLocation, deliveryLocation])

  const weightOpt    = WEIGHT_OPTIONS.find(w => w.value === weightKey)
  const volumeOpt    = VOLUME_OPTIONS.find(v => v.value === volumeKey)
  const fragilityOpt = FRAGILITY_OPTIONS.find(f => f.value === fragilityKey)
  const wtMul   = weightOpt?.multiplier    ?? 1
  const vlMul   = volumeOpt?.multiplier    ?? 1
  const fragMul = fragilityOpt?.multiplier ?? 1
  const isVan   = (weightOpt?.isVan ?? false) || (volumeOpt?.isVan ?? false)

  const locationsReady = pickupLocation !== null && deliveryLocation !== null
  const calcReady      = weightKey !== null && volumeKey !== null && fragilityKey !== null && locationsReady

  const { deliveryFee, commissionFee, totalFee } = calcFees(
    price, distanceKm, wtMul, vlMul, fragMul, isVan,
  )

  const isValid =
    imageFiles.length > 0 &&
    price > 0 &&
    itemDescription.trim().length > 0 &&
    locationsReady &&
    weightKey    !== null &&
    volumeKey    !== null &&
    fragilityKey !== null &&
    agreedCancel

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (imageFiles.length + files.length > 10) {
        alert('이미지는 최대 10장까지 업로드할 수 있습니다.')
        return
      }
      setImageFiles(prev => [...prev, ...files])
    },
    [imageFiles.length],
  )

  const removeImage = useCallback((idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const filteredPickup   = MOCK_LOCATIONS.filter(l => l.name.includes(pickupSearch))
  const filteredDelivery = MOCK_LOCATIONS.filter(l => l.name.includes(deliverySearch))

  const handleSubmit = () => {
    if (!isValid) return
    navigate(`/escrow/join/${linkId}/payment`, {
      state: {
        itemPrice: price,
        itemDescription,
        imageUrl: imageFiles.length > 0 ? URL.createObjectURL(imageFiles[0]) : '',
        pickupAddress:   pickupLocation!.name,
        deliveryAddress: deliveryLocation!.name,
        distanceKm,
        weightLabel:    weightOpt!.label,
        volumeLabel:    `${volumeOpt!.label} (${volumeOpt!.sub})`,
        fragilityLabel: `${fragilityOpt!.label} — ${fragilityOpt!.examples}`,
        isVan,
        deliveryFee,
        commissionFee,
        totalFee,
        deliveryNotes,
        linkId,
      },
    })
  }

  // ── 재사용 주소 검색 렌더
  const AddressSearch = ({
    label, hint, search, setSearch, showDrop, setShowDrop,
    selected, setSelected, filtered,
  }: {
    label: string; hint: string
    search: string; setSearch: (v: string) => void
    showDrop: boolean; setShowDrop: (v: boolean) => void
    selected: Location | null; setSelected: (l: Location) => void
    filtered: typeof MOCK_LOCATIONS
  }) => (
    <section>
      <p className="text-sm font-semibold text-gray-900 mb-1">
        {label} <span className="text-red-500">*</span>
      </p>
      <p className="text-xs text-gray-500 mb-2">{hint}</p>
      <div className="relative">
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500">
          <MapPin size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="주소를 검색하세요"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowDrop(true) }}
            onFocus={() => setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            className="flex-1 outline-none text-sm bg-transparent"
          />
        </div>
        {showDrop && search && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-20">
            {filtered.length > 0
              ? filtered.map((loc, i) => (
                  <button key={i} type="button"
                    onMouseDown={() => { setSelected(loc); setShowDrop(false); setSearch('') }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50"
                  >
                    {loc.name}
                  </button>
                ))
              : <p className="px-4 py-3 text-sm text-gray-400">검색 결과가 없습니다.</p>
            }
          </div>
        )}
        {selected && (
          <div className="mt-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm flex items-center gap-2">
            <MapPin size={13} />
            {selected.name}
          </div>
        )}
      </div>
    </section>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">거래 대행 신청서</h1>
        <p className="text-sm text-gray-500">항목을 모두 입력해야 신청이 가능합니다.</p>
      </div>

      {/* ── 반응형 2열 레이아웃 (lg+) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">

        {/* ══ 왼쪽 열 ══ */}
        <div className="flex flex-col gap-6">

          {/* ① 물품 이미지 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              물품 이미지 <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {imageFiles.map((file, i) => (
                <div key={i} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {imageFiles.length < 10 && (
                <label className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Upload className="text-gray-400 mb-1" size={18} />
                  <span className="text-xs text-gray-400">{imageFiles.length}/10</span>
                </label>
              )}
            </div>
          </section>

          {/* ② 물품 정보 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-900">물품 정보</p>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                거래 금액 (원) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="0"
                min={0}
                value={itemPrice}
                onChange={e => setItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                물품 설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={itemDescription}
                onChange={e => setItemDescription(e.target.value)}
                placeholder="물품 상태, 특이사항 등을 입력해 주세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500 resize-none"
              />
            </div>
          </section>

          {/* ③④ 주소 — md 이상에서 나란히 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <AddressSearch
                label="물품 수령지" hint="배달원이 물품을 가져갈 장소"
                search={pickupSearch} setSearch={setPickupSearch}
                showDrop={showPickupDrop} setShowDrop={setShowPickupDrop}
                selected={pickupLocation} setSelected={setPickupLocation}
                filtered={filteredPickup}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <AddressSearch
                label="물품 배달지" hint="물품을 전달할 장소"
                search={deliverySearch} setSearch={setDeliverySearch}
                showDrop={showDeliveryDrop} setShowDrop={setShowDeliveryDrop}
                selected={deliveryLocation} setSelected={setDeliveryLocation}
                filtered={filteredDelivery}
              />
            </div>
          </div>

          {/* ⑦ 배달원 요청사항 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <label className="text-sm font-semibold text-gray-900 mb-2 block">배달원에게 요청사항</label>
            <textarea
              value={deliveryNotes}
              onChange={e => setDeliveryNotes(e.target.value)}
              placeholder="배달원에게 전달할 사항을 입력해 주세요 (선택)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500 resize-none"
            />
          </section>
        </div>

        {/* ══ 오른쪽 열 ══ */}
        <div className="flex flex-col gap-6">

          {/* ⑤ 수수료 & 배달료 계산기 */}
          <section className="bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">수수료 & 배달료 계산기</p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Info size={12} />
                <span>관리자 설정 요율</span>
              </div>
            </div>

            {/* 관리자 설정값 */}
            <div className="bg-white rounded-lg p-3 border border-gray-200 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between col-span-2 sm:col-span-1">
                <span>대행 수수료율</span>
                <span className="font-medium text-gray-900">{(ADMIN_CONFIG.commissionRate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between col-span-2 sm:col-span-1">
                <span>유류비</span>
                <span className="font-medium text-gray-900">{ADMIN_CONFIG.fuelPricePerL.toLocaleString()}원/L</span>
              </div>
              <div className="flex justify-between col-span-2 sm:col-span-1">
                <span>기본료 (오토바이)</span>
                <span className="font-medium text-gray-900">{ADMIN_CONFIG.baseDeliveryFee.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between col-span-2 sm:col-span-1">
                <span>기본료 (용달차)</span>
                <span className="font-medium text-gray-900">{ADMIN_CONFIG.truckBaseDeliveryFee.toLocaleString()}원</span>
              </div>
            </div>

            {/* 예상 거리 자동 계산 */}
            <div className="flex justify-between items-center px-3 py-2.5 bg-white rounded-lg border border-gray-200 text-sm">
              <span className="text-xs text-gray-600">예상 거리 (자동 계산)</span>
              {locationsReady
                ? <span className="font-semibold text-gray-900">{distanceKm} km</span>
                : <span className="text-xs text-gray-400">수령지·배달지 선택 후 자동 산출</span>
              }
            </div>

            {/* 용달차 전환 배너 */}
            {isVan && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 text-xs text-orange-700">
                <Truck size={14} className="shrink-0" />
                <span>무게 또는 부피 기준 초과 → <strong>용달차</strong>로 자동 전환됩니다.</span>
              </div>
            )}

            {/* 무게 */}
            <div>
              <p className="text-xs text-gray-600 mb-2">무게 <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5 gap-1.5">
                {WEIGHT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWeightKey(opt.value)}
                    className={`py-2 px-1 rounded-lg text-xs font-medium border transition-colors flex flex-col items-center gap-0.5 ${
                      weightKey === opt.value
                        ? opt.isVan
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.isVan && (
                      <Truck size={11} className={weightKey === opt.value ? 'text-white' : 'text-orange-400'} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 부피 */}
            <div>
              <p className="text-xs text-gray-600 mb-2">부피 <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-3 gap-1.5">
                {VOLUME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVolumeKey(opt.value)}
                    className={`py-2.5 px-2 rounded-lg text-xs font-medium border transition-colors flex flex-col items-center gap-0.5 ${
                      volumeKey === opt.value
                        ? opt.isVan
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                    }`}
                  >
                    <span className="font-semibold">{opt.label}</span>
                    <span className={`text-[10px] ${volumeKey === opt.value ? 'text-white/80' : 'text-gray-400'}`}>
                      {opt.sub}
                    </span>
                    {opt.isVan && (
                      <Truck size={11} className={volumeKey === opt.value ? 'text-white' : 'text-orange-400'} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 파손 위험도 */}
            <div>
              <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                <ShieldAlert size={12} />
                파손 위험도 <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5 gap-1.5">
                {FRAGILITY_OPTIONS.map(opt => {
                  const isSelected = fragilityKey === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFragilityKey(opt.value)}
                      className={`py-2.5 px-1 rounded-lg text-xs font-medium border transition-colors flex flex-col items-center gap-0.5 ${
                        isSelected
                          ? `${opt.color.active} text-white`
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span className="font-semibold leading-tight text-center">{opt.label}</span>
                      <span className={`text-[10px] leading-tight text-center ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                        {opt.examples}
                      </span>
                    </button>
                  )
                })}
              </div>
              {fragilityOpt && fragilityOpt.multiplier > 1 && (
                <p className="text-xs text-gray-500 mt-1.5">
                  파손 위험 계수 ×{fragilityOpt.multiplier} 적용
                </p>
              )}
            </div>
          </section>

          {/* ⑥ 청구금액 내역 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">청구금액 내역</p>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>물품 금액</span>
                <span>{price > 0 ? `${price.toLocaleString()}원` : '—'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>대행 수수료 ({(ADMIN_CONFIG.commissionRate * 100).toFixed(0)}%)</span>
                <span>{price > 0 ? `${commissionFee.toLocaleString()}원` : '—'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1.5 flex-wrap">
                  배달료
                  {calcReady && (
                    <>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        isVan ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isVan ? '용달차' : '오토바이'}
                      </span>
                      {fragilityOpt && fragilityOpt.multiplier > 1 && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-700">
                          위험도 ×{fragilityOpt.multiplier}
                        </span>
                      )}
                    </>
                  )}
                </span>
                <span>{calcReady ? `${deliveryFee.toLocaleString()}원` : '—'}</span>
              </div>
              <div className="border-t pt-2.5 flex justify-between font-semibold">
                <span className="text-gray-900">합계</span>
                <span className={price > 0 && calcReady ? 'text-primary-600 text-base' : 'text-gray-400'}>
                  {price > 0 && calcReady ? `${totalFee.toLocaleString()}원` : '—'}
                </span>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* ⑧ 취소 수수료 경고 — 항상 최하단 */}
      <section className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5 mt-2">
        <div className="flex items-start gap-2 mb-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
          <p className="text-sm font-semibold text-red-900">취소 수수료 안내</p>
        </div>
        <p className="text-xs text-red-700 mb-3 leading-relaxed">
          배달기사 배정 후 취소 시 <strong>취소 수수료가 부과</strong>됩니다.
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedCancel}
            onChange={e => setAgreedCancel(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-red-600 rounded focus:ring-red-500"
          />
          <span className="text-sm text-red-900">위 취소 수수료 정책에 동의합니다.</span>
        </label>
      </section>

      <div className="flex flex-col gap-3 mt-4">
        <Button type="button" fullWidth disabled={!isValid} onClick={handleSubmit}>
          신청하기
        </Button>

        {/* 개발 전용: 결제 페이지 직접 이동 */}
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={() =>
              navigate(`/escrow/join/${linkId}/payment`, {
                state: {
                  itemPrice: 50_000,
                  itemDescription: '테스트 물품',
                  imageUrl: '',
                  pickupAddress: '서울 강남구 테헤란로 123',
                  deliveryAddress: '경기 성남시 분당구 판교로',
                  distanceKm: 12.5,
                  weightLabel: '1~3kg',
                  volumeLabel: '소형 (30cm 미만)',
                  fragilityLabel: '보통 — 전자제품·악기',
                  isVan: false,
                  deliveryFee: 8_500,
                  commissionFee: 2_500,
                  totalFee: 61_000,
                  deliveryNotes: '',
                  linkId,
                },
              })
            }
            className="w-full py-2 text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-500 transition-colors"
          >
            [DEV] 결제 페이지로 바로 이동
          </button>
        )}
      </div>
    </div>
  )
}
