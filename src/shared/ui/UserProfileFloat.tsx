// 유저 프로필 플로팅 패널: 물품 상세·채팅창에서 프로필 클릭 시 오버레이로 표시
// 닉네임만 표시 — 이메일 절대 노출 금지
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Star, Package } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

// ── 타입 정의 ──────────────────────────────────────────────────────────────────

/** 유저 기본 프로필 */
interface UserProfile {
  id: number
  nickname: string
  profileImageUrl: string | null
  trustScore: number    // 0~100
  tradeCount: number
}

/** 유저가 등록한 물품 */
interface UserItem {
  id: number
  title: string
  imageUrl: string | null
  price: number
  rentPrice: number
  itemType: 'SELL' | 'RENT' | 'SHARE'
  status: 'ACTIVE' | 'RESERVED' | 'SOLD'
}

/** 이 유저에게 작성된 리뷰 */
interface UserReview {
  id: number
  reviewerNickname: string
  rating: number       // 1~5
  comment: string
  createdAt: string
}

/** 컴포넌트 Props */
interface Props {
  userId: number
  onClose: () => void
}

// ── 샘플 데이터 (실제 구현 시 API 호출로 대체) ────────────────────────────────

/** userId별 프로필 목업 */
const MOCK_PROFILES: Record<number, UserProfile> = {
  1:   { id: 1,   nickname: '홍길동',  profileImageUrl: null, trustScore: 92, tradeCount: 47 },
  2:   { id: 2,   nickname: '김철수',  profileImageUrl: null, trustScore: 78, tradeCount: 12 },
  10:  { id: 10,  nickname: '이영희',  profileImageUrl: null, trustScore: 85, tradeCount: 31 },
  999: { id: 999, nickname: '관리자',  profileImageUrl: null, trustScore: 100, tradeCount: 0 },
}

/** 샘플 물품 목록 (판매중·예약중·완료 혼합) */
const MOCK_ITEMS: UserItem[] = [
  { id: 1, title: '아이패드 프로 12.9인치',  imageUrl: null, price: 850000, rentPrice: 15000, itemType: 'SELL', status: 'ACTIVE' },
  { id: 2, title: '캠핑 텐트 4인용',          imageUrl: null, price: 0,      rentPrice: 8000,  itemType: 'RENT', status: 'ACTIVE' },
  { id: 3, title: '프레임 자전거',            imageUrl: null, price: 250000, rentPrice: 0,     itemType: 'SELL', status: 'SOLD' },
  { id: 4, title: '드럼 세탁기',              imageUrl: null, price: 180000, rentPrice: 0,     itemType: 'SELL', status: 'RESERVED' },
  { id: 5, title: '빔 프로젝터 (단기 대여)',  imageUrl: null, price: 0,      rentPrice: 20000, itemType: 'RENT', status: 'ACTIVE' },
]

/** 샘플 리뷰 목록 */
const MOCK_REVIEWS: UserReview[] = [
  { id: 1, reviewerNickname: '박민준', rating: 5, comment: '친절하고 거래가 빠릿해요! 물건 상태도 사진 그대로였어요.', createdAt: '2024-04-20' },
  { id: 2, reviewerNickname: '이수진', rating: 4, comment: '약속 시간 잘 지키고 좋은 거래였습니다.', createdAt: '2024-04-10' },
  { id: 3, reviewerNickname: '최재원', rating: 5, comment: '새 제품 같은 상태! 다음에도 거래하고 싶어요.', createdAt: '2024-03-28' },
]

// ── 라벨·색상 맵 ──────────────────────────────────────────────────────────────

/** 물품 유형 라벨·배색 */
const ITEM_TYPE_MAP = {
  SELL:  { label: '중고거래', cls: 'bg-orange-50 text-orange-500' },
  RENT:  { label: '대여',     cls: 'bg-blue-50 text-blue-500' },
  SHARE: { label: '나눔',     cls: 'bg-green-50 text-green-600' },
} as const

/** 물품 상태 라벨·색상 */
const ITEM_STATUS_MAP = {
  ACTIVE:   { label: '판매중', cls: 'text-green-600' },
  RESERVED: { label: '예약중', cls: 'text-yellow-600' },
  SOLD:     { label: '완료',   cls: 'text-gray-400' },
} as const

// ── 컴포넌트 ───────────────────────────────────────────────────────────────────

