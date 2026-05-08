// 파일 업로드 헬퍼 (가이드 §7 — S3 presigned URL 흐름)
//
// 1) POST /api/v1/files/presigned-url  → presignedUrl, key 발급
// 2) PUT presignedUrl (S3 직접) — Content-Type 헤더 + binary body
// 3) (도메인별) 받은 key 를 백엔드 등록 API 로 전달
//    - ITEM: POST /api/v1/items 에 imageUrls 로 포함 → 백엔드가 정식 폴더로 promote
//    - PROFILE: ⚠️ 등록 endpoint/필드명 백엔드 합의 대기 중
//
// 제약 (가이드 §7):
//   - Content-Type: image/jpeg|jpg|png|webp|gif 만 허용
//   - Content-Length: ≤ 5MB
//   - 한 번에 ≤ 10건
//   - presigned URL 만료: 5분
//
// ⚠️ 주의: S3 PUT 은 **plain fetch** 사용. 우리 axios 인스턴스 쓰면 안 됨
//   (withCredentials/XSRF 인터셉터가 S3 CORS 정책에 어긋남)

import api from './axios'

// 업로드 카테고리 (가이드 §8)
//   PROFILE — 본인 프로필 (로그인만 OK)
//   ITEM    — 물품 이미지 (이메일 인증 필수)
//   MESSAGE — 채팅 첨부 (이메일 인증 필수)
//   SUPPORT — 1:1 문의 첨부 (이메일 인증 필수, 라운드7)
//   NOTICE  — 공지 이미지 (관리자 전용, 라운드9 — admin endpoint)
//   BANNER  — 메인 배너 이미지 (관리자 전용 — admin endpoint)
//   ESCROW  — 거래대행 신청 첨부 (이메일 인증 필수)
export type UploadPurpose = 'PROFILE' | 'ITEM' | 'MESSAGE' | 'SUPPORT' | 'NOTICE' | 'BANNER' | 'ESCROW'

// admin 전용 purpose 는 /api/v1/admin/files/presigned-url, 그 외는 /api/v1/files/presigned-url
const ADMIN_PURPOSES = new Set<UploadPurpose>(['NOTICE', 'BANNER'])
const presignedPath = (purpose: UploadPurpose) =>
  ADMIN_PURPOSES.has(purpose)
    ? '/api/v1/admin/files/presigned-url'
    : '/api/v1/files/presigned-url'

// 가이드 §7 허용 MIME
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const MAX_FILES_PER_REQUEST = 10

interface PresignedFileMeta {
  contentType: string
  contentLength: number
}

// 백엔드 body 필드명은 endpoint 별로 비대칭:
//   - 일반 (/api/v1/files/presigned-url):       items   (가이드 §8)
//   - admin (/api/v1/admin/files/presigned-url): files  (라운드13 백엔드 회신)
interface UserPresignedRequest {
  purpose: UploadPurpose
  items: PresignedFileMeta[]
}

interface AdminPresignedRequest {
  purpose: UploadPurpose
  files: PresignedFileMeta[]
}

interface PresignedUploadEntry {
  presignedUrl: string  // S3 PUT 대상
  key: string           // 백엔드 등록 시 사용할 식별자
}

interface PresignedResponse {
  uploads: PresignedUploadEntry[]
}

/**
 * 클라이언트 측 사전 검증 — 백엔드에 무의미한 요청 보내기 전 차단
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return '지원하지 않는 형식이에요. (jpg, png, webp, gif)'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    return `파일이 너무 커요. (${mb}MB / 최대 5MB)`
  }
  return null
}

/**
 * 1단계: 백엔드에 presigned URL 발급 요청
 */
export async function fetchPresignedUrls(
  purpose: UploadPurpose,
  files: File[],
): Promise<PresignedUploadEntry[]> {
  if (files.length === 0) return []
  if (files.length > MAX_FILES_PER_REQUEST) {
    throw new Error(`한 번에 최대 ${MAX_FILES_PER_REQUEST}건까지 업로드할 수 있어요.`)
  }

  const metas: PresignedFileMeta[] = files.map((f) => ({
    contentType: f.type,
    contentLength: f.size,
  }))
  const body: UserPresignedRequest | AdminPresignedRequest = ADMIN_PURPOSES.has(purpose)
    ? { purpose, files: metas }
    : { purpose, items: metas }
  const res = await api.post<PresignedResponse>(presignedPath(purpose), body)
  return res.data.uploads
}

/**
 * 2단계: S3 직접 PUT (axios 사용 X — plain fetch)
 */
export async function uploadFileToS3(presignedUrl: string, file: File): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!res.ok) {
    throw new Error(`S3 업로드 실패 (${res.status})`)
  }
}

// presignedUrl 에서 쿼리스트링 떼서 GET URL 만들기 (S3 key 기준 공개 URL)
function presignedToGetUrl(presignedUrl: string): string {
  const queryIdx = presignedUrl.indexOf('?')
  return queryIdx === -1 ? presignedUrl : presignedUrl.slice(0, queryIdx)
}

export interface UploadResult {
  key: string      // 백엔드가 쓰는 식별자 (ITEM 등록 시 imageUrls 에 사용)
  getUrl: string   // 공개 GET URL (PROFILE 수정 시 profileImage 에 사용)
}

/**
 * 단일 파일 업로드 통합 — 1단계 + 2단계 → key + getUrl 반환
 */
export async function uploadSingleImage(
  purpose: UploadPurpose,
  file: File,
): Promise<UploadResult> {
  const [entry] = await fetchPresignedUrls(purpose, [file])
  if (!entry) throw new Error('presigned URL 응답이 비어있어요.')
  await uploadFileToS3(entry.presignedUrl, file)
  return {
    key: entry.key,
    getUrl: presignedToGetUrl(entry.presignedUrl),
  }
}

/**
 * 다중 파일 업로드 통합 → 결과 배열 반환
 */
export async function uploadImages(
  purpose: UploadPurpose,
  files: File[],
): Promise<UploadResult[]> {
  if (files.length === 0) return []
  const uploads = await fetchPresignedUrls(purpose, files)
  await Promise.all(
    uploads.map((entry, i) => uploadFileToS3(entry.presignedUrl, files[i])),
  )
  return uploads.map((u) => ({
    key: u.key,
    getUrl: presignedToGetUrl(u.presignedUrl),
  }))
}
