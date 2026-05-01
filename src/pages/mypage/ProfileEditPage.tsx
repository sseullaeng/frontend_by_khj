import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ChevronLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/features/auth/store'
import { useUpdateProfile } from '@/features/auth/hooks'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

const schema = z.object({
  nickname: z.string().min(2, '닉네임은 2자 이상이에요.').max(20, '닉네임은 20자 이하예요.'),
})
type FormValues = z.infer<typeof schema>

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profileImageUrl ?? null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nickname: user?.nickname ?? '' },
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
