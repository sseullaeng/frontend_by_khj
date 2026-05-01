// 포인트 페이지 컴포넌트: 사용자 포인트 잔액 조회 및 충전/출금 기능을 제공하는 페이지
import { useQuery } from '@tanstack/react-query'  // React Query 훅
import { Link } from 'react-router-dom'  // React Router의 Link 컴포넌트
import { paymentApi } from '@/features/payment/api'  // 결제 API
import { pointKeys } from '@/features/payment/keys'  // 포인트 관련 쿼리 키
import { Card } from '@/shared/ui/Card'  // 카드 컴포넌트

/**
 * 포인트 페이지 컴포넌트
 * 
 * 기능:
 * - 사용자 현재 포인트 잔액 조회
 * - 포인트 충전 페이지로 이동
 * - 포인트 출금 페이지로 이동
 * - 잔액 정보 카드 형태로 표시
 * - 반응형 버튼 레이아웃
 * 
 * 데이터 흐름:
 * 1. 페이지 로드 시 포인트 잔액 API 호출
 * 2. React Query로 데이터 캐싱 및 상태 관리
 * 3. 잔액 정보 카드에 표시
 * 4. 충전/출금 버튼으로 각 기능 페이지 연결
 */
export default function PointPage() {
  // 포인트 잔액 조회 (React Query 사용)
  const { data: balance } = useQuery({
    queryKey: pointKeys.balance(),  // 쿼리 키: 포인트 잔액
    queryFn: () => paymentApi.getBalance().then((r) => r.data),  // API 호출 함수
  })

  return (
    <div className="flex flex-col gap-4">
      {/* 페이지 제목 */}
      <h1 className="text-xl font-bold">포인트</h1>

      {/* 포인트 잔액 카드 */}
      <Card className="text-center py-6">
        <p className="text-sm text-gray-500 mb-1">현재 잔액</p>
        <p className="text-3xl font-bold text-primary-500">
          {/* 숫자 포맷팅 (천 단위 구분자) */}
          {(balance?.balance ?? 0).toLocaleString()}원
        </p>
      </Card>

      {/* 포인트 관리 버튼들 */}
      <div className="flex gap-2">
        {/* 포인트 충전 버튼 */}
        <Link 
          to="/point/charge" 
          className="flex-1 py-2.5 text-center border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          충전하기
        </Link>
        
        {/* 포인트 출금 버튼 */}
        <Link 
          to="/point/withdraw" 
          className="flex-1 py-2.5 text-center border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          출금하기
        </Link>
      </div>

      <h2 className="text-base font-semibold mt-2">이용 내역</h2>
      {/* TODO: 포인트 내역 리스트 (D7 구현) */}
      <p className="text-sm text-gray-400 text-center py-4">내역을 불러오는 중...</p>
    </div>
  )
}
