// 애플리케이션 라우터 설정: React Router를 사용한 페이지 경로 관리
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy as reactLazy, type ComponentType } from 'react'

// Vercel 같은 호스팅이 새로 배포되면 chunk hash 가 바뀜.
// 이미 열어둔 탭이 옛 chunk 를 fetch 하면 404 → "Failed to fetch dynamically imported module".
// 첫 실패 시 한 번만 자동 새로고침해 새 hash 의 chunk 를 받도록 한다.
//
// sessionStorage 플래그로 무한 reload 루프 방지 (실제 chunk 가 망가졌을 땐 두 번째에 throw).
const RELOAD_KEY = 'chunk_reload_attempted'
function lazy<T extends ComponentType<any>>(importer: () => Promise<{ default: T }>) {
  return reactLazy<T>(async () => {
    try {
      const mod = await importer()
      sessionStorage.removeItem(RELOAD_KEY) // 정상 로드되면 플래그 리셋
      return mod
    } catch (err) {
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, '1')
        window.location.reload()
        // reload 가 진행되는 동안 Suspense fallback 유지하도록 영원히 pending Promise 반환
        return new Promise<{ default: T }>(() => {})
      }
      throw err
    }
  })
}

// 공통 레이아웃 컴포넌트
import RootLayout from '@/shared/ui/RootLayout'

// 라우트 가드 컴포넌트: 인증 상태에 따른 접근 제어
import ProtectedRoute from '@/shared/ui/ProtectedRoute' // 로그인 사용자 전용
import AdminRoute from '@/shared/ui/AdminRoute' // 관리자 전용
import PublicOnlyRoute from '@/shared/ui/PublicOnlyRoute' // 비로그인 사용자 전용

// 인증 관련 페이지 - lazy import (코드 스플리팅으로 초기 로딩 최적화)
const LoginPage = lazy(() => import('@/pages/auth/LoginPage')) // 로그인 페이지
const SignupPage = lazy(() => import('@/pages/auth/SignupPage')) // 회원가입 페이지
const SocialCallbackPage = lazy(() => import('@/pages/auth/SocialCallbackPage')) // 소셜 로그인 콜백 페이지
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage')) // 이메일 인증 페이지

// 홈 관련 페이지
const HomePage = lazy(() => import('@/pages/home/HomePage')) // 메인 홈페이지
const CategoryPage = lazy(() => import('@/pages/home/CategoryPage')) // 카테고리 페이지

// 물품 관련 페이지
const ItemListPage = lazy(() => import('@/pages/item/ItemListPage')) // 물품 목록 페이지
const ItemDetailPage = lazy(() => import('@/pages/item/ItemDetailPage')) // 물품 상세 페이지
const ItemCreatePage = lazy(() => import('@/pages/item/ItemCreatePage')) // 물품 등록 페이지
const ItemEditPage = lazy(() => import('@/pages/item/ItemEditPage')) // 물품 수정 페이지

// 거래 관련 페이지
const TransactionPage = lazy(() => import('@/pages/transaction/TransactionPage')) // 거래 페이지

// 포인트 관련 페이지
const PointPage = lazy(() => import('@/pages/point/PointPage')) // 포인트 페이지
const ChargePage = lazy(() => import('@/pages/point/ChargePage')) // 포인트 충전 페이지
const ChargeCallbackPage = lazy(() => import('@/pages/point/ChargeCallbackPage')) // 충전 콜백 페이지
const WithdrawPage = lazy(() => import('@/pages/point/WithdrawPage')) // 포인트 출금 페이지

// 배송 관련 페이지
const DeliveryPage = lazy(() => import('@/pages/delivery/DeliveryPage')) // 배송 페이지
const DeliveryTrackPage = lazy(() => import('@/pages/delivery/DeliveryTrackPage')) // 배송 추적 페이지

