// 이메일 인증 페이지 (가이드 §2.5 + 백엔드 확정 spec)
//
// URL: /auth/verify-email?token=...
// 흐름:
//   1) URL 에서 token 추출
//   2) POST /api/v1/auth/verify-email { token }
//   3) 성공 → 자동 로그인 X. 사용자가 이미 로그인된 상태라면 me 갱신해서 emailVerified=true 반영
//   4) 실패 → 에러 코드별 안내

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { authApi } from '@/features/auth/api'
import { useAuthStore } from '@/features/auth/store'
import { BusinessError } from '@/shared/types'
import { Button } from '@/shared/ui/Button'

type Status = 'pending' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isLoggedIn = useAuthStore((s) => s.user !== null)
  const ranOnce = useRef(false)

  const [status, setStatus] = useState<Status>('pending')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (ranOnce.current) return
    ranOnce.current = true

    if (!token) {
      setStatus('error')
      setErrorMsg('인증 링크가 잘못됐어요. (token 누락)')
      return
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus('success')
        // 이미 로그인 중이라면 me 재조회 → emailVerified=true 반영
        if (isLoggedIn) {
          queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        }
      })
      .catch((err) => {
        setStatus('error')
        if (err instanceof BusinessError) {
          if (err.code === 'AUTH_VERIFICATION_TOKEN_EXPIRED') {
            setErrorMsg('만료된 인증 링크예요. 인증 메일을 다시 받아 주세요.')
          } else if (err.code === 'AUTH_VERIFICATION_TOKEN_INVALID') {
            setErrorMsg('잘못된 인증 링크예요.')
          } else {
            setErrorMsg(err.message)
          }
        } else {
          setErrorMsg('이메일 인증에 실패했어요.')
        }
      })
  }, [token, isLoggedIn, queryClient])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        {status === 'pending' && (
          <>
            <Loader2 size={48} className="text-primary-500 animate-spin" />
            <h1 className="text-xl font-bold text-gray-900">이메일 인증 중...</h1>
            <p className="text-sm text-gray-500">잠시만 기다려 주세요.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className="text-emerald-500" />
            <h1 className="text-xl font-bold text-gray-900">이메일 인증 완료</h1>
            <p className="text-sm text-gray-500">이제 모든 기능을 이용하실 수 있어요.</p>
            <Button
              fullWidth
              onClick={() => navigate(isLoggedIn ? '/' : '/login', { replace: true })}
            >
              {isLoggedIn ? '홈으로' : '로그인하러 가기'}
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} className="text-red-500" />
            <h1 className="text-xl font-bold text-gray-900">이메일 인증 실패</h1>
            <p className="text-sm text-gray-500">{errorMsg}</p>
            <Link to="/login" className="text-sm text-primary-500 underline">
              로그인 페이지로
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
