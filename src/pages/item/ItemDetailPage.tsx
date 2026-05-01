import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, MapPin, Eye, Clock, ChevronLeft, Flag } from 'lucide-react'
import { useItemDetail, useToggleWish } from '@/features/item/hooks'
import { useDrawerStore } from '@/shared/store/drawerStore'
import { chatApi } from '@/features/chat/api'
import { cn } from '@/shared/lib/cn'
import { fromNow } from '@/shared/lib/date'

const STATUS_MAP = {
  ACTIVE:   { label: '판매중',   cls: 'bg-green-100 text-green-700' },
  RESERVED: { label: '예약중',   cls: 'bg-yellow-100 text-yellow-700' },
  SOLD:     { label: '판매완료', cls: 'bg-gray-100 text-gray-500' },
  HIDDEN:   { label: '숨김',     cls: 'bg-red-100 text-red-600' },
} as const

const TYPE_MAP = {
  SELL:  { label: '중고거래', cls: 'bg-orange-50 text-orange-500 border border-orange-200' },
  RENT:  { label: '대여',     cls: 'bg-blue-50 text-blue-500 border border-blue-200' },
  SHARE: { label: '나눔',     cls: 'bg-green-50 text-green-600 border border-green-200' },
} as const

export default function ItemDetailPage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const { data: item, isLoading } = useItemDetail(Number(id))
  const { mutate: toggleWish }    = useToggleWish(Number(id))
  const { open, openChatRoom }    = useDrawerStore()

  const handleChat = async () => {
    open('chat')
    try {
      const res = await chatApi.createRoom(item!.id)
      openChatRoom(res.data.id)
    } catch {
      // drawer가 이미 열려 있으므로 채팅 목록 표시
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-gray-400 text-sm">불러오는 중...</p>
    </div>
  )
  if (!item) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <p className="text-gray-700 font-semibold">상품을 찾을 수 없어요</p>
      <button onClick={() => navigate(-1)} className="text-primary-500 text-sm">← 돌아가기</button>
    </div>
  )

  const status = STATUS_MAP[item.status]
  const type   = TYPE_MAP[item.itemType]

  return (
    <div className="max-w-5xl mx-auto pb-28">

      {/* 뒤로가기 + 신고 */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={16} /> 목록으로
        </button>
        <button
          onClick={() => navigate(`/items/${id}/report`)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <Flag size={13} /> 신고
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-10">

        {/* ── 이미지 영역 ── */}
        <div className="mb-6 lg:mb-0">
          <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
            {item.imageUrls[0] ? (
              <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200" />
            )}
          </div>

          {item.imageUrls.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {item.imageUrls.slice(1).map((url, i) => (
                <div key={i} className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 상품 정보 ── */}
        <div className="flex flex-col gap-5">

          {/* 배지 */}
          <div className="flex items-center gap-2">
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', type.cls)}>
              {type.label}
            </span>
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', status.cls)}>
              {status.label}
            </span>
          </div>

          {/* 제목 */}
          <h1 className="text-xl font-bold text-gray-900 leading-snug">{item.title}</h1>

          {/* 가격 */}
          <div className="flex flex-col gap-0.5">
            {item.itemType === 'SHARE' ? (
              <span className="text-2xl font-bold text-green-600">무료 나눔</span>
            ) : (
              <span className="text-2xl font-bold text-gray-900">
                {item.price.toLocaleString()}원
              </span>
            )}
          </div>

          {/* 판매자 정보 */}
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.sellerProfileImageUrl ? (
                <img src={item.sellerProfileImageUrl} alt={item.sellerNickname} className="w-full h-full object-cover" />
              ) : (
                <span className="text-indigo-600 font-bold text-sm">
                  {item.sellerNickname[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.sellerNickname}</p>
              <p className="text-xs text-gray-400 mt-0.5">거래 12건 · ★ 4.8</p>
            </div>
            <Link
              to={`/users/${item.sellerId}`}
              className="text-xs text-primary-500 font-medium hover:underline flex-shrink-0"
            >
              프로필 보기
            </Link>
          </div>

          <hr className="border-gray-100" />

          {/* 상품 설명 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">상품 설명</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* 해시태그 */}
          {item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.hashtags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 메타 정보 */}
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={12} /> 서울</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {fromNow(item.createdAt)}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Eye size={12} /> 조회 {item.viewCount}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Heart size={12} /> 관심 {item.wishCount}
            </span>
          </div>

          {/* 데스크탑 액션 버튼 */}
          <div className="hidden lg:flex items-center gap-2 pt-2">
            <button
              onClick={() => toggleWish()}
              className={cn(
                'p-3 border rounded-xl transition-colors flex-shrink-0',
                item.isWished
                  ? 'border-red-300 text-red-500 bg-red-50'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
              )}
              aria-label="찜하기"
            >
              <Heart size={20} fill={item.isWished ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleChat}
              className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              채팅하기
            </button>
          </div>

        </div>
      </div>

      {/* 모바일 하단 고정 CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-2">
        <button
          onClick={() => toggleWish()}
          className={cn(
            'p-3 border rounded-xl transition-colors flex-shrink-0',
            item.isWished ? 'border-red-300 text-red-500 bg-red-50' : 'border-gray-200 text-gray-400'
          )}
          aria-label="찜하기"
        >
          <Heart size={20} fill={item.isWished ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={handleChat}
          className="flex-1 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold"
        >
          채팅하기
        </button>
      </div>

    </div>
  )
}
