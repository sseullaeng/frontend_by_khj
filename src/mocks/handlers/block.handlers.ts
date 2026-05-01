// 차단 관련 Mock API 핸들러 (UC-12: 차단 사용자 관리)
// 차단 목록 조회 / 차단 해제 기능 제공

import { http, HttpResponse } from 'msw'
import type { BlockedUser } from '@/features/item/types'

// 차단 일시 생성 헬퍼: N일 전 ISO 날짜 문자열 반환
const daysAgo = (n: number): string =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

// 초기 Mock 차단 사용자 데이터 목록
let mockBlockedUsers: BlockedUser[] = [
  {
    id:             10,
    nickname:       '불량유저1',
    profileImageUrl: null,
    blockedAt:      daysAgo(3),
  },
  {
    id:             11,
    nickname:       '스팸계정A',
    profileImageUrl: null,
    blockedAt:      daysAgo(7),
  },
  {
    id:             12,
    nickname:       '신고된유저',
    profileImageUrl: null,
    blockedAt:      daysAgo(14),
  },
]

export const blockHandlers = [
  // 차단 목록 조회 API
  // GET /api/v1/blocks
  http.get('/api/v1/blocks', () => {
    console.log('[Mock] 차단 목록 조회:', mockBlockedUsers.length, '명')
    return HttpResponse.json(mockBlockedUsers)
  }),

  // 차단 해제 API
  // DELETE /api/v1/blocks/:userId
  http.delete('/api/v1/blocks/:userId', ({ params }) => {
    const userId = Number(params.userId)
    const before = mockBlockedUsers.length
    mockBlockedUsers = mockBlockedUsers.filter(u => u.id !== userId)

    if (mockBlockedUsers.length === before) {
      // 해당 ID의 차단 사용자가 없을 때
      return HttpResponse.json(
        { error: { code: 'BLOCK_NOT_FOUND', message: '차단 내역을 찾을 수 없습니다.' } },
        { status: 404 }
      )
    }

    console.log('[Mock] 차단 해제 완료: userId =', userId)
    return HttpResponse.json({ success: true })
  }),

  // 사용자 신고 API (UC-23/UC-29: 신고 기능)
  // POST /api/v1/reports/:userId
  http.post('/api/v1/reports/:userId', async ({ params, request }) => {
    const userId = Number(params.userId)
    const body   = await request.json() as { reason?: string }
    console.log('[Mock] 사용자 신고:', userId, '사유:', body.reason)
    return HttpResponse.json({ success: true }, { status: 201 })
  }),

  // 사용자 차단 API
  // POST /api/v1/blocks/:userId
  http.post('/api/v1/blocks/:userId', ({ params }) => {
    const userId = Number(params.userId)
    // 이미 차단된 경우 중복 처리
    if (mockBlockedUsers.some(u => u.id === userId)) {
      return HttpResponse.json(
        { error: { code: 'ALREADY_BLOCKED', message: '이미 차단된 사용자입니다.' } },
        { status: 409 }
      )
    }

    // 새 차단 사용자 추가
    const newBlocked: BlockedUser = {
      id:             userId,
      nickname:       `사용자${userId}`,
      profileImageUrl: null,
      blockedAt:      new Date().toISOString(),
    }
    mockBlockedUsers.push(newBlocked)
    console.log('[Mock] 차단 추가: userId =', userId)
    return HttpResponse.json(newBlocked, { status: 201 })
  }),
]
