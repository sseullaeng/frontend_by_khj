// 카카오 로컬 검색 모달 — 검색창 + 결과 리스트 + 미리보기 지도 + 마커
//
// 사용 예:
//   const [open, setOpen] = useState(false)
//   <KakaoAddressSearch
//     open={open}
//     onClose={() => setOpen(false)}
//     onSelect={(r) => { setRegion(r.region); setOpen(false) }}
//   />
//
// 결과 데이터:
//   - region: "서울특별시 종로구" 같은 시도+시군구 텍스트 (백엔드 region 필드에 그대로 저장)
//   - lat / lng: 좌표 (현재 클라이언트 미리보기용)
//   - address: 전체 도로명 또는 지번 주소
import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { ensureKakaoMap } from '@/shared/lib/kakaoMap'
import type { KakaoMapInstance, KakaoMarker, KakaoPlace } from '@/shared/lib/kakaoMap'
import { cn } from '@/shared/lib/cn'

export interface AddressResult {
  region: string      // 시도 + 시군구 (예: "서울특별시 종로구")
  lat: number
  lng: number
  address: string     // 도로명 우선, 없으면 지번
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (result: AddressResult) => void
}

const SEOUL_CENTER = { lat: 37.5666103, lng: 126.9783882 }

export default function KakaoAddressSearch({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KakaoPlace[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<KakaoPlace | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<KakaoMapInstance | null>(null)
  const markerRef = useRef<KakaoMarker | null>(null)

  // 모달 열리면 SDK 로드 + 지도 초기화
  useEffect(() => {
    if (!open) return
    let cancelled = false

    ensureKakaoMap()
      .then(() => {
        if (cancelled || !containerRef.current || !window.kakao) return
        const { kakao } = window
        const center = new kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng)
        mapRef.current = new kakao.maps.Map(containerRef.current, { center, level: 5 })
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '지도를 불러오지 못했어요.')
      })

    return () => {
      cancelled = true
      mapRef.current = null
      markerRef.current = null
      // 다음 오픈 시 깨끗하게
      setQuery('')
      setResults([])
      setSelected(null)
      setError(null)
    }
  }, [open])

  // 선택 시 지도 마커 이동
  useEffect(() => {
    if (!selected || !mapRef.current || !window.kakao) return
    const { kakao } = window
    const lat = parseFloat(selected.y)
    const lng = parseFloat(selected.x)
    const latlng = new kakao.maps.LatLng(lat, lng)

    if (markerRef.current) {
      markerRef.current.setPosition(latlng)
    } else {
      markerRef.current = new kakao.maps.Marker({ position: latlng, map: mapRef.current })
    }
    mapRef.current.panTo(latlng)
  }, [selected])

  if (!open) return null

  const runSearch = () => {
    const q = query.trim()
    if (!q) return
    if (!window.kakao?.maps.services) {
      setError('카카오 검색 라이브러리가 로드되지 않았어요.')
      return
    }
    setSearching(true)
    setError(null)
    const places = new window.kakao.maps.services.Places()
    places.keywordSearch(
      q,
      (data, status) => {
        setSearching(false)
        const Status = window.kakao!.maps.services.Status
        if (status === Status.OK) {
          setResults(data)
          if (data.length > 0) setSelected(data[0])
        } else if (status === Status.ZERO_RESULT) {
          setResults([])
          setError('검색 결과가 없어요. 다른 키워드로 시도해 주세요.')
        } else {
          setError('검색 중 오류가 발생했어요.')
        }
      },
      { size: 15 },
    )
  }

  const handleConfirm = () => {
    if (!selected) return
    // address_name 예: "서울 종로구 세종로 1-1"  → region: 앞 두 단어
    const parts = selected.address_name.split(' ')
    const region = parts.slice(0, 2).join(' ')
    onSelect({
      region,
      lat: parseFloat(selected.y),
      lng: parseFloat(selected.x),
      address: selected.road_address_name || selected.address_name,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-bold text-gray-900">주소 검색</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* 검색창 */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              // 부모 페이지가 form 안에서 모달을 띄울 경우 Enter 가 form submit 으로
              // 전파되어 모달이 닫혀버림. preventDefault 로 차단.
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  runSearch()
                }
              }}
              placeholder="주소, 건물명, 장소명 입력 후 Enter"
              className="w-full pl-9 pr-20 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
              autoFocus
            />
            <button
              onClick={runSearch}
              disabled={!query.trim() || searching}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs bg-primary-500 text-white rounded-lg disabled:opacity-50"
            >
              {searching ? '검색 중' : '검색'}
            </button>
          </div>
        </div>

        {/* 결과 리스트 + 지도 */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">

          {/* 결과 리스트 */}
          <ul className="flex-1 overflow-y-auto sm:max-w-[55%] divide-y divide-gray-50">
            {error && (
              <li className="px-5 py-6 text-center text-sm text-gray-400">{error}</li>
            )}
            {!error && results.length === 0 && !searching && (
              <li className="px-5 py-12 text-center text-sm text-gray-400">
                키워드를 입력하고 검색하세요.
              </li>
            )}
            {results.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelected(p)}
                  className={cn(
                    'w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors',
                    selected?.id === p.id && 'bg-primary-50',
                  )}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{p.place_name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {p.road_address_name || p.address_name}
                  </p>
                  {p.category_name && (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{p.category_name}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* 지도 미리보기 (sm 이상) */}
          <div
            ref={containerRef}
            className="hidden sm:block sm:flex-1 bg-gray-100"
            style={{ minHeight: 300 }}
          />
        </div>

        {/* 하단 액션 */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0 bg-gray-50">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-600 flex-1 truncate">
              {selected
                ? `선택: ${selected.road_address_name || selected.address_name}`
                : '검색 후 항목을 선택하세요.'}
            </p>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="shrink-0 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
            >
              이 주소 사용
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
