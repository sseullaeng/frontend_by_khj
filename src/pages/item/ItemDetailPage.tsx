// 물품 상세 페이지: 물품 정보 표시, 구매/대여 선택(날짜 포함) 후 채팅 시작
// UC-19(물품 대여 신청), UC-20(물품 거래), UC-21(채팅하기), UC-24(관심등록) 관련
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Heart, MapPin, Eye, Clock, ChevronLeft, Flag,
  Pencil, Trash2, ShoppingCart, RefreshCw, CalendarDays, AlertCircle,
} from 'lucide-react'
import { useItemDetail, useToggleWish, useDeleteItem } from '@/features/item/hooks'  // 물품 관련 훅
import { useDrawerStore } from '@/shared/store/drawerStore'                           // 드로워 상태 스토어
import { useAuthStore } from '@/features/auth/store'                                  // 인증 상태 스토어
import { chatApi } from '@/features/chat/api'                                         // 채팅 API
import { cn } from '@/shared/lib/cn'                                                  // 조건부 클래스 유틸
import { fromNow } from '@/shared/lib/date'                                           // 날짜 포맷 유틸

// ─── 상수 정의 ────────────────────────────────────────────────────────────────

// 물품 상태별 라벨·배경색 맵핑
const STATUS_MAP = {
  ACTIVE:   { label: '판매중',   cls: 'bg-green-100 text-green-700' },    // 활성 상태
  RESERVED: { label: '예약중',   cls: 'bg-yellow-100 text-yellow-700' },  // 예약 상태
  SOLD:     { label: '판매완료', cls: 'bg-gray-100 text-gray-500' },      // 판매 완료
  HIDDEN:   { label: '숨김',     cls: 'bg-red-100 text-red-600' },        // 숨김 상태
} as const

// 거래 유형별 라벨·배경색 맵핑
const TYPE_MAP = {
  SELL:  { label: '중고거래', cls: 'bg-orange-50 text-orange-500 border border-orange-200' },  // 판매
  RENT:  { label: '대여',     cls: 'bg-blue-50 text-blue-500 border border-blue-200' },        // 대여
  SHARE: { label: '나눔',     cls: 'bg-green-50 text-green-600 border border-green-200' },      // 나눔
} as const

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

// 구매/대여 선택 타입: null이면 아직 미선택
type TradeChoice = 'buy' | 'rent'

// 구매/대여 선택 모달의 현재 단계
// step1: 구매/대여 방식 선택, step2: 대여 날짜·배송기간 확인 (대여 선택 시만)
type ModalStep = 'step1' | 'step2'

// ─── 유틸 함수 ────────────────────────────────────────────────────────────────

/**
 * 두 날짜 사이의 일수를 계산하는 함수
 * @param start - 시작일 문자열 (YYYY-MM-DD)
 * @param end   - 종료일 문자열 (YYYY-MM-DD)
 * @returns 두 날짜 사이의 일수 (음수면 0 반환)
 */
