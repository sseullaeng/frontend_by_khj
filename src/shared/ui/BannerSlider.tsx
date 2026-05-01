// 배너 슬라이더 컴포넌트: 자동 재생 및 수동 제어가 가능한 이미지 슬라이더
import { useState, useEffect } from 'react'  // React 상태 및 이펙트 훅
import { ChevronLeft, ChevronRight } from 'lucide-react'  // 좌우 화살표 아이콘
import { cn } from '@/shared/lib/cn'        // 클래스네임 유틸리티

// 배너 데이터 인터페이스
interface Banner {
  id: number              // 배너 고유 ID
  title: string           // 배너 제목
  description?: string    // 배너 설명 (선택사항)
  imageUrl?: string       // 배너 이미지 URL (선택사항)
  linkUrl?: string        // 클릭 시 이동할 링크 (선택사항)
  backgroundColor?: string // 배너 배경색 (선택사항)
}

// 배너 슬라이더 Props 인터페이스
interface BannerSliderProps {
  banners: Banner[]       // 배너 데이터 배열
  autoPlay?: boolean      // 자동 재생 여부 (기본값: true)
  interval?: number       // 자동 재생 간격 (밀리초, 기본값: 3000)
  className?: string      // 추가 CSS 클래스 (선택사항)
}

/**
 * 배너 슬라이더 컴포넌트
 * 자동 재생 및 수동 제어가 가능한 이미지 슬라이더입니다.
 * 
 * 기능:
 * - 자동 재생 (설정 가능)
 * - 좌우 화살표 버튼으로 수동 제어
 * - 인디케이터 점으로 현재 위치 표시
 * - 반복 재생
 * - 반응형 디자인
 * - 마우스 오버 시 자동 재생 일시정지
 * 
 * 사용법:
 * <BannerSlider 
 *   banners={bannerData}
 *   autoPlay={true}
 *   interval={3000}
 * />
 */
export default function BannerSlider({ 
  banners, 
  autoPlay = true, 
  interval = 3000,
  className 
}: BannerSliderProps) {
  // 현재 표시된 배너 인덱스 상태
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // 자동 재생 상태
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay)

  // 자동 재생 이펙트: 지정된 간격으로 다음 배너로 전환
  useEffect(() => {
    // 자동 재생이 비활성화되거나 배너가 1개 이하면 실행하지 않음
    if (!isAutoPlaying || banners.length <= 1) return

    // interval 마다 다음 배너로 전환 (마지막 배너 후 첫 배너로 순환)
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, interval)

    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearInterval(timer)
  }, [banners.length, interval, isAutoPlaying])

  const goToPrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goToNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(index)
  }

  if (banners.length === 0) {
    return (
      <div className={cn("h-52 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400", className)}>
        배너가 없습니다
      </div>
    )
  }

  const currentBanner = banners[currentIndex]

  return (
    <div className={cn("relative h-52 rounded-2xl overflow-hidden", className)}>
      {/* 배너 컨텐츠 */}
      <div
        className="absolute inset-0 flex items-center justify-center text-white"
        style={{
          backgroundColor: currentBanner.backgroundColor || '#6366f1',
          backgroundImage: currentBanner.imageUrl ? `url(${currentBanner.imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* 오버레이 */}
        {currentBanner.imageUrl && (
          <div className="absolute inset-0 bg-black/40" />
        )}
        
        {/* 텍스트 컨텐츠 */}
        <div className="relative z-10 text-center px-6">
          <h3 className="text-lg font-bold mb-1">{currentBanner.title}</h3>
          {currentBanner.description && (
            <p className="text-sm opacity-90">{currentBanner.description}</p>
          )}
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
            aria-label="이전 배너"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
            aria-label="다음 배너"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* 인디케이터 */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-white w-4'
                  : 'bg-white/50 hover:bg-white/70'
              )}
              aria-label={`${index + 1}번 배너로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
