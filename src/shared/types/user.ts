// 사용자 역할: 일반 사용자, 관리자
export type UserRole = 'USER' | 'ADMIN'

// 사용자 기본 정보
export interface User {
  id: number                // 사용자 고유 ID
  email: string             // 이메일
  nickname: string          // 닉네임
  profileImageUrl: string | null  // 프로필 이미지 URL
  trustScore: number        // 신뢰도 점수
  role: UserRole            // 사용자 역할
  createdAt: string          // 가입일시
}

// 사용자 상세 정보 (확장)
export interface UserProfile extends User {
  reviewCount: number       // 작성한 리뷰 수
  dealCount: number        // 거래 횟수
}
