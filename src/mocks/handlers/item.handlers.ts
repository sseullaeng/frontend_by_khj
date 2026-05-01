import { http, HttpResponse } from 'msw'
import type { Item } from '@/features/item/types'

const BASE = '/api/v1/items'

const mockItems: Item[] = [
  // 기존 1-20 범위
  ...Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    title: `테스트 상품 ${i + 1}`,
    description: '상품 설명입니다. 상태는 매우 양호해요.',
    price: i % 5 === 0 ? 0 : (i + 1) * 5_000,
    rentPrice: i % 3 === 0 ? (i + 1) * 1_000 : 0,
    itemType: (i % 3 === 0 ? 'RENT' : i % 5 === 0 ? 'SHARE' : 'SELL') as 'SELL' | 'RENT' | 'SHARE',
    isEscrow: i % 4 === 0,
    status: 'ACTIVE' as const,
    category: ['전자기기', '의류', '도서', '생활'][i % 4],
    hashtags: ['중고', '직거래'],
    imageUrls: [],
    wishCount: Math.floor(Math.random() * 20),
    viewCount: Math.floor(Math.random() * 100),
    isWished: false,
    sellerId: 2,
    sellerNickname: '판매자',
    sellerProfileImageUrl: null,
    buyerNickname: null,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  })),
  // 거래 내역에서 사용할 101-120 범위 추가
  ...Array.from({ length: 20 }, (_, i) => {
    const id = i + 101
    const itemTypes = ['SELL', 'RENT', 'SHARE'] as const
    const itemType = itemTypes[i % 3] as 'SELL' | 'RENT' | 'SHARE'
    return {
      id,
      title: `거래 물품 ${id}`,
      description: `이것은 거래 물품 ${id}의 상세 설명입니다. 상태가 매우 양호해요.`,
      price: itemType === 'SHARE' ? 0 : (i + 1) * 10_000,
      rentPrice: itemType === 'RENT' ? (i + 1) * 2_000 : 0,
      itemType,
      isEscrow: i % 2 === 0,
      status: 'SOLD' as const,
      category: ['전자기기', '의류', '도서', '생활'][i % 4],
      hashtags: ['중고', '직거래'],
      imageUrls: [],
      wishCount: Math.floor(Math.random() * 20),
      viewCount: Math.floor(Math.random() * 100),
      isWished: false,
      sellerId: 2,
      sellerNickname: '판매자',
      sellerProfileImageUrl: null,
      buyerNickname: `구매자${i}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  })
]

export const itemHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    const keyword = url.searchParams.get('keyword') ?? ''

    const filtered = keyword
      ? mockItems.filter((i) => i.title.includes(keyword))
      : mockItems

    const start = page * size
    const content = filtered.slice(start, start + size)

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
        hasNext: start + size < filtered.length,
        hasPrevious: page > 0,
      },
    })
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    console.log('물품 상세 조회 요청:', params.id)
    console.log('사용 가능한 물품 ID:', mockItems.map(i => i.id))
    const item = mockItems.find((i) => i.id === Number(params.id))
    console.log('찾은 물품:', item)
    if (!item) {
      return HttpResponse.json(
        { success: false, error: { code: 'ITEM_NOT_FOUND', message: '상품 없음', traceId: 'mock' } },
        { status: 404 }
      )
    }
    return HttpResponse.json({ success: true, data: item })
  }),

  http.post(BASE, async ({ request }) => {
    const body = await request.json() as Partial<Item>
    const newItem: Item = {
      ...mockItems[0],
      id: mockItems.length + 1,
      ...body,
      createdAt: new Date().toISOString(),
    }
    mockItems.push(newItem)
    return HttpResponse.json({ success: true, data: newItem }, { status: 201 })
  }),

  http.get(`${BASE}/wished`, () => {
    const wished = mockItems.slice(0, 5).map((i) => ({ ...i, isWished: true }))
    return HttpResponse.json({ success: true, data: { content: wished, page: 0, size: 5, totalElements: 5, totalPages: 1, hasNext: false, hasPrevious: false } })
  }),

  http.get(`${BASE}/my`, () => {
    const mine = mockItems.filter((i) => i.sellerId === 1)
    return HttpResponse.json({ success: true, data: { content: mine, page: 0, size: mine.length, totalElements: mine.length, totalPages: 1, hasNext: false, hasPrevious: false } })
  }),

  http.post(`${BASE}/:id/wish`, ({ params }) => {
    const item = mockItems.find((i) => i.id === Number(params.id))
    if (item) item.isWished = !item.isWished
    return HttpResponse.json({ success: true, data: { isWished: item?.isWished ?? false } })
  }),
]
