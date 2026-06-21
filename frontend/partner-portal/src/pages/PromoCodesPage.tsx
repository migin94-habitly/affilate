import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPromoCodes, createPromoCode, deactivatePromoCode } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

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
    <div className="space-y-5 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('promoCodes.title')}</h1>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            {t('promoCodes.create')}
          </Button>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-700">{t('promoCodes.description')}</p>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}
          <Input
            label={t('promoCodes.code')}
            placeholder={t('promoCodes.codePlaceholder')}
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
          />
          <div className="flex gap-2">
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

      {/* Promo codes list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !codes || codes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎫</p>
          <p>{t('promoCodes.noCodes')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map(promo => (
            <div key={promo.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-gray-900">{promo.code}</span>
                    <Badge
                      label={promo.is_active ? t('promoCodes.active') : t('promoCodes.inactive')}
                      variant={promo.is_active ? 'success' : 'default'}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
