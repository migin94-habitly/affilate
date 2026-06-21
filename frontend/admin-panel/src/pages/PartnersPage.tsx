import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPartners, updatePartnerStatus, updatePartnerTier } from '@/api/admin'
import { Table, TD, Badge, Btn, Filter } from '@/components/ui'

const statusVariant = (s: string) =>
  s === 'active' ? 'success' : s === 'pending' ? 'warning' : s === 'banned' ? 'danger' : 'default'

export function PartnersPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [segment, setSegment] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-partners', status, segment, search, page],
    queryFn: () => getPartners({ status, segment, search, page, per_page: 20 })
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => updatePartnerStatus(id, s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-partners'] })
  })

  const tierMutation = useMutation({
    mutationFn: ({ id, t }: { id: string; t: string }) => updatePartnerTier(id, t),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-partners'] })
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Партнёры</h1>
        <span className="text-sm text-gray-500">{data?.total ?? 0} всего</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Поиск по email / имени"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Filter label="Статус" value={status} onChange={v => { setStatus(v); setPage(1) }}
          options={[
            { value: '', label: 'Все' },
            { value: 'pending', label: 'Ожидает' },
            { value: 'active', label: 'Активен' },
            { value: 'suspended', label: 'Приостановлен' },
            { value: 'banned', label: 'Заблокирован' }
          ]} />
        <Filter label="Сегмент" value={segment} onChange={v => { setSegment(v); setPage(1) }}
          options={[
            { value: '', label: 'Все' },
            { value: 'influencer', label: 'Блогер' },
            { value: 'ugc', label: 'UGC' },
            { value: 'webservice', label: 'Веб-сервис' }
          ]} />
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-400">Загрузка...</div>
      ) : (
        <Table headers={['Партнёр', 'Сегмент', 'Tier', 'Статус', 'Страна', 'Зарегистрирован', 'Действия']}>
          {data?.items?.map((p: any) => (
            <tr key={p.id}>
              <TD>
                <div>
                  <p className="font-medium text-gray-900">{p.full_name}</p>
                  <p className="text-xs text-gray-400">{p.email}</p>
                </div>
              </TD>
              <TD><Badge label={p.segment} /></TD>
              <TD>
                <select
                  value={p.tier}
                  onChange={e => tierMutation.mutate({ id: p.id, t: e.target.value })}
                  className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white"
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                </select>
              </TD>
              <TD><Badge label={p.status} variant={statusVariant(p.status) as any} /></TD>
              <TD>{p.country}</TD>
              <TD className="text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString('ru-RU')}</TD>
              <TD>
                <div className="flex gap-1">
                  {p.status === 'pending' && (
                    <Btn size="sm" onClick={() => statusMutation.mutate({ id: p.id, s: 'active' })}>
                      Одобрить
                    </Btn>
                  )}
                  {p.status === 'active' && (
                    <Btn size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: p.id, s: 'suspended' })}>
                      Приостановить
                    </Btn>
                  )}
                  {(p.status === 'suspended' || p.status === 'pending') && (
                    <Btn size="sm" variant="danger" onClick={() => statusMutation.mutate({ id: p.id, s: 'banned' })}>
                      Бан
                    </Btn>
                  )}
                </div>
              </TD>
            </tr>
          ))}
        </Table>
      )}

      {/* Pagination */}
      <div className="flex gap-2">
        <Btn size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</Btn>
        <span className="px-2 py-1.5 text-sm text-gray-600">Стр. {page}</span>
        <Btn size="sm" variant="outline" disabled={!data?.items?.length || data.items.length < 20}
          onClick={() => setPage(p => p + 1)}>→</Btn>
      </div>
    </div>
  )
}
