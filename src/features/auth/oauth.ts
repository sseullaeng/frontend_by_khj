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
      // 라운드14 — 로그인용 카카오 앱 키. 맵용(VITE_KAKAO_MAP_JS_KEY) 과 분리 가능.
      //   둘 다 안 정의되면 기존 VITE_KAKAO_JS_KEY 로 fallback.
      const key =
        import.meta.env.VITE_KAKAO_AUTH_JS_KEY ??
        import.meta.env.VITE_KAKAO_JS_KEY
      if (!key) {
        throw new Error('카카오 로그인 키가 비어있어요 (VITE_KAKAO_AUTH_JS_KEY 또는 VITE_KAKAO_JS_KEY).')
      }
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(key)
      }
    })
  }
  return kakaoSDKPromise
}

// 라운드14 — OAuth `state` 파라미터로 callback 모드 분기.
//   - 일반 로그인: state 생략 (또는 단순 'login')
//   - 계정 연결 (LOCAL → OAuth): state='link'
//     → SocialCallbackPage 가 이 값을 읽어 social-link/preview 흐름으로 라우팅.
export type OAuthAuthorizeMode = 'login' | 'link'
const STATE_LINK = 'link'

function stateFor(mode: OAuthAuthorizeMode): string | undefined {
  return mode === 'link' ? STATE_LINK : undefined
}

// 카카오 로그인 시작 — 페이지가 카카오로 redirect 됨
//   ⚠ Kakao SDK 는 state 가 undefined 일 때 명시 전달 시 "Illegal argument for state" 던짐.
//      → mode 가 link 일 때만 state 키를 포함, 그 외엔 키 자체 생략.
export async function loginWithKakao(mode: OAuthAuthorizeMode = 'login'): Promise<never> {
  await ensureKakaoSDK()
  if (!window.Kakao) throw new Error('Kakao SDK 미로드')
  const stateVal = stateFor(mode)
  window.Kakao.Auth.authorize({
    redirectUri: KAKAO_REDIRECT_URI,
    scope: 'account_email',
    ...(stateVal ? { state: stateVal } : {}),
  })
  // page is redirecting; this promise never resolves
  return new Promise(() => {})
}

// 구글 로그인 시작 — 구글 OAuth URL 로 redirect
export async function loginWithGoogle(mode: OAuthAuthorizeMode = 'login'): Promise<never> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID 환경변수가 비어있어요. 구글 OAuth Client ID를 설정해 주세요.')
  }
  const stateVal = stateFor(mode)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'email profile openid',
    access_type: 'online',
    prompt: 'select_account',
    ...(stateVal ? { state: stateVal } : {}),
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return new Promise(() => {})
}

/** SocialCallbackPage 가 모드 분기 시 사용 */
export function isLinkState(state: string | null | undefined): boolean {
  return state === STATE_LINK
}
