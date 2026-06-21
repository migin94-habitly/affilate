import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDocuments, adminSignDocument, adminRejectDocument, getDocumentDownloadUrl } from '@/api/admin'
import { Table, TD, Badge, Btn, Filter } from '@/components/ui'

const docStatusVariant = (s: string) =>
  s === 'signed' ? 'success'
  : s === 'rejected' ? 'danger'
  : s === 'under_ticketon_review' ? 'warning'
  : 'default'

const docStatusLabel: Record<string, string> = {
  draft: 'Черновик',
  awaiting_partner_signature: 'Ждёт подписи партнёра',
  under_ticketon_review: 'На проверке',
  awaiting_ticketon_signature: 'Ждёт подписи Ticketon',
  signed: 'Подписано',
  archived: 'В архиве',
  rejected: 'Отклонено'
}

export function DocumentsPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('under_ticketon_review')
  const [page, setPage] = useState(1)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-documents', status, page],
    queryFn: () => getDocuments({ status, page, per_page: 20 })
  })

  const signMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) => adminSignDocument(id, url),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-documents'] })
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminRejectDocument(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-documents'] }); setRejectId(null); setRejectReason('') }
  })

  const handleDownload = async (docId: string) => {
    const { url } = await getDocumentDownloadUrl(docId)
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Документы</h1>
        <span className="text-sm text-gray-500">{data?.total ?? 0} всего</span>
      </div>

      <Filter label="Статус" value={status} onChange={v => { setStatus(v); setPage(1) }}
        options={[
          { value: '', label: 'Все' },
          { value: 'under_ticketon_review', label: 'На проверке' },
          { value: 'awaiting_ticketon_signature', label: 'Ждёт подписи Ticketon' },
          { value: 'awaiting_partner_signature', label: 'Ждёт подписи партнёра' },
          { value: 'signed', label: 'Подписано' },
          { value: 'rejected', label: 'Отклонено' }
        ]} />

      {isLoading ? (
        <div className="text-center py-10 text-gray-400">Загрузка...</div>
      ) : (
        <Table headers={['Тип', 'Партнёр', 'Статус', 'Обновлено', 'Файл партнёра', 'Действия']}>
          {data?.items?.map((d: any) => (
            <tr key={d.id}>
              <TD className="text-xs font-mono text-gray-600">{d.document_type}</TD>
              <TD className="text-xs font-mono text-gray-500">{d.partner_id.slice(0, 8)}...</TD>
              <TD>
                <Badge
                  label={docStatusLabel[d.status] ?? d.status}
                  variant={docStatusVariant(d.status) as any}
                />
              </TD>
              <TD className="text-xs text-gray-400">{new Date(d.updated_at).toLocaleDateString('ru-RU')}</TD>
              <TD>
                {d.partner_signed_url ? (
                  <button
                    onClick={() => handleDownload(d.id)}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Скачать
                  </button>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </TD>
              <TD>
                {rejectId === d.id ? (
                  <div className="flex gap-1 items-center">
                    <input
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Причина"
                      className="text-xs border border-gray-300 rounded px-2 py-1 w-36"
                    />
                    <Btn size="sm" variant="danger"
                      loading={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate({ id: d.id, reason: rejectReason })}>
                      OK
                    </Btn>
                    <Btn size="sm" variant="ghost" onClick={() => setRejectId(null)}>✕</Btn>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    {(d.status === 'under_ticketon_review' || d.status === 'awaiting_ticketon_signature') && (
                      <>
                        <Btn size="sm"
                          loading={signMutation.isPending}
                          onClick={() => signMutation.mutate({ id: d.id, url: d.partner_signed_url ?? '' })}>
                          Подписать
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => setRejectId(d.id)}>
                          Отклонить
                        </Btn>
                      </>
                    )}
                  </div>
                )}
              </TD>
            </tr>
          ))}
        </Table>
      )}

      {data?.items?.length === 0 && !isLoading && (
        <p className="text-center py-10 text-gray-400 text-sm">Нет документов</p>
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
