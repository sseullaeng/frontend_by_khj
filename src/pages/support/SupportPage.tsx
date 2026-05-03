// 고객센터 — 백엔드 hook 연동 (라운드7)
//
// 사용자: FAQ/QNA 조회 + 1:1 문의 작성/내 목록
// 관리자: FAQ/QNA CRUD + 전체 문의 목록 (상세는 /admin/support/{id})
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Headphones, MessageCircle, HelpCircle, Search,
  ChevronDown, ChevronUp, Phone, Mail, PenLine,
  Trash2, CheckCircle2, Clock, AlertCircle, X, Plus, ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store'
import {
  useAdminInquiries,
  useCreateInquiry,
  useCreateSupportPost,
  useDeleteSupportPost,
  useMyInquiries,
  useSupportPosts,
  useUpdateSupportPost,
} from '@/features/support/hooks'
import type {
  Inquiry,
  InquiryCategory,
  InquiryStatus,
  SupportPost,
  SupportPostType,
} from '@/features/support/types'
import { uploadImages, validateImageFile } from '@/shared/api/upload'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

// ── 정적 FAQ 데이터 ─────────────────────────────────────────────────────────

const faqCategories = [
  {
    id: 'account', name: '계정', icon: '👤',
    questions: [
      { question: '회원가입은 어떻게 하나요?', answer: '화면 상단의 회원가입 버튼을 클릭하여 필요한 정보를 입력하시면 5분 내로 가입이 완료됩니다.' },
      { question: '비밀번호를 잊어버렸어요', answer: '로그인 화면에서 "비밀번호 찾기"를 클릭하고 이메일을 입력하시면 임시 비밀번호가 발송됩니다.' },
      { question: '회원탈퇴는 어떻게 하나요?', answer: '마이페이지 > 계정설정 > 회원탈퇴에서 진행하실 수 있으며, 탈퇴 후 30일간은 재가입이 불가능합니다.' },
    ],
  },
  {
    id: 'transaction', name: '거래', icon: '💰',
    questions: [
      { question: '물품 등록은 무료인가요?', answer: '기본 물품 등록은 무료이며, 특별 서비스(우선 노출 등)는 유료로 제공됩니다.' },
      { question: '거래대행 서비스는 어떻게 신청하나요?', answer: '물품 상세페이지에서 "거래대행 신청" 버튼을 클릭하여 필요한 정보를 입력하시면 됩니다.' },
      { question: '판매 수수료는 얼마인가요?', answer: '기본 수수료는 5%이며, 월간 거래액에 따라 단계별 할인이 적용됩니다.' },
    ],
  },
  {
    id: 'payment', name: '결제', icon: '💳',
    questions: [
      { question: '어떤 결제수단을 사용할 수 있나요?', answer: '신용카드, 계좌이체, 휴대폰 소액결제, 간편결제 등 다양한 결제수단을 지원합니다.' },
      { question: '환불은 어떻게 받을 수 있나요?', answer: '결제 후 7일 내에 고객센터로 연락주시면 환불 처리가 가능하며, 결제수단에 따라 3-5일 내로 처리됩니다.' },
      { question: '보증금은 언제 반환되나요?', answer: '거래 완료 후 24시간 내에 자동으로 반환되며, 영업일 기준 2-3일 내에 입금됩니다.' },
    ],
  },
  {
    id: 'delivery', name: '배송', icon: '📦',
    questions: [
      { question: '배송비는 얼마인가요?', answer: '기본 배송비는 3,000원이며, 30,000원 이상 구매 시 무료 배송됩니다.' },
      { question: '배송에는 얼마나 걸리나요?', answer: '수도권은 1-2일, 지방은 2-3일 내에 배송되며, 주말 및 공휴일은 제외된 기간입니다.' },
      { question: '배송 추적은 어떻게 하나요?', answer: '마이페이지 > 거래내역에서 송장번호를 확인하여 배송 현황을 실시간으로 추적할 수 있습니다.' },
    ],
  },
]