function calcDays(start: string, end: string): number {
  if (!start || !end) return 0
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/**
 * 날짜 문자열을 한국어 형식으로 변환
 * @param dateStr - YYYY-MM-DD 형식 문자열
 * @returns 예: "2025년 5월 10일"
 */
function formatKorDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (date input min 값으로 사용) */
function today(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────

export default function ItemDetailPage() {
  // URL 파라미터에서 물품 ID 추출
  const { id } = useParams<{ id: string }>()
  // 페이지 이동 함수
  const navigate = useNavigate()

  // 물품 상세 정보 조회 훅
  const { data: item, isLoading } = useItemDetail(Number(id))
  // 찜하기 토글 훅
  const { mutate: toggleWish } = useToggleWish(Number(id))
  // 물품 삭제 훅
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem()
  // 드로워 스토어: 채팅 드로워 열기, 자동 전송 메시지 설정
  const { open, openChatRoom, setPendingFirstMessage } = useDrawerStore()
  // 현재 로그인 사용자 정보
  const currentUser = useAuthStore((s) => s.user)

  // ── 모달 상태 ──────────────────────────────────────────────────────────────
  // 삭제 확인 모달 열림 여부
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  // 구매/대여 선택 모달 열림 여부
  const [tradeSelectOpen, setTradeSelectOpen] = useState(false)
  // 모달 현재 단계 (step1: 방식선택, step2: 날짜선택)
  const [modalStep, setModalStep] = useState<ModalStep>('step1')

  // ── 선택 상태 ──────────────────────────────────────────────────────────────
  // 최종 확정된 거래 방식 (페이지 외부에 표시되는 상태)
  const [tradeChoice, setTradeChoice] = useState<TradeChoice | null>(null)
  // 모달 내 임시 방식 선택 (확인 전에는 반영 안 됨)
  const [tempChoice, setTempChoice] = useState<TradeChoice>('buy')
  // 대여 시작일 (YYYY-MM-DD)
  const [rentStart, setRentStart] = useState('')
  // 반납 예정일 (YYYY-MM-DD)
  const [rentEnd, setRentEnd] = useState('')
  // "배송기간 합산" 안내 체크박스 체크 여부
  const [deliveryChecked, setDeliveryChecked] = useState(false)

  // ── 계산값 ────────────────────────────────────────────────────────────────
  // 현재 사용자가 이 물품의 판매자인지 여부
  const isOwner = !!currentUser && item?.sellerId === currentUser.id
  // 구매가와 대여가가 모두 있는 물품인지 (선택 모달 표시 기준)
  const hasBothOptions = !!item && item.price > 0 && item.rentPrice > 0
  // 대여 날짜가 유효하게 선택되었는지 여부
  const rentDaysValid = calcDays(rentStart, rentEnd) > 0
  // step2 "선택 완료" 버튼 활성화 조건: 유효 날짜 + 배송기간 체크
  const step2CanConfirm = rentDaysValid && deliveryChecked

  // ── 이벤트 핸들러 ─────────────────────────────────────────────────────────

  /** 물품 삭제 처리: 삭제 후 목록 페이지로 이동 */
  const handleDelete = () => {
    deleteItem(Number(id), { onSuccess: () => navigate('/items') })
  }

  /**
   * 채팅하기 버튼 핸들러
   * - 구매/대여가 모두 있는 물품이고 아직 선택 안 했으면 → 선택 모달 열기
   * - 선택이 있으면 → 채팅방 열기 + 자동 첫 메시지 설정
   * @param choice - 이미 확정된 선택값 (모달 확인 후 전달)
   */
  const handleChat = async (choice?: TradeChoice, start?: string, end?: string) => {
    const finalChoice = choice ?? tradeChoice

    // 둘 다 있는 물품이고 아직 미선택이면 모달 열기
    if (hasBothOptions && !finalChoice) {
      setTempChoice('buy')
      setModalStep('step1')
      setRentStart('')
      setRentEnd('')
      setDeliveryChecked(false)
      setTradeSelectOpen(true)
      return
    }

    // 채팅 드로워 열기
    open('chat')
    try {
      const res = await chatApi.createRoom(item!.id)
      const roomId = res.data.id

      // 구매/대여 방식에 따라 판매자에게 전달할 자동 첫 메시지 생성
      if (finalChoice === 'rent' && start && end) {
        // 대여: 기간 정보 포함한 메시지
        const days = calcDays(start, end)
        const msg =
          `안녕하세요! 대여로 문의드립니다 😊\n` +
          `대여 기간: ${formatKorDate(start)} ~ ${formatKorDate(end)} (${days}일)\n` +
          `※ 배송기간 포함 확인 완료`
        setPendingFirstMessage(msg)
      } else if (finalChoice === 'buy') {
        // 구매: 간단한 안내 메시지
        setPendingFirstMessage('안녕하세요! 구매로 문의드립니다 😊')
      }

      // 채팅방 열기
      openChatRoom(roomId)
    } catch {
      // 채팅방 생성 실패 시 채팅 목록만 표시 (드로워는 이미 열림)
    }
  }

  /**
   * step1 확인 버튼 핸들러
   * - 구매 선택 → 바로 채팅 시작
   * - 대여 선택 → step2(날짜 선택)로 진행
   */
  const handleStep1Confirm = () => {
    if (tempChoice === 'buy') {
      // 구매 선택 확정 후 채팅 시작
      setTradeChoice('buy')
      setTradeSelectOpen(false)
      handleChat('buy')
    } else {
      // 대여 선택 → 날짜 입력 단계로 이동
      setModalStep('step2')
    }
  }

  /**
   * step2 확인 버튼 핸들러 (대여 날짜 확인)
   * - 날짜와 배송기간 체크박스가 모두 충족되면 채팅 시작
   */
  const handleStep2Confirm = () => {
    setTradeChoice('rent')
    setTradeSelectOpen(false)
    handleChat('rent', rentStart, rentEnd)
  }

  /** 선택 변경 버튼: 모달을 step1부터 다시 열기 */
  const handleChangeChoice = () => {
    setTempChoice(tradeChoice ?? 'buy')
    setModalStep('step1')
    setRentStart('')
    setRentEnd('')
    setDeliveryChecked(false)
    setTradeSelectOpen(true)
  }

  /** 모달 닫기: 모든 임시 상태 초기화 */
  const handleModalClose = () => {
    setTradeSelectOpen(false)
    setModalStep('step1')
  }

  // ── 로딩 / 에러 상태 렌더링 ───────────────────────────────────────────────

  // 물품 정보 로딩 중
  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-gray-400 text-sm">불러오는 중...</p>
    </div>
  )
  // 물품을 찾을 수 없을 때
  if (!item) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <p className="text-gray-700 font-semibold">상품을 찾을 수 없어요</p>
      <button onClick={() => navigate(-1)} className="text-primary-500 text-sm">← 돌아가기</button>
    </div>
  )

  // 물품 상태·유형 설정값
  const status = STATUS_MAP[item.status]
  const type   = TYPE_MAP[item.itemType]

  // ── 메인 렌더링 ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto pb-28">

      {/* 상단 네비게이션: 뒤로가기 + 신고 버튼 */}
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

      {/* 2단 레이아웃: 데스크탑은 좌(이미지) / 우(정보) */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-10">

        {/* ── 이미지 영역 ── */}
        <div className="mb-6 lg:mb-0">
          {/* 메인 이미지: 없으면 회색 원 표시 */}
          <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
            {item.imageUrls[0] ? (
              <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200" />
            )}
          </div>

          {/* 서브 이미지 가로 스크롤 목록 */}
          {item.imageUrls.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {item.imageUrls.slice(1).map((url, i) => (
                <div key={i} className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                  <img src={url} alt={`이미지 ${i + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 물품 정보 영역 ── */}
        <div className="flex flex-col gap-5">

          {/* 유형·상태 배지 */}
          <div className="flex items-center gap-2">
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', type.cls)}>
              {type.label}
            </span>
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', status.cls)}>
              {status.label}
            </span>
          </div>

          {/* 물품 제목 */}
          <h1 className="text-xl font-bold text-gray-900 leading-snug">{item.title}</h1>

          {/* 가격 영역: 구매가·대여가 함께 표시 */}
          <div className="flex flex-col gap-1">
            {item.itemType === 'SHARE' ? (
              // 나눔 물품
              <span className="text-2xl font-bold text-green-600">무료 나눔</span>
            ) : (
              <>
                {/* 구매가 표시 (0원이 아닐 때만) */}
                {item.price > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-12 shrink-0">구매가</span>
                    <span className="text-2xl font-bold text-gray-900">{item.price.toLocaleString()}원</span>
                  </div>
                )}
                {/* 대여가 표시 (0원이 아닐 때만) */}
                {item.rentPrice > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-12 shrink-0">대여가</span>
                    <span className={cn(
                      'font-bold',
                      item.price > 0 ? 'text-xl text-blue-600' : 'text-2xl text-gray-900'
                    )}>
                      {item.rentPrice.toLocaleString()}원<span className="text-sm font-normal text-gray-400 ml-1">/일</span>
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 거래 방식 선택 표시 박스 (구매/대여 둘 다 있는 물품 + 비판매자 전용) */}
          {hasBothOptions && !isOwner && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              {tradeChoice ? (
                <>
                  {/* 선택 완료 상태: 선택값 표시 + 변경 버튼 */}
                  <span className="text-sm text-blue-700 font-medium">
                    {tradeChoice === 'buy' ? '🛒 구매로 문의' : '🔄 대여로 문의'}
                  </span>
                  {/* 선택 변경 버튼 */}
                  <button
                    onClick={handleChangeChoice}
                    className="ml-auto flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                  >
                    <Pencil size={12} /> 변경
                  </button>
                </>
              ) : (
                // 미선택 상태: 안내 문구 표시
                <span className="text-sm text-blue-600">
                  채팅 전 구매 또는 대여를 선택해 주세요
                </span>
              )}
            </div>
          )}

          {/* 판매자 프로필 카드 */}
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            {/* 프로필 이미지: 없으면 닉네임 첫 글자 표시 */}
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.sellerProfileImageUrl ? (
                <img src={item.sellerProfileImageUrl} alt={item.sellerNickname} className="w-full h-full object-cover" />
              ) : (
                <span className="text-indigo-600 font-bold text-sm">{item.sellerNickname[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.sellerNickname}</p>
              <p className="text-xs text-gray-400 mt-0.5">거래 12건 · ★ 4.8</p>
            </div>
            {/* 판매자 프로필 상세 보기 링크 */}
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
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{item.description}</p>
          </div>

          {/* 해시태그 목록 */}
          {item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.hashtags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 메타 정보: 위치·등록시간·조회수·관심수 */}
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={12} /> 서울</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {fromNow(item.createdAt)}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Eye size={12} /> 조회 {item.viewCount}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Heart size={12} /> 관심 {item.wishCount}</span>
          </div>

          {/* 데스크탑 전용 액션 버튼 */}
          <div className="hidden lg:flex items-center gap-2 pt-2">
            {isOwner ? (
              // 판매자: 수정 + 삭제 버튼
              <>
                <button
                  onClick={() => navigate(`/items/${id}/edit`)}
                  className="flex items-center gap-1.5 px-4 py-3 border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 rounded-xl text-sm font-semibold transition-colors flex-1"
                >
                  <Pencil size={16} /> 수정
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-3 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors flex-1"
                >
                  <Trash2 size={16} /> 삭제
                </button>
              </>
            ) : (
              // 구매자: 찜하기 + 채팅하기 버튼
              <>
                <button
                  onClick={() => toggleWish()}
                  className={cn(
                    'p-3 border rounded-xl transition-colors flex-shrink-0',
                    item.isWished ? 'border-red-300 text-red-500 bg-red-50' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  )}
                  aria-label="찜하기"
                >
                  <Heart size={20} fill={item.isWished ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => handleChat()}
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {/* 미선택 상태이면 선택 유도 문구 표시 */}
                  {hasBothOptions && !tradeChoice ? '거래 방법 선택 후 채팅' : '채팅하기'}
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* 모바일 전용 하단 고정 액션 버튼 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-2">
        {isOwner ? (
          // 판매자: 수정 + 삭제
          <>
            <button
              onClick={() => navigate(`/items/${id}/edit`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold"
            >
              <Pencil size={16} /> 수정
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-red-200 text-red-500 rounded-xl text-sm font-semibold"
            >
              <Trash2 size={16} /> 삭제
            </button>
          </>
        ) : (
          // 구매자: 찜하기 + 채팅하기
          <>
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
              onClick={() => handleChat()}
              className="flex-1 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold"
            >
              {hasBothOptions && !tradeChoice ? '거래 방법 선택 후 채팅' : '채팅하기'}
            </button>
          </>
        )}
      </div>

      {/* ── 구매/대여 선택 모달 (2단계) ─────────────────────────────────────── */}
      {tradeSelectOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">

            {/* ── Step 1: 구매 / 대여 방식 선택 ── */}
            {modalStep === 'step1' && (
              <>
                {/* 모달 헤더 */}
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-900">거래 방법을 선택해 주세요</h3>
                  <p className="text-sm text-gray-500 mt-1">채팅 시 판매자에게 선택한 방법이 전달돼요</p>
                </div>

                {/* 구매 선택 버튼 */}
                <button
                  onClick={() => setTempChoice('buy')}
                  className={cn(
                    'w-full flex items-center gap-4 p-5 border-b border-gray-100 transition-colors text-left',
                    tempChoice === 'buy' ? 'bg-orange-50' : 'hover:bg-gray-50'
                  )}
                >
                  {/* 구매 아이콘 */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    tempChoice === 'buy' ? 'bg-orange-100' : 'bg-gray-100'
                  )}>
                    <ShoppingCart size={18} className={tempChoice === 'buy' ? 'text-orange-500' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1">
                    <p className={cn('font-semibold', tempChoice === 'buy' ? 'text-orange-600' : 'text-gray-800')}>구매</p>
                    <p className="text-sm text-gray-400">{item.price.toLocaleString()}원</p>
                  </div>
                  {/* 라디오 선택 표시 */}
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    tempChoice === 'buy' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                  )}>
                    {tempChoice === 'buy' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                {/* 대여 선택 버튼 */}
                <button
                  onClick={() => setTempChoice('rent')}
                  className={cn(
                    'w-full flex items-center gap-4 p-5 transition-colors text-left',
                    tempChoice === 'rent' ? 'bg-blue-50' : 'hover:bg-gray-50'
                  )}
                >
                  {/* 대여 아이콘 */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    tempChoice === 'rent' ? 'bg-blue-100' : 'bg-gray-100'
                  )}>
                    <RefreshCw size={18} className={tempChoice === 'rent' ? 'text-blue-500' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1">
                    <p className={cn('font-semibold', tempChoice === 'rent' ? 'text-blue-600' : 'text-gray-800')}>대여</p>
                    <p className="text-sm text-gray-400">{item.rentPrice.toLocaleString()}원/일</p>
                  </div>
                  {/* 라디오 선택 표시 */}
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    tempChoice === 'rent' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  )}>
                    {tempChoice === 'rent' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                {/* 취소 / 다음(선택완료) 버튼 */}
                <div className="flex gap-2 p-4">
                  <button
                    onClick={handleModalClose}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleStep1Confirm}
                    className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {/* 구매면 바로 완료, 대여면 날짜 선택으로 */}
                    {tempChoice === 'buy' ? '선택 완료' : '다음 →'}
                  </button>
                </div>
              </>
            )}

            {/* ── Step 2: 대여 날짜 선택 + 배송기간 확인 ── */}
            {modalStep === 'step2' && (
              <>
                {/* 모달 헤더: 뒤로가기 버튼 + 제목 */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    {/* step1으로 돌아가기 버튼 */}
                    <button
                      onClick={() => setModalStep('step1')}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h3 className="text-base font-bold text-gray-900">대여 기간을 선택해 주세요</h3>
                  </div>
                  <p className="text-sm text-gray-500 ml-6">시작일부터 반납 예정일까지 선택하세요</p>
                </div>

                <div className="p-5 flex flex-col gap-4">

                  {/* 날짜 입력 영역 */}
                  <div className="flex flex-col gap-3">
                    {/* 대여 시작일 입력 */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <CalendarDays size={13} className="text-blue-500" />
                        대여 시작일
                      </label>
                      <input
                        type="date"
                        value={rentStart}
                        min={today()}  // 오늘 이후만 선택 가능
                        onChange={(e) => {
                          setRentStart(e.target.value)
                          // 종료일이 시작일보다 이전이면 초기화
                          if (rentEnd && e.target.value > rentEnd) setRentEnd('')
                        }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </div>

                    {/* 반납 예정일 입력 */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <CalendarDays size={13} className="text-orange-500" />
                        반납 예정일
                      </label>
                      <input
                        type="date"
                        value={rentEnd}
                        min={rentStart || today()}  // 시작일 이후만 선택 가능
                        onChange={(e) => setRentEnd(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* 대여 기간 요약 (날짜가 유효하게 선택된 경우만 표시) */}
                  {rentDaysValid && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
                      <p className="font-semibold mb-0.5">대여 기간: {calcDays(rentStart, rentEnd)}일</p>
                      <p className="text-xs text-blue-500">
                        {formatKorDate(rentStart)} ~ {formatKorDate(rentEnd)}
                      </p>
                      {/* 대여 총 비용 계산 */}
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        예상 대여료: {(item.rentPrice * calcDays(rentStart, rentEnd)).toLocaleString()}원
                      </p>
                    </div>
                  )}

                  {/* 배송기간 합산 안내 체크박스 */}
                  <label className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    deliveryChecked
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-amber-50/50'
                  )}>
                    {/* 실제 체크박스 (숨김 처리 후 커스텀 UI 사용) */}
                    <input
                      type="checkbox"
                      checked={deliveryChecked}
                      onChange={(e) => setDeliveryChecked(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-amber-500 shrink-0"
                    />
                    {/* 안내 문구 */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
                        <AlertCircle size={13} className="text-amber-500 shrink-0" />
                        배송기간 합산 확인
                      </span>
                      <span className="text-xs text-gray-500 leading-relaxed">
                        배송기간도 대여기간에 합산되어집니다. 확인하셨습니까?
                      </span>
                    </div>
                  </label>

                  {/* 체크 안 됐을 때 경고 메시지 */}
                  {!deliveryChecked && rentDaysValid && (
                    <p className="text-xs text-amber-600 text-center">
                      배송기간 합산 체크박스를 확인해 주세요
                    </p>
                  )}
                </div>

                {/* 이전 / 선택 완료 버튼 */}
                <div className="flex gap-2 px-5 pb-5">
                  <button
                    onClick={() => setModalStep('step1')}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
                  >
                    이전
                  </button>
                  <button
                    onClick={handleStep2Confirm}
                    disabled={!step2CanConfirm}  // 날짜 + 체크박스 모두 충족 시 활성화
                    className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    선택 완료
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달 ─────────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">상품을 삭제할까요?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제된 상품은 복구할 수 없어요.</p>
            <div className="flex gap-2">
              {/* 취소 버튼 */}
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              {/* 삭제 확인 버튼 */}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
