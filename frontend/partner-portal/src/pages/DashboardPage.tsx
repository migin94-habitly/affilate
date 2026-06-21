import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getStats, getTimeSeries, getProfile, getDocuments } from '@/api/partner'
import { StatCard } from '@/components/ui/Card'
import { useAuthStore } from '@/store/auth'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Period = 'day' | 'week' | 'month'

const tierColors: Record<string, string> = {
  bronze: 'from-orange-400 to-orange-500',
  silver: 'from-gray-400 to-gray-500',
  gold: 'from-yellow-400 to-yellow-500'
}

interface OnboardingStep {
  id: string
  labelKey: string
  done: boolean
  linkTo?: string
  linkLabelKey?: string
}

function OnboardingWidget({ steps }: { steps: OnboardingStep[] }) {
  const { t } = useTranslation()
  const completed = steps.filter(s => s.done).length
  const total = steps.length
  const allDone = completed === total

  if (allDone) return null

  const pct = Math.round((completed / total) * 100)

  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">{t('onboarding.checklistTitle')}</h2>
        <span className="text-xs text-gray-500">{completed}/{total} {t('onboarding.checklistDone')}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
        <div
          className="bg-brand-500 h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="space-y-2">
        {steps.map(step => (
          <div key={step.id} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
              ${step.done ? 'bg-green-500' : 'bg-gray-200'}`}>
              {step.done ? (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-400" />
              )}
            </div>
            <span className={`text-sm flex-1 ${step.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {t(step.labelKey)}
            </span>
            {!step.done && step.linkTo && (
              <Link
                to={step.linkTo}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium whitespace-nowrap"
              >
                {t(step.linkLabelKey || 'common.next')} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
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

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile
  })

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments
  })

  const fmt = (n: number) => n?.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) ?? '—'

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'account',
      labelKey: 'onboarding.steps.account',
      done: true,
    },
    {
      id: 'kyc',
      labelKey: 'onboarding.steps.kyc',
      done: !!profile?.kyc,
      linkTo: '/profile',
      linkLabelKey: 'onboarding.steps.kycLink',
    },
    {
      id: 'offer',
      labelKey: 'onboarding.steps.offer',
      done: !!profile?.offer_accepted,
      linkTo: '/profile',
      linkLabelKey: 'onboarding.steps.offerLink',
    },
    {
      id: 'documents',
      labelKey: 'onboarding.steps.documents',
      done: !!(documents && documents.length > 0),
      linkTo: '/documents',
      linkLabelKey: 'onboarding.steps.documentsLink',
    },
  ]

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Welcome banner */}
      {partner && (
        <div className={`bg-gradient-to-r ${tierColors[partner.tier] || 'from-brand-500 to-brand-600'} rounded-2xl p-5 text-white`}>
          <p className="text-sm opacity-80">{t('dashboard.welcome')}</p>
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

      {/* Onboarding checklist */}
      <OnboardingWidget steps={onboardingSteps} />

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
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('dashboard.chartTitle')}</h2>
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
