// 소셜 로그인 콜백 페이지 — 카카오/구글 redirect 흐름 공용 처리
//
// 흐름:
//   1) /auth/{provider}/callback?code=... 진입
//   2) URL 에서 code 추출
//   3) 백엔드 /auth/oauth2/{provider} 로 { code, redirectUri } POST
//      → 백엔드가 provider /oauth/token 호출해서 토큰 교환 + 사용자 정보 조회
//   4) setUser → 홈

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { KAKAO_REDIRECT_URI, GOOGLE_REDIRECT_URI } from '@/features/auth/oauth'
import { useOAuthLogin } from '@/features/auth/hooks'
import type { OAuthProvider } from '@/features/auth/types'

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  kakao: '카카오',
  google: '구글',
}

const REDIRECT_URI: Record<OAuthProvider, string> = {
  kakao: KAKAO_REDIRECT_URI,
  google: GOOGLE_REDIRECT_URI,
}

function isOAuthProvider(value: string | undefined): value is OAuthProvider {
  return value === 'kakao' || value === 'google'
}

export default function SocialCallbackPage() {
  const { provider } = useParams<{ provider?: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { mutate: oauthLogin } = useOAuthLogin()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const ranOnce = useRef(false)

  useEffect(() => {
    // StrictMode 에서 effect 두 번 실행 방지
    if (ranOnce.current) return
    ranOnce.current = true

    if (!isOAuthProvider(provider)) {
      navigate('/login', { replace: true })
      return
    }

    const label = PROVIDER_LABEL[provider]
    const code = params.get('code')
    const oauthError = params.get('error')

    if (oauthError) {
      const desc = params.get('error_description') ?? oauthError
      setErrorMsg(`${label} 로그인이 취소되었어요. (${desc})`)
      toast.error(`${label} 로그인이 취소되었어요.`)
      return
    }

    if (!code) {
      setErrorMsg('인증 코드를 받지 못했어요.')
      toast.error(`${label} 로그인에 실패했어요.`)
      return
    }

    // code 와 redirectUri 를 백엔드로 그대로 전달
    oauthLogin({
      provider,
      code,
      redirectUri: REDIRECT_URI[provider],
    })
  }, [provider, params, navigate, oauthLogin])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <p className="text-gray-500">{errorMsg ?? '로그인 처리 중...'}</p>
      {errorMsg && (
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="text-sm text-primary-500 underline"
        >
          로그인 페이지로 돌아가기
        </button>
      )}
    </div>
  )
}
