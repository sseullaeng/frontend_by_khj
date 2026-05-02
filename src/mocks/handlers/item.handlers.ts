// MSW Item 핸들러 — PR #66 정합 (현재 MSW 비활성화 상태이므로 컴파일 통과 목적)
import { http, HttpResponse } from 'msw'
import type { Item, WishlistToggleResponse } from '@/features/item/types'

const BASE = '/api/v1/items'

const mockItems: Item[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  sellerId: 2,
  categoryId: (i % 5) + 1,
  title: `테스트 상품 ${i + 1}`,
  price: i % 5 === 0 ? 0 : (i + 1) * 5_000,
  tradeType: (i % 3 === 0 ? '대여' : i % 5 === 0 ? '나눔' : '판매') as '판매' | '대여' | '나눔',
  status: '판매중',
  region: ['서울 강남구', '서울 마포구', '경기 성남시', '부산 해운대구'][i % 4],
  thumbnailUrl: null,
  wishlistCount: Math.floor(Math.random() * 20),
  isWishlisted: false,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}))

export const itemHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    const q = url.searchParams.get('q') ?? ''

    const filtered = q ? mockItems.filter((i) => i.title.includes(q)) : mockItems
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
        { status: 404 },
      )
    }
    // ItemDetail 형태로 확장
    return HttpResponse.json({
      success: true,
      data: {
        ...item,
        description: '상품 설명입니다.',
        deposit: null,
        rentalUnit: null,
        viewCount: Math.floor(Math.random() * 100),
        images: [],
        hashtags: ['중고', '직거래'],
        updatedAt: item.createdAt,
      },
    })
  }),

  http.post(`${BASE}/:id/wishlist`, ({ params }) => {
    const item = mockItems.find((i) => i.id === Number(params.id))
    if (item) {
      item.isWishlisted = true
      item.wishlistCount += 1
    }
    const data: WishlistToggleResponse = {
      wishlisted: true,
      wishlistCount: item?.wishlistCount ?? 0,
    }
    return HttpResponse.json({ success: true, data })
  }),

  http.delete(`${BASE}/:id/wishlist`, ({ params }) => {
    const item = mockItems.find((i) => i.id === Number(params.id))
    if (item) {
      item.isWishlisted = false
      item.wishlistCount = Math.max(0, item.wishlistCount - 1)
    }
    const data: WishlistToggleResponse = {
      wishlisted: false,
      wishlistCount: item?.wishlistCount ?? 0,
    }
    return HttpResponse.json({ success: true, data })
  }),
]
