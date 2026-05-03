// 소셜 로그인 SDK 래퍼: Kakao / Google
//
// 두 provider 모두 redirect 흐름으로 통일 (백엔드 위임 방식, 합의 결과)
//   1) 로그인 버튼 클릭 → provider 인증 화면으로 redirect
//   2) 사용자 동의 후 redirectUri 로 돌아옴 (?code=...)
//   3) 콜백 페이지에서 code 와 redirectUri 를 백엔드로 그대로 POST
//      → 백엔드가 provider /oauth/token 호출해서 토큰 교환 + 사용자 정보 조회
//
// 카카오: SDK 사용 (Kakao.Auth.authorize)
// 구글: OAuth URL 직접 redirect (SDK 불필요)

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void
      isInitialized: () => boolean
      Auth: {
        authorize: (opts: { redirectUri: string; scope?: string; state?: string }) => void
      }
    }
  }
}

const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'

let kakaoSDKPromise: Promise<void> | null = null

// 콜백 redirect URI — 백엔드/콜백 페이지/카카오·구글 콘솔 모두 동일 값을 써야 하므로 공용 상수
export const KAKAO_REDIRECT_URI = `${window.location.origin}/auth/kakao/callback`
export const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/google/callback`

// 외부 스크립트 로딩 (중복 방지)
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

async function ensureKakaoSDK(): Promise<void> {
  if (!kakaoSDKPromise) {
    kakaoSDKPromise = loadScript(KAKAO_SDK_URL).then(() => {
      const key = import.meta.env.VITE_KAKAO_JS_KEY
      if (!key) {
        throw new Error('VITE_KAKAO_JS_KEY 환경변수가 비어있어요. 카카오 JavaScript 앱 키를 설정해 주세요.')
      }
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(key)
      }
    })
  }
  return kakaoSDKPromise
}

// 카카오 로그인 시작 — 페이지가 카카오로 redirect 됨
export async function loginWithKakao(): Promise<never> {
  await ensureKakaoSDK()
  if (!window.Kakao) throw new Error('Kakao SDK 미로드')
  window.Kakao.Auth.authorize({
    redirectUri: KAKAO_REDIRECT_URI,
    scope: 'account_email',
  })
  // page is redirecting; this promise never resolves
  return new Promise(() => {})
}

// 구글 로그인 시작 — 구글 OAuth URL 로 redirect
export async function loginWithGoogle(): Promise<never> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID 환경변수가 비어있어요. 구글 OAuth Client ID를 설정해 주세요.')
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'email profile openid',
    access_type: 'online',
    prompt: 'select_account',
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return new Promise(() => {})
}
