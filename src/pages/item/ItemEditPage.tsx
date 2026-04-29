import { useParams } from 'react-router-dom'
import { useItemDetail } from '@/features/item/hooks'

export default function ItemEditPage() {
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading } = useItemDetail(Number(id))

  if (isLoading) return <div className="py-20 text-center text-gray-400">불러오는 중...</div>
  if (!item) return <div className="py-20 text-center text-gray-400">상품을 찾을 수 없어요</div>

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">상품 수정</h1>
      {/* TODO: ItemCreatePage 폼 재활용 (defaultValues로 item 데이터 채워줌) */}
      <p className="text-gray-500 text-sm">수정 폼 (D5 구현)</p>
    </div>
  )
}
