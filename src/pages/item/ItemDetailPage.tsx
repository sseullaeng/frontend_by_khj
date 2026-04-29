import { useParams, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useItemDetail, useToggleWish } from '@/features/item/hooks'
import { Button } from '@/shared/ui/Button'
import { toDateString } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: item, isLoading } = useItemDetail(Number(id))
  const { mutate: toggleWish } = useToggleWish(Number(id))

  if (isLoading) return <div className="py-20 text-center text-gray-400">불러오는 중...</div>
  if (!item) return <div className="py-20 text-center text-gray-400">상품을 찾을 수 없어요</div>

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* 이미지 갤러리 */}
      <div className="h-72 bg-gray-100 rounded-2xl overflow-hidden">
        {item.imageUrls[0] && (
          <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
        )}
      </div>

      {/* 판매자 정보 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
          {item.sellerProfileImageUrl && (
            <img src={item.sellerProfileImageUrl} alt={item.sellerNickname} className="w-full h-full object-cover" />
          )}
        </div>
        <span className="font-medium text-sm">{item.sellerNickname}</span>
      </div>

      {/* 상품 정보 */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{item.title}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {item.category} · {toDateString(item.createdAt)}
        </p>
      </div>

      <p className="text-2xl font-bold text-gray-900">
        {item.itemType === 'SHARE' ? '나눔' : `${item.price.toLocaleString()}원`}
      </p>

      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
        {item.description}
      </p>

      {/* 해시태그 */}
      {item.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.hashtags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex items-center gap-3 max-w-screen-md mx-auto">
        <button
          onClick={() => toggleWish()}
          className={cn(
            'p-3 border rounded-xl',
            item.isWished ? 'border-red-400 text-red-500' : 'border-gray-300 text-gray-400'
          )}
          aria-label="찜하기"
        >
          <Heart size={20} fill={item.isWished ? 'currentColor' : 'none'} />
        </button>
        <Button
          fullWidth
          onClick={() => navigate(`/chats`, { state: { itemId: item.id } })}
        >
          채팅으로 거래하기
        </Button>
      </div>
    </div>
  )
}
