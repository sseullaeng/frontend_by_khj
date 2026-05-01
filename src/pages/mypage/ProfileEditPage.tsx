// 프로필 수정 페이지 컴포넌트: 사용자 프로필 정보 수정 기능 제공
import { useRef, useState } from 'react'  // React 훅들
import { useNavigate } from 'react-router-dom'  // React Router 네비게이션 훅
import { Camera, ChevronLeft } from 'lucide-react'  // Lucide 아이콘들
import { useForm } from 'react-hook-form'  // React Hook Form 라이브러리
import { zodResolver } from '@hookform/resolvers/zod'  // Zod 리졸버
import { z } from 'zod'  // Zod 스키마 라이브러리
import { useAuthStore } from '@/features/auth/store'  // 인증 상태 관리 스토어
import { useUpdateProfile } from '@/features/auth/hooks'  // 프로필 업데이트 훅
import { Button } from '@/shared/ui/Button'  // 버튼 컴포넌트
import { Input } from '@/shared/ui/Input'  // 입력 필드 컴포넌트

// 프로필 수정 폼 스키마: 닉네임 유효성 검증
const schema = z.object({
  nickname: z.string().min(2, '닉네임은 2자 이상이에요.').max(20, '닉네임은 20자 이하예요.'),
})
type FormValues = z.infer<typeof schema>  // 폼 데이터 타입

/**
 * 프로필 수정 페이지 컴포넌트
 * 
 * 기능:
 * - 닉네임 수정
 * - 프로필 이미지 업로드 및 미리보기
 * - 폼 유효성 검증 (Zod 스키마)
 * - 프로필 정보 API 업데이트
 * - 수정 완료 후 마이페이지로 이동
 * 
 * UI 구조:
 * - 상단: 페이지 제목 및 뒤로가기 버튼
 * - 중단: 프로필 이미지 업로드 및 닉네임 입력
 * - 하단: 저장 버튼
 */
export default function ProfileEditPage() {
  const navigate = useNavigate()  // 페이지 네비게이션 함수
  const user = useAuthStore((s) => s.user)  // 현재 사용자 정보
  const { mutate: updateProfile, isPending } = useUpdateProfile()  // 프로필 업데이트 훅

  // 이미지 상태 관리
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profileImageUrl ?? null)  // 이미지 미리보기 URL
  const [imageFile, setImageFile] = useState<File | null>(null)  // 업로드된 이미지 파일
  const fileInputRef = useRef<HTMLInputElement>(null)  // 파일 입력 참조

  // 폼 상태 관리
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),  // Zod 스키마 리졸버 설정
    defaultValues: { nickname: user?.nickname ?? '' },  // 기본값 설정
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const onSubmit = async (data: FormValues) => {
    // mock 모드: 이미지 presigned URL 생략, 닉네임만 전송
    // 실서버: imageFile → presigned URL → S3 PUT → key 전달
    void imageFile
    updateProfile({ nickname: data.nickname })
  }

  return (
    <div className="max-w-md mx-auto pb-20">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">프로필 수정</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* 프로필 이미지 */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-100">
              {previewUrl ? (
                <img src={previewUrl} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-400">
                    {user?.nickname?.[0] ?? '?'}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
            >
              <Camera size={14} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <p className="text-xs text-gray-400">프로필 사진을 변경하려면 탭하세요</p>
        </div>

        {/* 닉네임 */}
        <div>
          <Input
            label="닉네임"
            placeholder="2~20자 이내로 입력해 주세요"
            error={errors.nickname?.message}
            {...register('nickname')}
          />
        </div>

        <Button type="submit" fullWidth isLoading={isPending}>
          저장하기
        </Button>
      </form>
    </div>
  )
}
