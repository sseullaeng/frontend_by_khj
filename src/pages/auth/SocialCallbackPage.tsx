// 소셜 OAuth 콜백 페이지 — 일반 로그인 / 계정 연결(link) 분기 처리
//
// 흐름:
//   /auth/{provider}/callback?code=...&state=... 진입
//   - state === 'link' → LOCAL 계정에 OAuth 연결 (preview → 확인 모달 → confirm)
//   - 그 외           → 기존 OAuth 로그인 (POST /auth/oauth2/{provider})

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  KAKAO_REDIRECT_URI,
  GOOGLE_REDIRECT_URI,
  isLinkState,
} from '@/features/auth/oauth'
import {
  useOAuthLogin,
  useSocialLinkPreview,
  useSocialLinkConfirm,
} from '@/features/auth/hooks'
import type { OAuthProvider, SocialLinkPreviewResponse } from '@/features/auth/types'
import { BusinessError } from '@/shared/types'
import { getErrorMessage } from '@/shared/lib/errorMessages'
import { Button } from '@/shared/ui/Button'

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
  const preview = useSocialLinkPreview()
  const confirm = useSocialLinkConfirm()

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<SocialLinkPreviewResponse | null>(null)
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
    const stateParam = params.get('state')
    const oauthError = params.get('error')

    if (oauthError) {
      const desc = params.get('error_description') ?? oauthError
      setErrorMsg(`${label} 인증이 취소되었어요. (${desc})`)
      toast.error(`${label} 인증이 취소되었어요.`)
      return
    }

    if (!code) {
      setErrorMsg('인증 코드를 받지 못했어요.')
      toast.error(`${label} 인증에 실패했어요.`)
      return
    }

    // ── 연결 모드 (LOCAL 로그인 상태에서 SNS 연결) ──────────────────────────
    if (isLinkState(stateParam)) {
      preview.mutate(
        { provider, code, redirectUri: REDIRECT_URI[provider] },
        {
          onSuccess: (data) => setPreviewData(data),
          onError: (err) => {
            const msg = err instanceof BusinessError
              ? getErrorMessage(err.code, err.message)
              : '소셜 계정 정보를 불러오지 못했어요.'
            setErrorMsg(msg)
            toast.error(msg)
          },
        },
      )
      return
    }

    // ── 일반 OAuth 로그인 — 성공 시 sessionStorage('postLoginNext') 로 복귀 ──
    oauthLogin(
      { provider, code, redirectUri: REDIRECT_URI[provider] },
      {
        onSuccess: () => {
          const next = sessionStorage.getItem('postLoginNext')
          sessionStorage.removeItem('postLoginNext')
          navigate(next && next !== '' ? next : '/', { replace: true })
        },
      },
    )
  }, [provider, params, navigate, oauthLogin, preview])

  // 연결 확인 모달 — preview 성공 시 노출
  if (previewData) {
    return (
      <LinkConfirmCard
        preview={previewData}
        isConfirming={confirm.isPending}
        onCancel={() => {
          setPreviewData(null)
          navigate('/mypage', { replace: true })
        }}
        onConfirm={() => {
          confirm.mutate(
            { linkKey: previewData.linkKey },
            {
              onSuccess: () => navigate('/mypage', { replace: true }),
            },
          )
        }}
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <p className="text-gray-500">{errorMsg ?? '인증 처리 중...'}</p>
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

function LinkConfirmCard({
  preview, isConfirming, onConfirm, onCancel,
}: {
  preview: SocialLinkPreviewResponse
  isConfirming: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const providerLabel = typeof preview.provider === 'string'
    ? (preview.provider.toLowerCase() === 'kakao' ? '카카오' :
       preview.provider.toLowerCase() === 'google' ? '구글' : preview.provider)
    : '소셜'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900 mb-2">소셜 계정 연결</h1>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          현재 로그인된 계정에 <strong>{providerLabel}</strong> 계정을 연결할까요?
          <br />연결 후 기존 비밀번호 로그인도 그대로 사용할 수 있어요.
        </p>
        <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1 mb-5">
          <div className="flex justify-between text-gray-600">
            <span>{providerLabel} 이메일</span>
            <span className="font-medium text-gray-900">{preview.providerEmail}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            ⏱ {preview.expiresInSeconds}초 안에 확인해 주세요.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium disabled:opacity-50"
          >
            취소
          </button>
          <Button type="button" onClick={onConfirm} isLoading={isConfirming} className="flex-1">
            연결하기
          </Button>
        </div>
      </div>
    </div>
  )
}