export default function UserProfileFloat({ userId, onClose }: Props) {
  // 현재 선택된 탭 (물품 목록 / 리뷰)
  const [tab, setTab] = useState<'items' | 'reviews'>('items')
  const navigate = useNavigate()

  // 유저 프로필 (실제 구현 시 React Query로 교체)
  const profile: UserProfile =
    MOCK_PROFILES[userId] ?? { id: userId, nickname: `유저 #${userId}`, profileImageUrl: null, trustScore: 0, tradeCount: 0 }

  // 신뢰도 점수에 따른 색상
  const trustCls =
    profile.trustScore >= 90 ? 'text-emerald-600' :
    profile.trustScore >= 70 ? 'text-blue-600'    :
    'text-gray-500'

  return (
    // 전체 화면 오버레이 (SideDrawer z-50보다 높은 z-[70])
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">

      {/* 반투명 배경 — 클릭 시 닫힘 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 패널 본체 */}
      <div className="relative z-10 w-full sm:w-96 bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] shadow-2xl">

        {/* 패널 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <p className="text-sm font-semibold text-gray-800">회원 프로필</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 스크롤 가능 영역 */}
        <div className="overflow-y-auto flex-1">

          {/* ── 프로필 요약 ── */}
          <div className="px-5 py-5 flex items-center gap-4 border-b border-gray-50">
            {/* 프로필 이미지 또는 닉네임 첫 글자 */}
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
              {profile.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt={profile.nickname} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-indigo-600">{profile.nickname[0]}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* 닉네임 — 이메일 절대 표시 금지 */}
              <p className="text-lg font-bold text-gray-900 truncate">{profile.nickname}</p>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {/* 신뢰도 */}
                <span className={cn('text-sm font-semibold', trustCls)}>
                  신뢰도 {profile.trustScore}
                </span>
                <span className="text-gray-300 text-xs">·</span>
                {/* 거래 건수 */}
                <span className="text-sm text-gray-500">거래 {profile.tradeCount}건</span>
              </div>

              {/* 신뢰도 게이지 바 */}
              <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    profile.trustScore >= 90 ? 'bg-emerald-400' :
                    profile.trustScore >= 70 ? 'bg-blue-400'    :
                    'bg-gray-300'
                  )}
                  style={{ width: `${profile.trustScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── 탭 전환 ── */}
          <div className="flex border-b border-gray-100 shrink-0">
            {/* 판매·대여 물품 탭 */}
            <button
              onClick={() => setTab('items')}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-colors border-b-2',
                tab === 'items'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              판매·대여 물품
            </button>
            {/* 리뷰 탭 */}
            <button
              onClick={() => setTab('reviews')}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-colors border-b-2',
                tab === 'reviews'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              리뷰 {MOCK_REVIEWS.length}개
            </button>
          </div>

          {/* ── 물품 목록 탭 ── */}
          {tab === 'items' && (
            <ul className="divide-y divide-gray-50">
              {MOCK_ITEMS.length === 0 ? (
                <li className="py-10 text-center text-sm text-gray-400">등록된 물품이 없어요</li>
              ) : (
                MOCK_ITEMS.map((item) => (
                  <li key={item.id}>
                    {/* 클릭 시 패널 닫고 상세 페이지로 이동 */}
                    <button
                      onClick={() => { onClose(); navigate(`/items/${item.id}`) }}
                      className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      {/* 물품 섬네일 */}
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={18} className="text-gray-300" />
                        )}
                      </div>

                      {/* 물품 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {/* 유형 배지 */}
                          <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', ITEM_TYPE_MAP[item.itemType].cls)}>
                            {ITEM_TYPE_MAP[item.itemType].label}
                          </span>
                          {/* 상태 텍스트 */}
                          <span className={cn('text-xs font-medium', ITEM_STATUS_MAP[item.status].cls)}>
                            {ITEM_STATUS_MAP[item.status].label}
                          </span>
                        </div>
                      </div>

                      {/* 가격 */}
                      <div className="text-right shrink-0">
                        {item.itemType === 'SHARE' ? (
                          <p className="text-sm font-semibold text-green-600">무료</p>
                        ) : (
                          <>
                            {item.price > 0 && (
                              <p className="text-sm font-semibold text-gray-900">{item.price.toLocaleString()}원</p>
                            )}
                            {item.rentPrice > 0 && (
                              <p className="text-xs text-blue-500">{item.rentPrice.toLocaleString()}원/일</p>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}

          {/* ── 리뷰 탭 ── */}
          {tab === 'reviews' && (
            <ul className="divide-y divide-gray-50">
              {MOCK_REVIEWS.length === 0 ? (
                <li className="py-10 text-center text-sm text-gray-400">아직 리뷰가 없어요</li>
              ) : (
                MOCK_REVIEWS.map((review) => (
                  <li key={review.id} className="px-5 py-4 flex flex-col gap-1.5">
                    {/* 리뷰어 닉네임 + 날짜 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{review.reviewerNickname}</span>
                      <span className="text-xs text-gray-400">{review.createdAt}</span>
                    </div>

                    {/* 별점 */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < review.rating ? 'text-yellow-400' : 'text-gray-200'}
                          fill={i < review.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">{review.rating}.0</span>
                    </div>

                    {/* 리뷰 내용 */}
                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                  </li>
                ))
              )}
            </ul>
          )}

          {/* 하단 여백 */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}
