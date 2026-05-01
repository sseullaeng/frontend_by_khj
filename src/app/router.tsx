import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy } from 'react'

// 레이아웃
import RootLayout from '@/shared/ui/RootLayout'

// 가드
import ProtectedRoute from '@/shared/ui/ProtectedRoute'
import AdminRoute from '@/shared/ui/AdminRoute'
import PublicOnlyRoute from '@/shared/ui/PublicOnlyRoute'

// 페이지 — lazy import (코드 스플리팅)
const LoginPage          = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage         = lazy(() => import('@/pages/auth/SignupPage'))
const SocialCallbackPage = lazy(() => import('@/pages/auth/SocialCallbackPage'))

const HomePage           = lazy(() => import('@/pages/home/HomePage'))
const CategoryPage       = lazy(() => import('@/pages/home/CategoryPage'))

const ItemListPage       = lazy(() => import('@/pages/item/ItemListPage'))
const ItemDetailPage     = lazy(() => import('@/pages/item/ItemDetailPage'))
const ItemCreatePage     = lazy(() => import('@/pages/item/ItemCreatePage'))
const ItemEditPage       = lazy(() => import('@/pages/item/ItemEditPage'))


const TransactionPage    = lazy(() => import('@/pages/transaction/TransactionPage'))

const PointPage          = lazy(() => import('@/pages/point/PointPage'))
const ChargePage         = lazy(() => import('@/pages/point/ChargePage'))
const ChargeCallbackPage = lazy(() => import('@/pages/point/ChargeCallbackPage'))
const WithdrawPage       = lazy(() => import('@/pages/point/WithdrawPage'))

const DeliveryPage       = lazy(() => import('@/pages/delivery/DeliveryPage'))
const DeliveryTrackPage  = lazy(() => import('@/pages/delivery/DeliveryTrackPage'))

const MyPage             = lazy(() => import('@/pages/mypage/MyPage'))
const ProfileEditPage    = lazy(() => import('@/pages/mypage/ProfileEditPage'))
const UserProfilePage    = lazy(() => import('@/pages/mypage/UserProfilePage'))
const BlockListPage      = lazy(() => import('@/pages/mypage/BlockListPage'))
const WishListPage       = lazy(() => import('@/pages/mypage/WishListPage'))
const MyItemsPage        = lazy(() => import('@/pages/mypage/MyItemsPage'))

const NotificationPage   = lazy(() => import('@/pages/notification/NotificationPage'))
const ReviewManagePage   = lazy(() => import('@/pages/review/ReviewManagePage'))
const ReviewWritePage    = lazy(() => import('@/pages/review/ReviewWritePage'))
const NoticePage         = lazy(() => import('@/pages/notice/NoticePage'))
const NoticeDetailPage   = lazy(() => import('@/pages/notice/NoticeDetailPage'))
const SupportPage        = lazy(() => import('@/pages/support/SupportPage'))

// 거래 대행
const EscrowHubPage         = lazy(() => import('@/pages/escrow/EscrowHubPage'))
const EscrowListPage        = lazy(() => import('@/pages/escrow/EscrowListPage'))
const EscrowDetailPage      = lazy(() => import('@/pages/escrow/EscrowDetailPage'))
const EscrowStartPage       = lazy(() => import('@/pages/escrow/EscrowStartPage'))
const EscrowLinkPage        = lazy(() => import('@/pages/escrow/EscrowLinkPage'))
const EscrowInvitePage      = lazy(() => import('@/pages/escrow/EscrowInvitePage'))
const EscrowApplicationPage = lazy(() => import('@/pages/escrow/EscrowApplicationPage'))
const EscrowPaymentPage     = lazy(() => import('@/pages/escrow/EscrowPaymentPage'))
const EscrowCompletePage    = lazy(() => import('@/pages/escrow/EscrowCompletePage'))

// 관리자
const AdminLoginPage     = lazy(() => import('@/pages/admin/AdminLoginPage'))
const AdminDashboard     = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUserPage      = lazy(() => import('@/pages/admin/AdminUserPage'))
const AdminItemPage      = lazy(() => import('@/pages/admin/AdminItemPage'))
const AdminReportPage    = lazy(() => import('@/pages/admin/AdminReportPage'))
const AdminWithdrawPage  = lazy(() => import('@/pages/admin/AdminWithdrawPage'))
const AdminDeliveryPage  = lazy(() => import('@/pages/admin/AdminDeliveryPage'))
const AdminNoticePage    = lazy(() => import('@/pages/admin/AdminNoticePage'))
const AdminBannerPage    = lazy(() => import('@/pages/admin/AdminBannerPage'))
const AdminDepositPage      = lazy(() => import('@/pages/admin/AdminDepositPage'))
const AdminEscrowConfigPage = lazy(() => import('@/pages/admin/AdminEscrowConfigPage'))

const NotFoundPage       = lazy(() => import('@/pages/NotFoundPage'))

export const router = createBrowserRouter([
  // ── Public only (로그인하면 홈으로)
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login',  element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },

  // ── 소셜 로그인 콜백
  { path: '/auth/callback', element: <SocialCallbackPage /> },

  // ── 비로그인 접근 가능 라우트
  {
    element: <RootLayout />,
    children: [
      { path: '/',                 element: <HomePage /> },
      { path: '/categories/:slug', element: <CategoryPage /> },
      { path: '/items',            element: <ItemListPage /> },
      { path: '/items/:id',        element: <ItemDetailPage /> },
      { path: '/notices',          element: <NoticePage /> },
      { path: '/notices/:id',      element: <NoticeDetailPage /> },
      { path: '/support',          element: <SupportPage /> },

      // 거래대행 — 링크 공유 대상자도 접근 가능
      { path: '/escrow/join/:linkId',          element: <EscrowInvitePage /> },
      { path: '/escrow/join/:linkId/form',    element: <EscrowApplicationPage /> },
      { path: '/escrow/join/:linkId/payment',  element: <EscrowPaymentPage /> },
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
          { path: '/mypage/wishes',         element: <WishListPage /> },
          { path: '/users/:id',             element: <UserProfilePage /> },
          { path: '/mypage/blocks',         element: <BlockListPage /> },

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

  // ── 관리자 라우트
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    element: <AdminRoute />,
    children: [
      { path: '/admin',           element: <Navigate to="/admin/dashboard" replace /> },
      { path: '/admin/dashboard', element: <AdminDashboard /> },
      { path: '/admin/users',     element: <AdminUserPage /> },
      { path: '/admin/items',     element: <AdminItemPage /> },
      { path: '/admin/reports',   element: <AdminReportPage /> },
      { path: '/admin/withdraws', element: <AdminWithdrawPage /> },
      { path: '/admin/delivery',  element: <AdminDeliveryPage /> },
      { path: '/admin/notices',   element: <AdminNoticePage /> },
      { path: '/admin/banners',   element: <AdminBannerPage /> },
      { path: '/admin/deposits',      element: <AdminDepositPage /> },
      { path: '/admin/escrow-config', element: <AdminEscrowConfigPage /> },
    ],
  },

  // ── 404
  { path: '*', element: <NotFoundPage /> },
], {
  basename: import.meta.env.BASE_URL,
})
