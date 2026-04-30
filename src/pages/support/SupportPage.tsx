import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Headphones, MessageCircle, HelpCircle, Search, ChevronDown, ChevronUp, Phone, Mail, Clock } from 'lucide-react'

const faqCategories = [
  {
    id: 'account',
    name: '계정',
    icon: '👤',
    questions: [
      {
        question: '회원가입은 어떻게 하나요?',
        answer: '화면 상단의 회원가입 버튼을 클릭하여 필요한 정보를 입력하시면 5분 내로 가입이 완료됩니다.'
      },
      {
        question: '비밀번호를 잊어버렸어요',
        answer: '로그인 화면에서 "비밀번호 찾기"를 클릭하고 이메일을 입력하시면 임시 비밀번호가 발송됩니다.'
      },
      {
        question: '회원탈퇴는 어떻게 하나요?',
        answer: '마이페이지 > 계정설정 > 회원탈퇴에서 진행하실 수 있으며, 탈퇴 후 30일간은 재가입이 불가능합니다.'
      }
    ]
  },
  {
    id: 'transaction',
    name: '거래',
    icon: '💰',
    questions: [
      {
        question: '물품 등록은 무료인가요?',
        answer: '기본 물품 등록은 무료이며, 특별 서비스(우선 노출 등)는 유료로 제공됩니다.'
      },
      {
        question: '거래대행 서비스는 어떻게 신청하나요?',
        answer: '물품 상세페이지에서 "거래대행 신청" 버튼을 클릭하여 필요한 정보를 입력하시면 됩니다.'
      },
      {
        question: '판매 수수료는 얼마인가요?',
        answer: '기본 수수료는 5%이며, 월간 거래액에 따라 단계별 할인이 적용됩니다.'
      }
    ]
  },
  {
    id: 'payment',
    name: '결제',
    icon: '💳',
    questions: [
      {
        question: '어떤 결제수단을 사용할 수 있나요?',
        answer: '신용카드, 계좌이체, 휴대폰 소액결제, 간편결제 등 다양한 결제수단을 지원합니다.'
      },
      {
        question: '환불은 어떻게 받을 수 있나요?',
        answer: '결제 후 7일 내에 고객센터로 연락주시면 환불 처리가 가능하며, 결제수단에 따라 3-5일 내로 처리됩니다.'
      },
      {
        question: '보증금은 언제 반환되나요?',
        answer: '거래 완료 후 24시간 내에 자동으로 반환되며, 영업일 기준 2-3일 내에 입금됩니다.'
      }
    ]
  },
  {
    id: 'delivery',
    name: '배송',
    icon: '📦',
    questions: [
      {
        question: '배송비는 얼마인가요?',
        answer: '기본 배송비는 3,000원이며, 30,000원 이상 구매 시 무료 배송됩니다.'
      },
      {
        question: '배송에는 얼마나 걸리나요?',
        answer: '수도권은 1-2일, 지방은 2-3일 내에 배송되며, 주말 및 공휴일은 제외된 기간입니다.'
      },
      {
        question: '배송 추적은 어떻게 하나요?',
        answer: '마이페이지 > 거래내역에서 송장번호를 확인하여 배송 현황을 실시간으로 추적할 수 있습니다.'
      }
    ]
  }
]

const contactInfo = {
  phone: '1234-5678',
  email: 'help@sseulang.com',
  hours: '평일 09:00-18:00 (주말/공휴일 휴무)'
}

export default function SupportPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState<'faq' | 'inquiry'>('faq')

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
    setExpandedQuestion(null)
  }

  const toggleQuestion = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index)
  }

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Headphones className="text-primary-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-900">고객센터</h1>
          </div>
          <p className="text-gray-600 mt-2">궁금하신 점이 있으신가요? 빠르고 정확하게 안내해드립니다.</p>
        </div>
      </div>

      {/* Quick Contact */}
      <div className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Phone size={24} />
              <div>
                <p className="font-medium">전화 상담</p>
                <p className="text-sm opacity-90">{contactInfo.phone}</p>
                <p className="text-xs opacity-75">{contactInfo.hours}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={24} />
              <div>
                <p className="font-medium">이메일 문의</p>
                <p className="text-sm opacity-90">{contactInfo.email}</p>
                <p className="text-xs opacity-75">24시간 접수 가능</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle size={24} />
              <div>
                <p className="font-medium">실시간 채팅</p>
                <p className="text-sm opacity-90">평일 09:00-18:00</p>
                <p className="text-xs opacity-75">빠른 응대</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSelectedTab('faq')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
              selectedTab === 'faq'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HelpCircle size={20} />
            자주하는 질문
          </button>
          <button
            onClick={() => setSelectedTab('inquiry')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
              selectedTab === 'inquiry'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle size={20} />
            1:1 상담
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {selectedTab === 'faq' ? (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="궁금하신 내용을 검색해보세요"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* FAQ Categories */}
            <div className="space-y-4">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <div key={category.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <span className="font-medium text-gray-900">{category.name}</span>
                        <span className="text-sm text-gray-500">({category.questions.length})</span>
                      </div>
                      {expandedCategory === category.id ? (
                        <ChevronUp className="text-gray-400" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-400" size={20} />
                      )}
                    </button>
                    
                    {expandedCategory === category.id && (
                      <div className="border-t border-gray-200">
                        {category.questions.map((item, index) => (
                          <div key={index} className="border-b border-gray-100 last:border-b-0">
                            <button
                              onClick={() => toggleQuestion(index)}
                              className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900">{item.question}</p>
                                {expandedQuestion === index ? (
                                  <ChevronUp className="text-gray-400 flex-shrink-0 ml-2" size={16} />
                                ) : (
                                  <ChevronDown className="text-gray-400 flex-shrink-0 ml-2" size={16} />
                                )}
                              </div>
                            </button>
                            {expandedQuestion === index && (
                              <div className="px-6 pb-4">
                                <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <HelpCircle size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">검색 결과가 없습니다</p>
                  <p className="text-sm text-gray-400 mt-2">다른 키워드로 검색해보세요</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1:1 Inquiry */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1:1 상담 신청</h2>
              <p className="text-gray-600 mb-6">궁금하신 점을 상세하게 작성해주시면 빠르고 정확하게 답변해드립니다.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">문의 유형</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                    <option>문의 유형을 선택해주세요</option>
                    <option>계정 관련</option>
                    <option>거래 관련</option>
                    <option>결제 관련</option>
                    <option>배송 관련</option>
                    <option>기타</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    type="text"
                    placeholder="문의 제목을 입력해주세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                  <textarea
                    rows={6}
                    placeholder="문의 내용을 상세하게 작성해주세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                  <input
                    type="email"
                    placeholder="답변받을 이메일을 입력해주세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                
                <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors">
                  상담 신청하기
                </button>
              </div>
            </div>

            {/* Recent Inquiries */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 문의내역</h3>
              <div className="space-y-3">
                <div className="p-4 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">배송 문의</span>
                    <span className="text-xs text-gray-500">2024-04-28</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">배송이 너무 늦어요</p>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    답변 완료
                  </span>
                </div>
                
                <div className="p-4 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">환불 문의</span>
                    <span className="text-xs text-gray-500">2024-04-25</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">주문 취소 후 환불 언제되나요?</p>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    처리 중
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
