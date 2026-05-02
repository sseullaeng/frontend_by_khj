// 마이페이지: 일반 유저는 프로필·메뉴, 관리자는 사용자/거래/신고 통계 대시보드 표시
import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'  // 인증 상태 스토어
import { useLogout } from '@/features/auth/hooks'     // 로그아웃 훅
import { Button } from '@/shared/ui/Button'           // 버튼 컴포넌트
import { cn } from '@/shared/lib/cn'                  // 클래스명 유틸
import { ChevronRight, ShieldCheck, ShieldOff, UserX, X } from 'lucide-react'
import UserProfileFloat from '@/shared/ui/UserProfileFloat'  // 유저 프로필 플로팅 패널
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ── 타입 정의 ────────────────────────────────────────────────────────────────

/** 유저 상태: 정상 / 휴면 / 활동정지 / 탈퇴 */
type UserStatus = 'ACTIVE' | 'DORMANT' | 'SUSPENDED' | 'WITHDRAWN'

/** 거래 유형: 중고거래 / 대여 / 나눔 / 거래대행 */
type TradeType = 'SELL' | 'RENT' | 'SHARE' | 'ESCROW'

/** 거래 상태: 진행중 / 완료 / 취소 */
type TradeStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

/** 관리자 유저 정보 */
interface AdminUser {
  id: number
  profileImageUrl: string | null
  nickname: string
  memberId: string       // 예: "user_001"
  signupPath: string     // "이메일" | "카카오" | "네이버"
  trustScore: number
  tradeCount: number
  joinedAt: string       // "YYYY-MM-DD"
  reportCount: number
  status: UserStatus
  suspendedAt?: string   // 활동정지 처리 날짜 (YYYY-MM-DD)
  suspendDays?: number   // 활동정지 기간 (일)
}

/** 관리자 거래 정보 */
interface AdminTrade {
  id: number
  itemImageUrl: string | null
  itemTitle: string
  itemType: TradeType
  tradeStatus: TradeStatus
  price: number
  buyerNickname: string
  sellerNickname: string
  date: string
}

/** 관리자 신고 정보 */
interface AdminReport {
  id: number
  targetType: 'USER' | 'ITEM'
  targetId: number
  targetName: string      // 닉네임 또는 물품 제목
  reason: string
  reportCount: number
  reportedAt: string
  status: UserStatus | 'ACTIVE'
}

/** 사이드 패널 종류: null이면 닫힘 */
type PanelKind =
  | 'USER_ALL'
  | 'USER_TODAY'
  | 'USER_WITHDRAWN'
  | 'TRADE_MONTHLY'
  | 'REPORT'
  | { kind: 'TRADE_TYPE'; tradeType: TradeType; label: string }
  | { kind: 'TRADE_STATUS'; tradeStatus: TradeStatus; label: string }
  | { kind: 'USER_DATE'; date: string }

// ── 색상·레이블 맵 ──────────────────────────────────────────────────────────

/** 유저 상태별 뱃지 색상 */
const STATUS_CLS: Record<UserStatus, string> = {
  ACTIVE:    'bg-emerald-100 text-emerald-700',
  DORMANT:   'bg-sky-100 text-sky-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
  WITHDRAWN: 'bg-gray-100 text-gray-400',
}

/** 유저 상태별 한글 레이블 */
const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE:    '정상',
  DORMANT:   '휴면',
  SUSPENDED: '활동정지',
  WITHDRAWN: '탈퇴',
}

/** 거래 유형별 뱃지 색상 */
const TYPE_CLS: Record<TradeType, string> = {
  SELL:   'bg-orange-100 text-orange-700',
  RENT:   'bg-blue-100 text-blue-700',
  SHARE:  'bg-green-100 text-green-700',
  ESCROW: 'bg-purple-100 text-purple-700',
}

/** 거래 유형별 한글 레이블 */
const TYPE_LABEL: Record<TradeType, string> = {
  SELL:   '중고거래',
  RENT:   '대여',
  SHARE:  '나눔',
  ESCROW: '거래대행',
}

/** 거래 유형별 이모지 */
const TRADE_EMOJI: Record<TradeType, string> = {
  SELL:   '🛒',
  RENT:   '🔄',
  SHARE:  '🤝',
  ESCROW: '🛡️',
}

