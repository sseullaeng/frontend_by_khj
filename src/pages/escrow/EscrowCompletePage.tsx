// 에스크로 신청 완료 페이지 컴포넌트: 에스크로 신청 완료 정보 표시
import { useLocation, useNavigate } from 'react-router-dom'  // React Router 훅
import { CheckCircle, MapPin, List } from 'lucide-react'  // Lucide 아이콘들
import { Button } from '@/shared/ui/Button'  // 버튼 컴포넌트

// 완료 상태 인터페이스: 신청 완료 후 전달되는 데이터 타입
interface CompleteState {
  totalFee: number        // 총 배달비
  pickupAddress: string   // 픽업 주소
  deliveryAddress: string // 배달 주소
}

/**
 * 에스크로 신청 완료 페이지 컴포넌트
 * 
 * 기능:
 * - 에스크로 신청 완료 확인
 * - 배달비 및 주소 정보 표시
 * - 다음 안내 메시지 제공
 * - 목록 페이지로 이동
 * 
 * UI 구조:
 * - 상단: 완료 아이콘 및 메시지
 * - 중단: 배달 정보 요약
 * - 하단: 네비게이션 버튼
 */
export default function EscrowCompletePage() {
  const { state } = useLocation()  // 이전 페이지에서 전달된 상태 데이터
  const navigate  = useNavigate()  // 페이지 네비게이션 함수
  const data = state as CompleteState | null  // 완료 상태 데이터

  return (
    <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-6 text-center">
      {/* 완료 아이콘 */}
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle size={44} className="text-green-500" />
      </div>

      {/* 완료 메시지 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">신청 완료</h1>
        <p className="text-sm text-gray-500">
          입금 확인 후 배달기사가 배정됩니다.<br />
          진행 상황은 거래 목록에서 확인할 수 있습니다.
        </p>
      </div>

      {/* 요약 */}
      {data && (
        <div className="w-full bg-gray-50 rounded-xl border border-gray-200 p-5 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">결제 금액</span>
            <span className="font-bold text-primary-600">{data.totalFee.toLocaleString()}원</span>
          </div>
          <div className="flex items-start justify-between text-sm gap-4">
            <span className="text-gray-500 flex items-center gap-1 shrink-0">
              <MapPin size={13} />수령지
            </span>
            <span className="text-gray-900 text-right">{data.pickupAddress}</span>
          </div>
          <div className="flex items-start justify-between text-sm gap-4">
            <span className="text-gray-500 flex items-center gap-1 shrink-0">
              <MapPin size={13} />배달지
            </span>
            <span className="text-gray-900 text-right">{data.deliveryAddress}</span>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col gap-3 mt-2">
        <Button
          type="button"
          fullWidth
          onClick={() => navigate('/escrow/list', { replace: true })}
        >
          <List size={16} className="mr-1.5" />
          거래 목록 보기
        </Button>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}
