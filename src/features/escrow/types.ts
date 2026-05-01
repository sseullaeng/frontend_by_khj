import { z } from 'zod'

// 거래대행 역할: 구매자, 판매자
export type EscrowRole = 'buyer' | 'seller'

// 거래대행 상태: 대기중, 확인됨, 진행중, 완료, 취소됨
export type EscrowStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

// 수수료료 부담자: 구매자, 판매자, 둘다
export type FeePayer = 'buyer' | 'seller' | 'both'

export interface EscrowApplication {
  id: string
  role: EscrowRole
  feePayer: FeePayer
  itemInfo?: {
    id: number
    title: string
    imageUrl: string
    price: number
  }
  deliveryInfo?: {
    address: string
    lat: number
    lng: number
  }
  status: EscrowStatus
  linkId?: string
  createdAt: string
  updatedAt: string
}

export interface EscrowLink {
  id: string
  initiatorRole: EscrowRole
  feePayer: FeePayer
  status: 'pending' | 'confirmed' | 'expired'
  initiatorId: string
  createdAt: string
  expiresAt: string
}

// Form schemas
export const escrowStartSchema = z.object({
  role: z.enum(['buyer', 'seller'], { 
    errorMap: () => ({ message: ' buyer/payer' })
  }),
  feePayer: z.enum(['buyer', 'seller', 'both'], { 
    errorMap: () => ({ message: ' buyer/payer/both' })
  }),
})

export type EscrowStartRequest = z.infer<typeof escrowStartSchema>

export const escrowApplicationSchema = z.object({
  itemTitle: z.string().min(2, ' 2 ').max(100, ' 100 '),
  itemPrice: z.number({ invalid_type_error: ' ' }).min(0, ' 0 '),
  itemImageUrl: z.string().url(' URL '),
  deliveryAddress: z.string().min(5, ' 5 '),
  deliveryLat: z.number({ invalid_type_error: ' ' }),
  deliveryLng: z.number({ invalid_type_error: ' ' }),
})

export type EscrowApplicationRequest = z.infer<typeof escrowApplicationSchema>
