export interface ChargeInitResponse {
  paymentKey: string
  orderId: string
  amount: number
  customerKey: string
}

export interface ChargeConfirmRequest {
  paymentKey: string
  orderId: string
  amount: number
}

export interface PointBalance {
  balance: number
  updatedAt: string
}

export type PointHistoryType = 'CHARGE' | 'USE' | 'REFUND' | 'WITHDRAW'

export interface PointHistory {
  id: number
  type: PointHistoryType
  amount: number
  description: string
  createdAt: string
}

export interface WithdrawRequest {
  amount: number
  bankCode: string
  accountNumber: string
  accountHolder: string
}
