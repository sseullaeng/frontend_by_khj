// 푸터 컴포넌트: 웹사이트 하단 정보 영역 - 회사 정보, 고객센터, 저작권 정보 표시
import { Link } from 'react-router-dom'  // React Router의 링크 컴포넌트

/**
 * 푸터 컴포넌트
 * 웹사이트 하단에 위치하며 회사 정보, 고객센터 연락처, 저작권 정보 등을 표시합니다.
 * 반응형 디자인으로 모바일과 데스크톱에서 모두 적절한 레이아웃을 제공합니다.
 * 
 * 구조:
 * - 좌측: 브랜드 소개
 * - 중앙: 사업자 정보
 * - 우측: 고객센터 정보
 * - 하단: 저작권 정보
 */
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
      {/* 푸터 컨텐츠 컨테이너 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 3단 그리드 레이아웃 (모바일에서는 1단) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 브랜드 소개 섹션 */}
          <div>
            <h3 className="text-base font-semibold mb-3">쓸랭</h3>
            <p className="text-gray-600 text-xs">
              중고거래·대여·나눔·배달대행 통합 C2C 플랫폼
            </p>
          </div>
          
          {/* 사업자 정보 섹션 */}
          <div>
            <h4 className="font-medium mb-2 text-sm">사업자 정보</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>상호명: 쓸랭 주식회사</p>
              <p>대표자: 김쓸랭</p>
              <p>사업자등록번호: 123-45-67890</p>
              <p>통신판매업신고: 제2024-서울강남-1234호</p>
              <p>주소: 서울특별시 강남구 테헤란로 123</p>
            </div>
          </div>
          
          {/* 고객센터 섹션 */}
          <div>
            <Link 
              to="/support" 
              className="font-medium mb-2 text-sm hover:text-primary-600 transition-colors inline-block"
            >
              고객센터
            </Link>
            <div className="text-xs text-gray-600 space-y-1">
              <p>전화: 1234-5678</p>
              <p>이메일: help@sseulang.com</p>
              <p>운영시간: 평일 09:00-18:00</p>
            </div>
          </div>
        </div>
        
        {/* 저작권 정보 섹션 */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          © 2024 쓸랭 주식회사. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
