import { Sparkles } from 'lucide-react'

interface HotItemBadgeProps {
  className?: string
}

export default function HotItemBadge({ className = '' }: HotItemBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full ${className}`}>
      <Sparkles size={12} className="animate-pulse" />
      <span className="animate-pulse">HOT</span>
    </div>
  )
}
