export interface EscrowAdminConfig {
  commissionRate: number        // 대행 수수료율 (0.05 = 5%)
  fuelPricePerL: number         // 현재 유류비 (원/L)
  baseFuelPrice: number         // 기준 유류비 — kmRate 산출 기준
  // 오토바이
  baseDeliveryFee: number       // 기본 배달료 (원)
  baseKmRate: number            // 거리당 요금 (원/km)
  fuelEfficiency: number        // 연비 (km/L)
  minDeliveryFee: number        // 최소 배달료 (원)
  // 용달차
  truckBaseDeliveryFee: number
  truckBaseKmRate: number
  truckFuelEfficiency: number
  truckMinDeliveryFee: number
}

const STORAGE_KEY = 'escrow_admin_config'

export const DEFAULT_CONFIG: EscrowAdminConfig = {
  commissionRate: 0.05,
  fuelPricePerL: 1_650,
  baseFuelPrice: 1_650,
  baseDeliveryFee: 1_500,
  baseKmRate: 500,
  fuelEfficiency: 25,
  minDeliveryFee: 3_000,
  truckBaseDeliveryFee: 5_000,
  truckBaseKmRate: 1_200,
  truckFuelEfficiency: 10,
  truckMinDeliveryFee: 15_000,
}

export function getAdminConfig(): EscrowAdminConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
  } catch {}
  return { ...DEFAULT_CONFIG }
}

export function saveAdminConfig(config: EscrowAdminConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
