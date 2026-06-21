import { useQuery } from '@tanstack/react-query'
import { getFraudSignals } from '@/api/admin'
import { Table, TD, Badge, Card, Stat } from '@/components/ui'

const signalLabel: Record<string, string> = {
  click_spike: 'Всплеск кликов',
  zero_conversion: 'Нулевая конверсия'
}

export function FraudPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['fraud-signals'],
    queryFn: getFraudSignals,
    refetchInterval: 60_000
  })

  const signals = data ?? []
  const spikes = signals.filter((s: any) => s.signal_type === 'click_spike').length
  const zeroConv = signals.filter((s: any) => s.signal_type === 'zero_conversion').length
  const partners = new Set(signals.map((s: any) => s.partner_id)).size

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Антифрод</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <Stat label="Всего сигналов" value={String(signals.length)} />
        </Card>
        <Card>
          <Stat label="Всплески кликов" value={String(spikes)} color="text-orange-500" />
        </Card>
        <Card>
          <Stat label="Нулевая конверсия" value={String(zeroConv)} color="text-red-500" />
        </Card>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        <strong>Правила обнаружения:</strong>
        <ul className="mt-1 list-disc pl-4 space-y-0.5">
          <li>Всплеск кликов — более 100 кликов в течение одного часа от одного партнёра</li>
          <li>Нулевая конверсия — более 50 кликов за 7 дней без единого заказа</li>
        </ul>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-400">Загрузка...</div>
      ) : signals.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-gray-500 text-sm">Подозрительной активности не обнаружено</p>
        </div>
      ) : (
        <Table headers={['Тип сигнала', 'Партнёр', 'Значение', 'Обнаружено', 'Статус']}>
          {signals.map((s: any, i: number) => (
            <tr key={i}>
              <TD>
                <Badge
                  label={signalLabel[s.signal_type] ?? s.signal_type}
                  variant={s.signal_type === 'click_spike' ? 'warning' : 'danger'}
                />
              </TD>
              <TD className="font-mono text-xs text-gray-500">{s.partner_id.slice(0, 8)}...</TD>
              <TD className="font-semibold">
                {s.signal_type === 'click_spike'
                  ? `${s.click_count} кликов/ч`
                  : `${s.click_count} кликов → 0 заказов`}
              </TD>
              <TD className="text-xs text-gray-400">
                {new Date(s.detected_at).toLocaleString('ru-RU')}
              </TD>
              <TD>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                  Требует проверки
                </span>
              </TD>
            </tr>
          ))}
        </Table>
      )}

      <p className="text-xs text-gray-400 text-right">
        Обновляется автоматически каждые 60 секунд · Партнёров под наблюдением: {partners}
      </p>
    </div>
  )
}
