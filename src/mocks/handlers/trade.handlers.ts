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

// Mock 거래 데이터 생성 함수
// @param id - 거래 ID
// @returns 거래 정보 객체
const createMockTrade = (id: number): Trade => {
  const statuses: TradeStatus[] = ['COMPLETED', 'ACTIVE', 'CANCELLED']
  const itemTypes = ['SELL', 'RENT', 'SHARE'] as const
  const categories = ['전자기기', '의류', '도서', '생활']
  
  const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)]
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const isEscrow = Math.random() > 0.5
  const isBuyer = Math.random() > 0.5  // 현재 사용자가 구매자인지 판매자인지
  
  return {
    id,
    status,
    isBuyer,  // 판매/구매 구분
    item: {
      id: id + 100,
      title: `거래 물품 ${id}`,
      description: `이것은 거래 물품 ${id}의 상세 설명입니다. 상태가 매우 양호해요.`,
      price: itemType === 'SHARE' ? 0 : (id + 1) * 10_000,
      rentPrice: itemType === 'RENT' ? (id + 1) * 2_000 : 0,
      itemType,
      status: status === 'CANCELLED' ? 'HIDDEN' : 'SOLD',
      category: categories[Math.floor(Math.random() * categories.length)],
      isEscrow,
      hashtags: ['중고', '직거래'],
      imageUrls: [],
      wishCount: Math.floor(Math.random() * 20),
      viewCount: Math.floor(Math.random() * 100),
      isWished: false,
      sellerId: 2,
      sellerNickname: '판매자',
      sellerProfileImageUrl: null,
      buyerNickname: status === 'COMPLETED' ? `구매자${id}` : null,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    counterpart: createMockCounterpart(id),
    location: '서울특별시 강남구 테헤란로 123',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: status === 'COMPLETED' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
  }
}

// Mock 거래 데이터 생성 (20개)
// 거래 ID 1-20, 물품 ID 101-120 범위
const mockTrades: Trade[] = Array.from({ length: 20 }, (_, i) => createMockTrade(i + 1))

export const tradeHandlers = [
  // 내 거래 내역 조회 API
  // GET /api/v1/trades/my
  http.get('/api/v1/trades/my', () => {
    console.log('내 거래 내역 조회 요청')
    console.log('반환할 거래 데이터:', mockTrades.length, '개')
    return HttpResponse.json(mockTrades)
  }),

  // 거래 상세 조회 API
  // GET /api/v1/trades/:tradeId
  http.get('/api/v1/trades/:tradeId', ({ params }) => {
    const tradeId = Number(params.tradeId)
    const trade = mockTrades.find(t => t.id === tradeId)
    
    if (!trade) {
      return HttpResponse.json(
        { error: { code: 'TRADE_NOT_FOUND', message: '거래를 찾을 수 없습니다.' } },
        { status: 404 }
      )
    }
    
    return HttpResponse.json(trade)
  }),
]
