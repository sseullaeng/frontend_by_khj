// 본인 문의 상세 — 라운드8: 고객지원 답변 알림 클릭 시 진입
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, AlertCircle, Clock, CheckCircle2, Trash2,
} from 'lucide-react'
import {
  useDeleteMyInquiry,
  useInquiryDetail,
} from '@/features/support/hooks'
import type { InquiryStatus } from '@/features/support/types'
import { cn } from '@/shared/lib/cn'
import { formatKst } from '@/shared/lib/date'

const STATUS_MAP: Record<InquiryStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING:    { label: '접수 완료', cls: 'bg-gray-100 text-gray-600',   icon: <AlertCircle  size={12} /> },
  PROCESSING: { label: '처리 중',  cls: 'bg-blue-100 text-blue-700',   icon: <Clock        size={12} /> },
  DONE:       { label: '답변 완료', cls: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> },
}

export default function MyInquiryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const inquiryId = id ? parseInt(id) : 0

  const { data: inquiry, isLoading } = useInquiryDetail(inquiryId || undefined)
  const deleteMine = useDeleteMyInquiry()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
  }

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

  const sm = STATUS_MAP[inquiry.status]
  const canDelete = inquiry.status === 'PENDING'

  const handleDelete = async () => {
    try {
      await deleteMine.mutateAsync(inquiry.id)
      navigate('/support', { replace: true })
    } catch {
      setConfirmOpen(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-10 space-y-4">

      {/* 상단 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 truncate">내 문의 상세</h1>
        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full shrink-0', sm.cls)}>
          {sm.icon}
          {sm.label}
        </span>
      </div>

      {/* 문의 내용 */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1 flex-wrap text-xs text-gray-400">
            <span>{inquiry.category}</span>
            <span>·</span>
            <span>{formatKst(inquiry.createdAt, 'yyyy.MM.dd HH:mm')}</span>
          </div>
          <h2 className="text-base font-bold text-gray-900">{inquiry.title}</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{inquiry.content}</p>
          {inquiry.imageUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {inquiry.imageUrls.map((img, i) => (
                <a key={i} href={img} target="_blank" rel="noreferrer">
                  <img
                    src={img}
                    alt={`첨부이미지 ${i + 1}`}
                    className="w-full h-28 object-cover rounded-lg border border-gray-200"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 관리자 답변 */}
      {inquiry.adminReply && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5">
          <p className="text-xs font-semibold text-primary-700 mb-2">
            관리자 답변
            {inquiry.repliedAt && (
              <span className="ml-2 font-normal text-primary-500">
                {formatKst(inquiry.repliedAt, 'yyyy.MM.dd HH:mm')}
              </span>
            )}
          </p>
          <p className="text-sm text-primary-900 whitespace-pre-wrap leading-relaxed">{inquiry.adminReply}</p>
        </div>
      )}

      {/* 액션 */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/support')}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
        >
          목록으로
        </button>
        {canDelete && (
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleteMine.isPending}
            className="flex items-center gap-1 px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 rounded-xl text-sm transition-colors"
          >
            <Trash2 size={14} />
            삭제
          </button>
        )}
      </div>

      {/* 삭제 확인 */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">문의를 삭제할까요?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제된 문의는 복구할 수 없어요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={deleteMine.isPending}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMine.isPending}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
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
