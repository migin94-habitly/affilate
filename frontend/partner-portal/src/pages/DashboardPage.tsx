import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getStats, getTimeSeries } from '@/api/partner'
import { StatCard } from '@/components/ui/Card'
import { useAuthStore } from '@/store/auth'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Period = 'day' | 'week' | 'month'

const tierColors: Record<string, string> = {
  bronze: 'from-orange-400 to-orange-500',
  silver: 'from-gray-400 to-gray-500',
  gold: 'from-yellow-400 to-yellow-500'
}

export function DashboardPage() {
  const { t } = useTranslation()
  const partner = useAuthStore(s => s.partner)
  const [period, setPeriod] = useState<Period>('month')

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', period],
    queryFn: () => getStats(period)
  })

  const { data: series } = useQuery({
    queryKey: ['series'],
    queryFn: () => getTimeSeries(30)
  })

  const fmt = (n: number) => n?.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) ?? '—'

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Welcome banner */}
      {partner && (
        <div className={`bg-gradient-to-r ${tierColors[partner.tier] || 'from-brand-500 to-brand-600'} rounded-2xl p-5 text-white`}>
          <p className="text-sm opacity-80">Привет,</p>
          <h1 className="text-xl font-bold">{partner.full_name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold uppercase">
              {partner.tier}
            </span>
            <span className="text-sm opacity-75">•</span>
            <span className="text-sm opacity-75 capitalize">{partner.segment}</span>
          </div>
        </div>
      )}

      {/* Period selector */}
      <div className="flex gap-2">
        {(['day', 'week', 'month'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${period === p ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
          >
            {t(`dashboard.period.${p}`)}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label={t('dashboard.clicks')}
          value={statsLoading ? '...' : fmt(stats?.total_clicks ?? 0)}
          color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>}
        />
        <StatCard
          label={t('dashboard.orders')}
          value={statsLoading ? '...' : fmt(stats?.total_orders ?? 0)}
          color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label={t('dashboard.earned')}
          value={statsLoading ? '...' : `${fmt(stats?.total_earned ?? 0)} ₸`}
          color="orange"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
        />
        <StatCard
          label={t('dashboard.conversion')}
          value={statsLoading ? '...' : `${(stats?.conversion_rate ?? 0).toFixed(1)}%`}
          color="red"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t('dashboard.balance')}</p>
          <p className="text-xl font-bold text-green-600 mt-1">{fmt(stats?.available_amount ?? 0)} ₸</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t('dashboard.pending')}</p>
          <p className="text-xl font-bold text-orange-500 mt-1">{fmt(stats?.pending_amount ?? 0)} ₸</p>
        </div>
      </div>

      {/* Chart */}
      {series && series.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Клики и заказы (30 дней)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={series} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} dot={false} name="Клики" />
              <Line type="monotone" dataKey="orders" stroke="#E84040" strokeWidth={2} dot={false} name="Заказы" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
