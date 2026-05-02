/**
 * Auth MSW 핸들러
 * ⚠️ 응답 포맷은 백엔드 ApiResponse<T>와 반드시 동일하게 유지
 */
import { http, HttpResponse } from 'msw'

const BASE = '/api/v1/auth'

interface StoredUser {
  password: string
  user: {
    id: number
    email: string
    nickname: string
    profileImageUrl: string | null
    trustScore: number
    role: 'USER' | 'ADMIN'
    createdAt: string
  }
}

// 인메모리 유저 저장소 (기본 테스트 계정 포함)
const userStore = new Map<string, StoredUser>([
  ['test@sseulang.kr', {
    password: 'password1234',
    user: {
      id: 1,
      email: 'test@sseulang.kr',
      nickname: '테스트유저',
      profileImageUrl: null,
      trustScore: 80,
      role: 'USER',
      createdAt: new Date().toISOString(),
    }
  }]
])

let nextId = 2
let currentUser: StoredUser['user'] | null = null

export const authHandlers = [
  http.post(`${BASE}/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    const stored = userStore.get(body.email)
    if (!stored || stored.password !== body.password) {
      return HttpResponse.json(
        { success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다', traceId: 'mock-trace' } },
        { status: 401 }
      )
    }
    currentUser = stored.user
    return HttpResponse.json({ success: true, data: { user: stored.user } })
  }),

  http.post(`${BASE}/signup`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string; nickname: string }
    if (userStore.has(body.email)) {
      return HttpResponse.json(
        { success: false, error: { code: 'AUTH_EMAIL_DUPLICATED', message: '이미 사용 중인 이메일입니다', traceId: 'mock-trace' } },
        { status: 409 }
      )
    }
    const newUser = {
      id: nextId++,
      email: body.email,
      nickname: body.nickname,
      profileImageUrl: null,
      trustScore: 50,
      role: 'USER' as const,
      createdAt: new Date().toISOString(),
    }
    userStore.set(body.email, { password: body.password, user: newUser })
    return HttpResponse.json({ success: true, data: null }, { status: 201 })
  }),

  http.post(`${BASE}/logout`, () => {
    currentUser = null
    return HttpResponse.json({ success: true, data: null })
  }),

  http.post(`${BASE}/refresh`, () =>
    HttpResponse.json({ success: true, data: null })
  ),

  http.get('/api/v1/users/me', () => {
    if (!currentUser) {
      return HttpResponse.json(
        { success: false, error: { code: 'AUTH_UNAUTHORIZED', message: '로그인이 필요합니다', traceId: 'mock-trace' } },
        { status: 401 }
      )
    }
    return HttpResponse.json({ success: true, data: currentUser })
  }),

  http.patch('/api/v1/users/me', async ({ request }) => {
    if (!currentUser) {
      return HttpResponse.json(
        { success: false, error: { code: 'AUTH_UNAUTHORIZED', message: '로그인이 필요합니다', traceId: 'mock-trace' } },
        { status: 401 }
      )
    }
    const body = await request.json() as { nickname?: string; profileImageKey?: string }
    if (body.nickname) currentUser = { ...currentUser, nickname: body.nickname }
    const stored = userStore.get(currentUser.email)
    if (stored) userStore.set(currentUser.email, { ...stored, user: currentUser })
    return HttpResponse.json({ success: true, data: currentUser })
  }),
]