const STATUS_MAP: Record<InquiryStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING:    { label: '접수 완료', cls: 'bg-gray-100 text-gray-600',   icon: <AlertCircle  size={12} /> },
  PROCESSING: { label: '처리 중',  cls: 'bg-blue-100 text-blue-700',   icon: <Clock        size={12} /> },
  DONE:       { label: '답변 완료', cls: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> },
}

const INQUIRY_CATEGORIES: InquiryCategory[] = ['계정', '거래', '결제', '배송', '기타']

const MAX_INQUIRY_IMAGES = 5  // 백엔드 spec — 1:1 문의 최대 5장
const MAX_POST_IMAGES = 5

// ── 동적 FAQ 항목 ──────────────────────────────────────────────────────────

function DynamicFaqItem({ post, isAdmin, onEdit, onDelete }: {
  post: SupportPost
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="shrink-0 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {post.category}
            </span>
            <p className="font-medium text-gray-900 truncate">{post.question}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); onEdit() }}
                  className="p-1 text-gray-400 hover:text-primary-500 transition-colors"
                >
                  <PenLine size={14} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDelete() }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
            {open ? <ChevronUp className="text-gray-400" size={16} /> : <ChevronDown className="text-gray-400" size={16} />}
          </div>
        </div>
      </button>
      {open && (
        <div className="px-6 pb-4">
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{post.answer}</p>
          {post.imageUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {post.imageUrls.map((img, i) => (
                <a key={i} href={img} target="_blank" rel="noreferrer">
                  <img src={img} alt="" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 게시글 작성/수정 모달 ──────────────────────────────────────────────────

function PostWriteModal({
  existingPost,
  onClose,
}: {
  existingPost?: SupportPost
  onClose: () => void
}) {
  const create = useCreateSupportPost()
  const update = useUpdateSupportPost()
  const submitting = create.isPending || update.isPending

  const [postType, setPostType]   = useState<SupportPostType>(existingPost?.postType ?? 'FAQ')
  const [category, setCategory]   = useState<InquiryCategory | ''>(existingPost?.category ?? '')
  const [question, setQuestion]   = useState(existingPost?.question ?? '')
  const [answer,   setAnswer]     = useState(existingPost?.answer ?? '')
  const [keepUrls, setKeepUrls]   = useState<string[]>(existingPost?.imageUrls ?? [])
  const [newFiles, setNewFiles]   = useState<File[]>([])

  const totalImages = keepUrls.length + newFiles.length

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    const remaining = MAX_POST_IMAGES - totalImages
    if (remaining <= 0) return
    const valid: File[] = []
    for (const f of files.slice(0, remaining)) {
      const err = validateImageFile(f)
      if (err) { toast.error(err); continue }
      valid.push(f)
    }
    setNewFiles((prev) => [...prev, ...valid])
  }

  const handleSubmit = async () => {
    if (!question.trim() || !answer.trim() || !category) return
    try {
      const uploadedUrls = newFiles.length > 0
        ? (await uploadImages('SUPPORT', newFiles)).map((u) => u.getUrl)
        : []
      const body = {
        postType,
        category,
        question: question.trim(),
        answer: answer.trim(),
        imageUrls: [...keepUrls, ...uploadedUrls],
      }
      if (existingPost) {
        await update.mutateAsync({ id: existingPost.id, body })
      } else {
        await create.mutateAsync(body)
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했어요.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold text-gray-900">
            {existingPost ? '게시글 수정' : '게시글 작성'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">게시 유형</p>
            <div className="flex gap-2">
              {(['FAQ', 'QNA'] as SupportPostType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setPostType(t)}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-xl border-2 transition-colors',
                    postType === t
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  )}
                >
                  {t === 'FAQ' ? '자주하는 질문' : 'Q&A'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">카테고리</p>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as InquiryCategory | '')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-400 bg-white"
            >
              <option value="">카테고리를 선택해주세요</option>
              {INQUIRY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">질문</p>
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="질문을 입력하세요"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">답변</p>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={5}
              placeholder="답변 내용을 입력하세요"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-400 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-700">이미지 첨부</p>
              <p className="text-xs text-gray-400">{totalImages}/{MAX_POST_IMAGES}</p>
            </div>
            {(keepUrls.length + newFiles.length) > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {keepUrls.map((url, i) => (
                  <div key={`u-${i}`} className="relative">
                    <img src={url} alt="" className="w-full h-16 object-cover rounded-lg border border-gray-200" />
                    <button
                      onClick={() => setKeepUrls((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                    >
                      <X size={9} />
                    </button>
                  </div>
                ))}
                {newFiles.map((f, i) => (
                  <div key={`f-${i}`} className="relative">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-16 object-cover rounded-lg border border-gray-200" />
                    <button
                      onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                    >
                      <X size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {totalImages < MAX_POST_IMAGES && (
              <label className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-primary-300 hover:text-primary-500 cursor-pointer transition-colors">
                <ImageIcon size={14} />
                이미지 추가
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImages}
                />
              </label>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || !answer.trim() || !category || submitting}
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {submitting ? '저장 중...' : existingPost ? '수정' : '등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 메인 SupportPage ────────────────────────────────────────────────────────

export default function SupportPage() {
  const navigate     = useNavigate()
  const currentUser  = useAuthStore((s) => s.user)
  const isAdmin      = currentUser?.role === 'ADMIN'

  // 게시글 (FAQ + QNA 따로 fetch)
  const { data: faqPage } = useSupportPosts({ type: 'FAQ', page: 0, size: 50 })
  const { data: qnaPage } = useSupportPosts({ type: 'QNA', page: 0, size: 50 })
  const faqPosts = faqPage?.content ?? []
  const qnaPosts = qnaPage?.content ?? []
  const allPosts = [...faqPosts, ...qnaPosts]

  // 문의 — 관리자 전체 / 일반 본인
  const { data: adminPage } = useAdminInquiries({ page: 0, size: 50 })
  const { data: myPage }    = useMyInquiries({ page: 0, size: 50 })
  const adminInquiries = isAdmin ? (adminPage?.content ?? []) : []
  const myInquiries    = !isAdmin ? (myPage?.content ?? []) : []

  const createInquiry = useCreateInquiry()
  const deletePost    = useDeleteSupportPost()

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)
  const [searchTerm,       setSearchTerm]       = useState('')
  const [selectedTab,      setSelectedTab]      = useState<'faq' | 'inquiry'>('faq')

  // 관리자 — 게시글 작성/수정 모달
  const [postWriteOpen, setPostWriteOpen] = useState(false)
  const [editingPost,   setEditingPost]   = useState<SupportPost | null>(null)

  // 일반 유저 — 문의 폼
  const [inquiryCategory, setInquiryCategory] = useState<InquiryCategory | ''>('')
  const [inquiryTitle,    setInquiryTitle]    = useState('')
  const [inquiryContent,  setInquiryContent]  = useState('')
  const [inquiryEmail,    setInquiryEmail]    = useState(currentUser?.email ?? '')
  const [inquiryFiles,    setInquiryFiles]    = useState<File[]>([])
  const [submitted,       setSubmitted]       = useState(false)

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id)
    setExpandedQuestion(null)
  }
  const toggleQuestion = (index: number) =>
    setExpandedQuestion(expandedQuestion === index ? null : index)

  const filteredCategories = faqCategories
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0)

  const handleInquiryImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    const remaining = MAX_INQUIRY_IMAGES - inquiryFiles.length
    if (remaining <= 0) return
    const valid: File[] = []
    for (const f of files.slice(0, remaining)) {
      const err = validateImageFile(f)
      if (err) { toast.error(err); continue }
      valid.push(f)
    }
    setInquiryFiles((prev) => [...prev, ...valid])
  }

  const handleInquirySubmit = async () => {
    if (!inquiryTitle.trim() || !inquiryContent.trim() || !inquiryCategory || !inquiryEmail.trim()) return
    try {
      const imageUrls = inquiryFiles.length > 0
        ? (await uploadImages('SUPPORT', inquiryFiles)).map((u) => u.getUrl)
        : []
      await createInquiry.mutateAsync({
        category: inquiryCategory,
        title: inquiryTitle.trim(),
        content: inquiryContent.trim(),
        email: inquiryEmail.trim(),
        imageUrls,
      })
      setSubmitted(true)
      setInquiryTitle(''); setInquiryContent(''); setInquiryCategory(''); setInquiryFiles([])
      // email 은 다음 문의도 같은 거 쓸 가능성 → 유지
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '제출에 실패했어요.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Headphones className="text-primary-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-900">고객센터</h1>
            {isAdmin && (
              <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">관리자</span>
            )}
          </div>
          <p className="text-gray-600 mt-2">궁금하신 점이 있으신가요? 빠르고 정확하게 안내해드립니다.</p>
        </div>
      </div>

      {/* 연락처 배너 */}
      <div className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Phone size={24} />
              <div>
                <p className="font-medium">전화 상담</p>
                <p className="text-sm opacity-90">1234-5678</p>
                <p className="text-xs opacity-75">평일 09:00-18:00</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={24} />
              <div>
                <p className="font-medium">이메일 문의</p>
                <p className="text-sm opacity-90">help@sseulang.com</p>
                <p className="text-xs opacity-75">24시간 접수 가능</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle size={24} />
              <div>
                <p className="font-medium">실시간 채팅</p>
                <p className="text-sm opacity-90">평일 09:00-18:00</p>
                <p className="text-xs opacity-75">빠른 응대</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSelectedTab('faq')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
              selectedTab === 'faq' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HelpCircle size={20} />
            {isAdmin ? 'FAQ / Q&A 관리' : '자주하는 질문'}
          </button>
          <button
            onClick={() => setSelectedTab('inquiry')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
              selectedTab === 'inquiry' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle size={20} />
            {isAdmin ? `문의 관리 (${adminInquiries.length})` : '1:1 상담'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">

        {/* ── FAQ / Q&A 탭 ── */}
        {selectedTab === 'faq' && (
          <>
            {/* 관리자 — 게시글 관리 */}
            {isAdmin && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900">FAQ / Q&A 게시글 관리</h2>
                  <button
                    onClick={() => { setEditingPost(null); setPostWriteOpen(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                    게시글 추가
                  </button>
                </div>
                {allPosts.length === 0 && (
                  <p className="px-6 py-8 text-sm text-gray-400 text-center">등록된 게시글이 없어요</p>
                )}
                {faqPosts.length > 0 && (
                  <div>
                    <p className="px-6 py-2 text-xs font-semibold text-blue-600 bg-blue-50 border-b border-gray-100">
                      자주하는 질문 ({faqPosts.length})
                    </p>
                    {faqPosts.map((post) => (
                      <DynamicFaqItem
                        key={post.id}
                        post={post}
                        isAdmin
                        onEdit={() => { setEditingPost(post); setPostWriteOpen(true) }}
                        onDelete={() => deletePost.mutate(post.id)}
                      />
                    ))}
                  </div>
                )}
                {qnaPosts.length > 0 && (
                  <div className="border-t border-gray-100">
                    <p className="px-6 py-2 text-xs font-semibold text-green-600 bg-green-50 border-b border-gray-100">
                      Q&A ({qnaPosts.length})
                    </p>
                    {qnaPosts.map((post) => (
                      <DynamicFaqItem
                        key={post.id}
                        post={post}
                        isAdmin
                        onEdit={() => { setEditingPost(post); setPostWriteOpen(true) }}
                        onDelete={() => deletePost.mutate(post.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 일반 유저 — 백엔드 등록 FAQ/Q&A */}
            {!isAdmin && allPosts.length > 0 && (
              <div className="space-y-4">
                {faqPosts.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h2 className="text-base font-bold text-gray-900">자주하는 질문</h2>
                    </div>
                    {faqPosts.map((post) => (
                      <DynamicFaqItem
                        key={post.id}
                        post={post}
                        isAdmin={false}
                        onEdit={() => {}}
                        onDelete={() => {}}
                      />
                    ))}
                  </div>
                )}
                {qnaPosts.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h2 className="text-base font-bold text-gray-900">Q&A</h2>
                    </div>
                    {qnaPosts.map((post) => (
                      <DynamicFaqItem
                        key={post.id}
                        post={post}
                        isAdmin={false}
                        onEdit={() => {}}
                        onDelete={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 검색 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="궁금하신 내용을 검색해보세요"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* 정적 FAQ 아코디언 */}
            <div className="space-y-4">
              {filteredCategories.length > 0 ? filteredCategories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <span className="text-sm text-gray-500">({category.questions.length})</span>
                    </div>
                    {expandedCategory === category.id
                      ? <ChevronUp className="text-gray-400" size={20} />
                      : <ChevronDown className="text-gray-400" size={20} />}
                  </button>

                  {expandedCategory === category.id && (
                    <div className="border-t border-gray-200">
                      {category.questions.map((item, index) => (
                        <div key={index} className="border-b border-gray-100 last:border-b-0">
                          <button
                            onClick={() => toggleQuestion(index)}
                            className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900">{item.question}</p>
                              {expandedQuestion === index
                                ? <ChevronUp className="text-gray-400 shrink-0 ml-2" size={16} />
                                : <ChevronDown className="text-gray-400 shrink-0 ml-2" size={16} />}
                            </div>
                          </button>
                          {expandedQuestion === index && (
                            <div className="px-6 pb-4">
                              <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <HelpCircle size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">검색 결과가 없습니다</p>
                  <p className="text-sm text-gray-400 mt-2">다른 키워드로 검색해보세요</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── 1:1 문의 탭 ── */}
        {selectedTab === 'inquiry' && (
          <>
            {isAdmin ? (
              <AdminInquiryList inquiries={adminInquiries} navigate={navigate} />
            ) : (
              <>
                <UserInquiryForm
                  category={inquiryCategory}
                  title={inquiryTitle}
                  content={inquiryContent}
                  email={inquiryEmail}
                  files={inquiryFiles}
                  submitted={submitted}
                  pending={createInquiry.isPending}
                  onCategory={setInquiryCategory}
                  onTitle={setInquiryTitle}
                  onContent={setInquiryContent}
                  onEmail={setInquiryEmail}
                  onFiles={handleInquiryImages}
                  onRemoveFile={(i) => setInquiryFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  onSubmit={handleInquirySubmit}
                  onAgain={() => setSubmitted(false)}
                />

                {myInquiries.length > 0 && <MyInquiriesList inquiries={myInquiries} />}
              </>
            )}
          </>
        )}
      </div>

      {/* 게시글 작성/수정 */}
      {postWriteOpen && (
        <PostWriteModal
          existingPost={editingPost ?? undefined}
          onClose={() => { setPostWriteOpen(false); setEditingPost(null) }}
        />
      )}
    </div>
  )
}

// ── 분리 컴포넌트 ──────────────────────────────────────────────────────────

function AdminInquiryList({ inquiries, navigate }: { inquiries: Inquiry[]; navigate: (to: string) => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">전체 문의 목록</h2>
        <p className="text-xs text-gray-400 mt-0.5">클릭하면 상세 페이지에서 처리할 수 있어요</p>
      </div>
      {inquiries.length === 0 && (
        <p className="px-6 py-8 text-sm text-gray-400 text-center">문의 내역이 없어요</p>
      )}
      <ul className="divide-y divide-gray-100">
        {inquiries.map((inquiry) => {
          const sm = STATUS_MAP[inquiry.status]
          return (
            <li key={inquiry.id}>
              <button
                onClick={() => navigate(`/admin/support/${inquiry.id}`)}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-gray-400">{inquiry.category}</span>
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full', sm.cls)}>
                        {sm.icon}
                        {sm.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{inquiry.title}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{inquiry.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      사용자 #{inquiry.userId} · {formatKst(inquiry.createdAt, 'yyyy.MM.dd')}
                    </p>
                  </div>
                  <PenLine size={15} className="text-gray-300 shrink-0 mt-1" />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function MyInquiriesList({ inquiries }: { inquiries: Inquiry[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">내 문의 내역</h3>
      <div className="space-y-3">
        {inquiries.map((inquiry) => {
          const sm = STATUS_MAP[inquiry.status]
          return (
            <div key={inquiry.id} className="p-4 border border-gray-100 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{inquiry.title}</span>
                <span className="text-xs text-gray-500">{formatKst(inquiry.createdAt, 'yyyy.MM.dd')}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">{inquiry.content}</p>
              {inquiry.imageUrls.length > 0 && (
                <div className="flex gap-1.5 mb-2">
                  {inquiry.imageUrls.slice(0, 4).map((img, i) => (
                    <img key={i} src={img} alt="" className="w-12 h-12 object-cover rounded-md border border-gray-200" />
                  ))}
                  {inquiry.imageUrls.length > 4 && (
                    <div className="w-12 h-12 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-500">+{inquiry.imageUrls.length - 4}</span>
                    </div>
                  )}
                </div>
              )}
              <span className={cn('inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full', sm.cls)}>
                {sm.icon}
                {sm.label}
              </span>
              {inquiry.adminReply && (
                <div className="mt-2 p-2 bg-primary-50 rounded-lg border border-primary-100">
                  <p className="text-xs font-semibold text-primary-700 mb-0.5">관리자 답변</p>
                  <p className="text-xs text-primary-800 whitespace-pre-wrap">{inquiry.adminReply}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface UserInquiryFormProps {
  category: InquiryCategory | ''
  title: string
  content: string
  email: string
  files: File[]
  submitted: boolean
  pending: boolean
  onCategory: (v: InquiryCategory | '') => void
  onTitle: (v: string) => void
  onContent: (v: string) => void
  onEmail: (v: string) => void
  onFiles: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (index: number) => void
  onSubmit: () => void
  onAgain: () => void
}

function UserInquiryForm(props: UserInquiryFormProps) {
  const {
    category, title, content, email, files, submitted, pending,
    onCategory, onTitle, onContent, onEmail, onFiles, onRemoveFile, onSubmit, onAgain,
  } = props

  const canSubmit = title.trim() && content.trim() && category && email.trim() && !pending

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">1:1 상담 신청</h2>

      {submitted ? (
        <div className="py-8 text-center">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-gray-900">문의가 접수되었습니다</p>
          <p className="text-sm text-gray-500 mt-1">빠른 시일 내에 답변 드리겠습니다.</p>
          <button
            onClick={onAgain}
            className="mt-4 text-sm text-primary-600 hover:underline"
          >
            추가 문의하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">문의 유형</label>
            <select
              value={category}
              onChange={(e) => onCategory(e.target.value as InquiryCategory | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">문의 유형을 선택해주세요</option>
              {INQUIRY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitle(e.target.value)}
              placeholder="문의 제목을 입력해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => onContent(e.target.value)}
              placeholder="문의 내용을 상세하게 작성해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">이미지 첨부</label>
              <span className="text-xs text-gray-400">{files.length}/{MAX_INQUIRY_IMAGES}</span>
            </div>
            {files.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {files.map((f, i) => (
                  <div key={i} className="relative">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => onRemoveFile(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {files.length < MAX_INQUIRY_IMAGES && (
              <label className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-primary-300 hover:text-primary-500 cursor-pointer transition-colors">
                <Plus size={16} />
                사진 추가 ({MAX_INQUIRY_IMAGES - files.length}장 남음)
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={onFiles}
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmail(e.target.value)}
              placeholder="답변받을 이메일을 입력해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {pending ? '제출 중...' : '상담 신청하기'}
          </button>
        </div>
      )}
    </div>
  )
}
