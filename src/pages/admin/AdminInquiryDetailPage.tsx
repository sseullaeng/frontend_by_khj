// 관리자 문의 상세 페이지: 문의 내용 확인·처리 상태 변경·관리자 답변 작성·삭제
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronUp, ChevronDown,
  Trash2, AlertCircle, Clock, CheckCircle2,
} from 'lucide-react'
import { useSupportStore, type InquiryStatus } from '@/shared/store/supportStore'
import { cn } from '@/shared/lib/cn'

/** 처리 상태 메타데이터 */
const STATUS_MAP: Record<InquiryStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:    { label: '접수 완료', cls: 'bg-gray-100 text-gray-600',   icon: <AlertCircle  size={12} /> },
  processing: { label: '처리 중',  cls: 'bg-blue-100 text-blue-700',   icon: <Clock        size={12} /> },
  done:       { label: '답변 완료', cls: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> },
}

export default function AdminInquiryDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const inquiryId = parseInt(id ?? '0')

  const { inquiries, updateInquiryStatus, deleteInquiry } = useSupportStore()

  // 현재·이전·다음 문의
  const inquiry      = inquiries.find(i => i.id === inquiryId)
  const currentIndex = inquiries.findIndex(i => i.id === inquiryId)
  const prevInquiry  = currentIndex > 0 ? inquiries[currentIndex - 1] : null
  const nextInquiry  = currentIndex < inquiries.length - 1 ? inquiries[currentIndex + 1] : null

  // 로컬 편집 상태 (저장 전)
  const [reply,      setReply]      = useState(inquiry?.adminReply ?? '')
  const [status,     setStatus]     = useState<InquiryStatus>(inquiry?.status ?? 'pending')
  const [deleteOpen, setDeleteOpen] = useState(false)

  // 문의를 찾지 못한 경우
  if (!inquiry) {
    return (
      <div className="py-16 text-center text-gray-400">
        <p className="text-sm">문의를 찾을 수 없어요.</p>
        <button
          onClick={() => navigate('/support')}
          className="mt-4 text-sm text-primary-600 hover:underline"
        >
          고객센터로 돌아가기
        </button>
      </div>
    )
  }

  const sm = STATUS_MAP[status]

  /** 수정사항 저장 후 뒤로 이동 */
  const handleSave = () => {
    updateInquiryStatus(inquiry.id, status, reply)
    navigate(-1)
  }

  /** 문의 삭제 후 고객센터 목록으로 이동 */
  const handleDelete = () => {
    deleteInquiry(inquiry.id)
    navigate('/support', { replace: true })
  }

  return (
    <div className="pb-10 space-y-4">

      {/* 상단: 뒤로가기 + 제목 + 처리 상태 태그 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 truncate">문의 상세</h1>
        {/* 현재 처리 상태 태그 */}
        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full shrink-0', sm.cls)}>
          {sm.icon}
          {sm.label}
        </span>
      </div>

      {/* 문의 내용 카드 */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1 flex-wrap text-xs text-gray-400">
            <span>{inquiry.category}</span>
            <span>·</span>
            <span>{new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}</span>
          </div>
          <h2 className="text-base font-bold text-gray-900">{inquiry.title}</h2>
          <p className="text-xs text-gray-500 mt-1">{inquiry.userName} · {inquiry.email}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{inquiry.content}</p>
          {/* 유저가 첨부한 이미지 */}
          {inquiry.images && inquiry.images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {inquiry.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`첨부이미지 ${i + 1}`}
                  className="w-full h-28 object-cover rounded-lg border border-gray-200"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 처리 상태 선택 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-700 mb-3">처리 상태</p>
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(STATUS_MAP) as [InquiryStatus, typeof STATUS_MAP[InquiryStatus]][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors',
                status === key
                  ? val.cls + ' border-current'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
              )}
            >
              {val.icon}
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* 관리자 답변 입력 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">관리자 답변</p>
        <textarea
          value={reply}
          onChange={e => setReply(e.target.value)}
          rows={5}
          placeholder="사용자에게 전달할 답변을 입력하세요"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 resize-none"
        />
      </div>

      {/* 액션 버튼: 삭제 / 취소 / 저장 */}
      <div className="flex gap-2">
        <button
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-1 px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm transition-colors"
        >
          <Trash2 size={14} />
          삭제
        </button>
        <button
          onClick={() => navigate(-1)}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          저장
        </button>
      </div>

      {/* 이전글 / 다음글 + 목록 버튼 (새소식/이벤트 레이아웃과 동일) */}
      <div className="flex gap-4 items-center">
        <button
          onClick={() => navigate('/support')}
          className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm shrink-0"
        >
          목록으로
        </button>

        <div className="flex flex-col gap-2 flex-1">
          {/* 이전 문의 */}
          {prevInquiry && (
            <button
              onClick={() => navigate(`/admin/support/${prevInquiry.id}`)}
              className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs min-w-0 w-full text-left"
            >
              <ChevronUp size={14} className="shrink-0" />
              <span className="font-medium text-gray-900 line-clamp-1 flex-1">{prevInquiry.title}</span>
              {/* 이전 문의 처리 상태 태그 */}
              <span className={cn('ml-auto shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full', STATUS_MAP[prevInquiry.status].cls)}>
                {STATUS_MAP[prevInquiry.status].label}
              </span>
            </button>
          )}
          {/* 다음 문의 */}
          {nextInquiry && (
            <button
              onClick={() => navigate(`/admin/support/${nextInquiry.id}`)}
              className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs min-w-0 w-full text-left"
            >
              <ChevronDown size={14} className="shrink-0" />
              <span className="font-medium text-gray-900 line-clamp-1 flex-1">{nextInquiry.title}</span>
              {/* 다음 문의 처리 상태 태그 */}
              <span className={cn('ml-auto shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full', STATUS_MAP[nextInquiry.status].cls)}>
                {STATUS_MAP[nextInquiry.status].label}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">문의를 삭제할까요?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제된 문의는 복구할 수 없어요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
