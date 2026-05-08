// 애플리케이션 라우터 설정: React Router를 사용한 페이지 경로 관리
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy } from 'react'

// 공통 레이아웃 컴포넌트
import RootLayout from '@/shared/ui/RootLayout'

// 라우트 가드 컴포넌트: 인증 상태에 따른 접근 제어
import ProtectedRoute from '@/shared/ui/ProtectedRoute'      // 로그인 사용자 전용
import AdminRoute from '@/shared/ui/AdminRoute'              // 관리자 전용
import PublicOnlyRoute from '@/shared/ui/PublicOnlyRoute'    // 비로그인 사용자 전용

// 인증 관련 페이지 - lazy import (코드 스플리팅으로 초기 로딩 최적화)
const LoginPage          = lazy(() => import('@/pages/auth/LoginPage'))          // 로그인 페이지
const SignupPage         = lazy(() => import('@/pages/auth/SignupPage'))         // 회원가입 페이지
const SocialCallbackPage = lazy(() => import('@/pages/auth/SocialCallbackPage')) // 소셜 로그인 콜백 페이지
const VerifyEmailPage    = lazy(() => import('@/pages/auth/VerifyEmailPage'))    // 이메일 인증 페이지

// 홈 관련 페이지
const HomePage           = lazy(() => import('@/pages/home/HomePage'))           // 메인 홈페이지
const CategoryPage       = lazy(() => import('@/pages/home/CategoryPage'))       // 카테고리 페이지

// 물품 관련 페이지
const ItemListPage       = lazy(() => import('@/pages/item/ItemListPage'))       // 물품 목록 페이지
const ItemDetailPage     = lazy(() => import('@/pages/item/ItemDetailPage'))     // 물품 상세 페이지
const ItemCreatePage     = lazy(() => import('@/pages/item/ItemCreatePage'))     // 물품 등록 페이지
const ItemEditPage       = lazy(() => import('@/pages/item/ItemEditPage'))       // 물품 수정 페이지

// 거래 관련 페이지
const TransactionPage    = lazy(() => import('@/pages/transaction/TransactionPage')) // 거래 페이지

// 포인트 관련 페이지
const PointPage          = lazy(() => import('@/pages/point/PointPage'))          // 포인트 페이지
const ChargePage         = lazy(() => import('@/pages/point/ChargePage'))         // 포인트 충전 페이지
const ChargeCallbackPage = lazy(() => import('@/pages/point/ChargeCallbackPage')) // 충전 콜백 페이지
const WithdrawPage       = lazy(() => import('@/pages/point/WithdrawPage'))       // 포인트 출금 페이지

// 배송 관련 페이지
const DeliveryPage       = lazy(() => import('@/pages/delivery/DeliveryPage'))       // 배송 페이지
const DeliveryTrackPage  = lazy(() => import('@/pages/delivery/DeliveryTrackPage'))  // 배송 추적 페이지

// 마이페이지 관련
const MyPage             = lazy(() => import('@/pages/mypage/MyPage'))             // 마이페이지 메인
const ProfileEditPage    = lazy(() => import('@/pages/mypage/ProfileEditPage'))    // 프로필 수정 페이지
const UserProfilePage    = lazy(() => import('@/pages/mypage/UserProfilePage'))    // 사용자 프로필 페이지
const BlockListPage      = lazy(() => import('@/pages/mypage/BlockListPage'))      // 차단 목록 페이지
const WishListPage       = lazy(() => import('@/pages/mypage/WishListPage'))       // 찜 목록 페이지
const MyItemsPage        = lazy(() => import('@/pages/mypage/MyItemsPage'))        // 내 물품 페이지
const TradeDetailPage     = lazy(() => import('@/pages/mypage/TradeDetailPage'))     // 거래 내역 상세 페이지

// 알림 및 리뷰 관련
const NotificationPage   = lazy(() => import('@/pages/notification/NotificationPage')) // 알림 페이지
const ReviewManagePage   = lazy(() => import('@/pages/review/ReviewManagePage'))   // 리뷰 관리 페이지
const ReviewWritePage    = lazy(() => import('@/pages/review/ReviewWritePage'))    // 리뷰 작성 페이지

