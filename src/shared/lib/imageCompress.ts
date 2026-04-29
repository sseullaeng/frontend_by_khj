import imageCompression from 'browser-image-compression'

/**
 * S3 5MB 제한 대응 — 업로드 전 클라이언트 측 압축
 * 긴 변 최대 1920px, 5MB 이하로 압축
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }
  const compressed = await imageCompression(file, options)
  return new File([compressed], file.name, { type: compressed.type })
}
