// 대여 기간 선택 캘린더 — 라운드14 4-C
//
// 동작:
//   - 월 단위로 표시 (좌/우 네비)
//   - 백엔드에서 받은 활성 거래 [start, end] 페어 안에 들어가는 날짜는 비활성 (회색)
//   - 오늘 이전 날짜도 비활성
//   - 사용자는 시작일 → 종료일 순서로 두 번 클릭
//   - 선택 범위가 차단 구간과 겹치면 토스트로 안내 (서버가 최종 검증)
//
// 단위: '일' 단위 (rentalUnit 시간/주/월 도 일 기반 환산해서 백엔드 LocalDateTime ISO 전송)

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export interface RentalBlock {
  /** ISO LocalDateTime (백엔드) — 시작 포함 */
  start: string
  /** ISO LocalDateTime — 종료 포함 */
  end: string
}

export interface RentalRange {
  /** YYYY-MM-DD */
  start: string
  /** YYYY-MM-DD */
  end: string
}

interface Props {
  blocks: RentalBlock[]
  value: RentalRange | null
  onChange: (range: RentalRange | null) => void
}

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function isSameDay(a: string, b: string): boolean {
  return a === b
}

function isBetween(target: string, start: string, end: string): boolean {
  // 문자열 비교 (YYYY-MM-DD 형식이라 사전순 = 시간순)
  return target >= start && target <= end
}

export default function RentalDatePicker({ blocks, value, onChange }: Props) {
  const today = useMemo(() => ymd(new Date()), [])
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))

  // 차단된 날짜 set — block 마다 start~end 안의 모든 날짜를 펼침
  const blockedSet = useMemo(() => {
    const s = new Set<string>()
    for (const b of blocks) {
      const start = new Date(b.start.slice(0, 10))
      const end = new Date(b.end.slice(0, 10))
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        s.add(ymd(d))
      }
    }
    return s
  }, [blocks])

  // 달력 grid — 해당 월의 일자 + 앞/뒤 padding
  const days = useMemo(() => {
    const first = startOfMonth(cursor)
    const startDow = first.getDay() // 0=Sun
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const cells: { date: string | null }[] = []
    for (let i = 0; i < startDow; i++) cells.push({ date: null })
    for (let d = 1; d <= last; d++) {
      cells.push({ date: ymd(new Date(cursor.getFullYear(), cursor.getMonth(), d)) })
    }
    // 마지막 줄 padding
    while (cells.length % 7 !== 0) cells.push({ date: null })
    return cells
  }, [cursor])

  const handleClick = (date: string) => {
    if (date < today) return
    if (blockedSet.has(date)) return
    if (!value || (value.start && value.end)) {
      // 첫 클릭 → 시작일 만 설정 (end 비움)
      onChange({ start: date, end: '' })
      return
    }
    if (value.start && !value.end) {
      // 두 번째 클릭 → 종료일
      if (date < value.start) {
        // 거꾸로 클릭 → 새 시작점으로
        onChange({ start: date, end: '' })
        return
      }
      // start~date 범위 안에 blocked 있으면 거절
      for (let d = new Date(value.start); ymd(d) <= date; d.setDate(d.getDate() + 1)) {
        if (blockedSet.has(ymd(d))) {
          onChange({ start: date, end: '' })
          return
        }
      }
      onChange({ start: value.start, end: date })
    }
  }

  const monthLabel = `${cursor.getFullYear()}.${String(cursor.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, -1))}
          className="p-1 text-gray-500 hover:text-gray-800"
          aria-label="이전 달"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-gray-900">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="p-1 text-gray-500 hover:text-gray-800"
          aria-label="다음 달"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] text-gray-400 mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, i) => {
          if (!cell.date) return <div key={i} />
          const date = cell.date
          const blocked = blockedSet.has(date) || date < today
          const isStart = value?.start && isSameDay(date, value.start)
          const isEnd = value?.end && isSameDay(date, value.end)
          const inRange = value?.start && value?.end && isBetween(date, value.start, value.end)
          return (
            <button
              key={date}
              type="button"
              disabled={blocked}
              onClick={() => handleClick(date)}
              className={cn(
                'aspect-square rounded text-xs font-medium',
                blocked
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : isStart || isEnd
                    ? 'bg-primary-500 text-white'
                    : inRange
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100',
              )}
            >
              {Number(date.slice(8))}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        회색 날짜는 이미 예약된 기간이에요.
      </p>
    </div>
  )
}
