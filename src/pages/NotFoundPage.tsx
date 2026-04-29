import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <p className="text-7xl font-bold text-gray-200">404</p>
      <h1 className="text-xl font-bold text-gray-800">페이지를 찾을 수 없어요</h1>
      <p className="text-sm text-gray-500">주소가 잘못됐거나 삭제된 페이지예요.</p>
      <Button as={Link} to="/">홈으로 가기</Button>
    </div>
  )
}
