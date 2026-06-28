import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPayouts, requestPayout, getBalance, getProfile } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

const statusVariant = (s: string): 'success' | 'info' | 'danger' | 'warning' => {
  if (s === 'paid') return 'success'
  if (s === 'processing') return 'info'
  if (s === 'failed') return 'danger'
  return 'warning'
}

export function PayoutsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [amount, setAmount] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['balance'],
    queryFn: getBalance,
    refetchInterval: 30000
  })

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: () => getPayouts()
  })

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile
  })

  const requestMutation = useMutation({
    mutationFn: (amt: number) => requestPayout(amt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payouts'] })
      qc.invalidateQueries({ queryKey: ['balance'] })
      setShowForm(false)
      setAmount('')
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || t('common.error'))
    }
  })

  const fmt = (n: number) => n?.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) ?? '0'

  const handleRequest = () => {
    const val = parseFloat(amount)
    if (isNaN(val) || val < 5000) {
      setError(t('payouts.minError'))
      return
    }
    if (balance && val > balance.available_amount) {
      setError(t('payouts.insufficientBalance'))
      return
    }
    setError('')
    requestMutation.mutate(val)
  }

  const kyc = profile?.kyc
  const bankLabel = kyc?.bank_name
    ? `${kyc.bank_name}${kyc.bank_account ? ` · ${kyc.bank_account}` : ''}`
    : kyc?.freedom_pay_account
    ? `Freedom Pay · ${kyc.freedom_pay_account}`
    : null

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('payouts.title')}</h1>

      {/* Balance grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-4 text-white shadow-card-md relative overflow-hidden">
          <div className="absolute right-3 top-3 w-16 h-16 rounded-full bg-white/10" />
          <p className="text-xs font-medium opacity-80">{t('dashboard.balance')}</p>
          {balanceLoading
            ? <div className="h-8 w-28 bg-white/20 rounded-lg mt-1 animate-pulse" />
            : <p className="text-2xl font-bold mt-1 tabular-nums">{fmt(balance?.available_amount ?? 0)} ₸</p>
          }
          <p className="text-xs opacity-70 mt-1">{t('payouts.availableToWithdraw')}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{t('dashboard.pending')}</p>
          {balanceLoading
            ? <Skeleton className="h-6 w-20 mt-2" />
            : <p className="text-xl font-bold text-orange-500 dark:text-orange-400 mt-1 tabular-nums">{fmt(balance?.pending_amount ?? 0)} ₸</p>
          }
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{t('payouts.paid')}</p>
          {balanceLoading
            ? <Skeleton className="h-6 w-20 mt-2" />
            : <p className="text-xl font-bold text-gray-700 dark:text-gray-300 mt-1 tabular-nums">{fmt(balance?.paid_out_amount ?? 0)} ₸</p>
          }
        </div>
      </div>

      {/* Bank details notice */}
      {bankLabel && (
        <div className="flex items-start gap-3 p-3.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl text-sm text-blue-700 dark:text-blue-300">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
          <span>{t('payouts.willSendTo')} <span className="font-semibold">{bankLabel}</span></span>
        </div>
      )}

      {/* No bank details warning */}
      {!kyc && (
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl text-sm text-amber-700 dark:text-amber-300">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          {t('payouts.noBankDetails')}
        </div>
      )}

      {/* Request form */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          disabled={!balance || balance.available_amount < 5000 || !kyc}
          size="md"
        >
          {t('payouts.request')}
        </Button>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5 space-y-4 animate-slide-up">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('payouts.requestTitle')}</h3>
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <Input
            label={t('payouts.amount')}
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            hint={t('payouts.minThreshold')}
            placeholder="5000"
            suffix={<span className="text-sm font-medium">₸</span>}
          />
          {bankLabel && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('payouts.destination')}: <span className="font-medium text-gray-700 dark:text-gray-300">{bankLabel}</span>
            </p>
          )}
          <div className="flex gap-2.5">
            <Button full loading={requestMutation.isPending} onClick={handleRequest}>
              {t('payouts.submit')}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setError('') }}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('payouts.history')}</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !payouts?.items?.length ? (
          <EmptyState
            variant="payouts"
            title={t('payouts.emptyTitle')}
            description={t('payouts.emptyDesc')}
          />
        ) : (
          <div className="space-y-2">
            {payouts.items.map((p, i) => (
              <div
                key={p.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between shadow-card hover:shadow-card-md transition-all duration-150 animate-slide-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {fmt(p.amount)} {p.currency}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(p.requested_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {p.freedom_pay_ref && (
                      <span className="ml-2 font-mono opacity-70">#{p.freedom_pay_ref.slice(0, 8)}</span>
                    )}
                  </p>
                  {(p.bank_name || p.bank_account) && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {p.bank_name}{p.bank_account ? ` · ${p.bank_account.slice(-8)}` : ''}
                    </p>
                  )}
                </div>
                <Badge label={t(`payouts.status.${p.status}`)} variant={statusVariant(p.status)} dot />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
