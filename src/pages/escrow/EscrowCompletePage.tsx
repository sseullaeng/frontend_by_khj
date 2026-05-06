// 거래대행 신청 완료 안내
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, MapPin, List } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import type { EscrowApplication } from '@/features/escrow/types'

interface CompleteState {
  application?: EscrowApplication
  paid?: number
}

export default function EscrowCompletePage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const data = state as CompleteState | null
  const app = data?.application

  return (
    <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle size={44} className="text-green-500" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">신청 완료</h1>
        <p className="text-sm text-gray-500">
          결제 확인 후 라이더가 배정돼요.<br />
          진행 상황은 거래 목록에서 확인할 수 있어요.
        </p>
      </div>

      {app && (
        <div className="w-full bg-gray-50 rounded-xl border border-gray-200 p-5 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">신청 ID</span>
            <span className="text-gray-900 font-mono">#{app.id}</span>
          </div>
          {data.paid != null && data.paid > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">결제 금액 (내 share)</span>
              <span className="font-bold text-primary-600">{data.paid.toLocaleString()}원</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">총 청구액</span>
            <span className="text-gray-900">{app.appliedTotalFee.toLocaleString()}원</span>
          </div>
          <hr />
          <div className="flex items-start justify-between text-sm gap-4">
            <span className="text-gray-500 flex items-center gap-1 shrink-0">
              <MapPin size={13} />픽업
            </span>
            <span className="text-gray-900 text-right">{app.pickupAddress}</span>
          </div>
          <div className="flex items-start justify-between text-sm gap-4">
            <span className="text-gray-500 flex items-center gap-1 shrink-0">
              <MapPin size={13} />배달
            </span>
            <span className="text-gray-900 text-right">{app.deliveryAddress}</span>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col gap-3 mt-2">
        <Button type="button" fullWidth onClick={() => navigate('/escrow/list', { replace: true })}>
          <List size={16} className="mr-1.5" />
          거래 목록 보기
        </Button>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="text-sm text-gray-500 hover:underline"
        >
          홈으로
        </button>
      </div>
    </div>
  )
}
