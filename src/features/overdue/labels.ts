// 연체 record 의 phase / status / legal action 라벨·색상 공용 헬퍼.
// MyOverduePage / AdminOverduePage / AdminOverdueDetailPage 모두에서 재사용.
import type {
  OverdueLegalAction,
  OverduePhase,
  OverdueStatus,
} from './types'

export const PHASE_STYLE: Record<OverduePhase, { label: string; cls: string }> = {
  PHASE_1: { label: '1단계 · 안내',        cls: 'bg-yellow-100 text-yellow-800' },
  PHASE_2: { label: '2단계 · 차감 누적',   cls: 'bg-orange-100 text-orange-700' },
  PHASE_3: { label: '3단계 · 채무 발생',   cls: 'bg-red-100 text-red-700' },
  PHASE_4: { label: '4단계 · 계정 정지',   cls: 'bg-red-600 text-white' },
}

export const STATUS_STYLE: Record<OverdueStatus, string> = {
  '진행중':     'bg-red-100 text-red-700',
  '법적조치중': 'bg-rose-200 text-rose-800',
  '정산완료':   'bg-gray-100 text-gray-600',
  '종료':       'bg-gray-100 text-gray-500',
}

export const LEGAL_ACTION_OPTIONS: { value: OverdueLegalAction; label: string }[] = [
  { value: 'NONE',     label: '조치 없음' },
  { value: '내용증명', label: '내용증명 발송' },
  { value: '분쟁조정', label: '분쟁조정 신청' },
  { value: '소송제기', label: '소송 제기' },
]
