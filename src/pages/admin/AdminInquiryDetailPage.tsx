// 관리자 문의 상세 페이지: 백엔드 hook 연동 (라운드7)
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  AlertCircle, Clock, CheckCircle2,
} from 'lucide-react'
import {
  useAdminInquiryDetail,
  useReplyInquiry,
  useUpdateInquiryStatus,
} from '@/features/support/hooks'
import type { InquiryStatus } from '@/features/support/types'
import { cn } from '@/shared/lib/cn'
import { formatKst } from '@/shared/lib/date'

const STATUS_MAP: Record<InquiryStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING:    { label: '접수 완료', cls: 'bg-gray-100 text-gray-600',   icon: <AlertCircle  size={12} /> },
  PROCESSING: { label: '처리 중',  cls: 'bg-blue-100 text-blue-700',   icon: <Clock        size={12} /> },
  DONE:       { label: '답변 완료', cls: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> },
}

export default function AdminInquiryDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const inquiryId = parseInt(id ?? '0')

  const { data: inquiry, isLoading } = useAdminInquiryDetail(inquiryId || undefined)

  const replyMut       = useReplyInquiry()
  const statusMut      = useUpdateInquiryStatus()
  const submitting     = replyMut.isPending || statusMut.isPending

  // 로컬 편집 상태 (서버 데이터 도착 시 동기화)
  const [reply,      setReply]      = useState('')
  const [status,     setStatus]     = useState<InquiryStatus>('PENDING')

  useEffect(() => {
    if (inquiry) {
      setReply(inquiry.adminReply ?? '')
      setStatus(inquiry.status)
    }
  }, [inquiry])

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

  const sm = STATUS_MAP[status]

  /**
   * 저장 — reply 와 status 변경을 한 번에 적용:
   *   · reply 변경 → PATCH /reply (status 같이 보냄)
   *   · reply 변경 없고 status 만 변경 → PATCH /status
   *   · 답변 없이 DONE 시도 → 백엔드가 INQUIRY_INVALID_STATE 반환
   */
  const handleSave = async () => {
    const replyChanged  = reply !== (inquiry.adminReply ?? '')
    const statusChanged = status !== inquiry.status

    try {
      if (replyChanged) {
        await replyMut.mutateAsync({
          id: inquiry.id,
          body: { adminReply: reply, status },
        })
      } else if (statusChanged) {
        await statusMut.mutateAsync({ id: inquiry.id, body: { status } })
      }
      navigate(-1)
    } catch {
      // hook 에서 토스트 — 머무름
    }
  }

  return (
    <div className="pb-10 space-y-4">

      {/* 상단 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 truncate">문의 상세</h1>
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
          <p className="text-xs text-gray-500 mt-1">사용자 #{inquiry.userId} · {inquiry.email}</p>
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

      {/*
        처리 상태 — 라운드8 백엔드 상태머신:
          · PENDING 으로의 되돌림은 항상 400 (선택지 제외)
          · DONE → PROCESSING/PENDING 전이 모두 400 (DONE 일 때 변경 UI 자체 숨김)
          · 답변 없이 DONE 시도 시 400 (UI 안내)
      */}
      {inquiry.status !== 'DONE' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-700 mb-3">처리 상태</p>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(STATUS_MAP) as [InquiryStatus, typeof STATUS_MAP[InquiryStatus]][])
              // PENDING 선택지 제외 — 이미 PENDING 인 경우만 표시 의미 있음
              .filter(([key]) => key !== 'PENDING' || inquiry.status === 'PENDING')
              .map(([key, val]) => (
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
          {status === 'DONE' && !reply.trim() && (
            <p className="text-xs text-amber-600 mt-2">답변 없이 완료로 변경할 수 없어요.</p>
          )}
        </div>
      )}

      {/* 관리자 답변 */}
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

      {/* 액션 */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate(-1)}
          disabled={submitting}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={submitting}
          className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {submitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
