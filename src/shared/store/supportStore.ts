import { create } from 'zustand'

/** 1:1 문의 처리 상태 */
export type InquiryStatus = 'pending' | 'processing' | 'done'

/** 1:1 문의 */
export interface Inquiry {
  id: number
  userId: number
  userName: string
  category: string
  title: string
  content: string
  email: string
  status: InquiryStatus
  createdAt: string
  adminReply?: string
  images?: string[]   // 첨부 이미지 (base64 dataURL)
}

/** 관리자 FAQ/Q&A 게시물 */
export interface SupportPost {
  id: number
  postType: 'FAQ' | 'QNA'   // 자주하는 질문 | Q&A
  category: string           // 계정|거래|결제|배송|기타
  question: string           // 질문
  answer: string             // 답변
  images: string[]           // 첨부 이미지 (base64 dataURL)
  createdAt: string
}

interface SupportStore {
  inquiries: Inquiry[]
  posts: SupportPost[]
  addInquiry: (data: Omit<Inquiry, 'id' | 'status' | 'createdAt'>) => void
  deleteInquiry: (id: number) => void
  updateInquiryStatus: (id: number, status: InquiryStatus, adminReply?: string) => void
  addPost: (data: Omit<SupportPost, 'id' | 'createdAt'>) => void
  updatePost: (id: number, data: Partial<Omit<SupportPost, 'id' | 'createdAt'>>) => void
  deletePost: (id: number) => void
}

const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: 1,
    userId: 2,
    userName: '홍길동',
    category: '거래 관련',
    title: '배송이 너무 늦어요',
    content: '주문한 지 5일이 지났는데 아직 배송이 안 됐습니다. 확인 부탁드립니다.',
    email: 'hong@example.com',
    status: 'done',
    createdAt: '2026-04-28T10:00:00Z',
    adminReply: '안녕하세요. 배송 지연 관련하여 판매자에게 연락하였으며 오늘 중 발송 예정입니다.',
    images: [],
  },
  {
    id: 2,
    userId: 3,
    userName: '김영희',
    category: '결제 관련',
    title: '환불 처리는 언제 되나요?',
    content: '3일 전에 취소 신청을 했는데 아직 환불이 안 됐습니다.',
    email: 'kim@example.com',
    status: 'processing',
    createdAt: '2026-04-30T14:30:00Z',
    images: [],
  },
  {
    id: 3,
    userId: 4,
    userName: '이철수',
    category: '계정 관련',
    title: '비밀번호 변경이 안 돼요',
    content: '비밀번호 변경 이메일이 오지 않습니다.',
    email: 'lee@example.com',
    status: 'pending',
    createdAt: '2026-05-01T09:15:00Z',
    images: [],
  },
]

const MOCK_POSTS: SupportPost[] = [
  {
    id: 1,
    postType: 'FAQ',
    category: '계정',
    question: '비밀번호를 잊어버렸어요. 어떻게 찾나요?',
    answer: '로그인 화면에서 "비밀번호 찾기"를 클릭하고 이메일을 입력하시면 임시 비밀번호가 발송됩니다.',
    images: [],
    createdAt: '2026-05-03T09:00:00Z',
  },
  {
    id: 2,
    postType: 'QNA',
    category: '거래',
    question: '거래대행 수수료는 얼마인가요?',
    answer: '기본 수수료는 5%이며, 월간 거래액에 따라 단계별 할인이 적용됩니다.',
    images: [],
    createdAt: '2026-05-01T10:00:00Z',
  },
]

export const useSupportStore = create<SupportStore>((set) => ({
  inquiries: MOCK_INQUIRIES,
  posts: MOCK_POSTS,

  addInquiry: (data) =>
    set((s) => ({
      inquiries: [
        { ...data, id: Date.now(), status: 'pending', createdAt: new Date().toISOString() },
        ...s.inquiries,
      ],
    })),

  deleteInquiry: (id) =>
    set((s) => ({ inquiries: s.inquiries.filter((i) => i.id !== id) })),

  updateInquiryStatus: (id, status, adminReply) =>
    set((s) => ({
      inquiries: s.inquiries.map((i) =>
        i.id === id ? { ...i, status, ...(adminReply !== undefined ? { adminReply } : {}) } : i
      ),
    })),

  addPost: (data) =>
    set((s) => ({
      posts: [
        { ...data, id: Date.now(), createdAt: new Date().toISOString() },
        ...s.posts,
      ],
    })),

  updatePost: (id, data) =>
    set((s) => ({
      posts: s.posts.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

  deletePost: (id) =>
    set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),
}))
