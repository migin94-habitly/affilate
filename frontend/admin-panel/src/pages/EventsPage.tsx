import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminEvents, upsertAdminEvent, setAdminEventActive, setAdminEventSpecialRate } from '@/api/admin'
import { Btn, Badge, Card, Table, TD, Stat } from '@/components/ui'

interface AdminEvent {
  id: string
  external_id: string
  title: string
  city: string
  category: string
  date?: string
  venue: string
  image_url: string
  base_url: string
  min_price: number
  currency: string
  service_fee_pct: number
  is_active: boolean
  special_rate?: number | null
  created_at: string
  updated_at: string
}

interface EventsData {
  items: AdminEvent[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

const EMPTY_FORM = {
  external_id: '',
  title: '',
  city: '',
  category: '',
  venue: '',
  image_url: '',
  base_url: '',
  min_price: 0,
  currency: 'KZT',
  service_fee_pct: 0,
  is_active: true,
  special_rate: '',
}

function EventForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Partial<AdminEvent>
  onSave: (data: any) => void
  onCancel: () => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(initial
      ? {
          external_id: initial.external_id ?? '',
          title: initial.title ?? '',
          city: initial.city ?? '',
          category: initial.category ?? '',
          venue: initial.venue ?? '',
          image_url: initial.image_url ?? '',
          base_url: initial.base_url ?? '',
          min_price: initial.min_price ?? 0,
          currency: initial.currency ?? 'KZT',
          service_fee_pct: initial.service_fee_pct ?? 0,
          is_active: initial.is_active ?? true,
          special_rate: initial.special_rate != null ? String(initial.special_rate) : '',
        }
      : {}),
  })

  const f = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSave = () => {
    const payload: any = {
      external_id: form.external_id.trim(),
      title: form.title.trim(),
      city: form.city.trim(),
      category: form.category.trim(),
      venue: form.venue.trim(),
      image_url: form.image_url.trim(),
      base_url: form.base_url.trim(),
      min_price: Number(form.min_price),
      currency: form.currency || 'KZT',
      service_fee_pct: Number(form.service_fee_pct),
      is_active: form.is_active,
    }
    if (form.special_rate !== '') {
      payload.special_rate = Number(form.special_rate)
    }
    onSave(payload)
  }

  const inp = 'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500'
  const lbl = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'

  return (
    <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>External ID *</label>
          <input className={inp} value={form.external_id} onChange={e => f('external_id', e.target.value)} placeholder="evt_12345" />
        </div>
        <div>
          <label className={lbl}>Название *</label>
          <input className={inp} value={form.title} onChange={e => f('title', e.target.value)} placeholder="Концерт Иванова" />
        </div>
        <div>
          <label className={lbl}>Город</label>
          <input className={inp} value={form.city} onChange={e => f('city', e.target.value)} placeholder="Алматы" />
        </div>
        <div>
          <label className={lbl}>Категория</label>
          <input className={inp} value={form.category} onChange={e => f('category', e.target.value)} placeholder="Концерт" />
        </div>
        <div>
          <label className={lbl}>Площадка</label>
          <input className={inp} value={form.venue} onChange={e => f('venue', e.target.value)} placeholder="Арена" />
        </div>
        <div>
          <label className={lbl}>URL изображения</label>
          <input className={inp} value={form.image_url} onChange={e => f('image_url', e.target.value)} placeholder="https://..." />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Ссылка на покупку билетов *</label>
          <input className={inp} value={form.base_url} onChange={e => f('base_url', e.target.value)} placeholder="https://ticketon.kz/event/..." />
        </div>
        <div>
          <label className={lbl}>Мин. цена</label>
          <input type="number" className={inp} value={form.min_price} onChange={e => f('min_price', e.target.value)} min={0} />
        </div>
        <div>
          <label className={lbl}>Валюта</label>
          <select className={inp} value={form.currency} onChange={e => f('currency', e.target.value)}>
            <option value="KZT">KZT</option>
            <option value="USD">USD</option>
            <option value="RUB">RUB</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Комиссия Ticketon, %</label>
          <input type="number" className={inp} value={form.service_fee_pct} onChange={e => f('service_fee_pct', e.target.value)} min={0} max={100} step={0.01} />
        </div>
        <div>
          <label className={lbl}>Спец. ставка партнёра, % (необязательно)</label>
          <input type="number" className={inp} value={form.special_rate} onChange={e => f('special_rate', e.target.value)} min={0} step={0.01} placeholder="Оставьте пустым для отключения" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={form.is_active} onChange={e => f('is_active', e.target.checked)} className="w-4 h-4 rounded" />
          Показывать в каталоге партнёров
        </label>
        <div className="flex gap-2">
          <Btn size="sm" loading={loading} onClick={handleSave}>Сохранить</Btn>
          <Btn size="sm" variant="outline" onClick={onCancel}>Отмена</Btn>
        </div>
      </div>
    </div>
  )
}

