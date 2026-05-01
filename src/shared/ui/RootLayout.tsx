// 루트 레이아웃 컴포넌트: 애플리케이션의 전체 구조를 정의하는 웹 스타일 레이아웃
import { Outlet } from 'react-router-dom'  // React Router의 Outlet (자식 라우트 렌더링)
import Header from './Header'              // 상단 네비게이션 헤더
import Footer from './Footer'              // 하단 푸터
import SideDrawer from './SideDrawer'      // 사이드 드로워 (채팅/알림)

/**
 * 웹 스타일 레이아웃 컴포넌트
 * 전형적인 웹 페이지 구조인 Header + 콘텐츠 영역 + Footer를 구성합니다.
 * 모든 페이지에서 공통으로 사용되는 기본 레이아웃입니다.
 * 
 * 구조:
 * - Header: 상단 네비게이션 바
 * - main: 페이지별 콘텐츠가 렌더링되는 영역 (Outlet)
 * - Footer: 하단 정보 영역
 * - SideDrawer: 우측에서 나타나는 채팅/알림 드로워
 */
export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 헤더 */}
      <Header />
      
      {/* 메인 콘텐츠 영역: 페이지별 내용이 여기에 렌더링됨 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />  {/* 현재 라우트에 해당하는 페이지 컴포넌트가 렌더링됨 */}
      </main>
      
      {/* 하단 푸터 */}
      <Footer />
      
      {/* 사이드 드로워: 채팅 및 알림 기능 */}
      <SideDrawer />
    </div>
  )
}
