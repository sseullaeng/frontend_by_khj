import { useState } from 'react'
import { Save, RotateCcw, CheckCircle } from 'lucide-react'
import {
  getAdminConfig,
  saveAdminConfig,
  DEFAULT_CONFIG,
  type EscrowAdminConfig,
} from '@/features/escrow/adminConfig'

type Field = {
  key: keyof EscrowAdminConfig
  label: string
  unit: string
  min: number
  step: number
  description?: string
}

const BIKE_FIELDS: Field[] = [
  { key: 'baseDeliveryFee', label: '기본 배달료',  unit: '원',    min: 0,    step: 100 },
  { key: 'baseKmRate',      label: '거리당 요금',  unit: '원/km', min: 0,    step: 10  },
  { key: 'fuelEfficiency',  label: '연비',         unit: 'km/L',  min: 1,    step: 1   },
  { key: 'minDeliveryFee',  label: '최소 배달료',  unit: '원',    min: 0,    step: 100 },
]

const TRUCK_FIELDS: Field[] = [
  { key: 'truckBaseDeliveryFee', label: '기본 배달료',  unit: '원',    min: 0, step: 500 },
  { key: 'truckBaseKmRate',      label: '거리당 요금',  unit: '원/km', min: 0, step: 50  },
  { key: 'truckFuelEfficiency',  label: '연비',         unit: 'km/L',  min: 1, step: 1   },
  { key: 'truckMinDeliveryFee',  label: '최소 배달료',  unit: '원',    min: 0, step: 500 },
]

export default function AdminEscrowConfigPage() {
  const [config, setConfig] = useState<EscrowAdminConfig>(getAdminConfig)
  const [saved, setSaved]   = useState(false)

  const set = (key: keyof EscrowAdminConfig, value: number) =>
    setConfig(prev => ({ ...prev, [key]: value }))

  const handleSave = () => {
    saveAdminConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2_000)
  }

  const handleReset = () => {
    setConfig({ ...DEFAULT_CONFIG })
  }

  const NumberInput = ({ field }: { field: Field }) => (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{field.label}</p>
        {field.description && (
          <p className="text-xs text-gray-500">{field.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          min={field.min}
          step={field.step}
          value={config[field.key]}
          onChange={e => set(field.key, Number(e.target.value))}
          className="w-28 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-right outline-none focus:border-primary-500"
        />
        <span className="text-xs text-gray-500 w-10">{field.unit}</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">거래대행 요율 설정</h1>
          <p className="text-sm text-gray-500 mt-0.5">변경 후 저장해야 적용됩니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={14} />
            초기화
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              saved
                ? 'bg-green-500 text-white border border-green-500'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saved ? '저장됨' : '저장'}
          </button>
        </div>
      </div>

      {/* 공통 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-2">공통</h2>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">대행 수수료율</p>
            <p className="text-xs text-gray-500">물품 금액 × 요율 = 수수료</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={config.commissionRate * 100}
              onChange={e => set('commissionRate', Number(e.target.value) / 100)}
              className="w-28 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-right outline-none focus:border-primary-500"
            />
            <span className="text-xs text-gray-500 w-10">%</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">현재 유류비</p>
            <p className="text-xs text-gray-500">배달료 자동 보정에 사용</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="number"
              min={0}
              step={10}
              value={config.fuelPricePerL}
              onChange={e => set('fuelPricePerL', Number(e.target.value))}
              className="w-28 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-right outline-none focus:border-primary-500"
            />
            <span className="text-xs text-gray-500 w-10">원/L</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">기준 유류비</p>
            <p className="text-xs text-gray-500">거리당 요금 산출 기준가</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="number"
              min={0}
              step={10}
              value={config.baseFuelPrice}
              onChange={e => set('baseFuelPrice', Number(e.target.value))}
              className="w-28 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-right outline-none focus:border-primary-500"
            />
            <span className="text-xs text-gray-500 w-10">원/L</span>
          </div>
        </div>
      </section>

      {/* 오토바이 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-2">오토바이</h2>
        {BIKE_FIELDS.map(f => <NumberInput key={f.key} field={f} />)}
      </section>

      {/* 용달차 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-2">용달차</h2>
        {TRUCK_FIELDS.map(f => <NumberInput key={f.key} field={f} />)}
      </section>

      {/* 미리보기 */}
      <section className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">요금 미리보기 (5km 기준)</h2>
        <Preview config={config} />
      </section>
    </div>
  )
}

function Preview({ config }: { config: EscrowAdminConfig }) {
  const distKm = 5
  const { fuelPricePerL, baseFuelPrice } = config

  const bikeMpkm  = baseFuelPrice / config.fuelEfficiency
  const bikeKmRate = config.baseKmRate - bikeMpkm + bikeMpkm * (fuelPricePerL / baseFuelPrice)
  const bikeRaw   = config.baseDeliveryFee + bikeKmRate * distKm
  const bikeFee   = Math.round(Math.max(config.minDeliveryFee, Math.round(bikeRaw / 100) * 100))

  const truckMpkm  = baseFuelPrice / config.truckFuelEfficiency
  const truckKmRate = config.truckBaseKmRate - truckMpkm + truckMpkm * (fuelPricePerL / baseFuelPrice)
  const truckRaw   = config.truckBaseDeliveryFee + truckKmRate * distKm
  const truckFee   = Math.round(Math.max(config.truckMinDeliveryFee, Math.round(truckRaw / 100) * 100))

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-600 font-medium mb-1">오토바이</p>
        <p className="text-lg font-bold text-blue-900">{bikeFee.toLocaleString()}원</p>
      </div>
      <div className="bg-orange-50 rounded-lg p-3">
        <p className="text-xs text-orange-600 font-medium mb-1">용달차</p>
        <p className="text-lg font-bold text-orange-900">{truckFee.toLocaleString()}원</p>
      </div>
    </div>
  )
}
