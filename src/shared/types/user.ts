// 사용자 역할: 일반 사용자, 관리자
export type UserRole = 'USER' | 'ADMIN'

// 소셜 로그인 provider (LOCAL = 일반 이메일 가입)
export type SocialProvider = 'LOCAL' | 'KAKAO' | 'GOOGLE'

// 사용자 기본 정보 (백엔드 가이드 응답 schema 기준)
export interface User {
  id: number                       // 사용자 고유 ID
  email: string                    // 이메일
  nickname: string                 // 닉네임
  profileImage: string | null      // 프로필 이미지 URL
  socialProvider: SocialProvider   // 가입 경로 (LOCAL / KAKAO / GOOGLE)
  emailVerified: boolean           // 이메일 인증 여부
  pointBalance: number             // 포인트 잔액
  trustScore: number | null        // 신뢰도 점수 (없을 수 있음)
  reviewCount: number              // 받은 리뷰 수
  role?: UserRole                  // 어드민 식별용 (응답에 없을 수 있음)
}

// 사용자 상세 정보 (확장)
export interface UserProfile extends User {
  dealCount: number                // 거래 횟수
}
