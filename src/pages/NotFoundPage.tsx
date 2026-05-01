// 404 에러 페이지 컴포넌트: 존재하지 않는 페이지 접속 시 사용자 친화적인 에러 화면 표시
import { Link } from 'react-router-dom'  // React Router의 Link 컴포넌트

/**
 * 404 Not Found 페이지 컴포넌트
 * 
 * 기능:
 * - 사용자가 존재하지 않는 URL에 접속했을 때 표시
 * - 친절한 에러 메시지와 안내 제공
 * - 홈페이지로 돌아가기 위한 네비게이션 버튼
 * - 중앙 정렬된 레이아웃으로 시각적 안정성 제공
 * - 반응형 디자인으로 모든 기기에서 적절한 표시
 * 
 * UI 구조:
 * - 상단: 큰 404 에러 코드
 * - 중앙: 에러 제목과 설명 메시지
 * - 하단: 홈으로 가기 버튼
 */
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      {/* 에러 코드: 크고 흐리게 표시하여 시각적 강조 */}
      <p className="text-7xl font-bold text-gray-200">404</p>
      
      {/* 에러 메시지: 사용자에게 상황을 명확하게 설명 */}
      <h1 className="text-xl font-bold text-gray-800">페이지를 찾을 수 없어요</h1>
      <p className="text-sm text-gray-500">주소가 잘못됐거나 삭제된 페이지예요.</p>
      
      {/* 홈으로 돌아가기 버튼: 사용자가 다른 페이지로 이동할 수 있는 경로 제공 */}
      <Link 
        to="/" 
        className="px-6 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition-colors"
      >
        홈으로 가기
      </Link>
    </div>
  )
}
