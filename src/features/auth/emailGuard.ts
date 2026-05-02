// 이메일 인증 가드 (가이드 §2.5)
//
// 인증이 필요한 기능들 (거래/결제/채팅 시작/신고/파일 업로드 등) 호출 전에 사용.
// 백엔드가 미인증 사용자에게 403 AUTH_EMAIL_NOT_VERIFIED 떨구기 전에 프론트에서 막아 UX 개선.
//
// 사용 예시:
//   const { isVerified, requireVerified } = useEmailGuard()
//
//   // 1) 버튼 disable 등 UI 분기
//   <Button disabled={!isVerified} ...>
//
//   // 2) 클릭 핸들러 가드
//   <Button onClick={() => requireVerified(() => createItem())}>
//
//   // 3) 페이지 진입 차단
//   if (!isVerified) return <VerifyEmailNotice />

import { toast } from 'sonner'
import { useAuthStore } from './store'

export function useEmailGuard() {
  const user = useAuthStore((s) => s.user)
  const isVerified = user?.emailVerified === true

  // 인증 상태일 때만 action 실행, 아니면 안내 토스트
  const requireVerified = (action: () => void): void => {
    if (!user) {
      toast.error('로그인이 필요해요.')
      return
    }
    if (!isVerified) {
      toast.error('이메일 인증이 필요한 기능이에요. 가입 시 받은 인증 메일을 확인해 주세요.')
      return
    }
    action()
  }

  return { isVerified, requireVerified }
}
