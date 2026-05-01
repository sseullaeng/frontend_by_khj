// 소셜 로그인 콜백 페이지 컴포넌트: 카카오/네이버 소셜 로그인 후 처리 페이지
import { useEffect } from 'react'  // React 이펙트 훅
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'  // React Router 훅들
import { authApi } from '@/features/auth/api'  // 인증 API
import { useAuthStore } from '@/features/auth/store'  // 인증 상태 관리 스토어
import { toast } from 'sonner'  // 토스트 알림 라이브러리

/**
 * 소셜 로그인 콜백 페이지 컴포넌트
 * 
 * 기능:
 * - 소셜 로그인 제공업체(카카오/네이버)에서 리디렉션된 인증 코드 처리
 * - 인증 코드를 백엔드로 전송하여 액세스 토큰 및 사용자 정보 획득
 * - 성공 시 사용자 정보 저장 및 홈페이지로 이동
 * - 실패 시 에러 메시지 표시 및 로그인 페이지로 리디렉션
 * - 처리 중 로딩 상태 표시
 * 
 * 처리 흐름:
 * 1. URL 파라미터에서 인증 코드 추출
 * 2. 경로를 기준으로 제공업체 식별 (kakao/naver)
 * 3. 백엔드 API로 인증 코드 전송
 * 4. 응답에 따라 성공/실패 처리
 */
export default function SocialCallbackPage() {
  const [params] = useSearchParams()  // URL 쿼리 파라미터
  const navigate = useNavigate()      // 페이지 네비게이션 함수
  const location = useLocation()     // 현재 위치 정보
  const setUser = useAuthStore((s) => s.setUser)  // 사용자 정보 설정 함수

  // 소셜 로그인 처리 이펙트
  useEffect(() => {
    // URL에서 인증 코드 추출
    const code = params.get('code')
    
    // 경로를 기준으로 소셜 제공업체 식별
    const provider = location.pathname.includes('kakao') ? 'kakao' : 'naver'

    // 인증 코드가 없으면 실패 처리
    if (!code) {
      toast.error('소셜 로그인에 실패했어요.')
      navigate('/login')
      return
    }

    // 백엔드에 인증 코드 전송하여 토큰 및 사용자 정보 요청
    authApi
      .socialCallback(code, provider)
      .then((r) => {
        // 성공 시 사용자 정보 저장 및 홈으로 이동
        setUser(r.data.user)
        navigate('/')
      })
      .catch(() => {
        // 실패 시 에러 메시지 표시 및 로그인 페이지로 이동
        toast.error('소셜 로그인에 실패했어요.')
        navigate('/login')
      })
  }, [])  // 의존성 배열이 비어있어 컴포넌트 마운트 시 한 번만 실행

  // 로딩 상태 UI: 소셜 로그인 처리 중임을 시각적으로 표시
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">로그인 처리 중...</p>
    </div>
  )
}
