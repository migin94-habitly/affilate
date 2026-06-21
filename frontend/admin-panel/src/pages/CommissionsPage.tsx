import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTariffs, updateTariff, getCommissions, approveAllCommissions } from '@/api/admin'
import { Table, TD, Badge, Btn, Card } from '@/components/ui'

export function CommissionsPage() {
  const qc = useQueryClient()
  const [editingTier, setEditingTier] = useState<any>(null)

  const { data: tariffs } = useQuery({ queryKey: ['tariffs'], queryFn: getTariffs })
  const { data: commissions, isLoading } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => getCommissions({ status: 'pending', page: 1, per_page: 50 })
  })

  const updateMutation = useMutation({
    mutationFn: updateTariff,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tariffs'] }); setEditingTier(null) }
  })

  const approveMutation = useMutation({
    mutationFn: approveAllCommissions,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions'] })
  })

  const fmt = (n: number) => n?.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) ?? '0'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Комиссии и тарифы</h1>

      {/* Tariff editor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tariffs?.map((t: any) => (
          <Card key={t.tier} title={`Tier: ${t.tier.charAt(0).toUpperCase() + t.tier.slice(1)}`}>
            {editingTier?.tier === t.tier ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Ставка (% от сервисного сбора)</label>
                  <input type="number" step="0.5" value={editingTier.base_rate}
                    onChange={e => setEditingTier({ ...editingTier, base_rate: parseFloat(e.target.value) })}
                    className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-sm" />
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
                <div className="flex gap-2">
                  <Btn size="sm" loading={updateMutation.isPending}
                    onClick={() => updateMutation.mutate(editingTier)}>
                    Сохранить
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setEditingTier(null)}>Отмена</Btn>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ставка</span>
                  <span className="font-semibold">{t.base_rate}%</span>
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
                <Btn size="sm" variant="outline" onClick={() => setEditingTier({ ...t })}>
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
          <Table headers={['Заказ', 'Партнёр', 'Ставка', 'Сервисный сбор', 'Комиссия', 'Статус']}>
            {commissions?.items?.map((c: any) => (
              <tr key={c.id}>
                <TD className="font-mono text-xs">{c.order_id.slice(0, 8)}...</TD>
                <TD className="font-mono text-xs">{c.partner_id.slice(0, 8)}...</TD>
                <TD>{c.rate}%</TD>
                <TD>{fmt(c.base_amount)} ₸</TD>
                <TD className="font-semibold text-green-600">{fmt(c.total_amount)} ₸</TD>
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
