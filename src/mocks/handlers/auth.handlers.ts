/**
 * Auth MSW 핸들러
 * ⚠️ 응답 포맷은 백엔드 ApiResponse<T>와 반드시 동일하게 유지
 */
import { http, HttpResponse } from 'msw'

const BASE = '/api/v1/auth'

const mockUser = {
  id: 1,
  email: 'test@sseulang.kr',
  nickname: '테스트유저',
  profileImageUrl: null,
  trustScore: 80,
  role: 'USER' as const,
  createdAt: new Date().toISOString(),
}

export const authHandlers = [
  http.post(`${BASE}/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    if (body.password.length < 8) {
      return HttpResponse.json(
        { success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: '인증 실패', traceId: 'mock-trace' } },
        { status: 401 }
      )
    }
    return HttpResponse.json({ success: true, data: { user: mockUser } })
  }),

  http.post(`${BASE}/signup`, () =>
    HttpResponse.json({ success: true, data: null }, { status: 201 })
  ),

  http.post(`${BASE}/logout`, () =>
    HttpResponse.json({ success: true, data: null })
  ),

  http.post(`${BASE}/refresh`, () =>
    HttpResponse.json({ success: true, data: null })
  ),

  http.get(`${BASE}/me`, () =>
    HttpResponse.json({ success: true, data: mockUser })
  ),
]
