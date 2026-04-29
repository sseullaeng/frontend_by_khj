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

const ChatListPage       = lazy(() => import('@/pages/chat/ChatListPage'))
const ChatRoomPage       = lazy(() => import('@/pages/chat/ChatRoomPage'))

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

const NotificationPage   = lazy(() => import('@/pages/notification/NotificationPage'))

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
const AdminDepositPage   = lazy(() => import('@/pages/admin/AdminDepositPage'))

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

  // ── 소셜 로그인 콜백 (인증 미들웨어 불필요)
  { path: '/auth/callback', element: <SocialCallbackPage /> },

  // ── 비로그인 접근 가능 라우트
  {
    element: <RootLayout />,
    children: [
      { path: '/',                          element: <HomePage /> },
      { path: '/categories/:slug',          element: <CategoryPage /> },
      { path: '/items',                     element: <ItemListPage /> },
      { path: '/items/:id',                 element: <ItemDetailPage /> },
    ],
  },

  // ── 일반 사용자 라우트 (로그인 필수)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { path: '/items/new',                 element: <ItemCreatePage /> },
          { path: '/items/:id/edit',            element: <ItemEditPage /> },

          { path: '/chats',                     element: <ChatListPage /> },
          { path: '/chats/:roomId',             element: <ChatRoomPage /> },

          { path: '/transactions/:id',          element: <TransactionPage /> },

          { path: '/point',                     element: <PointPage /> },
          { path: '/point/charge',              element: <ChargePage /> },
          { path: '/point/charge/callback',     element: <ChargeCallbackPage /> },
          { path: '/point/withdraw',            element: <WithdrawPage /> },

          { path: '/delivery',                  element: <DeliveryPage /> },
          { path: '/delivery/:id/track',        element: <DeliveryTrackPage /> },

          { path: '/mypage',                    element: <MyPage /> },
          { path: '/mypage/edit',               element: <ProfileEditPage /> },
          { path: '/users/:id',                 element: <UserProfilePage /> },
          { path: '/mypage/blocks',             element: <BlockListPage /> },

          { path: '/notifications',             element: <NotificationPage /> },
        ],
      },
    ],
  },

  // ── 관리자 라우트
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    element: <AdminRoute />,
    children: [
      { path: '/admin',            element: <Navigate to="/admin/dashboard" replace /> },
      { path: '/admin/dashboard',  element: <AdminDashboard /> },
      { path: '/admin/users',      element: <AdminUserPage /> },
      { path: '/admin/items',      element: <AdminItemPage /> },
      { path: '/admin/reports',    element: <AdminReportPage /> },
      { path: '/admin/withdraws',  element: <AdminWithdrawPage /> },
      { path: '/admin/delivery',   element: <AdminDeliveryPage /> },
      { path: '/admin/notices',    element: <AdminNoticePage /> },
      { path: '/admin/banners',    element: <AdminBannerPage /> },
      { path: '/admin/deposits',   element: <AdminDepositPage /> },
    ],
  },

  // ── 404
  { path: '*', element: <NotFoundPage /> },
])