// 공지 및 지원 관련
const NoticePage         = lazy(() => import('@/pages/notice/NoticePage'))         // 공지사항 페이지
const NoticeDetailPage   = lazy(() => import('@/pages/notice/NoticeDetailPage'))   // 공지 상세 페이지
const NoticeWritePage    = lazy(() => import('@/pages/notice/NoticeWritePage'))    // 공지 글쓰기·수정 페이지 (관리자)
const SupportPage           = lazy(() => import('@/pages/support/SupportPage'))           // 고객 지원 페이지
const MyInquiryDetailPage   = lazy(() => import('@/pages/support/MyInquiryDetailPage'))   // 본인 문의 상세 (라운드8)

// 거래 대행(Escrow) 관련 페이지
const EscrowHubPage         = lazy(() => import('@/pages/escrow/EscrowHubPage'))         // 에스크로 허브 페이지
const EscrowListPage        = lazy(() => import('@/pages/escrow/EscrowListPage'))        // 에스크로 목록 페이지
const EscrowDetailPage      = lazy(() => import('@/pages/escrow/EscrowDetailPage'))      // 에스크로 상세 페이지
const EscrowStartPage       = lazy(() => import('@/pages/escrow/EscrowStartPage'))       // 에스크로 시작 페이지
const EscrowLinkPage        = lazy(() => import('@/pages/escrow/EscrowLinkPage'))        // 에스크로 링크 페이지
const EscrowInvitePage      = lazy(() => import('@/pages/escrow/EscrowInvitePage'))      // 에스크로 초대 페이지
const EscrowApplicationPage = lazy(() => import('@/pages/escrow/EscrowApplicationPage')) // 에스크로 신청 페이지
const EscrowPaymentPage     = lazy(() => import('@/pages/escrow/EscrowPaymentPage'))     // 에스크로 결제 페이지
const EscrowCompletePage         = lazy(() => import('@/pages/escrow/EscrowCompletePage'))         // 에스크로 완료 페이지
const EscrowPaymentCallbackPage  = lazy(() => import('@/pages/escrow/EscrowPaymentCallbackPage'))  // 거래대행 결제 콜백 (Toss)

// 관리자 페이지
const AdminLoginPage          = lazy(() => import('@/pages/admin/AdminLoginPage'))          // 관리자 로그인 페이지
// 라운드13: /admin/dashboard 가 차트 대시보드(AdminStats) 를 사용. 옛 카드형 AdminDashboard 는
// 백엔드 §11.7 응답을 그대로 보여주는 페이지로 따로 보존(필요 시 별도 라우트로 노출).
const AdminDashboard          = lazy(() => import('@/pages/mypage/AdminStats'))             // 관리자 대시보드 (차트)
const AdminUserPage           = lazy(() => import('@/pages/admin/AdminUserPage'))           // 관리자 전체 회원 관리
const AdminTodayUsersPage     = lazy(() => import('@/pages/admin/AdminTodayUsersPage'))     // 관리자 오늘 신규 가입자
const AdminWithdrawnUsersPage = lazy(() => import('@/pages/admin/AdminWithdrawnUsersPage')) // 관리자 탈퇴 회원 관리
const AdminMonthlyTradesPage  = lazy(() => import('@/pages/admin/AdminMonthlyTradesPage'))  // 관리자 이번달 거래
const AdminItemPage           = lazy(() => import('@/pages/admin/AdminItemPage'))           // 관리자 물품 관리
const AdminReportPage         = lazy(() => import('@/pages/admin/AdminReportPage'))         // 관리자 신고 대기 처리
const AdminWithdrawPage       = lazy(() => import('@/pages/admin/AdminWithdrawPage'))       // 관리자 출금 관리
const AdminDeliveryPage       = lazy(() => import('@/pages/admin/AdminDeliveryPage'))       // 관리자 배송 관리
const AdminNoticePage         = lazy(() => import('@/pages/admin/AdminNoticePage'))         // 관리자 공지 관리
const AdminBannerPage         = lazy(() => import('@/pages/admin/AdminBannerPage'))         // 관리자 배너 관리
const AdminDepositPage        = lazy(() => import('@/pages/admin/AdminDepositPage'))        // 관리자 보증금 관리
const AdminEscrowConfigPage   = lazy(() => import('@/pages/admin/AdminEscrowConfigPage'))   // 관리자 에스크로 설정
const AdminInquiryDetailPage  = lazy(() => import('@/pages/admin/AdminInquiryDetailPage'))  // 관리자 문의 상세 페이지

// 404 페이지
const NotFoundPage       = lazy(() => import('@/pages/NotFoundPage')) // 페이지를 찾을 수 없을 때 표시

