import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paymentApi } from '@/features/payment/api'
import { pointKeys } from '@/features/payment/keys'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

export default function PointPage() {
  const { data: balance } = useQuery({
    queryKey: pointKeys.balance(),
    queryFn: () => paymentApi.getBalance().then((r) => r.data),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">포인트</h1>

      <Card className="text-center py-6">
        <p className="text-sm text-gray-500 mb-1">현재 잔액</p>
        <p className="text-3xl font-bold text-primary-500">
          {(balance?.balance ?? 0).toLocaleString()}원
        </p>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" fullWidth as={Link} to="/point/charge">
          충전하기
        </Button>
        <Button variant="outline" fullWidth as={Link} to="/point/withdraw">
          출금하기
        </Button>
      </div>

      <h2 className="text-base font-semibold mt-2">이용 내역</h2>
      {/* TODO: 포인트 내역 리스트 (D7 구현) */}
      <p className="text-sm text-gray-400 text-center py-4">내역을 불러오는 중...</p>
    </div>
  )
}
