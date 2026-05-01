// 관리자 에스크로 설정 페이지 컴포넌트: 거래대행 요율 및 배달비 설정 관리
import { useState } from 'react'  // React 상태 훅
import { Save, RotateCcw, CheckCircle } from 'lucide-react'  // Lucide 아이콘들
import {
  getAdminConfig,      // 관리자 설정 가져오기 함수
  saveAdminConfig,      // 관리자 설정 저장 함수
  DEFAULT_CONFIG,       // 기본 설정값
  type EscrowAdminConfig, // 에스크로 관리자 설정 타입
} from '@/features/escrow/adminConfig'  // 에스크로 관리자 설정 모듈

// 필드 타입: 설정 입력 필드의 구조 정의
type Field = {
  key: keyof EscrowAdminConfig  // 설정 객체의 키
  label: string                  // 필드 라벨
  unit: string                   // 단위
  min: number                    // 최소값
  step: number                   // 증감 단위
  description?: string           // 설명 (선택사항)
}

// 오토바이 배달 관련 필드 설정
const BIKE_FIELDS: Field[] = [
  { key: 'baseDeliveryFee', label: '기본 배달료',  unit: '원',    min: 0,    step: 100 },  // 기본 배달료
  { key: 'baseKmRate',      label: '거리당 요금',  unit: '원/km', min: 0,    step: 10  },  // km당 요금
  { key: 'fuelEfficiency',  label: '연비',         unit: 'km/L',  min: 1,    step: 1   },  // 연비
  { key: 'minDeliveryFee',  label: '최소 배달료',  unit: '원',    min: 0,    step: 100 },  // 최소 배달료
]

// 용달차 배달 관련 필드 설정
const TRUCK_FIELDS: Field[] = [
  { key: 'truckBaseDeliveryFee', label: '기본 배달료',  unit: '원',    min: 0, step: 500 },  // 기본 배달료
  { key: 'truckBaseKmRate',      label: '거리당 요금',  unit: '원/km', min: 0, step: 50  },  // km당 요금
  { key: 'truckFuelEfficiency',  label: '연비',         unit: 'km/L',  min: 1, step: 1   },  // 연비
  { key: 'truckMinDeliveryFee',  label: '최소 배달료',  unit: '원',    min: 0, step: 500 },  // 최소 배달료
]

/**
 * 관리자 에스크로 설정 페이지 컴포넌트
 * 
 * 기능:
 * - 에스크로 거래대행 요율 설정
 * - 배달비 관련 설정 (오토바이/용달차)
 * - 유류비 자동 보정 기능
 * - 실시간 요금 미리보기
 * - 설정 저장 및 초기화
 * 
 * 설정 항목:
 * - 대행 수수료율: 거래대행 수수료 비율
 * - 유류비 관련: 현재/기준 유류비 설정
 * - 배달비: 기본료, km당 요금, 연비, 최소료
 * - 차량별 설정: 오토바이, 용달차 각각 설정
 */
export default function AdminEscrowConfigPage() {
  // 현재 설정 상태: localStorage에서 불러온 설정값
  const [config, setConfig] = useState<EscrowAdminConfig>(getAdminConfig)
  
  // 저장 완료 상태: 저장 성공 시 일시적으로 표시
  const [saved, setSaved]   = useState(false)

  // 설정값 업데이트 함수: 특정 키의 값을 변경
  const set = (key: keyof EscrowAdminConfig, value: number) =>
    setConfig(prev => ({ ...prev, [key]: value }))

  // 설정 저장 처리 함수
  const handleSave = () => {
    saveAdminConfig(config)  // localStorage에 설정 저장
    setSaved(true)           // 저장 완료 상태 설정
    setTimeout(() => setSaved(false), 2_000)  // 2초 후 상태 초기화
  }

  // 설정 초기화 함수: 기본값으로 되돌리기
  const handleReset = () => {
    setConfig({ ...DEFAULT_CONFIG })
  }

  // 숫자 입력 컴포넌트: 설정 필드를 위한 재사용 가능한 숫자 입력 UI
  const NumberInput = ({ field }: { field: Field }) => (
    <div className="flex items-center justify-between gap-4">
      {/* 필드 정보 영역 */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{field.label}</p>
        {field.description && (
          <p className="text-xs text-gray-500">{field.description}</p>
        )}
      </div>
      
      {/* 입력 필드 영역 */}
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          min={field.min}                    // 최소값 제한
          step={field.step}                  // 증감 단위
          value={config[field.key]}          // 현재 설정값
          onChange={e => set(field.key, Number(e.target.value))}  // 값 변경 처리
          className="w-28 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-right outline-none focus:border-primary-500"
        />
        {/* 단위 표시 */}
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

/**
 * 요금 미리보기 컴포넌트
 * 
 * 기능:
 * - 현재 설정값으로 실제 배달비 계산
 * - 5km 기준 요금 미리보기
 * - 오토바이/용달차 요금 비교
 * - 유류비 보정 적용된 최종 요금 표시
 * 
 * 계산 로직:
 * 1. 기본료 + (km당 요금 × 거리)
 * 2. 유류비 보정 적용
 * 3. 최소 배달료 적용
 * 4. 100원 단위 반올림
 */
function Preview({ config }: { config: EscrowAdminConfig }) {
  const distKm = 5  // 기준 거리: 5km
  const { fuelPricePerL, baseFuelPrice } = config  // 유류비 관련 설정

  // 오토바이 배달비 계산
  const bikeMpkm  = baseFuelPrice / config.fuelEfficiency  // km당 유류비
  const bikeKmRate = config.baseKmRate - bikeMpkm + bikeMpkm * (fuelPricePerL / baseFuelPrice)  // 유류비 보정된 km당 요금
  const bikeRaw   = config.baseDeliveryFee + bikeKmRate * distKm  // 기본 배달비
  const bikeFee   = Math.round(Math.max(config.minDeliveryFee, Math.round(bikeRaw / 100) * 100))  // 최소 배달료 적용 및 반올림

  // 용달차 배달비 계산
  const truckMpkm  = baseFuelPrice / config.truckFuelEfficiency  // km당 유류비
  const truckKmRate = config.truckBaseKmRate - truckMpkm + truckMpkm * (fuelPricePerL / baseFuelPrice)  // 유류비 보정된 km당 요금
  const truckRaw   = config.truckBaseDeliveryFee + truckKmRate * distKm  // 기본 배달비
  const truckFee   = Math.round(Math.max(config.truckMinDeliveryFee, Math.round(truckRaw / 100) * 100))  // 최소 배달료 적용 및 반올림

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {/* 오토바이 배달비 카드 */}
      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-600 font-medium mb-1">오토바이</p>
        <p className="text-lg font-bold text-blue-900">{bikeFee.toLocaleString()}원</p>
      </div>
      
      {/* 용달차 배달비 카드 */}
      <div className="bg-orange-50 rounded-lg p-3">
        <p className="text-xs text-orange-600 font-medium mb-1">용달차</p>
        <p className="text-lg font-bold text-orange-900">{truckFee.toLocaleString()}원</p>
      </div>
    </div>
  )
}
