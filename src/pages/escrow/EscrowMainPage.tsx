// 에스크로 메인 페이지 컴포넌트: 에스크로(거래대행) 서비스 메인 페이지
import { Link } from 'react-router-dom'  // React Router의 Link 컴포넌트
import { Shield, FileText, ArrowRight } from 'lucide-react'  // Lucide 아이콘들

/**
 * 에스크로 메인 페이지 컴포넌트
 * 
 * 기능:
 * - 에스크로 서비스 소개
 * - 에스크로 신청 페이지로 이동
 * - 에스크로 목록 페이지로 이동
 * - 안전한 거래대행 서비스 안내
 * 
 * UI 구조:
 * - 상단: 에스크로 서비스 설명 및 아이콘
 * - 하단: 기능별 카드 메뉴 (신청, 목록 등)
 * - 반응형 디자인으로 모바일 최적화
 */
export default function EscrowMainPage() {
  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* 헤더 섹션 */}
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Shield className="text-primary-600" size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">안전 거래대행</h1>
        
        <p className="text-gray-600 text-sm">
          쓸랭 에스크로를 통해 안전하고 편리한 거래를 경험해보세요.
        </p>
      </div>

      {/* 기능 카드 메뉴 */}
      <div className="space-y-4">
        <Link to="/escrow/apply">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-primary-600" size={24} />
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">거래대행 신청</h2>
                  <p className="text-sm text-gray-600">
                    안전한 거래를 위해 에스크로 서비스를 신청하세요.
                      
                  </p>
                </div>
              </div>
              <ArrowRight className="text-gray-400" size={20} />
            </div>
          </div>
        </Link>

        <Link to="/escrow/list">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1"> </h2>
                  <p className="text-sm text-gray-600">
                      
                  </p>
                </div>
              </div>
              <ArrowRight className="text-gray-400" size={20} />
            </div>
          </div>
        </Link>
      </div>

      {/* 안내 정보 */}
      <div className="bg-gray-50 rounded-xl p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-3"> </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">·</span>
            <span>  .</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">·</span>
            <span>  .</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">·</span>
            <span>  .</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
