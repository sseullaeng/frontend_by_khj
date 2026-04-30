import { http, HttpResponse } from 'msw'
import type { Item } from '@/features/item/types'

const BASE = '/api/v1/items'

const mockItems: Item[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `테스트 상품 ${i + 1}`,
  description: '상품 설명입니다. 상태는 매우 양호해요.',
  price: i % 5 === 0 ? 0 : (i + 1) * 5_000,
  rentPrice: i % 3 === 0 ? (i + 1) * 1_000 : 0,
  itemType: i % 3 === 0 ? 'RENT' : i % 5 === 0 ? 'SHARE' : 'SELL',
  isEscrow: i % 4 === 0,
  status: 'ACTIVE',
  category: ['전자기기', '의류', '도서', '생활'][i % 4],
  hashtags: ['중고', '직거래'],
  imageUrls: [],
  wishCount: Math.floor(Math.random() * 20),
  viewCount: Math.floor(Math.random() * 100),
  isWished: false,
  sellerId: 2,
  sellerNickname: '판매자',
  sellerProfileImageUrl: null,
  createdAt: new Date().toISOString(),
}))

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
    const item = mockItems.find((i) => i.id === Number(params.id))
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

  http.post(`${BASE}/:id/wish`, ({ params }) => {
    const item = mockItems.find((i) => i.id === Number(params.id))
    if (item) item.isWished = !item.isWished
    return HttpResponse.json({ success: true, data: { isWished: item?.isWished ?? false } })
  }),
]