function SpecialRateModal({
  event,
  onSave,
  onClose,
  loading,
}: {
  event: AdminEvent
  onSave: (rate: number | null, reason: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [rate, setRate] = useState(event.special_rate != null ? String(event.special_rate) : '')
  const [reason, setReason] = useState('')

  const inp = 'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-5 w-full max-w-sm">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Спец. ставка партнёра</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">{event.title}</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Ставка, % (макс. &lt; {event.service_fee_pct}%)
            </label>
            <input
              type="number"
              className={inp}
              value={rate}
              onChange={e => setRate(e.target.value)}
              min={0}
              step={0.01}
              placeholder="Пусто — отключить"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Причина изменения</label>
            <input className={inp} value={reason} onChange={e => setReason(e.target.value)} placeholder="Промо-акция, партнёрское соглашение..." />
          </div>
          <div className="flex gap-2 pt-1">
            <Btn size="sm" loading={loading} onClick={() => onSave(rate === '' ? null : Number(rate), reason)}>
              Сохранить
            </Btn>
            <Btn size="sm" variant="outline" onClick={onClose}>Отмена</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EventsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [rateEvent, setRateEvent] = useState<AdminEvent | null>(null)

  const { data, isLoading } = useQuery<EventsData>({
    queryKey: ['admin-events', search, cityFilter, catFilter, page],
    queryFn: () => getAdminEvents({ search, city: cityFilter, category: catFilter, page, per_page: 20 }),
    placeholderData: prev => prev,
  })

  const events: AdminEvent[] = data?.items ?? []
  const totalPages = data?.total_pages ?? 1
  const total = data?.total ?? 0
  const activeCount = events.filter(e => e.is_active).length

  const upsertMut = useMutation({
    mutationFn: upsertAdminEvent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-events'] }); setEditingId(null) },
  })

  const activeMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => setAdminEventActive(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-events'] }),
  })

  const rateMut = useMutation({
    mutationFn: ({ id, rate, reason }: { id: string; rate: number | null; reason: string }) =>
      setAdminEventSpecialRate(id, rate, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-events'] }); setRateEvent(null) },
  })

  const inp = 'px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500'

  const editingEvent = editingId && editingId !== 'new'
    ? events.find(e => e.id === editingId)
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Каталог событий</h1>
        {editingId !== 'new' && (
          <Btn size="sm" onClick={() => setEditingId('new')}>+ Добавить событие</Btn>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Stat label="Всего событий" value={total} />
        <Stat label="Активных (эта страница)" value={activeCount} color="text-green-600" />
        <Stat label="Страница" value={`${page} / ${totalPages}`} />
      </div>

      {/* New event form */}
      {editingId === 'new' && (
        <Card title="Новое событие">
          <EventForm
            onSave={data => upsertMut.mutate(data)}
            onCancel={() => setEditingId(null)}
            loading={upsertMut.isPending}
          />
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className={inp}
          placeholder="Поиск по названию..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <input
          className={inp}
          placeholder="Город"
          value={cityFilter}
          onChange={e => { setCityFilter(e.target.value); setPage(1) }}
        />
        <input
          className={inp}
          placeholder="Категория"
          value={catFilter}
          onChange={e => { setCatFilter(e.target.value); setPage(1) }}
        />
        {(search || cityFilter || catFilter) && (
          <Btn
            size="sm"
            variant="ghost"
            onClick={() => { setSearch(''); setCityFilter(''); setCatFilter(''); setPage(1) }}
          >
            Сбросить
          </Btn>
        )}
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-gray-400 dark:text-gray-500 text-4xl">🎟️</p>
            <p className="font-medium text-gray-700 dark:text-gray-300">События не найдены</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {search || cityFilter || catFilter
                ? 'Попробуйте изменить фильтры'
                : 'Добавьте первое событие нажав кнопку выше'}
            </p>
          </div>
        ) : (
          <Table headers={['Событие', 'Город / Категория', 'Цена', 'Доп. ставка', 'Статус', '']}>
            {events.map(event => (
              <tr key={event.id}>
                {editingId === event.id ? (
                  <td colSpan={6} className="px-4 py-2">
                    <EventForm
                      initial={editingEvent}
                      onSave={data => upsertMut.mutate(data)}
                      onCancel={() => setEditingId(null)}
                      loading={upsertMut.isPending}
                    />
                  </td>
                ) : (
                  <>
                    <TD>
                      <div className="flex items-center gap-3 min-w-0">
                        {event.image_url ? (
                          <img src={event.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-gray-100 dark:bg-gray-800" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">🎟️</div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-1">{event.title}</p>
                          {event.date && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(event.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <div className="space-y-0.5">
                        {event.city && <p className="text-sm text-gray-700 dark:text-gray-300">{event.city}</p>}
                        {event.category && <p className="text-xs text-gray-400 dark:text-gray-500">{event.category}</p>}
                      </div>
                    </TD>
                    <TD>
                      {event.min_price > 0
                        ? <span className="tabular-nums">{event.min_price.toLocaleString()} {event.currency}</span>
                        : <span className="text-gray-400 dark:text-gray-500">—</span>
                      }
                    </TD>
                    <TD>
                      {event.special_rate != null ? (
                        <Badge label={`+${event.special_rate}%`} variant="success" dot />
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">базовая</span>
                      )}
                    </TD>
                    <TD>
                      <Badge
                        label={event.is_active ? 'Активно' : 'Скрыто'}
                        variant={event.is_active ? 'success' : 'default'}
                        dot
                      />
                    </TD>
                    <TD>
                      <div className="flex gap-1.5 flex-wrap">
                        <Btn
                          size="xs"
                          variant={event.is_active ? 'outline' : 'primary'}
                          loading={activeMut.isPending}
                          onClick={() => activeMut.mutate({ id: event.id, is_active: !event.is_active })}
                        >
                          {event.is_active ? 'Скрыть' : 'Активировать'}
                        </Btn>
                        <Btn
                          size="xs"
                          variant="outline"
                          onClick={() => setRateEvent(event)}
                        >
                          Ставка
                        </Btn>
                        <Btn
                          size="xs"
                          variant="ghost"
                          onClick={() => setEditingId(event.id)}
                        >
                          ✏️
                        </Btn>
                      </div>
                    </TD>
                  </>
                )}
              </tr>
            ))}
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Btn variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              ←
            </Btn>
            <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 tabular-nums">
              {page} / {totalPages}
            </span>
            <Btn variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              →
            </Btn>
          </div>
        )}
      </Card>

      {/* Special rate modal */}
      {rateEvent && (
        <SpecialRateModal
          event={rateEvent}
          onClose={() => setRateEvent(null)}
          loading={rateMut.isPending}
          onSave={(rate, reason) => rateMut.mutate({ id: rateEvent.id, rate, reason })}
        />
      )}
    </div>
  )
}
