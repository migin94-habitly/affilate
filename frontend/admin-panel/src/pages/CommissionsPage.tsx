import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTariffs, updateTariff, getCommissions, approveAllCommissions } from '@/api/admin'
import { Table, TD, Badge, Btn, Card } from '@/components/ui'

const DEFAULT_SF_PCT = 10 // illustrative default; must be confirmed with Finance (PRD §14 Q1)

function derivedSFRate(gmvRate: number, sfPct = DEFAULT_SF_PCT): number {
  return sfPct > 0 ? (gmvRate / sfPct) * 100 : 0
}

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
}

const TIER_RANGES: Record<string, string> = {
  bronze: '3% GMV',
  silver: '4.5–5% GMV',
  gold: '6–8% GMV',
}

export function CommissionsPage() {
  const qc = useQueryClient()
  const [editingTier, setEditingTier] = useState<any>(null)
  const [guardrailError, setGuardrailError] = useState('')
  const [notice, setNotice] = useState('')

  const { data: tariffs } = useQuery({ queryKey: ['tariffs'], queryFn: getTariffs })
  const { data: commissions, isLoading } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => getCommissions({ status: 'pending', page: 1, per_page: 50 })
  })

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateTariff({ ...payload, gmv_rate: payload.gmv_rate }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['tariffs'] })
      setEditingTier(null)
      setGuardrailError('')
      if (data?.notice) setNotice(data.notice)
      else setNotice('')
    },
    onError: (err: any) => {
      setGuardrailError(err?.response?.data?.error ?? 'Ошибка при сохранении ставки')
    }
  })

  const approveMutation = useMutation({
    mutationFn: approveAllCommissions,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions'] })
  })

  const fmt = (n: number) => n?.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) ?? '0'
  const fmtPct = (n: number) => n?.toFixed(2) ?? '0.00'

  const handleSave = () => {
    if (!editingTier) return
    if (editingTier.gmv_rate >= DEFAULT_SF_PCT) {
      setGuardrailError(`Ставка ${editingTier.gmv_rate}% ≥ Service Fee ${DEFAULT_SF_PCT}% — маржа Ticketon уйдёт в минус`)
      return
    }
    setGuardrailError('')
    updateMutation.mutate(editingTier)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Комиссии и тарифы</h1>

      {notice && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          ⚠️ {notice}
        </div>
      )}

      {/* Tariff editor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tariffs?.map((t: any) => (
          <Card key={t.tier} title={`${TIER_LABELS[t.tier] ?? t.tier} — целевой диапазон: ${TIER_RANGES[t.tier]}`}>
            {editingTier?.tier === t.tier ? (
              <div className="space-y-3">
                {/* Primary: GMV rate (what partner sees) */}
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Ставка, % от суммы заказа (GMV) — то, что видит партнёр
                  </label>
                  <input
                    type="number" step="0.5" min="0" max={DEFAULT_SF_PCT - 0.5}
                    value={editingTier.gmv_rate}
                    onChange={e => setEditingTier({ ...editingTier, gmv_rate: parseFloat(e.target.value) })}
                    className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    → внутренний % от Service Fee (авто): {fmtPct(derivedSFRate(editingTier.gmv_rate))}%
                    (при SF={DEFAULT_SF_PCT}%)
                  </p>
                </div>
                {t.tier === 'bronze' && (
                  <div>
                    <label className="text-xs text-gray-500">Мин. заказов до Silver</label>
                    <input type="number" value={editingTier.min_orders_for_silver}
                      onChange={e => setEditingTier({ ...editingTier, min_orders_for_silver: parseInt(e.target.value) })}
                      className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-sm" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500">CPA бонус за нового пользователя (₸)</label>
                  <input type="number" value={editingTier.cpa_bonus}
                    onChange={e => setEditingTier({ ...editingTier, cpa_bonus: parseFloat(e.target.value) })}
                    className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Причина изменения (обязательна при снижении)</label>
                  <input type="text" value={editingTier.reason ?? ''}
                    onChange={e => setEditingTier({ ...editingTier, reason: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                    placeholder="Например: сезонная корректировка" />
                </div>
                {guardrailError && (
                  <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{guardrailError}</p>
                )}
                <div className="flex gap-2">
                  <Btn size="sm" loading={updateMutation.isPending} onClick={handleSave}>
                    Сохранить
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => { setEditingTier(null); setGuardrailError('') }}>Отмена</Btn>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {/* Primary display: GMV rate */}
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500">Ставка (% от GMV)</span>
                  <span className="font-bold text-lg text-indigo-700">{fmtPct(t.gmv_rate)}%</span>
                </div>
                {/* Derived: SF rate — internal only */}
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-400 text-xs">→ % от Service Fee (внутр.)</span>
                  <span className="text-gray-400 text-xs">{fmtPct(t.base_rate)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CPA бонус</span>
                  <span className="font-semibold">{fmt(t.cpa_bonus)} ₸</span>
                </div>
                {t.tier === 'bronze' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">До Silver</span>
                    <span className="font-semibold">{t.min_orders_for_silver} заказов</span>
                  </div>
                )}
                {/* Pending rate decrease notice */}
                {t.pending_gmv_rate != null && t.rate_effective_at && (
                  <div className="mt-2 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-xs text-amber-700">
                    ⏳ Снижение до {fmtPct(t.pending_gmv_rate)}% GMV вступит в силу{' '}
                    {new Date(t.rate_effective_at).toLocaleDateString('ru-RU')}
                  </div>
                )}
                <Btn size="sm" variant="outline" onClick={() => { setEditingTier({ ...t, reason: '' }); setGuardrailError(''); setNotice('') }}>
                  Редактировать
                </Btn>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Pending commissions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Ожидающие одобрения ({commissions?.total ?? 0})
          </h2>
          <Btn loading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>
            Одобрить все
          </Btn>
        </div>

        {isLoading ? (
          <p className="text-gray-400 text-sm">Загрузка...</p>
        ) : commissions?.items?.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">Нет ожидающих комиссий</p>
        ) : (
          <Table headers={['Заказ', 'Партнёр', 'Ставка (GMV%)', 'Сумма заказа', 'Комиссия', 'CPA', 'Статус']}>
            {commissions?.items?.map((c: any) => (
              <tr key={c.id}>
                <TD className="font-mono text-xs">{c.order_id.slice(0, 8)}...</TD>
                <TD className="font-mono text-xs">{c.partner_id.slice(0, 8)}...</TD>
                <TD>{fmtPct(c.rate)}%</TD>
                <TD>{fmt(c.base_amount)} ₸</TD>
                <TD className="font-semibold text-green-600">{fmt(c.commission_amount)} ₸</TD>
                <TD>{c.cpa_bonus > 0 ? `+${fmt(c.cpa_bonus)} ₸` : '—'}</TD>
                <TD>
                  <Badge
                    label={c.status}
                    variant={c.status === 'approved' ? 'success' : c.fraud_hold ? 'danger' : 'warning'}
                  />
                </TD>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  )
}
