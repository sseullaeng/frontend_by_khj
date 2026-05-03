// 프로필 수정 페이지 — 닉네임 + 프로필 이미지
//
// 이미지 업로드 흐름 (가이드 §7 + 백엔드 확정 spec):
//   파일 선택 → 검증 (타입·크기) → 압축 → 미리보기
//   → 저장 시 imageFile 있으면:
//      1) POST /files/presigned-url (PROFILE)  — 미인증 사용자도 OK
//      2) PUT presignedUrl (S3 직접 binary)
//      3) PATCH /users/me { profileImage: <getUrl> }
//   → 이미지 제거 의도: PATCH /users/me { profileImage: "" }
//   → 변경 없으면: 해당 필드 omit

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ChevronLeft, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store'
import { useUpdateProfile } from '@/features/auth/hooks'
import { compressImage } from '@/shared/lib/imageCompress'
import { uploadSingleImage, validateImageFile } from '@/shared/api/upload'
import type { UpdateProfileRequest } from '@/features/auth/types'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

// 프로필 수정 폼 스키마: 닉네임 유효성 검증
const schema = z.object({
  nickname: z.string().min(1, '닉네임을 입력해 주세요.').max(50, '닉네임은 50자 이하예요.'),
})
type FormValues = z.infer<typeof schema>

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { mutateAsync: updateProfileAsync, isPending } = useUpdateProfile()

  const initialPreview = user?.profileImage ?? null
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreview)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [imageProcessing, setImageProcessing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // blob URL leak 방지: imageFile 바뀔 때 이전 객체 URL revoke
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nickname: user?.nickname ?? '' },
  })

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일 재선택 가능하도록 초기화
    if (!file) return

    // 1) 클라이언트 검증
    const validationError = validateImageFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    // 2) 압축 (5MB 제한 + 1920px 제한 자동 적용)
    setImageProcessing(true)
    try {
      const compressed = await compressImage(file)
      // 압축 후에도 한 번 더 검증 (안전망)
      const postError = validateImageFile(compressed)
      if (postError) {
        toast.error(postError)
        return
      }
      setImageFile(compressed)
      setImageRemoved(false)
      setPreviewUrl(URL.createObjectURL(compressed))
    } catch {
      toast.error('이미지 처리 중 문제가 발생했어요.')
    } finally {
      setImageProcessing(false)
    }
  }

  // 새로 선택한 이미지 취소 (기존 이미지로 복귀) 또는 기존 이미지 제거
  const removeImage = () => {
    if (imageFile) {
      // 새로 선택한 것만 취소 → 기존 이미지로 복귀
      setImageFile(null)
      setImageRemoved(false)
      setPreviewUrl(initialPreview)
    } else if (initialPreview) {
      // 기존 이미지 제거 의도
      setImageRemoved(true)
      setPreviewUrl(null)
    }
  }

  const onSubmit = async (data: FormValues) => {
    const body: UpdateProfileRequest = {}

    // 닉네임 — 변경됐을 때만 포함
    if (data.nickname !== user?.nickname) {
      body.nickname = data.nickname
    }

    // 프로필 이미지 — 새로 업로드 / 제거 / 변경 없음
    if (imageFile) {
      try {
        setUploading(true)
        const { getUrl } = await uploadSingleImage('PROFILE', imageFile)
        body.profileImage = getUrl
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '이미지 업로드에 실패했어요.')
        return
      } finally {
        setUploading(false)
      }
    } else if (imageRemoved) {
      body.profileImage = '' // 백엔드 spec: 빈 문자열 = 제거
    }

    // 변경 사항 없음
    if (body.nickname === undefined && body.profileImage === undefined) {
      toast.message('변경된 내용이 없어요.')
      return
    }

    try {
      await updateProfileAsync(body)
    } catch {
      // onError 가 이미 토스트 표시
    }
  }

  const sizeLabel = imageFile
    ? `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`
    : null

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

            {/* 사진 변경 버튼 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageProcessing}
              title="사진 변경"
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
            >
              <Camera size={14} />
            </button>

            {/* 이미지 제거 — 새로 선택한 것 취소 또는 기존 이미지 제거 */}
            {(imageFile || (initialPreview && !imageRemoved)) && (
              <button
                type="button"
                onClick={removeImage}
                title={imageFile ? '선택 취소' : '이미지 제거'}
                className="absolute top-0 right-0 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
              >
                <X size={12} className="text-gray-600" />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            className="hidden"
          />

          <p className="text-xs text-gray-400">
            {imageProcessing
              ? '이미지 처리 중...'
              : uploading
              ? '업로드 중...'
              : imageRemoved
              ? '이미지가 제거됩니다'
              : sizeLabel
              ? `선택됨 · ${sizeLabel}`
              : '프로필 사진을 변경하려면 탭하세요'}
          </p>
        </div>

        {/* 닉네임 */}
        <div>
          <Input
            label="닉네임"
            placeholder="1~50자 이내로 입력해 주세요"
            error={errors.nickname?.message}
            {...register('nickname')}
          />
        </div>

        <Button
          type="submit"
          fullWidth
          isLoading={isPending || uploading}
          disabled={imageProcessing}
        >
          저장하기
        </Button>
      </form>
    </div>
  )
}
