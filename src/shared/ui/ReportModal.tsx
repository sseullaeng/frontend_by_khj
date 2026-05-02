// 신고 모달 — Item / User 공용 (가이드 §10)
//
// body: { reason: string (≤50, 필수), detail?: string (≤5000) }
// 본인 항목 신고도 백엔드 허용 (자기보호 케이스)

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { itemApi } from '@/features/item/api'
import { userApi } from '@/features/user/api'
import { useEmailGuard } from '@/features/auth/emailGuard'
import { BusinessError } from '@/shared/types'
import { Button } from './Button'

const REASONS = [
  '사기 의심',
  '금지 물품',
  '욕설/혐오',
  '스팸/광고',
  '음란물',
  '저작권 침해',
  '기타',
]

export type ReportTarget =
  | { kind: 'item'; itemId: number }
  | { kind: 'user'; userId: number }

interface Props {
  target: ReportTarget
  onClose: () => void
}

export default function ReportModal({ target, onClose }: Props) {
  const { isVerified } = useEmailGuard()
  const [reason, setReason] = useState(REASONS[0])
  const [detail, setDetail] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const body = { reason, detail: detail.trim() || undefined }
      return target.kind === 'item'
        ? itemApi.report(target.itemId, body)
        : userApi.report(target.userId, body)
    },
    onSuccess: () => {
      toast.success('신고가 접수됐어요. 검토 후 조치됩니다.')
      onClose()
    },
    onError: (err) => {
      if (err instanceof BusinessError) toast.error(err.message)
      else toast.error('신고 접수에 실패했어요.')
    },
  })

  const handleSubmit = () => {
    if (!isVerified) {
      toast.error('이메일 인증 후 신고할 수 있어요.')
      return
    }
    if (!reason) {
      toast.error('신고 사유를 선택해 주세요.')
      return
    }
    if (detail.length > 5000) {
      toast.error('상세 설명은 5000자 이하로 입력해 주세요.')
      return
    }
    mutate()
  }

  const targetLabel = target.kind === 'item' ? '물품' : '사용자'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{targetLabel} 신고</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* 사유 선택 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">신고 사유</p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    reason === r
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 상세 설명 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              상세 설명 <span className="text-xs text-gray-400">(선택)</span>
            </label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={5000}
              placeholder="신고 내용을 자세히 적어주세요"
              className="w-full h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{detail.length} / 5000</p>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            허위 신고는 제재 대상이 될 수 있어요. 신고 내용은 운영팀 검토 후 처리됩니다.
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
          >
            취소
          </button>
          <Button onClick={handleSubmit} isLoading={isPending} className="flex-1">
            신고하기
          </Button>
        </div>
      </div>
    </div>
  )
}
