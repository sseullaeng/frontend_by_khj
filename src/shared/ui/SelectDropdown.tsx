import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export interface SelectDropdownOption<T extends string = string> {
  value: T
  label: string
}

interface SelectDropdownProps<T extends string = string> {
  value: T
  onChange: (value: T) => void
  options: readonly SelectDropdownOption<T>[]
  className?: string
  buttonClassName?: string
  menuClassName?: string
  disabled?: boolean
}

export function SelectDropdown<T extends string = string>({
  value,
  onChange,
  options,
  className,
  buttonClassName,
  menuClassName,
  disabled,
}: SelectDropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return

    const closeOnOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    window.addEventListener('mousedown', closeOnOutside)
    return () => window.removeEventListener('mousedown', closeOnOutside)
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative inline-block text-sm', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'inline-flex h-10 min-w-32 items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 text-left text-gray-700 shadow-sm transition-colors hover:border-primary-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-50',
          buttonClassName
        )}
      >
        <span className="truncate">{selected?.label ?? '선택'}</span>
        <ChevronDown
          size={15}
          className={cn('shrink-0 text-gray-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full z-30 mt-1 min-w-full overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg',
            menuClassName
          )}
        >
          {options.map((option) => {
            const active = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors',
                  active
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <span className="whitespace-nowrap">{option.label}</span>
                {active && <Check size={14} className="shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
