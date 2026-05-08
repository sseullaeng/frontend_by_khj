import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface Banner {
  id: number
  title: string
  description?: string
  imageUrl?: string
  linkUrl?: string          // 클릭 시 이동할 내부 경로
  backgroundColor?: string
}

interface BannerSliderProps {
  banners: Banner[]
  autoPlay?: boolean
  interval?: number
  className?: string
}

export default function BannerSlider({
  banners,
  autoPlay = true,
  interval = 5000,
  className
}: BannerSliderProps) {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay)

  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, interval)

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
    // Safari 의 'border-radius + overflow:hidden + absolute 자식' 모서리 1px 새어나옴 회피:
    //   1) transform-gpu — GPU 합성 layer 로 강제
    //   2) clip-path: inset(0 round 1rem) — Safari 가 border-radius 보다 clip-path 를 더 정확히 클리핑
    //   3) 외곽에도 같은 backgroundColor — 그래도 1px 새어나오면 같은 색이라 인지 X
    <div
      className={cn(
        "relative h-52 rounded-2xl overflow-hidden transform-gpu",
        "[clip-path:inset(0_round_1rem)]",
        className,
      )}
      style={{ backgroundColor: currentBanner.backgroundColor || '#6366f1' }}
    >
      {/* 배너 컨텐츠 (linkUrl 있으면 클릭 시 이동)
         - 컨테이너 높이는 h-52 (208px) 고정.
         - 이미지가 16:5 가 아니어도 비율 보존(object-contain) → 잘림 방지.
         - 비는 영역은 backgroundColor 로 채움. */}
      <div
        onClick={() => currentBanner.linkUrl && navigate(currentBanner.linkUrl)}
        className={cn(
          'absolute inset-0',
          currentBanner.linkUrl && 'cursor-pointer'
        )}
      >
        {currentBanner.imageUrl ? (
          // 이미지 모드 — 이미지 자체로 디자인 완결. 텍스트/어둠 오버레이 없음.
          // title 은 alt 로 접근성/검색에만 사용.
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            className="w-full h-full object-contain"
          />
        ) : (
          // 단색 fallback 모드 — 이미지가 없을 때만 텍스트 표시
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-center px-6">
              <h3 className="text-lg font-bold mb-1">{currentBanner.title}</h3>
              {currentBanner.description && (
                <p className="text-sm opacity-90">{currentBanner.description}</p>
              )}
            </div>
          </div>
        )}
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
