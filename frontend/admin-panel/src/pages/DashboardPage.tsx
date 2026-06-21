import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAnalytics } from '@/api/admin'
import { Stat, Card } from '@/components/ui'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function DashboardPage() {
  const [period, setPeriod] = useState('30d')

  const { data: analytics } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => getAnalytics(period)
  })

  const fmt = (n: number) => n?.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) ?? '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Аналитика канала</h1>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors
                ${period === p ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Affiliate GMV" value={`${fmt(analytics?.affiliate_gmv ?? 0)} ₸`} color="text-green-600" />
        <Stat label="Доля в GMV" value={`${(analytics?.affiliate_pct ?? 0).toFixed(1)}%`} color="text-blue-600" />
        <Stat label="Активные партнёры" value={fmt(analytics?.active_partners ?? 0)} />
        <Stat label="Affiliate CAC" value={`${fmt(analytics?.affiliate_cac ?? 0)} ₸`} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="GMV — Total vs Affiliate">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total GMV</span>
              <span className="font-semibold">{fmt(analytics?.total_gmv ?? 0)} ₸</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-brand-500 h-2 rounded-full"
                style={{ width: `${analytics?.affiliate_pct ?? 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Affiliate: {fmt(analytics?.affiliate_gmv ?? 0)} ₸ ({(analytics?.affiliate_pct ?? 0).toFixed(1)}%)</span>
              <span>Всего заказов: {fmt(analytics?.total_orders ?? 0)}</span>
            </div>
          </div>
        </Card>

        <Card title="Комиссионные выплаты">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Начислено комиссий</span>
              <span className="font-semibold text-orange-600">{fmt(analytics?.total_commissions ?? 0)} ₸</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Заказов через affiliate</span>
              <span className="font-semibold">{fmt(analytics?.total_orders ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Affiliate CAC</span>
              <span className="font-semibold text-green-600">{fmt(analytics?.affiliate_cac ?? 0)} ₸</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