// 마이페이지 관련
const MyPage = lazy(() => import('@/pages/mypage/MyPage')) // 마이페이지 메인
const ProfileEditPage = lazy(() => import('@/pages/mypage/ProfileEditPage')) // 프로필 수정 페이지
const UserProfilePage = lazy(() => import('@/pages/mypage/UserProfilePage')) // 사용자 프로필 페이지
const BlockListPage = lazy(() => import('@/pages/mypage/BlockListPage')) // 차단 목록 페이지
const WishListPage = lazy(() => import('@/pages/mypage/WishListPage')) // 찜 목록 페이지
const MyItemsPage = lazy(() => import('@/pages/mypage/MyItemsPage')) // 내 물품 페이지
const TradeDetailPage = lazy(() => import('@/pages/mypage/TradeDetailPage')) // 거래 내역 상세 페이지
const MyOverduePage = lazy(() => import('@/pages/mypage/MyOverduePage')) // 연체 정보 (라운드14)

// 알림 및 리뷰 관련
const NotificationPage = lazy(() => import('@/pages/notification/NotificationPage')) // 알림 페이지
const ReviewManagePage = lazy(() => import('@/pages/review/ReviewManagePage')) // 리뷰 관리 페이지
const ReviewWritePage = lazy(() => import('@/pages/review/ReviewWritePage')) // 리뷰 작성 페이지

// 공지 및 지원 관련
const NoticePage = lazy(() => import('@/pages/notice/NoticePage')) // 공지사항 페이지
const NoticeDetailPage = lazy(() => import('@/pages/notice/NoticeDetailPage')) // 공지 상세 페이지
const NoticeWritePage = lazy(() => import('@/pages/notice/NoticeWritePage')) // 공지 글쓰기·수정 페이지 (관리자)
const SupportPage = lazy(() => import('@/pages/support/SupportPage')) // 고객 지원 페이지
const MyInquiryDetailPage = lazy(() => import('@/pages/support/MyInquiryDetailPage')) // 본인 문의 상세 (라운드8)
const AdminSupportPostFormPage = lazy(() => import('@/pages/support/AdminSupportPostFormPage')) // 관리자 FAQ/QnA 작성·수정

// 거래 대행(Escrow) 관련 페이지
const EscrowHubPage = lazy(() => import('@/pages/escrow/EscrowHubPage')) // 에스크로 허브 페이지
const EscrowListPage = lazy(() => import('@/pages/escrow/EscrowListPage')) // 에스크로 목록 페이지
const EscrowDetailPage = lazy(() => import('@/pages/escrow/EscrowDetailPage')) // 에스크로 상세 페이지
const EscrowStartPage = lazy(() => import('@/pages/escrow/EscrowStartPage')) // 에스크로 시작 페이지
const EscrowLinkPage = lazy(() => import('@/pages/escrow/EscrowLinkPage')) // 에스크로 링크 페이지
const EscrowInvitePage = lazy(() => import('@/pages/escrow/EscrowInvitePage')) // 에스크로 초대 페이지
const EscrowApplicationPage = lazy(() => import('@/pages/escrow/EscrowApplicationPage')) // 에스크로 신청 페이지 (외부 link)
const EscrowInternalApplicationPage = lazy(
  () => import('@/pages/escrow/EscrowInternalApplicationPage')
) // 채팅방 내부 신청 (라운드12)
const EscrowBuyerInfoPage = lazy(() => import('@/pages/escrow/EscrowBuyerInfoPage')) // 구매자 수령지 입력 (PR-B-4)
const EscrowPayPage = lazy(() => import('@/pages/escrow/EscrowPayPage')) // 거래대행 포인트 결제 (PR-B-5)
const EscrowCompletePage = lazy(() => import('@/pages/escrow/EscrowCompletePage')) // 에스크로 완료 페이지

