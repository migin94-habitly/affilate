import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPayouts, updatePayoutStatus, exportPayouts } from '@/api/admin'
import { Table, TD, Badge, Btn, Filter } from '@/components/ui'

const statusVariant = (s: string) =>
  s === 'paid' ? 'success' : s === 'processing' ? 'warning' : s === 'failed' ? 'danger' : 'default'

const statusLabel = (s: string) =>
  s === 'requested' ? 'Ожидает' : s === 'processing' ? 'В обработке' : s === 'paid' ? 'Выплачено' : s === 'failed' ? 'Ошибка' : s

export function PayoutsPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('requested')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payouts', status, page],
    queryFn: () => getPayouts({ status, page, per_page: 20 })
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => updatePayoutStatus(id, s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payouts'] })
  })

  const handleExport = async () => {
    setExporting(true)
    try {
      const csv = await exportPayouts()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payouts_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const fmt = (n: number) => n?.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) ?? '0'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Выплаты</h1>
        <Btn loading={exporting} variant="outline" onClick={handleExport}>
          Экспорт CSV (Freedom Pay)
        </Btn>
      </div>

      <div className="flex gap-3 items-center">
        <Filter label="Статус" value={status} onChange={v => { setStatus(v); setPage(1) }}
          options={[
            { value: '', label: 'Все' },
            { value: 'requested', label: 'Ожидает' },
            { value: 'processing', label: 'В обработке' },
            { value: 'paid', label: 'Выплачено' },
            { value: 'failed', label: 'Ошибка' }
          ]} />
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-400">Загрузка...</div>
      ) : (
        <Table headers={['Партнёр', 'Сумма', 'Freedom Pay / Банк', 'Ref', 'Запрошено', 'Исполнено', 'Статус', 'Действия']}>
          {data?.items?.map((p: any) => (
            <tr key={p.id}>
              <TD>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{p.partner_name || '—'}</p>
                  <p className="text-xs text-gray-400">{p.partner_email || '—'}</p>
                </div>
              </TD>
              <TD className="font-semibold text-green-600">{fmt(p.amount)} ₸</TD>
              <TD>
                <div>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300">{p.freedom_pay_account || '—'}</p>
                  {p.bank_name && (
                    <p className="text-xs text-gray-400 mt-0.5">{p.bank_name}{p.bank_account ? ` · ${p.bank_account}` : ''}</p>
                  )}
                </div>
              </TD>
              <TD className="text-xs font-mono text-gray-400">{p.freedom_pay_ref || '—'}</TD>
              <TD className="text-xs text-gray-400 whitespace-nowrap">
                {p.requested_at ? new Date(p.requested_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
              </TD>
              <TD className="text-xs text-gray-400 whitespace-nowrap">
                {p.paid_at
                  ? new Date(p.paid_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
                  : p.processed_at
                    ? new Date(p.processed_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
                    : '—'}
              </TD>
              <TD><Badge label={statusLabel(p.status)} variant={statusVariant(p.status) as any} /></TD>
              <TD>
                <div className="flex gap-1">
                  {p.status === 'requested' && (
                    <Btn size="sm"
                      loading={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: p.id, s: 'processing' })}>
                      В обработку
                    </Btn>
                  )}
                  {p.status === 'processing' && (
                    <>
                      <Btn size="sm"
                        loading={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: p.id, s: 'paid' })}>
                        Выплачено
                      </Btn>
                      <Btn size="sm" variant="danger"
                        loading={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: p.id, s: 'failed' })}>
                        Ошибка
                      </Btn>
                    </>
                  )}
                  {p.notes && (
                    <span className="text-xs text-gray-400 italic ml-1 truncate max-w-[100px]" title={p.notes}>{p.notes}</span>
                  )}
                </div>
              </TD>
            </tr>
          ))}
        </Table>
      )}

      {data?.items?.length === 0 && !isLoading && (
        <p className="text-center py-10 text-gray-400 text-sm">Нет выплат</p>
      )}

      <div className="flex gap-2">
        <Btn size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</Btn>
        <span className="px-2 py-1.5 text-sm text-gray-600">Стр. {page}</span>
        <Btn size="sm" variant="outline" disabled={!data?.items?.length || data.items.length < 20}
          onClick={() => setPage(p => p + 1)}>→</Btn>
      </div>
    </div>
  )
}
