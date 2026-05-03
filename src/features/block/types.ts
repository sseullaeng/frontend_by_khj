// 사용자 차단 도메인 — 가이드 §10.11
//
// 응답에 닉네임/프로필이 없어 표시 시 별도로 /users/{id}/profile 조회 필요.

export interface UserBlock {
  id: number
  blockerId: number       // 본인
  blockedId: number       // 차단당한 사용자
  createdAt: string       // KST naive LocalDateTime
}
