import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface Banner {
  id: number
  title: string
  description?: string
  imageUrl?: string
  linkUrl?: string
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
  interval = 3000,
  className 
}: BannerSliderProps) {
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
