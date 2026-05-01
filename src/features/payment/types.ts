// 충전 초기화 응답
export interface ChargeInitResponse {
  paymentKey: string      // 결제 키
  orderId: string        // 주문 ID
  amount: number         // 충전 금액
  customerKey: string   // 고객 키
}

// 충전 확인 요청
export interface ChargeConfirmRequest {
  paymentKey: string  // 결제 키
  orderId: string    // 주문 ID
  amount: number      // 충전 금액
}

// 포인트 잔액 정보
export interface PointBalance {
  balance: number      // 현재 잔액
  updatedAt: string   // 최종 업데이트 시간
}

// 포인트 내역 타입: 충전, 사용, 환불, 출금
export type PointHistoryType = 'CHARGE' | 'USE' | 'REFUND' | 'WITHDRAW'

// 포인트 내역
export interface PointHistory {
  id: number          // 내역 고유 ID
  type: PointHistoryType  // 내역 타입
  amount: number        // 금액
  description: string   // 내용
  createdAt: string    // 생성일시
}

// 출금 요청
export interface WithdrawRequest {
  amount: number        // 출금 금액
  bankCode: string     // 은행 코드
  accountNumber: string // 계좌번호
  accountHolder: string // 예금주 명의
}
