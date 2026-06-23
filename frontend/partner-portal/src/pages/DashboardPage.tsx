import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getStats, getTimeSeries, getProfile, getDocuments } from '@/api/partner'
import { StatCard, SectionCard } from '@/components/ui/Card'
import { SkeletonStatCard, Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/store/auth'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { IconCheck } from '@/components/ui/Icons'

type Period = 'day' | 'week' | 'month'

const tierGradients: Record<string, string> = {
  bronze: 'from-orange-500 to-amber-500',
  silver: 'from-slate-400 to-slate-500',
  gold:   'from-yellow-400 to-amber-400',
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
  if (completed === total) return null
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-brand-100 dark:border-brand-500/20 shadow-card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('onboarding.checklistTitle')}</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{completed}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-brand-500 to-brand-400 h-1.5 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-2.5">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors
              ${step.done
                ? 'opacity-60'
                : 'bg-gray-50 dark:bg-gray-800/50'
              }`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all
              ${step.done
                ? 'bg-green-500 shadow-sm'
                : 'bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600'
              }`}>
              {step.done ? (
                <IconCheck className="w-3 h-3 text-white" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-500" />
              )}
            </div>
            <span className={`text-sm flex-1 ${step.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
              {t(step.labelKey)}
            </span>
            {!step.done && step.linkTo && (
              <Link
                to={step.linkTo}
                className="text-xs text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors flex-shrink-0 px-2.5 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10"
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

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-card-md px-3.5 py-2.5 text-xs">
      <p className="text-gray-500 dark:text-gray-400 mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{entry.value}</span>
        </div>
      ))}
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

  const { data: series, isLoading: seriesLoading } = useQuery({
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
    { id: 'account',   labelKey: 'onboarding.steps.account',   done: true },
    { id: 'kyc',       labelKey: 'onboarding.steps.kyc',       done: !!profile?.kyc, linkTo: '/profile', linkLabelKey: 'onboarding.steps.kycLink' },
    { id: 'offer',     labelKey: 'onboarding.steps.offer',     done: !!profile?.offer_accepted, linkTo: '/profile', linkLabelKey: 'onboarding.steps.offerLink' },
    { id: 'documents', labelKey: 'onboarding.steps.documents', done: !!(documents && documents.length > 0), linkTo: '/documents', linkLabelKey: 'onboarding.steps.documentsLink' },
  ]

  const tierGradient = partner ? (tierGradients[partner.tier] ?? 'from-brand-500 to-brand-600') : 'from-brand-500 to-brand-600'

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Welcome banner */}
      {partner && (
        <div className={`bg-gradient-to-r ${tierGradient} rounded-2xl p-5 text-white shadow-card-md relative overflow-hidden`}>
          <div className="absolute right-0 top-0 bottom-0 w-48 opacity-10">
            <div className="absolute right-6 top-6 w-20 h-20 rounded-full border-4 border-white" />
            <div className="absolute right-16 bottom-4 w-12 h-12 rounded-full border-2 border-white" />
          </div>
          <p className="text-sm opacity-80 font-medium">{t('dashboard.welcome')}</p>
          <h1 className="text-xl font-bold mt-0.5">{partner.full_name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs font-bold uppercase tracking-wide">
              {partner.tier}
            </span>
            <span className="text-sm opacity-60">·</span>
            <span className="text-sm opacity-80 capitalize">{partner.segment}</span>
          </div>
        </div>
      )}

      {/* Onboarding */}
      <OnboardingWidget steps={onboardingSteps} />

      {/* Period selector */}
      <div className="flex gap-2">
        {(['day', 'week', 'month'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95
              ${period === p
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
          >
            {t(`dashboard.period.${p}`)}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsLoading ? (
          [1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard
              label={t('dashboard.clicks')}
              value={fmt(stats?.total_clicks ?? 0)}
              color="blue"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>}
            />
            <StatCard
              label={t('dashboard.orders')}
              value={fmt(stats?.total_orders ?? 0)}
              color="green"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            />
            <StatCard
              label={t('dashboard.earned')}
              value={`${fmt(stats?.total_earned ?? 0)} ₸`}
              color="orange"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>}
            />
            <StatCard
              label={t('dashboard.conversion')}
              value={`${(stats?.conversion_rate ?? 0).toFixed(1)}%`}
              color="red"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>}
            />
          </>
        )}
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('dashboard.balance')}</p>
          {statsLoading ? (
            <Skeleton className="h-7 w-28 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1 tabular-nums">
              {fmt(stats?.available_amount ?? 0)} ₸
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Доступно к выводу</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('dashboard.pending')}</p>
          {statsLoading ? (
            <Skeleton className="h-7 w-28 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-orange-500 dark:text-orange-400 mt-1 tabular-nums">
              {fmt(stats?.pending_amount ?? 0)} ₸
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">В обработке</p>
        </div>
      </div>

      {/* Chart */}
      <SectionCard
        title={t('dashboard.chartTitle')}
        description="Клики и заказы за 30 дней"
      >
        {seriesLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !series || series.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
            Нет данных за выбранный период
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E84040" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#E84040" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)}
                stroke="currentColor" strokeOpacity={0.2} />
              <YAxis tick={{ fontSize: 10 }} stroke="currentColor" strokeOpacity={0.2} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2}
                fill="url(#colorClicks)" dot={false} name="Клики"
              />
              <Area
                type="monotone" dataKey="orders" stroke="#E84040" strokeWidth={2}
                fill="url(#colorOrders)" dot={false} name="Заказы"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </SectionCard>
    </div>
  )
}
