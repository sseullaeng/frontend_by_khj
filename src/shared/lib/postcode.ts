// 다음(카카오) 우편번호 서비스 — 주소 검색 모달 래퍼
//
// 무료, API 키 불필요. SDK 동적 로드 후 모달 열어 결과 반환.
// 우리는 "지역" 텍스트만 필요하므로 sido + sigungu 조합 ("서울 강남구") 형태로 정규화.
//
// 사용:
//   const region = await openAddressSearch()
//   if (region) setRegion(region)

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: {
        oncomplete: (data: PostcodeResult) => void
        onclose?: (state: 'COMPLETE_CLOSE' | 'FORCE_CLOSE') => void
        width?: string | number
        height?: string | number
      }) => { open: () => void; embed: (el: HTMLElement) => void }
    }
  }
}

interface PostcodeResult {
  address: string         // "서울특별시 강남구 테헤란로 123"
  roadAddress: string
  jibunAddress: string
  zonecode: string
  bname: string           // 법정동
  buildingName: string
  sido: string            // "서울특별시"
  sigungu: string         // "강남구"
}

const SDK_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

let sdkPromise: Promise<void> | null = null

function loadSDK(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve()
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${SDK_URL}"]`)) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = SDK_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('주소검색 SDK 로딩 실패'))
      document.head.appendChild(script)
    })
  }
  return sdkPromise
}

// "서울특별시" → "서울", "경기도" → "경기" (가이드 예시 "서울 강남구" 형식)
function shortSido(sido: string): string {
  return sido
    .replace(/특별자치시$/, '')
    .replace(/특별자치도$/, '')
    .replace(/특별시$/, '')
    .replace(/광역시$/, '')
    .replace(/도$/, '')
}

/**
 * 주소검색 모달 열기 → 사용자 선택 시 region 텍스트("시도 시군구") 반환
 * 사용자가 닫기/취소하면 null 반환
 */
export async function openAddressSearch(): Promise<string | null> {
  await loadSDK()
  const Postcode = window.daum?.Postcode
  if (!Postcode) throw new Error('주소검색 SDK 미로드')

  return new Promise((resolve) => {
    let resolved = false
    new Postcode({
      oncomplete: (data) => {
        resolved = true
        const region = `${shortSido(data.sido)} ${data.sigungu}`.trim()
        resolve(region)
      },
      onclose: (state) => {
        // 사용자가 그냥 닫은 경우 null 반환
        if (state === 'FORCE_CLOSE' && !resolved) resolve(null)
      },
    }).open()
  })
}
