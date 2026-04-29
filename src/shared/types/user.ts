export type UserRole = 'USER' | 'ADMIN'

export interface User {
  id: number
  email: string
  nickname: string
  profileImageUrl: string | null
  trustScore: number
  role: UserRole
  createdAt: string
}

export interface UserProfile extends User {
  reviewCount: number
  dealCount: number
}