/** 거래 상태별 뱃지 색상 */
const STATUS_CLS_TRADE: Record<TradeStatus, string> = {
  ACTIVE:    'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

/** 거래 상태별 한글 레이블 */
const TRADE_STATUS_LABEL: Record<TradeStatus, string> = {
  ACTIVE:    '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

// ── 목업 데이터 ──────────────────────────────────────────────────────────────

/** 관리자 유저 목업 데이터 (11명) */
const MOCK_USERS: AdminUser[] = [
  { id: 1,  profileImageUrl: null, nickname: '테스트유저', memberId: 'user_001', signupPath: '이메일', trustScore: 80, tradeCount: 12, joinedAt: '2026-05-02', reportCount: 0, status: 'ACTIVE' },
  { id: 2,  profileImageUrl: null, nickname: '홍길동',     memberId: 'user_002', signupPath: '카카오', trustScore: 72, tradeCount: 7,  joinedAt: '2026-05-02', reportCount: 1, status: 'ACTIVE' },
  { id: 3,  profileImageUrl: null, nickname: '김영희',     memberId: 'user_003', signupPath: '네이버', trustScore: 40, tradeCount: 3,  joinedAt: '2026-05-01', reportCount: 5, status: 'SUSPENDED', suspendedAt: '2026-05-01', suspendDays: 7 },
  { id: 4,  profileImageUrl: null, nickname: '이철수',     memberId: 'user_004', signupPath: '이메일', trustScore: 90, tradeCount: 25, joinedAt: '2026-04-30', reportCount: 0, status: 'ACTIVE' },
  { id: 5,  profileImageUrl: null, nickname: '박민준',     memberId: 'user_005', signupPath: '카카오', trustScore: 0,  tradeCount: 2,  joinedAt: '2026-04-29', reportCount: 3, status: 'WITHDRAWN' },
  { id: 6,  profileImageUrl: null, nickname: '최수진',     memberId: 'user_006', signupPath: '이메일', trustScore: 65, tradeCount: 9,  joinedAt: '2026-04-28', reportCount: 0, status: 'ACTIVE' },
  { id: 7,  profileImageUrl: null, nickname: '정우성',     memberId: 'user_007', signupPath: '네이버', trustScore: 55, tradeCount: 4,  joinedAt: '2026-04-28', reportCount: 2, status: 'ACTIVE' },
  { id: 8,  profileImageUrl: null, nickname: '강동원',     memberId: 'user_008', signupPath: '카카오', trustScore: 30, tradeCount: 1,  joinedAt: '2026-04-27', reportCount: 8, status: 'SUSPENDED', suspendedAt: '2026-04-30', suspendDays: 30 },
  { id: 9,  profileImageUrl: null, nickname: '손예진',     memberId: 'user_009', signupPath: '이메일', trustScore: 95, tradeCount: 31, joinedAt: '2026-04-27', reportCount: 0, status: 'ACTIVE' },
  { id: 10, profileImageUrl: null, nickname: '유재석',     memberId: 'user_010', signupPath: '카카오', trustScore: 88, tradeCount: 18, joinedAt: '2026-04-26', reportCount: 0, status: 'ACTIVE' },
  { id: 11, profileImageUrl: null, nickname: '신동엽',     memberId: 'user_011', signupPath: '이메일', trustScore: 0,  tradeCount: 0,  joinedAt: '2026-04-26', reportCount: 1, status: 'WITHDRAWN' },
  { id: 12, profileImageUrl: null, nickname: '이미래',     memberId: 'user_012', signupPath: '카카오', trustScore: 60, tradeCount: 5,  joinedAt: '2026-04-25', reportCount: 0, status: 'DORMANT' },
  { id: 13, profileImageUrl: null, nickname: '박지훈',     memberId: 'user_013', signupPath: '이메일', trustScore: 45, tradeCount: 2,  joinedAt: '2026-04-24', reportCount: 0, status: 'DORMANT' },
  { id: 14, profileImageUrl: null, nickname: '조은별',     memberId: 'user_014', signupPath: '네이버', trustScore: 70, tradeCount: 8,  joinedAt: '2026-04-23', reportCount: 0, status: 'DORMANT' },
]

/** 관리자 거래 목업 데이터 (12건) */
const MOCK_TRADES: AdminTrade[] = [
  { id: 1,  itemImageUrl: null, itemTitle: '아이폰 15 Pro',       itemType: 'SELL',   tradeStatus: 'COMPLETED', price: 1100000, buyerNickname: '홍길동',   sellerNickname: '이철수',     date: '2026-05-02' },
  { id: 2,  itemImageUrl: null, itemTitle: '캠핑 텐트 대여',       itemType: 'RENT',   tradeStatus: 'ACTIVE',    price: 25000,   buyerNickname: '최수진',   sellerNickname: '테스트유저', date: '2026-05-01' },
  { id: 3,  itemImageUrl: null, itemTitle: '어린이 장난감',        itemType: 'SHARE',  tradeStatus: 'COMPLETED', price: 0,       buyerNickname: '정우성',   sellerNickname: '손예진',     date: '2026-05-01' },
  { id: 4,  itemImageUrl: null, itemTitle: '맥북 에어 M2',         itemType: 'SELL',   tradeStatus: 'ACTIVE',    price: 1400000, buyerNickname: '강동원',   sellerNickname: '유재석',     date: '2026-04-30' },
  { id: 5,  itemImageUrl: null, itemTitle: '전동 킥보드',          itemType: 'RENT',   tradeStatus: 'CANCELLED', price: 15000,   buyerNickname: '박민준',   sellerNickname: '최수진',     date: '2026-04-30' },
  { id: 6,  itemImageUrl: null, itemTitle: '타 플랫폼 거래 대행',  itemType: 'ESCROW', tradeStatus: 'ACTIVE',    price: 350000,  buyerNickname: '테스트유저', sellerNickname: '홍길동',   date: '2026-04-29' },
  { id: 7,  itemImageUrl: null, itemTitle: '빈티지 자켓',          itemType: 'SELL',   tradeStatus: 'COMPLETED', price: 45000,   buyerNickname: '김영희',   sellerNickname: '정우성',     date: '2026-04-29' },
  { id: 8,  itemImageUrl: null, itemTitle: 'DSLR 카메라 대여',     itemType: 'RENT',   tradeStatus: 'COMPLETED', price: 80000,   buyerNickname: '이철수',   sellerNickname: '강동원',     date: '2026-04-28' },
  { id: 9,  itemImageUrl: null, itemTitle: '아기 옷 나눔',         itemType: 'SHARE',  tradeStatus: 'COMPLETED', price: 0,       buyerNickname: '손예진',   sellerNickname: '유재석',     date: '2026-04-28' },
  { id: 10, itemImageUrl: null, itemTitle: 'PS5 본체',             itemType: 'SELL',   tradeStatus: 'CANCELLED', price: 680000,  buyerNickname: '신동엽',   sellerNickname: '이철수',     date: '2026-04-27' },
  { id: 11, itemImageUrl: null, itemTitle: '자전거 대여',          itemType: 'RENT',   tradeStatus: 'ACTIVE',    price: 10000,   buyerNickname: '최수진',   sellerNickname: '테스트유저', date: '2026-04-27' },
  { id: 12, itemImageUrl: null, itemTitle: '전자레인지',           itemType: 'SELL',   tradeStatus: 'COMPLETED', price: 55000,   buyerNickname: '정우성',   sellerNickname: '손예진',     date: '2026-04-26' },
]

/** 관리자 신고 목업 데이터 (7건) */
const MOCK_REPORTS: AdminReport[] = [
  { id: 1, targetType: 'USER', targetId: 3,   targetName: '김영희',          reason: '사기 및 허위 거래',       reportCount: 5, reportedAt: '2026-05-01', status: 'SUSPENDED' },
  { id: 2, targetType: 'USER', targetId: 8,   targetName: '강동원',          reason: '욕설 및 비방',            reportCount: 8, reportedAt: '2026-04-30', status: 'SUSPENDED' },
  { id: 3, targetType: 'ITEM', targetId: 101, targetName: '불법 물품 판매',  reason: '불법 물품 거래',          reportCount: 3, reportedAt: '2026-05-02', status: 'ACTIVE' },
  { id: 4, targetType: 'USER', targetId: 5,   targetName: '박민준',          reason: '개인정보 요청',           reportCount: 3, reportedAt: '2026-04-29', status: 'WITHDRAWN' },
  { id: 5, targetType: 'ITEM', targetId: 102, targetName: '미성년자 대상 물품', reason: '음란물 / 불건전한 내용', reportCount: 2, reportedAt: '2026-05-01', status: 'ACTIVE' },
  { id: 6, targetType: 'ITEM', targetId: 103, targetName: '허위 상품 설명',  reason: '사기 및 허위 거래',       reportCount: 4, reportedAt: '2026-04-28', status: 'ACTIVE' },
  { id: 7, targetType: 'USER', targetId: 2,   targetName: '홍길동',          reason: '스팸 / 반복 도배',        reportCount: 1, reportedAt: '2026-05-02', status: 'ACTIVE' },
]

/** 일별 신규 가입자 수 (최근 7일) — MOCK_USERS와 날짜 일치 */
const DAILY_SIGNUP = [
  { day: '4/26', count: 2 },  // 유재석, 신동엽
  { day: '4/27', count: 2 },  // 강동원, 손예진
  { day: '4/28', count: 2 },  // 최수진, 정우성
  { day: '4/29', count: 1 },  // 박민준
  { day: '4/30', count: 1 },  // 이철수
  { day: '5/1',  count: 1 },  // 김영희
  { day: '5/2',  count: 2 },  // 테스트유저, 홍길동
]

/** 날짜 문자열 → 가입 유저 목록 매핑 */
const SIGNUP_BY_DATE: Record<string, AdminUser[]> = {
  '4/26': MOCK_USERS.filter(u => u.joinedAt === '2026-04-26'),
  '4/27': MOCK_USERS.filter(u => u.joinedAt === '2026-04-27'),
  '4/28': MOCK_USERS.filter(u => u.joinedAt === '2026-04-28'),
  '4/29': MOCK_USERS.filter(u => u.joinedAt === '2026-04-29'),
  '4/30': MOCK_USERS.filter(u => u.joinedAt === '2026-04-30'),
  '5/1':  MOCK_USERS.filter(u => u.joinedAt === '2026-05-01'),
  '5/2':  MOCK_USERS.filter(u => u.joinedAt === '2026-05-02'),
}

/** 거래 유형별 건수 (MOCK_TRADES 기반) */
const TRADE_TYPE_DATA = [
  { type: '중고거래', count: MOCK_TRADES.filter(t => t.itemType === 'SELL').length },
  { type: '대여',     count: MOCK_TRADES.filter(t => t.itemType === 'RENT').length },
  { type: '나눔',     count: MOCK_TRADES.filter(t => t.itemType === 'SHARE').length },
  { type: '거래대행', count: MOCK_TRADES.filter(t => t.itemType === 'ESCROW').length },
]

/** 거래 상태별 건수 (파이차트용) */
const TRADE_STATUS_DATA = [
  { name: '거래중', value: MOCK_TRADES.filter(t => t.tradeStatus === 'ACTIVE').length },
  { name: '완료',   value: MOCK_TRADES.filter(t => t.tradeStatus === 'COMPLETED').length },
  { name: '취소',   value: MOCK_TRADES.filter(t => t.tradeStatus === 'CANCELLED').length },
]

/** 파이차트 색상 배열 */
const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b']

// ── PanelContent 컴포넌트 ────────────────────────────────────────────────────

/** 패널 콘텐츠 Props */
interface PanelContentProps {
  kind: PanelKind
  onClose: () => void
  onUserClick: (id: number) => void
  users: AdminUser[]
  trades: AdminTrade[]
  reports: AdminReport[]
}

/** 유저 목록 렌더링 서브컴포넌트 — 상단 탭 필터 + 정지/탈퇴/복구 액션 */
function UserList({
  users,
  onUserClick,
}: {
  users: AdminUser[]
  onUserClick: (id: number) => void
}) {
  type UserTab = UserStatus | 'ALL' | 'REPORTED'
  const [activeTab, setActiveTab] = useState<UserTab>('ALL')

  // 유저별 로컬 상태 오버라이드 (정지·복구·탈퇴 결과 반영)
  const [statuses,    setStatuses]    = useState<Record<number, UserStatus>>({})
  // 유저별 정지 정보 (처리 날짜·기간)
  const [suspendInfo, setSuspendInfo] = useState<Record<number, { date: string; days: number }>>({})
  // 확인 모달 대상
  const [confirm, setConfirm] = useState<{ userId: number; userName: string; action: 'suspend' | 'withdraw' | 'restore' } | null>(null)
  // 정지 기간 드롭다운 선택값
  const [suspendDays, setSuspendDays] = useState<number>(7)

  const SUSPEND_OPTIONS = [3, 7, 30, 100]

  const TABS: { key: UserTab; label: string }[] = [
    { key: 'ALL',       label: '전체' },
    { key: 'ACTIVE',    label: '정상' },
    { key: 'DORMANT',   label: '휴면' },
    { key: 'SUSPENDED', label: '활동정지' },
    { key: 'WITHDRAWN', label: '탈퇴' },
    { key: 'REPORTED',  label: '신고제재' },
  ]

  /** 유저의 실제 상태 (로컬 오버라이드 우선) */
  const getStatus = (user: AdminUser): UserStatus => statuses[user.id] ?? user.status

  /** 정지 정보 (로컬 저장 우선, 없으면 MOCK 원본 사용) */
  const getSuspendInfo = (user: AdminUser) =>
    suspendInfo[user.id] ?? (user.suspendedAt ? { date: user.suspendedAt, days: user.suspendDays ?? 0 } : null)

  const filtered = users.filter(u => {
    const eff = getStatus(u)
    if (activeTab === 'ALL')      return true
    if (activeTab === 'REPORTED') return u.reportCount > 0
    return eff === activeTab
  })

  /** 확인 후 상태 변경 적용 */
  const handleConfirm = () => {
    if (!confirm) return
    if (confirm.action === 'suspend') {
      // 활동정지 처리 및 정지 정보 저장
      setStatuses(prev => ({ ...prev, [confirm.userId]: 'SUSPENDED' }))
      const today = new Date().toISOString().slice(0, 10)
      setSuspendInfo(prev => ({ ...prev, [confirm.userId]: { date: today, days: suspendDays } }))
    } else if (confirm.action === 'restore') {
      // 복구 처리 — 정지 정보 삭제
      setStatuses(prev => ({ ...prev, [confirm.userId]: 'ACTIVE' }))
      setSuspendInfo(prev => { const n = { ...prev }; delete n[confirm.userId]; return n })
    } else {
      // 탈퇴 처리
      setStatuses(prev => ({ ...prev, [confirm.userId]: 'WITHDRAWN' }))
    }
    setConfirm(null)
    setSuspendDays(7)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {/* 상태 필터 탭 바 */}
      <div className="flex border-b border-gray-100 overflow-x-auto shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-600',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 유저 목록 */}
      <ul className="divide-y divide-gray-100 overflow-y-auto flex-1">
        {filtered.map(user => {
          const effStatus = getStatus(user)
          const si = getSuspendInfo(user)
          const isSuspended = effStatus === 'SUSPENDED'
          const isWithdrawn = effStatus === 'WITHDRAWN'

          return (
            <li key={user.id} className="flex items-center px-4 py-3 gap-3">
              {/* 왼쪽: 프로필 클릭 영역 */}
              <button
                onClick={() => onUserClick(user.id)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-75 transition-opacity"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-indigo-600">{user.nickname[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{user.nickname}</span>
                    {/* 실제 적용된 상태 뱃지 */}
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', STATUS_CLS[effStatus])}>
                      {STATUS_LABEL[effStatus]}
                    </span>
                    {user.reportCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">
                        신고 {user.reportCount}건
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{user.memberId} · {user.signupPath} · 신뢰 {user.trustScore}점</p>
                  <p className="text-xs text-gray-400">거래 {user.tradeCount}건 · 가입 {user.joinedAt}</p>
                  {/* 활동정지 처리 날짜·기간 */}
                  {isSuspended && si && (
                    <p className="text-xs text-amber-600 font-medium mt-0.5">
                      {si.days}일 정지 · {si.date} 처리
                    </p>
                  )}
                </div>
              </button>

              {/* 오른쪽 액션 버튼 */}
              <div className="flex items-center gap-1 shrink-0">
                {isWithdrawn ? (
                  /* 탈퇴 회원 — 복구 버튼만 */
                  <button
                    onClick={() => setConfirm({ userId: user.id, userName: user.nickname, action: 'restore' })}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold transition-colors"
                  >
                    <ShieldCheck size={13} />
                    복구
                  </button>
                ) : (
                  <>
                    {/* 정지 중 → 복구 버튼 / 정상·휴면 → 정지 버튼 */}
                    <button
                      onClick={() => setConfirm({ userId: user.id, userName: user.nickname, action: isSuspended ? 'restore' : 'suspend' })}
                      className={cn(
                        'p-2 rounded-lg border transition-colors',
                        isSuspended
                          ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          : 'border-amber-200 text-amber-500 hover:bg-amber-50'
                      )}
                      title={isSuspended ? '복구' : '활동정지'}
                    >
                      {isSuspended ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
                    </button>
                    {/* 탈퇴 처리 버튼 */}
                    <button
                      onClick={() => setConfirm({ userId: user.id, userName: user.nickname, action: 'withdraw' })}
                      className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      title="탈퇴 처리"
                    >
                      <UserX size={15} />
                    </button>
                  </>
                )}
              </div>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-gray-400">데이터 없음</li>
        )}
      </ul>

      {/* ── 확인 모달 ── */}
      {confirm && (
        <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              {confirm.action === 'suspend'  && <ShieldOff  size={18} className="text-amber-500 shrink-0" />}
              {confirm.action === 'restore'  && <ShieldCheck size={18} className="text-emerald-500 shrink-0" />}
              {confirm.action === 'withdraw' && <UserX      size={18} className="text-red-500 shrink-0" />}
              <h3 className="text-sm font-bold text-gray-900">
                {confirm.action === 'suspend'  && '활동정지'}
                {confirm.action === 'restore'  && '활동 복구'}
                {confirm.action === 'withdraw' && '탈퇴 처리'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-semibold">{confirm.userName}</span> 님을{' '}
              {confirm.action === 'suspend'  && '활동정지 처리하시겠습니까?'}
              {confirm.action === 'restore'  && '복구하시겠습니까?'}
              {confirm.action === 'withdraw' && '탈퇴 처리하시겠습니까?'}
            </p>
            {/* 정지 기간 드롭다운 */}
            {confirm.action === 'suspend' && (
              <div className="mt-2 mb-1">
                <label className="text-xs text-gray-500 mb-1 block">정지 기간</label>
                <select
                  value={suspendDays}
                  onChange={e => setSuspendDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg outline-none focus:border-amber-400 bg-white"
                >
                  {SUSPEND_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}일</option>
                  ))}
                </select>
              </div>
            )}
            {confirm.action === 'withdraw' && (
              <p className="text-xs text-red-500 mt-1 mb-1">⚠ 탈퇴 처리는 되돌릴 수 없습니다.</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setConfirm(null); setSuspendDays(7) }}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className={cn(
                  'flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-colors',
                  confirm.action === 'withdraw' ? 'bg-red-500 hover:bg-red-600' :
                  confirm.action === 'restore'  ? 'bg-emerald-500 hover:bg-emerald-600' :
                                                  'bg-amber-500 hover:bg-amber-600'
                )}
              >
                {confirm.action === 'withdraw' ? '탈퇴' : confirm.action === 'restore' ? '복구' : '정지'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** 거래 목록 탭 모드: type=유형별 탭, status=상태별 탭, none=탭 없음 */
type TradeFilterMode = 'type' | 'status' | 'none'

/** 거래 목록 렌더링 서브컴포넌트 — filterMode에 따라 상단 탭 표시 */
function TradeList({ trades, filterMode = 'none' }: { trades: AdminTrade[]; filterMode?: TradeFilterMode }) {
  const navigate = useNavigate()

  // 유형 탭: 대여제공·대여현황 모두 RENT, 중고구매·중고판매 모두 SELL 매핑
  type TypeTabKey = 'ALL' | 'RENT_P' | 'RENT_S' | 'SELL_B' | 'SELL_S' | 'SHARE'
  const TYPE_TABS: { key: TypeTabKey; label: string; type: TradeType | null }[] = [
    { key: 'ALL',    label: '전체보기', type: null },
    { key: 'RENT_P', label: '대여제공', type: 'RENT' },
    { key: 'RENT_S', label: '대여현황', type: 'RENT' },
    { key: 'SELL_B', label: '중고구매', type: 'SELL' },
    { key: 'SELL_S', label: '중고판매', type: 'SELL' },
    { key: 'SHARE',  label: '나눔',     type: 'SHARE' },
  ]
  const STATUS_TABS: { key: 'ALL' | TradeStatus; label: string }[] = [
    { key: 'ALL',       label: '전체' },
    { key: 'ACTIVE',    label: '거래중' },
    { key: 'COMPLETED', label: '완료' },
    { key: 'CANCELLED', label: '취소' },
  ]

  const [typeTab,   setTypeTab]   = useState<TypeTabKey>('ALL')
  const [statusTab, setStatusTab] = useState<'ALL' | TradeStatus>('ALL')

  const filtered = trades.filter(t => {
    if (filterMode === 'type') {
      const tab = TYPE_TABS.find(tb => tb.key === typeTab)
      return tab?.type === null || t.itemType === tab?.type
    }
    if (filterMode === 'status') return statusTab === 'ALL' || t.tradeStatus === statusTab
    return true
  })

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 유형 탭 (이번달 거래 / 거래상태별 패널) */}
      {filterMode === 'type' && (
        <div className="flex border-b border-gray-100 overflow-x-auto shrink-0">
          {TYPE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setTypeTab(tab.key)}
              className={cn(
                'shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                typeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 상태 탭 (거래유형별 패널) */}
      {filterMode === 'status' && (
        <div className="flex border-b border-gray-100 overflow-x-auto shrink-0">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={cn(
                'shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                statusTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 거래 목록 */}
      <ul className="divide-y divide-gray-100 overflow-y-auto flex-1">
        {filtered.map(trade => (
          <li key={trade.id}>
            <button
              onClick={() => navigate(`/items/${trade.id}`)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-lg">{TRADE_EMOJI[trade.itemType]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', TYPE_CLS[trade.itemType])}>
                      {TYPE_LABEL[trade.itemType]}
                    </span>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', STATUS_CLS_TRADE[trade.tradeStatus])}>
                      {TRADE_STATUS_LABEL[trade.tradeStatus]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{trade.itemTitle}</p>
                  <p className="text-xs text-gray-400">
                    {trade.price > 0 ? trade.price.toLocaleString() + '원' : '무료'} · {trade.sellerNickname} → {trade.buyerNickname}
                  </p>
                  <p className="text-xs text-gray-400">{trade.date}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 shrink-0 mt-1" />
              </div>
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-gray-400">데이터 없음</li>
        )}
      </ul>
    </div>
  )
}

/** 신고 목록 렌더링 (유저탭→프로필+액션버튼 / 물품탭→상세 페이지 이동) */
function ReportList({ reports, onUserClick }: { reports: AdminReport[]; onUserClick: (id: number) => void }) {
  const navigate = useNavigate()
  // 탭 상태: 'USER' 또는 'ITEM'
  const [tab, setTab] = useState<'USER' | 'ITEM'>('USER')
  // 유저별 로컬 상태 오버라이드 (정지/복구/탈퇴 처리 결과 반영)
  const [statuses, setStatuses] = useState<Record<number, UserStatus>>({})
  // 유저별 정지 정보 (정지 날짜·기간)
  const [suspendInfo, setSuspendInfo] = useState<Record<number, { date: string; days: number }>>({})
  // 확인 모달 대상
  const [confirm, setConfirm] = useState<{ targetId: number; targetName: string; action: 'suspend' | 'withdraw' } | null>(null)
  // 정지 기간 선택 (모달 내 드롭다운)
  const [suspendDays, setSuspendDays] = useState<number>(7)

  const SUSPEND_OPTIONS = [3, 7, 30, 100]

  const filtered = reports.filter(r => r.targetType === tab)

  /** 유저의 현재 상태 (로컬 오버라이드 우선) */
  const getStatus = (report: AdminReport): UserStatus =>
    statuses[report.targetId] ?? (report.status as UserStatus)

  /** 확인 후 상태 변경 적용 */
  const handleConfirm = () => {
    if (!confirm) return
    if (confirm.action === 'suspend') {
      const cur = statuses[confirm.targetId] ?? (reports.find(r => r.targetId === confirm.targetId)?.status as UserStatus)
      const nextStatus = cur === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
      setStatuses(prev => ({ ...prev, [confirm.targetId]: nextStatus }))
      // 정지 처리 시 날짜·기간 저장, 복구 시 정보 삭제
      if (nextStatus === 'SUSPENDED') {
        const today = new Date().toISOString().slice(0, 10)
        setSuspendInfo(prev => ({ ...prev, [confirm.targetId]: { date: today, days: suspendDays } }))
      } else {
        setSuspendInfo(prev => { const next = { ...prev }; delete next[confirm.targetId]; return next })
      }
    } else {
      setStatuses(prev => ({ ...prev, [confirm.targetId]: 'WITHDRAWN' }))
    }
    setConfirm(null)
    setSuspendDays(7)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 탭 버튼 */}
      <div className="flex border-b border-gray-100 px-4">
        <button
          onClick={() => setTab('USER')}
          className={cn(
            'py-2.5 px-4 text-sm font-medium border-b-2 transition-colors',
            tab === 'USER' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-400',
          )}
        >
          유저
        </button>
        <button
          onClick={() => setTab('ITEM')}
          className={cn(
            'py-2.5 px-4 text-sm font-medium border-b-2 transition-colors',
            tab === 'ITEM' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-400',
          )}
        >
          물품
        </button>
      </div>

      {/* 신고 목록 */}
      <ul className="divide-y divide-gray-100 overflow-y-auto flex-1">
        {filtered.map(report => {
          const status = getStatus(report)
          const isWithdrawn = status === 'WITHDRAWN'
          const isSuspended = status === 'SUSPENDED'

          return (
            <li key={report.id} className="px-4 py-3 flex items-center gap-3">

              {tab === 'USER' ? (
                /* ── 유저 탭: 좌(프로필 클릭) + 우(액션 버튼) ── */
                <>
                  {/* 왼쪽 클릭 영역 → 프로필 플로팅 */}
                  <button
                    onClick={() => onUserClick(report.targetId)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-75 transition-opacity"
                  >
                    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-red-500">{report.targetName[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{report.targetName}</span>
                        {/* 현재 상태 뱃지 */}
                        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', STATUS_CLS[status])}>
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{report.reason}</p>
                      <p className="text-xs text-gray-400">신고 {report.reportCount}건 · {report.reportedAt}</p>
                      {/* 정지 처리 날짜·기간 (정지 상태일 때만) */}
                      {status === 'SUSPENDED' && suspendInfo[report.targetId] && (
                        <p className="text-xs text-amber-600 font-medium mt-0.5">
                          {suspendInfo[report.targetId].days}일 정지 · {suspendInfo[report.targetId].date} 처리
                        </p>
                      )}
                    </div>
                  </button>

                  {/* 오른쪽 액션 버튼 — 탈퇴 회원은 비활성 */}
                  {!isWithdrawn && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* 활동정지 / 복구 토글 */}
                      <button
                        onClick={() => setConfirm({ targetId: report.targetId, targetName: report.targetName, action: 'suspend' })}
                        className={cn(
                          'p-2 rounded-lg border transition-colors',
                          isSuspended
                            ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            : 'border-amber-200 text-amber-500 hover:bg-amber-50'
                        )}
                        title={isSuspended ? '복구' : '활동정지'}
                      >
                        {isSuspended ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
                      </button>
                      {/* 탈퇴 처리 */}
                      <button
                        onClick={() => setConfirm({ targetId: report.targetId, targetName: report.targetName, action: 'withdraw' })}
                        className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                        title="탈퇴 처리"
                      >
                        <UserX size={15} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* ── 물품 탭: 전체 클릭 → 물품 상세 이동 ── */
                <button
                  onClick={() => navigate(`/items/${report.targetId}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-75 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-lg">📦</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{report.targetName}</p>
                    <p className="text-xs text-gray-500">{report.reason}</p>
                    <p className="text-xs text-gray-400">신고 {report.reportCount}건 · {report.reportedAt}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                </button>
              )}
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-gray-400">신고 없음</li>
        )}
      </ul>

      {/* ── 확인 모달 ── */}
      {confirm && (
        <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              {confirm.action === 'suspend' ? (
                <ShieldOff size={18} className="text-amber-500 shrink-0" />
              ) : (
                <UserX size={18} className="text-red-500 shrink-0" />
              )}
              <h3 className="text-sm font-bold text-gray-900">
                {confirm.action === 'suspend'
                  ? (statuses[confirm.targetId] === 'SUSPENDED' ? '활동 복구' : '활동정지')
                  : '탈퇴 처리'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-semibold">{confirm.targetName}</span> 님을{' '}
              {confirm.action === 'suspend'
                ? (statuses[confirm.targetId] === 'SUSPENDED' ? '복구하시겠습니까?' : '활동정지 처리하시겠습니까?')
                : '탈퇴 처리하시겠습니까?'}
            </p>
            {/* 정지 기간 드롭다운 — 새로 정지할 때만 표시 */}
            {confirm.action === 'suspend' && statuses[confirm.targetId] !== 'SUSPENDED' && (
              <div className="mt-2 mb-1">
                <label className="text-xs text-gray-500 mb-1 block">정지 기간</label>
                <select
                  value={suspendDays}
                  onChange={e => setSuspendDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg outline-none focus:border-amber-400 bg-white"
                >
                  {SUSPEND_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}일</option>
                  ))}
                </select>
              </div>
            )}
            {confirm.action === 'withdraw' && (
              <p className="text-xs text-red-500 mb-3">⚠ 탈퇴 처리는 되돌릴 수 없습니다.</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className={cn(
                  'flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-colors',
                  confirm.action === 'withdraw'
                    ? 'bg-red-500 hover:bg-red-600'
                    : statuses[confirm.targetId] === 'SUSPENDED'
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-amber-500 hover:bg-amber-600'
                )}
              >
                {confirm.action === 'withdraw' ? '탈퇴' : statuses[confirm.targetId] === 'SUSPENDED' ? '복구' : '정지'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** 사이드 패널 전체 콘텐츠 (종류에 따라 유저/거래/신고 목록 렌더링) */
function PanelContent({ kind, onClose, onUserClick, users, trades, reports }: PanelContentProps) {
  // 패널 제목 및 콘텐츠 결정
  let title = ''
  let content: React.ReactNode = null

  if (kind === 'USER_ALL') {
    // 전체 회원 목록
    title = '전체 회원'
    content = <UserList users={users} onUserClick={onUserClick} />
  } else if (kind === 'USER_TODAY') {
    // 오늘 신규 가입자 목록
    title = '오늘 신규 가입자'
    const todayUsers = users.filter(u => u.joinedAt === '2026-05-02')
    content = <UserList users={todayUsers} onUserClick={onUserClick} />
  } else if (kind === 'USER_WITHDRAWN') {
    // 탈퇴 회원 목록 (복구 버튼 포함)
    title = '탈퇴 회원'
    const withdrawnUsers = users.filter(u => u.status === 'WITHDRAWN')
    content = <UserList users={withdrawnUsers} onUserClick={onUserClick} />
  } else if (kind === 'TRADE_MONTHLY') {
    // 이번달 거래 목록 (거래 유형별 탭)
    title = '이번달 거래 내역'
    content = <TradeList trades={trades} filterMode="type" />
  } else if (kind === 'REPORT') {
    // 신고 목록 (유저/물품 탭)
    title = '신고 목록'
    content = <ReportList reports={reports} onUserClick={onUserClick} />
  } else if (kind.kind === 'TRADE_TYPE') {
    // 거래 유형별 필터링 목록 (거래 상태 탭으로 세분화)
    title = `${kind.label} 거래 목록`
    const filtered = trades.filter(t => t.itemType === kind.tradeType)
    content = <TradeList trades={filtered} filterMode="status" />
  } else if (kind.kind === 'TRADE_STATUS') {
    // 거래 상태별 필터링 목록 (거래 유형 탭으로 세분화)
    title = `${kind.label} 목록`
    const filtered = trades.filter(t => t.tradeStatus === kind.tradeStatus)
    content = <TradeList trades={filtered} filterMode="type" />
  } else if (kind.kind === 'USER_DATE') {
    // 특정 날짜 가입자 목록
    title = `${kind.date} 가입자`
    const dateUsers = SIGNUP_BY_DATE[kind.date] ?? []
    content = <UserList users={dateUsers} onUserClick={onUserClick} />
  }

  return (
    <>
      {/* 패널 헤더: 제목 + 닫기 버튼 */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 shrink-0">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="닫기"
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      {/* 패널 본문 */}
      <div className="flex flex-col flex-1 min-h-0">
        {content}
      </div>
    </>
  )
}

// ── AdminStats 컴포넌트 ───────────────────────────────────────────────────────

/** 관리자 통계 대시보드 (차트, 요약 카드, 사이드 패널 포함) */
function AdminStats({ nickname }: { nickname: string }) {
  // 사이드 패널 종류 상태 (null이면 닫힘)
  const [panel, setPanel] = useState<PanelKind | null>(null)
  // 영역 차트 마우스 호버 날짜 상태
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  // 프로필 플로팅 패널에 표시할 유저 ID (null이면 닫힘)
  const [profileUserId, setProfileUserId] = useState<number | null>(null)
  /** 패널 열기 */
  const openPanel = (kind: PanelKind) => setPanel(kind)
  /** 패널 닫기 */
  const closePanel = () => setPanel(null)

  // 차트 호버 카드 숨김 딜레이 타이머 ref (마우스를 잠깐 벗어나도 카드가 유지되도록)
  const hideTimerRef = useRef<number>(0)

  // 탈퇴 회원 수 (카드 표시용)
  const withdrawnCount = MOCK_USERS.filter(u => u.status === 'WITHDRAWN').length

  return (
    <div className="flex flex-col gap-6">

      {/* 관리자 헤더 */}
      <div className="flex items-center gap-3 py-2">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
          <ShieldCheck size={22} className="text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{nickname}</p>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">관리자</span>
        </div>
      </div>

      {/* 요약 카드 2×2 그리드 (모두 클릭 가능) */}
      <div className="grid grid-cols-2 gap-3">
        {/* 전체 회원 카드 */}
        <button
          onClick={() => openPanel('USER_ALL')}
          className="bg-white border border-gray-200 rounded-2xl p-4 text-left cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-500 mb-1">전체 회원</p>
          <p className="text-xl font-bold text-gray-900">1,284명</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-400">이번 달 +89</p>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </button>

        {/* 오늘 신규 카드 */}
        <button
          onClick={() => openPanel('USER_TODAY')}
          className="bg-white border border-gray-200 rounded-2xl p-4 text-left cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-500 mb-1">오늘 신규</p>
          <p className="text-xl font-bold text-gray-900">15명</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-400">어제 대비 +3</p>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </button>

        {/* 이번달 거래 카드 */}
        <button
          onClick={() => openPanel('TRADE_MONTHLY')}
          className="bg-white border border-gray-200 rounded-2xl p-4 text-left cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-500 mb-1">이번달 거래</p>
          <p className="text-xl font-bold text-gray-900">316건</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-400">저번달 대비 +12%</p>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </button>

        {/* 신고 대기 카드 */}
        <button
          onClick={() => openPanel('REPORT')}
          className="bg-white border border-gray-200 rounded-2xl p-4 text-left cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-500 mb-1">신고 대기</p>
          <p className="text-xl font-bold text-red-500">7건</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-400">미처리 신고</p>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </button>

        {/* 탈퇴 회원 카드 — 2열 전체 너비 */}
        <button
          onClick={() => openPanel('USER_WITHDRAWN')}
          className="col-span-2 bg-white border border-gray-200 rounded-2xl p-4 text-left cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-500 mb-1">탈퇴 회원</p>
          <p className="text-xl font-bold text-gray-400">{withdrawnCount}명</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-400">복구 가능 · 클릭하여 목록 보기</p>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </button>
      </div>

      {/* 일별 신규 가입자 — AreaChart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">일별 신규 가입자 (최근 7일)</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={DAILY_SIGNUP}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            onMouseMove={(data: { activeLabel?: string }) => {
              // 마우스 이동 시 타이머 취소 후 날짜 업데이트
              window.clearTimeout(hideTimerRef.current)
              if (data.activeLabel) setHoveredDate(data.activeLabel)
            }}
            onMouseLeave={() => {
              // 마우스가 차트를 벗어나면 400ms 후 카드 숨김 (호버 카드 위로 이동 시 취소)
              hideTimerRef.current = window.setTimeout(() => setHoveredDate(null), 400)
            }}
          >
            <defs>
              <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              fill="url(#signupGrad)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="가입자"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* 호버 시 해당 날짜 가입자 미니 카드 */}
        {hoveredDate !== null && (
          <div
            className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl"
            onMouseEnter={() => window.clearTimeout(hideTimerRef.current)}
            onMouseLeave={() => { hideTimerRef.current = window.setTimeout(() => setHoveredDate(null), 400) }}
          >
            <p className="text-xs font-semibold text-indigo-700 mb-2">{hoveredDate} 가입자</p>
            <ul className="space-y-1">
              {(SIGNUP_BY_DATE[hoveredDate] ?? []).map(user => (
                <li key={user.id} className="flex items-center gap-2">
                  {/* 가입자 이니셜 아바타 */}
                  <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-indigo-700">{user.nickname[0]}</span>
                  </div>
                  <span className="text-xs text-gray-700">{user.nickname}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{user.signupPath}</span>
                </li>
              ))}
              {(SIGNUP_BY_DATE[hoveredDate] ?? []).length === 0 && (
                <li className="text-xs text-gray-400">데이터 없음</li>
              )}
            </ul>
            {/* 해당 날짜 패널 전체 보기 버튼 */}
            <button
              onClick={() => openPanel({ kind: 'USER_DATE', date: hoveredDate })}
              className="mt-2 text-xs text-indigo-600 font-medium hover:underline"
            >
              전체 보기 →
            </button>
          </div>
        )}
      </div>

      {/* 거래 유형별 건수 — BarChart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-0.5">거래 유형별 건수</p>
        {/* 클릭 안내 문구 */}
        <p className="text-xs text-gray-400 mb-3">클릭하면 상세 목록을 볼 수 있어요</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={TRADE_TYPE_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="type" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar
              dataKey="count"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
              name="건수"
              cursor="pointer"
              onClick={(data: { type: string }) => {
                // 거래 유형명 → TradeType 코드 매핑
                const map: Record<string, TradeType> = {
                  '중고거래': 'SELL',
                  '대여':     'RENT',
                  '나눔':     'SHARE',
                  '거래대행': 'ESCROW',
                }
                const tradeType = map[data.type]
                if (tradeType) openPanel({ kind: 'TRADE_TYPE', tradeType, label: data.type })
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 거래 상태 비율 — PieChart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">거래 상태 비율</p>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={TRADE_STATUS_DATA}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {TRADE_STATUS_DATA.map((_, i) => {
                // 거래 상태 코드 및 레이블 매핑
                const statusCodes: TradeStatus[] = ['ACTIVE', 'COMPLETED', 'CANCELLED']
                const statusLabels = ['거래중', '완료', '취소']
                return (
                  <Cell
                    key={i}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      openPanel({
                        kind: 'TRADE_STATUS',
                        tradeStatus: statusCodes[i],
                        label: statusLabels[i],
                      })
                    }}
                  />
                )
              })}
            </Pie>
            <Tooltip />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 사이드 패널 오버레이 */}
      {panel !== null && (
        <div className="fixed inset-0 z-50 flex">
          {/* 배경 딤 처리 (클릭 시 닫기) */}
          <div onClick={closePanel} className="flex-1 bg-black/30" />
          {/* 패널 본체 */}
          <div className="w-full sm:w-[600px] bg-white h-full flex flex-col shadow-2xl relative">
            <PanelContent
              kind={panel}
              onClose={closePanel}
              onUserClick={(id) => setProfileUserId(id)}
              users={MOCK_USERS}
              trades={MOCK_TRADES}
              reports={MOCK_REPORTS}
            />
          </div>
        </div>
      )}

      {/* 유저 프로필 플로팅 패널 (사이드 패널 위 z-[70]) */}
      {profileUserId !== null && (
        <UserProfileFloat
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
        />
      )}
    </div>
  )
}

// ── 일반 유저 메뉴 목록 ──────────────────────────────────────────────────────

/** 일반 유저용 마이페이지 메뉴 항목 */
const MENU_ITEMS = [
  { label: '내 거래',   to: '/mypage/items' },
  { label: '찜 목록',   to: '/mypage/wishes' },
  { label: '리뷰 관리', to: '/reviews' },
  { label: '차단 목록', to: '/mypage/blocks' },
]

// ── 메인 MyPage 컴포넌트 ─────────────────────────────────────────────────────

/** 마이페이지: 관리자면 통계 대시보드, 일반 유저면 프로필·메뉴 표시 */
export default function MyPage() {
  const user                       = useAuthStore((s) => s.user)  // 현재 로그인 유저
  const { mutate: logout, isPending } = useLogout()               // 로그아웃 훅

  const isAdmin = user?.role === 'ADMIN'  // 관리자 여부 판단

  return (
    <div className="flex flex-col gap-4">

      {/* 관리자: 통계 대시보드 / 일반 유저: 프로필 + 메뉴 */}
      {isAdmin ? (
        <AdminStats nickname={user?.nickname ?? '관리자'} />
      ) : (
        <>
          {/* 일반 유저 프로필 */}
          <div className="flex items-center gap-4 py-2">
            {/* 프로필 이미지 */}
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {user?.profileImageUrl && (
                <img src={user.profileImageUrl} alt={user.nickname} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">{user?.nickname}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            {/* 프로필 수정 링크 */}
            <Link to="/mypage/edit" className="text-sm text-primary-500">수정</Link>
          </div>

          {/* 신뢰 지수 표시 바 */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
            <span className="text-sm text-gray-600">신뢰 지수</span>
            <span className="font-bold text-primary-500">{user?.trustScore ?? 0}점</span>
          </div>

          {/* 메뉴 목록 */}
          <ul className="divide-y divide-gray-100">
            {MENU_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="flex items-center justify-between py-4 text-sm text-gray-700">
                  {item.label}
                  <ChevronRight size={16} className="text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 로그아웃 버튼 (공통) */}
      <Button variant="ghost" fullWidth isLoading={isPending} onClick={() => logout()}>
        로그아웃
      </Button>

    </div>
  )
}
