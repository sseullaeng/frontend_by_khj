import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-base font-semibold mb-3">쓸랭</h3>
            <p className="text-gray-600 text-xs">
              중고거래·대여·나눔·배달대행 통합 C2C 플랫폼
            </p>
            <p className="text-gray-600 text-xs mt-1">
              중고거래·대여·나눔·배달대행 통합 C2C 플랫폼
            </p>
          </div>
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
          <div>
            <h4 className="font-medium mb-2 text-sm">고객센터</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>전화: 1234-5678</p>
              <p>이메일: help@sseulang.com</p>
              <p>운영시간: 평일 09:00-18:00</p>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          © 2024 쓸랭 주식회사. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
