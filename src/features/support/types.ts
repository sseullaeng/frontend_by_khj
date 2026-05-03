// 고객지원 도메인 타입 — 가이드 §10.14 (Inquiry) / §10.15 (SupportPost) / 라운드7

export type InquiryCategory = '계정' | '거래' | '결제' | '배송' | '기타'

export type InquiryStatus = 'PENDING' | 'PROCESSING' | 'DONE'

export interface Inquiry {
  id: number
  userId: number
  category: InquiryCategory
  title: string
  content: string
  email: string
  status: InquiryStatus
  imageUrls: string[]
  adminReply: string | null
  repliedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InquiryCreateRequest {
  category: InquiryCategory
  title: string
  content: string
  email: string
  imageUrls?: string[]   // 최대 5장
}

export interface InquiryReplyRequest {
  adminReply: string
  status?: InquiryStatus
}

export interface InquiryStatusRequest {
  status: InquiryStatus
}

// FAQ / QNA 게시글
export type SupportPostType = 'FAQ' | 'QNA'

export interface SupportPost {
  id: number
  postType: SupportPostType
  category: InquiryCategory
  question: string
  answer: string
  imageUrls: string[]
  createdAt: string
  updatedAt: string
}

export interface SupportPostUpsertRequest {
  postType: SupportPostType
  category: InquiryCategory
  question: string
  answer: string
  imageUrls?: string[]
}
