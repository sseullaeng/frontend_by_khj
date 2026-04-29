import { useEffect } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '@/features/auth/api'
import { useAuthStore } from '@/features/auth/store'
import { toast } from 'sonner'

export default function SocialCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    const code = params.get('code')
    const provider = location.pathname.includes('kakao') ? 'kakao' : 'naver'

    if (!code) {
      toast.error('소셜 로그인에 실패했어요.')
      navigate('/login')
      return
    }

    authApi
      .socialCallback(code, provider)
      .then((r) => {
        setUser(r.data.user)
        navigate('/')
      })
      .catch(() => {
        toast.error('소셜 로그인에 실패했어요.')
        navigate('/login')
      })
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">로그인 처리 중...</p>
    </div>
  )
}
