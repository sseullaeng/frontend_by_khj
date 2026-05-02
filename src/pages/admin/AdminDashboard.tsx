// 관리자 대시보드 — 가이드 §11.7
import { Link } from 'react-router-dom'
import {
  Users, ShoppingBag, CreditCard, ArrowDownToLine, Truck,
} from 'lucide-react'
import { useAdminDashboard } from '@/features/admin/hooks'

export default function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard()

  if (isLoading) return <p className="py-12 text-center text-gray-400">불러오는 중...</p>
  if (!data) return <p className="py-12 text-center text-gray-400">데이터를 불러올 수 없어요.</p>

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-xl font-bold">통계 대시보드</h1>

      {/* 회원 */}
      <Section title="회원" icon={<Users size={18} />} link="/admin/users">
        <Stat label="총" value={data.users.total} />
        <Stat label="활성" value={data.users.active} accent="emerald" />
        <Stat label="차단" value={data.users.blocked} accent="amber" />
        <Stat label="탈퇴" value={data.users.deleted} accent="gray" />
      </Section>

      {/* 거래 */}
      <Section title="거래" icon={<ShoppingBag size={18} />}>
        <Stat label="총" value={data.transactions.total} />
        {Object.entries(data.transactions.byStatus).map(([k, v]) => (
          <Stat key={k} label={k} value={v} />
        ))}
      </Section>

      {/* 결제 */}
      <Section title="결제" icon={<CreditCard size={18} />}>
        <Stat label="결제 완료" value={data.payments.paidCount} />
        <Stat label="총 결제액" value={`${data.payments.totalPaidAmount.toLocaleString()}원`} />
      </Section>

      {/* 출금 */}
      <Section title="출금" icon={<ArrowDownToLine size={18} />} link="/admin/withdraws">
        <Stat label="총" value={data.withdrawals.total} />
        {Object.entries(data.withdrawals.byStatus).map(([k, v]) => (
          <Stat key={k} label={k} value={v} />
        ))}
        <Stat
          label="완료액"
          value={`${data.withdrawals.completedAmount.toLocaleString()}원`}
          accent="emerald"
        />
      </Section>

      {/* 배달 */}
      <Section title="배달" icon={<Truck size={18} />} link="/admin/delivery">
        <Stat label="총" value={data.deliveries.total} />
        {Object.entries(data.deliveries.byStatus).map(([k, v]) => (
          <Stat key={k} label={k} value={v} />
        ))}
        <Stat
          label="정산 합계"
          value={`${data.deliveries.settledFeeTotal.toLocaleString()}원`}
          accent="emerald"
        />
      </Section>
    </div>
  )
}

function Section({
  title,
  icon,
  link,
  children,
}: {
  title: string
  icon: React.ReactNode
  link?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-700">{icon}</span>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {link && (
          <Link to={link} className="ml-auto text-xs text-primary-500 hover:underline">
            관리하기 →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{children}</div>
    </section>
  )
}

const ACCENT: Record<string, string> = {
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  gray: 'text-gray-500',
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number | string
  accent?: 'emerald' | 'amber' | 'gray'
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${accent ? ACCENT[accent] : 'text-gray-900'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}