// 관리자 페이지
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage')) // 관리자 로그인 페이지
// 라운드13 — /admin/dashboard 가 AdminConsole (사이드바 + 인라인 콘텐츠) 로 변경.
//   AdminStats / 각 admin page 는 콘솔 내부에서 lazy 렌더.
//   /admin/users 등 직접 URL 진입은 기존 라우트 유지.
const AdminDashboard = lazy(() => import('@/pages/admin/AdminConsole')) // 관리자 콘솔 (사이드바 + 인라인)
const AdminUserPage = lazy(() => import('@/pages/admin/AdminUserPage')) // 관리자 전체 회원 관리
const AdminTodayUsersPage = lazy(() => import('@/pages/admin/AdminTodayUsersPage')) // 관리자 오늘 신규 가입자
const AdminWithdrawnUsersPage = lazy(() => import('@/pages/admin/AdminWithdrawnUsersPage')) // 관리자 탈퇴 회원 관리
const AdminMonthlyTradesPage = lazy(() => import('@/pages/admin/AdminMonthlyTradesPage')) // 관리자 이번달 거래
const AdminItemPage = lazy(() => import('@/pages/admin/AdminItemPage')) // 관리자 물품 관리
const AdminEscrowApplicationsPage = lazy(() => import('@/pages/admin/AdminEscrowApplicationsPage')) // 관리자 거래대행 모니터링
const AdminReportPage = lazy(() => import('@/pages/admin/AdminReportPage')) // 관리자 신고 대기 처리
const AdminOverduePage = lazy(() => import('@/pages/admin/AdminOverduePage')) // 관리자 연체 관리
const AdminWithdrawPage = lazy(() => import('@/pages/admin/AdminWithdrawPage')) // 관리자 출금 관리
const AdminDeliveryPage = lazy(() => import('@/pages/admin/AdminDeliveryPage')) // 관리자 배송 관리
const AdminNoticePage = lazy(() => import('@/pages/admin/AdminNoticePage')) // 관리자 공지 관리
const AdminBannerPage = lazy(() => import('@/pages/admin/AdminBannerPage')) // 관리자 배너 관리
const AdminDepositPage = lazy(() => import('@/pages/admin/AdminDepositPage')) // 관리자 보증금 관리
const AdminEscrowConfigPage = lazy(() => import('@/pages/admin/AdminEscrowConfigPage')) // 관리자 에스크로 설정
const AdminInquiryDetailPage = lazy(() => import('@/pages/admin/AdminInquiryDetailPage')) // 관리자 문의 상세 페이지

// 약관·개인정보처리방침
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'))

// 404 페이지
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage')) // 페이지를 찾을 수 없을 때 표시