export const router = createBrowserRouter([
  // ── Public only (로그인하면 홈으로)
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login',  element: <LoginPage /> },
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
      { path: '/',                 element: <HomePage /> },
      { path: '/categories/:id',   element: <CategoryPage /> },
      { path: '/items',            element: <ItemListPage /> },
      { path: '/items/:id',        element: <ItemDetailPage /> },
      { path: '/notices',          element: <NoticePage /> },
      { path: '/notices/write',    element: <NoticeWritePage /> },
      { path: '/notices/:id/edit', element: <NoticeWritePage /> },
      { path: '/notices/:id',      element: <NoticeDetailPage /> },
      { path: '/support',          element: <SupportPage /> },

      // 거래대행 — 링크 공유 대상자도 접근 가능
      { path: '/escrow/join/:linkId',          element: <EscrowInvitePage /> },
      { path: '/escrow/join/:linkId/form',    element: <EscrowApplicationPage /> },
      { path: '/escrow/join/:linkId/payment',  element: <EscrowPaymentPage /> },
      { path: '/escrow/join/:linkId/complete', element: <EscrowCompletePage /> },
      // Toss success/fail redirect — public 진입 가능 (Toss 가 외부에서 redirect)
      { path: '/escrow/payment/callback',      element: <EscrowPaymentCallbackPage /> },
    ],
  },

  // ── 일반 사용자 라우트 (로그인 필수)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { path: '/items/new',             element: <ItemCreatePage /> },
          { path: '/items/:id/edit',        element: <ItemEditPage /> },

{ path: '/transactions/:id',      element: <TransactionPage /> },

          { path: '/point',                 element: <PointPage /> },
          { path: '/point/charge',          element: <ChargePage /> },
          { path: '/point/charge/callback', element: <ChargeCallbackPage /> },
          { path: '/point/withdraw',        element: <WithdrawPage /> },

          { path: '/delivery',              element: <DeliveryPage /> },
          { path: '/delivery/:id/track',    element: <DeliveryTrackPage /> },

          { path: '/mypage',                element: <MyPage /> },
          { path: '/mypage/edit',           element: <ProfileEditPage /> },
          { path: '/mypage/items',          element: <MyItemsPage /> },
          { path: '/trades/:tradeId',        element: <TradeDetailPage /> },
          { path: '/mypage/wishes',         element: <WishListPage /> },
          { path: '/users/:id',             element: <UserProfilePage /> },
          { path: '/mypage/blocks',         element: <BlockListPage /> },
          { path: '/mypage/inquiries/:id',  element: <MyInquiryDetailPage /> },

          { path: '/notifications',         element: <NotificationPage /> },
          { path: '/reviews',               element: <ReviewManagePage /> },
          { path: '/reviews/write',         element: <ReviewWritePage /> },

          // 거래대행 — 로그인 필수
          { path: '/escrow',               element: <EscrowHubPage /> },
          { path: '/escrow/list',          element: <EscrowListPage /> },
          { path: '/escrow/list/:id',      element: <EscrowDetailPage /> },
          { path: '/escrow/apply',         element: <EscrowStartPage /> },
          { path: '/escrow/apply/link',    element: <EscrowLinkPage /> },
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
          { path: '/admin',                  element: <Navigate to="/admin/dashboard" replace /> },
          { path: '/admin/dashboard',        element: <AdminDashboard /> },
          { path: '/admin/users',            element: <AdminUserPage /> },           // 전체 회원
          { path: '/admin/users/today',      element: <AdminTodayUsersPage /> },     // 오늘 신규 가입자
          { path: '/admin/users/withdrawn',  element: <AdminWithdrawnUsersPage /> }, // 탈퇴 회원
          { path: '/admin/trades',           element: <AdminMonthlyTradesPage /> },  // 이번달 거래
          { path: '/admin/items',            element: <AdminItemPage /> },
          { path: '/admin/reports',          element: <AdminReportPage /> },         // 신고 대기
          { path: '/admin/withdraws',        element: <AdminWithdrawPage /> },
          { path: '/admin/delivery',         element: <AdminDeliveryPage /> },
          { path: '/admin/notices',          element: <AdminNoticePage /> },
          { path: '/admin/banners',          element: <AdminBannerPage /> },
          { path: '/admin/deposits',         element: <AdminDepositPage /> },
          { path: '/admin/escrow-config',    element: <AdminEscrowConfigPage /> },
          { path: '/admin/support/:id',     element: <AdminInquiryDetailPage /> },  // 관리자 문의 상세
        ],
      },
    ],
  },

  // ── 404
  { path: '*', element: <NotFoundPage /> },
], {
  basename: import.meta.env.BASE_URL,
})
