import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPromoCodes, createPromoCode, deactivatePromoCode } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { IconPlus } from '@/components/ui/Icons'

export function PromoCodesPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const { data: codes, isLoading } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: getPromoCodes
  })

  const createMutation = useMutation({
    mutationFn: () => createPromoCode({ code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promo-codes'] })
      setCode('')
      setShowForm(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || t('common.error'))
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivatePromoCode(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo-codes'] })
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('promoCodes.title')}</h1>
        {!showForm && (
          <Button size="sm" icon={<IconPlus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
            {t('promoCodes.create')}
          </Button>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl">
        <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p className="text-sm text-blue-700 dark:text-blue-300">{t('promoCodes.description')}</p>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5 space-y-4 animate-scale-in">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Новый промокод</h3>
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <Input
            label={t('promoCodes.code')}
            placeholder={t('promoCodes.codePlaceholder')}
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            hint="Минимум 3 символа, только латинские буквы и цифры"
          />
          <div className="flex gap-2.5">
            <Button
              loading={createMutation.isPending}
              disabled={code.length < 3}
              onClick={() => createMutation.mutate()}
            >
              {t('promoCodes.create')}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setCode(''); setError('') }}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !codes?.length ? (
        <EmptyState
          variant="promo"
          title={t('promoCodes.noCodes')}
          description="Создайте промокод и делитесь им со своей аудиторией для отслеживания конверсий"
          action={{ label: t('promoCodes.create'), onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-2.5">
          {codes.map((promo, i) => (
            <div
              key={promo.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-4 flex items-center justify-between gap-3 hover:shadow-card-md transition-all duration-150 animate-slide-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono font-bold text-lg text-gray-900 dark:text-gray-100 tracking-wider">
                    {promo.code}
                  </span>
                  <Badge
                    label={promo.is_active ? t('promoCodes.active') : t('promoCodes.inactive')}
                    variant={promo.is_active ? 'success' : 'default'}
                    dot
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {promo.uses_count} {t('promoCodes.uses')}
                </p>
              </div>
              {promo.is_active && (
                <Button
                  size="sm"
                  variant="outline"
                  loading={deactivateMutation.isPending}
                  onClick={() => deactivateMutation.mutate(promo.id)}
                >
                  {t('promoCodes.deactivate')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
