import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPayouts, requestPayout, getBalance } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

const statusVariant = (s: string) => {
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

  const { data: balance } = useQuery({
    queryKey: ['balance'],
    queryFn: getBalance,
    refetchInterval: 30000
  })

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: () => getPayouts()
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
      setError('Минимальная сумма выплаты — 5 000 ₸')
      return
    }
    if (balance && val > balance.available_amount) {
      setError('Недостаточно средств на балансе')
      return
    }
    setError('')
    requestMutation.mutate(val)
  }

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <h1 className="text-xl font-bold text-gray-900">{t('payouts.title')}</h1>

      {/* Balance block */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-xs opacity-75">{t('dashboard.balance')}</p>
          <p className="text-2xl font-bold mt-1">{fmt(balance?.available_amount ?? 0)} ₸</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t('dashboard.pending')}</p>
          <p className="text-xl font-bold text-orange-500 mt-1">{fmt(balance?.pending_amount ?? 0)} ₸</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Выплачено всего</p>
          <p className="text-xl font-bold text-gray-700 mt-1">{fmt(balance?.paid_out_amount ?? 0)} ₸</p>
        </div>
      </div>

      {/* Freedom Pay notice */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t('payouts.freedomPayOnly')}
      </div>

      {/* Request payout button */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} disabled={!balance || balance.available_amount < 5000}>
          {t('payouts.request')}
        </Button>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <h3 className="font-medium text-gray-900">{t('payouts.request')}</h3>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Input
            label={t('payouts.amount')}
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            hint={t('payouts.minThreshold')}
            placeholder="5000"
          />
          <div className="flex gap-2">
            <Button full loading={requestMutation.isPending} onClick={handleRequest}>
              Запросить
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setError('') }}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('payouts.history')}</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
          </div>
        ) : payouts?.items?.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Выплат пока нет</div>
        ) : (
          <div className="space-y-2">
            {payouts?.items?.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{fmt(p.amount)} {p.currency}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(p.requested_at).toLocaleDateString('ru-RU')}
                    {p.freedom_pay_ref && ` • Ref: ${p.freedom_pay_ref}`}
                  </p>
                </div>
                <Badge
                  label={t(`payouts.status.${p.status}`)}
                  variant={statusVariant(p.status) as any}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