export const router = createBrowserRouter(
  [
    // ── Public only (로그인하면 홈으로)
    {
      element: <PublicOnlyRoute />,
      children: [
        { path: '/login', element: <LoginPage /> },
        { path: '/signup', element: <SignupPage /> },
      ],
    },

    // ── 소셜 로그인 콜백 (카카오/구글 공용)
    { path: '/auth/:provider/callback', element: <SocialCallbackPage /> },

    // ── 이메일 인증 (메일 링크에서 진입, 비로그인도 접근 가능)
    { path: '/auth/verify-email', element: <VerifyEmailPage /> },

    // ── 비로그인 접근 가능 라우트
    {
      element: <RootLayout />,
      children: [
        { path: '/', element: <HomePage /> },
        { path: '/categories/:id', element: <CategoryPage /> },
        { path: '/items', element: <ItemListPage /> },
        { path: '/items/:id', element: <ItemDetailPage /> },
        { path: '/notices', element: <NoticePage /> },
        { path: '/notices/write', element: <NoticeWritePage /> },
        { path: '/notices/:id/edit', element: <NoticeWritePage /> },
        { path: '/notices/:id', element: <NoticeDetailPage /> },
        { path: '/support', element: <SupportPage /> },
        { path: '/support/posts/new', element: <AdminSupportPostFormPage /> },
        { path: '/support/posts/:id/edit', element: <AdminSupportPostFormPage /> },
        { path: '/terms', element: <TermsPage /> },

        // 거래대행 — 링크 공유 대상자도 접근 가능
        { path: '/escrow/join/:linkId', element: <EscrowInvitePage /> },
        { path: '/escrow/join/:linkId/form', element: <EscrowApplicationPage /> },
        { path: '/escrow/internal/new', element: <EscrowInternalApplicationPage /> },
        { path: '/escrow/:id/buyer-info', element: <EscrowBuyerInfoPage /> },
        { path: '/escrow/:id/pay', element: <EscrowPayPage /> },
        { path: '/escrow/join/:linkId/complete', element: <EscrowCompletePage /> },
      ],
    },

    // ── 일반 사용자 라우트 (로그인 필수)
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <RootLayout />,
          children: [
            { path: '/items/new', element: <ItemCreatePage /> },
            { path: '/items/:id/edit', element: <ItemEditPage /> },

            { path: '/transactions/:id', element: <TransactionPage /> },

            { path: '/point', element: <PointPage /> },
            { path: '/point/charge', element: <ChargePage /> },
            { path: '/point/charge/callback', element: <ChargeCallbackPage /> },
            { path: '/point/withdraw', element: <WithdrawPage /> },

            { path: '/delivery', element: <DeliveryPage /> },
            { path: '/delivery/:id/track', element: <DeliveryTrackPage /> },

            { path: '/mypage', element: <MyPage /> },
            { path: '/mypage/edit', element: <ProfileEditPage /> },
            { path: '/mypage/items', element: <MyItemsPage /> },
            { path: '/trades/:tradeId', element: <TradeDetailPage /> },
            { path: '/mypage/wishes', element: <WishListPage /> },
            { path: '/users/:id', element: <UserProfilePage /> },
            { path: '/mypage/blocks', element: <BlockListPage /> },
            { path: '/mypage/overdue', element: <MyOverduePage /> },
            { path: '/mypage/inquiries/:id', element: <MyInquiryDetailPage /> },

            { path: '/notifications', element: <NotificationPage /> },
            { path: '/reviews', element: <ReviewManagePage /> },
            { path: '/reviews/write', element: <ReviewWritePage /> },

            // 거래대행 — 로그인 필수
            { path: '/escrow', element: <EscrowHubPage /> },
            { path: '/escrow/list', element: <EscrowListPage /> },
            { path: '/escrow/list/:id', element: <EscrowDetailPage /> },
            { path: '/escrow/apply', element: <EscrowStartPage /> },
            { path: '/escrow/apply/link', element: <EscrowLinkPage /> },
          ],
        },
      ],
    },

    // ── 관리자 라우트 (RootLayout으로 감싸 헤더·푸터·하단 네비 제공)
    { path: '/admin/login', element: <AdminLoginPage /> },
    {
      element: <AdminRoute />,
      children: [
        {
          element: <RootLayout />,
          children: [
            { path: '/admin', element: <Navigate to="/admin/dashboard" replace /> },
            { path: '/admin/dashboard', element: <AdminDashboard /> },
            { path: '/admin/users', element: <AdminUserPage /> }, // 전체 회원
            { path: '/admin/users/today', element: <AdminTodayUsersPage /> }, // 오늘 신규 가입자
            { path: '/admin/users/withdrawn', element: <AdminWithdrawnUsersPage /> }, // 탈퇴 회원
            { path: '/admin/trades', element: <AdminMonthlyTradesPage /> }, // 이번달 거래
            { path: '/admin/items', element: <AdminItemPage /> },
            { path: '/admin/escrow/applications', element: <AdminEscrowApplicationsPage /> },
            { path: '/admin/escrow/applications/:id', element: <AdminEscrowApplicationsPage /> },
            { path: '/admin/reports', element: <AdminReportPage /> }, // 신고 대기
            { path: '/admin/overdue', element: <AdminOverduePage /> }, // 연체 관리
            { path: '/admin/withdraws', element: <AdminWithdrawPage /> },
            { path: '/admin/delivery', element: <AdminDeliveryPage /> },
            { path: '/admin/notices', element: <AdminNoticePage /> },
            { path: '/admin/banners', element: <AdminBannerPage /> },
            { path: '/admin/deposits', element: <AdminDepositPage /> },
            { path: '/admin/escrow-config', element: <AdminEscrowConfigPage /> },
            { path: '/admin/support/:id', element: <AdminInquiryDetailPage /> }, // 관리자 문의 상세
          ],
        },
      ],
    },

    // ── 404
    { path: '*', element: <NotFoundPage /> },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
)
