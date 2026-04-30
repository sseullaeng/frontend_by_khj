import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

/** 웹 스타일 레이아웃: Header + 콘텐츠 영역 + Footer */
export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
