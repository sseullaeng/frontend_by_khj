// 거래 관련 Mock API 핸들러
// 내 거래 내역 조회 및 거래 상세 조회 기능 제공

import { http, HttpResponse } from 'msw'
import type { Trade, TradeStatus, Counterpart } from '@/features/item/types'

// Mock 거래 상대방 데이터 생성 함수
// @param id - 상대방 ID
// @returns 상대방 정보 객체
const createMockCounterpart = (id: number): Counterpart => ({
  id,
  nickname: `상대방${id}`,
  profileImageUrl: null,
  trustScore: Math.floor(Math.random() * 100),
})

/**
 * 오늘 기준으로 N일 뒤 날짜를 YYYY-MM-DD 형식으로 반환
 * @param offsetDays - 기준일로부터의 오프셋 일수 (음수 가능)
 */
const offsetDate = (offsetDays: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

// 고정 대여 Mock 거래 데이터 목록 (다양한 대여 상태 시나리오)
// rentStartDate, rentEndDate, isReturned 필드를 포함
const RENT_MOCK_SCENARIOS: Array<{
  rentStartDate: string
  rentEndDate: string
  isReturned: boolean
  status: TradeStatus
}> = [
  // 현재 대여중 (7일 후 반납 예정)
  { rentStartDate: offsetDate(-3), rentEndDate: offsetDate(7),  isReturned: false, status: 'ACTIVE' },
  // 반납 임박 (2일 후 반납 예정)
  { rentStartDate: offsetDate(-8), rentEndDate: offsetDate(2),  isReturned: false, status: 'ACTIVE' },
  // 반납 임박 (D-Day)
  { rentStartDate: offsetDate(-5), rentEndDate: offsetDate(0),  isReturned: false, status: 'ACTIVE' },
  // 연체 중 (3일 전 반납 예정이었음)
  { rentStartDate: offsetDate(-10), rentEndDate: offsetDate(-3), isReturned: false, status: 'ACTIVE' },
  // 반납 완료
  { rentStartDate: offsetDate(-15), rentEndDate: offsetDate(-5), isReturned: true, status: 'COMPLETED' },
  // 반납 완료 (두 번째)
  { rentStartDate: offsetDate(-20), rentEndDate: offsetDate(-10), isReturned: true, status: 'COMPLETED' },
]

// Mock 거래 데이터 생성 함수
// @param id - 거래 ID
// @returns 거래 정보 객체
const createMockTrade = (id: number): Trade => {
  const statuses: TradeStatus[]           = ['COMPLETED', 'ACTIVE', 'CANCELLED']
  const itemTypes                          = ['SELL', 'RENT', 'SHARE'] as const
  const categories                         = ['전자기기', '의류', '도서', '생활']

  const itemType  = itemTypes[id % itemTypes.length]  // 순환 배정으로 다양한 타입 보장
  const status    = statuses[Math.floor(Math.random() * statuses.length)]
  const isEscrow  = id % 2 === 0
  const isBuyer   = id % 2 !== 0  // 홀수 ID는 구매자, 짝수 ID는 판매자

  // 대여 타입일 경우 대여 시나리오 데이터 추가
  const rentScenario = itemType === 'RENT'
    ? RENT_MOCK_SCENARIOS[id % RENT_MOCK_SCENARIOS.length]
    : undefined

  return {
    id,
    status:   rentScenario?.status ?? status,  // 대여 시나리오의 상태 우선 적용
    isBuyer,  // 판매/구매 구분
    item: {
      id:                   id + 100,
      title:                `거래 물품 ${id}`,
      description:          `이것은 거래 물품 ${id}의 상세 설명입니다. 상태가 매우 양호해요.`,
      price:                itemType === 'SHARE' ? 0 : (id + 1) * 10_000,
      rentPrice:            itemType === 'RENT' ? (id + 1) * 2_000 : 0,
      itemType,
      status:               status === 'CANCELLED' ? 'HIDDEN' : 'SOLD',
      category:             categories[id % categories.length],
      isEscrow,
      hashtags:             ['중고', '직거래'],
      imageUrls:            [],
      wishCount:            Math.floor(Math.random() * 20),
      viewCount:            Math.floor(Math.random() * 100),
      isWished:             false,
      sellerId:             2,
      sellerNickname:       '판매자',
      sellerProfileImageUrl: null,
      buyerNickname:        status === 'COMPLETED' ? `구매자${id}` : null,
      createdAt:            new Date(Date.now() - id * 24 * 60 * 60 * 1000).toISOString(),
    },
    counterpart:   createMockCounterpart(id),
    location:      '서울특별시 강남구 테헤란로 123',
    createdAt:     new Date(Date.now() - id * 24 * 60 * 60 * 1000).toISOString(),
    completedAt:   rentScenario?.status === 'COMPLETED' || status === 'COMPLETED'
      ? new Date(Date.now() - id * 12 * 60 * 60 * 1000).toISOString()
      : undefined,
    // 대여 전용 필드: RENT 타입일 때만 포함
    rentStartDate: rentScenario?.rentStartDate,
    rentEndDate:   rentScenario?.rentEndDate,
    isReturned:    rentScenario?.isReturned,
  }
}

// Mock 거래 데이터 생성 (20개)
// 거래 ID 1-20, 물품 ID 101-120 범위
const mockTrades: Trade[] = Array.from({ length: 20 }, (_, i) => createMockTrade(i + 1))

export const tradeHandlers = [
  // 내 거래 내역 조회 API
  // GET /api/v1/trades/my
  http.get('/api/v1/trades/my', () => {
    console.log('[Mock] 내 거래 내역 조회 요청:', mockTrades.length, '개')
    return HttpResponse.json(mockTrades)
  }),

  // 거래 상세 조회 API
  // GET /api/v1/trades/:tradeId
  http.get('/api/v1/trades/:tradeId', ({ params }) => {
    const tradeId = Number(params.tradeId)
    const trade   = mockTrades.find(t => t.id === tradeId)

    if (!trade) {
      return HttpResponse.json(
        { error: { code: 'TRADE_NOT_FOUND', message: '거래를 찾을 수 없습니다.' } },
        { status: 404 }
      )
    }

    return HttpResponse.json(trade)
  }),
]
