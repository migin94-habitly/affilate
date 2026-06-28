import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminEvents, upsertAdminEvent, setAdminEventActive, setAdminEventSpecialRate, getAdminEventFilters } from '@/api/admin'
import { Btn, Badge, Card, Table, TD, Stat } from '@/components/ui'

// ─── Combobox ─────────────────────────────────────────────────────────────────

function Combobox({
  value,
  onChange,
  options,
  placeholder,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()))

  const base = 'w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500'

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        className={base}
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-44 overflow-y-auto">
          {query !== '' && (
            <button
              className="w-full text-left px-3 py-2 text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
              onMouseDown={() => { onChange(''); setQuery(''); setOpen(false) }}
            >
              Очистить
            </button>
          )}
          {filtered.map(opt => (
            <button
              key={opt}
              className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-700 dark:hover:text-brand-400 transition-colors"
              onMouseDown={() => { onChange(opt); setQuery(opt); setOpen(false) }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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
}

// Extract a stable external_id from the URL (last meaningful path segment or full URL hash)
function extractExternalId(url: string): string {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    // prefer a numeric segment (event ID in URLs like /event/12345/...)
    const num = parts.find(p => /^\d+$/.test(p))
    if (num) return num
    // fallback: last non-empty segment
    return parts[parts.length - 1] ?? u.hostname
  } catch {
    return url.slice(0, 80)
  }
}

function isValidUrl(s: string) {
  try { return ['http:', 'https:'].includes(new URL(s).protocol) } catch { return false }
}

// ─── Event form (simplified) ─────────────────────────────────────────────────

interface EventFormData {
  base_url: string
  title: string
  city: string
  category: string
  is_active: boolean
  special_rate: string
}

const EMPTY: EventFormData = { base_url: '', title: '', city: '', category: '', is_active: true, special_rate: '' }

function EventForm({
  initial,
  onSave,
  onCancel,
  loading,
  cities = [],
  categories = [],
}: {
  initial?: Partial<AdminEvent>
  onSave: (data: any) => void
  onCancel: () => void
  loading: boolean
  cities?: string[]
  categories?: string[]
}) {
  const [form, setForm] = useState<EventFormData>({
    base_url:     initial?.base_url  ?? '',
    title:        initial?.title     ?? '',
    city:         initial?.city      ?? '',
    category:     initial?.category  ?? '',
    is_active:    initial?.is_active ?? true,
    special_rate: initial?.special_rate != null ? String(initial.special_rate) : '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({})

  const f = <K extends keyof EventFormData>(key: K, val: EventFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const e: Partial<Record<keyof EventFormData, string>> = {}
    if (!form.base_url.trim()) {
      e.base_url = 'Укажите URL события'
    } else if (!isValidUrl(form.base_url.trim())) {
      e.base_url = 'Некорректный URL — должен начинаться с https://'
    }
    if (!form.title.trim()) e.title = 'Название обязательно'
    if (form.special_rate !== '' && (isNaN(Number(form.special_rate)) || Number(form.special_rate) < 0 || Number(form.special_rate) > 100)) {
      e.special_rate = 'Ставка: число от 0 до 100'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const url = form.base_url.trim()
    const payload: any = {
      external_id: initial?.external_id ?? extractExternalId(url),
      base_url:    url,
      title:       form.title.trim(),
      city:        form.city.trim(),
      category:    form.category.trim(),
      is_active:   form.is_active,
      // required by backend but can be empty for manual entries
      venue:    '',
      image_url: '',
      min_price: 0,
      currency:  'KZT',
      service_fee_pct: 0,
    }
    if (form.special_rate !== '') payload.special_rate = Number(form.special_rate)
    onSave(payload)
  }

  const inp = (err?: string) =>
    `w-full px-3 py-2 border rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
     focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-colors
     ${err ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'}`
  const lbl = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
  const err = 'mt-1 text-xs text-red-500 dark:text-red-400'

  return (
    <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Primary: URL */}
      <div>
        <label className={lbl}>Ссылка на событие *</label>
        <input
          className={inp(errors.base_url)}
          type="url"
          value={form.base_url}
          onChange={e => f('base_url', e.target.value)}
          placeholder="https://ticketon.kz/event/12345/concert-name"
          autoFocus
        />
        {errors.base_url
          ? <p className={err}>{errors.base_url}</p>
          : form.base_url && isValidUrl(form.base_url)
            ? <p className="mt-1 text-xs text-green-600 dark:text-green-400">ID: {extractExternalId(form.base_url)}</p>
            : null}
      </div>

      {/* Title */}
      <div>
        <label className={lbl}>Название события *</label>
        <input
          className={inp(errors.title)}
          value={form.title}
          onChange={e => f('title', e.target.value)}
          placeholder="Концерт Димаша Кудайбергена"
          maxLength={300}
        />
        {errors.title && <p className={err}>{errors.title}</p>}
      </div>

      {/* City + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Город</label>
          <Combobox
            value={form.city}
            onChange={v => f('city', v)}
            options={cities}
            placeholder="Алматы"
          />
        </div>
        <div>
          <label className={lbl}>Категория</label>
          <Combobox
            value={form.category}
            onChange={v => f('category', v)}
            options={categories}
            placeholder="Концерт"
          />
        </div>
      </div>

      {/* Special rate + active */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Спец. ставка партнёра, %</label>
          <input
            type="number"
            className={inp(errors.special_rate)}
            value={form.special_rate}
            onChange={e => f('special_rate', e.target.value)}
            placeholder="Оставьте пустым"
            min={0}
            max={100}
            step={0.01}
          />
          {errors.special_rate && <p className={err}>{errors.special_rate}</p>}
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
            <div
              onClick={() => f('is_active', !form.is_active)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer
                ${form.is_active ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            {form.is_active ? 'Активно' : 'Скрыто'}
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Btn size="sm" loading={loading} onClick={handleSave}>Сохранить</Btn>
        <Btn size="sm" variant="outline" onClick={onCancel}>Отмена</Btn>
      </div>
    </div>
  )
}

// ─── Special rate modal ───────────────────────────────────────────────────────

function SpecialRateModal({
  event, onSave, onClose, loading,
}: {
  event: AdminEvent
  onSave: (rate: number | null, reason: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [rate, setRate] = useState(event.special_rate != null ? String(event.special_rate) : '')
  const [reason, setReason] = useState('')
  const [rateErr, setRateErr] = useState('')

  const handleSave = () => {
    if (rate !== '' && (isNaN(Number(rate)) || Number(rate) < 0)) {
      setRateErr('Некорректное значение')
      return
    }
    onSave(rate === '' ? null : Number(rate), reason)
  }

  const inp = `w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm
    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
    focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-5 w-full max-w-sm">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Спец. ставка партнёра</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">{event.title}</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Ставка, % {event.service_fee_pct > 0 ? `(макс. < ${event.service_fee_pct}%)` : ''}
            </label>
            <input
              type="number" className={inp} value={rate}
              onChange={e => { setRate(e.target.value); setRateErr('') }}
              min={0} step={0.01} placeholder="Пусто — отключить"
            />
            {rateErr && <p className="mt-1 text-xs text-red-500">{rateErr}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Причина изменения</label>
            <input className={inp} value={reason} onChange={e => setReason(e.target.value)} placeholder="Промо-акция..." />
          </div>
          <div className="flex gap-2 pt-1">
            <Btn size="sm" loading={loading} onClick={handleSave}>Сохранить</Btn>
            <Btn size="sm" variant="outline" onClick={onClose}>Отмена</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CSV import ───────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
    else cur += ch
  }
  result.push(cur.trim())
  return result
}

function parseCsv(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  // header: url, title, city, category, is_active
  return lines.slice(1).map(line => {
    const [url, title, city, category, active] = parseCsvLine(line)
    if (!url || !title) return null
    return {
      external_id: extractExternalId(url), base_url: url, title, city: city ?? '',
      category: category ?? '', is_active: active?.toLowerCase() !== 'false',
      venue: '', image_url: '', min_price: 0, currency: 'KZT', service_fee_pct: 0,
    }
  }).filter(Boolean)
}

function CsvImport({ onImport, loading }: { onImport: (rows: any[]) => void; loading: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [error, setError] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const rows = parseCsv(text)
      if (rows.length === 0) { setError('Файл пустой или некорректный формат'); setPreview([]) }
      else { setPreview(rows); setError('') }
    }
    reader.readAsText(file, 'utf-8')
  }

  const downloadTemplate = () => {
    const csv = 'url,title,city,category,is_active\nhttps://ticketon.kz/event/12345/concert,Концерт,Алматы,Концерт,true\n'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'events_template.csv'
    a.click()
  }

  return (
    <Card title="Импорт событий из CSV">
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Загрузите файл в формате CSV с колонками: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">url, title, city, category, is_active</code>
        </p>
        <div className="flex flex-wrap gap-2">
          <Btn size="sm" variant="outline" onClick={downloadTemplate}>Скачать шаблон</Btn>
          <Btn size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            Выбрать файл CSV
          </Btn>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {preview.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Найдено {preview.length} событий для импорта:
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    {['URL', 'Название', 'Город', 'Категория'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {preview.map((row: any, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 max-w-[180px] truncate">{row.base_url}</td>
                      <td className="px-3 py-1.5 text-gray-900 dark:text-gray-100 font-medium">{row.title}</td>
                      <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{row.city}</td>
                      <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{row.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Btn size="sm" loading={loading} onClick={() => onImport(preview)}>
              Импортировать {preview.length} событий
            </Btn>
          </div>
        )}
        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <p className="font-semibold">Интеграция каталога событий</p>
          <p>По аналогии с платформами Impact.com и Partnerize поддерживается импорт событий через CSV-фид. В будущих версиях планируется автоматическая синхронизация через API-вебхуки от Ticketon.</p>
        </div>
      </div>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function EventsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [rateEvent, setRateEvent] = useState<AdminEvent | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  const { data: filters } = useQuery({
    queryKey: ['admin-event-filters'],
    queryFn: getAdminEventFilters,
    staleTime: 5 * 60_000,
  })
  const availCities = filters?.cities ?? []
  const availCats = filters?.categories ?? []

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events', search, cityFilter, catFilter, page],
    queryFn: () => getAdminEvents({ search, city: cityFilter, category: catFilter, page, per_page: 20 }),
    placeholderData: prev => prev,
  })

  const events: AdminEvent[] = data?.items ?? []
  const totalPages = data?.total_pages ?? 1
  const total = data?.total ?? 0

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

  // Batch CSV import: upsert one-by-one
  const [importing, setImporting] = useState(false)
  const handleCsvImport = async (rows: any[]) => {
    setImporting(true)
    let ok = 0
    for (const row of rows) {
      try { await upsertAdminEvent(row); ok++ } catch {}
    }
    qc.invalidateQueries({ queryKey: ['admin-events'] })
    setImporting(false)
    setShowImport(false)
    setImportResult(`Импортировано ${ok} из ${rows.length} событий`)
    setTimeout(() => setImportResult(null), 5000)
  }

  const editingEvent = editingId && editingId !== 'new' ? events.find(e => e.id === editingId) : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Каталог событий</h1>
        <div className="flex gap-2">
          <Btn size="sm" variant="outline" onClick={() => { setShowImport(v => !v); setEditingId(null) }}>
            {showImport ? 'Закрыть импорт' : '↑ Импорт CSV'}
          </Btn>
          {editingId !== 'new' && (
            <Btn size="sm" onClick={() => { setEditingId('new'); setShowImport(false) }}>
              + Добавить событие
            </Btn>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Stat label="Всего событий" value={total} />
        <Stat label="Активных на странице" value={events.filter(e => e.is_active).length} color="text-green-600" />
        <Stat label="Страница" value={`${page} / ${totalPages}`} />
      </div>

      {/* Import result */}
      {importResult && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-green-700 dark:text-green-400 text-sm font-medium">
          ✅ {importResult}
        </div>
      )}

      {/* CSV import */}
      {showImport && <CsvImport onImport={handleCsvImport} loading={importing} />}

      {/* Add form */}
      {editingId === 'new' && (
        <Card title="Новое событие">
          <EventForm
            onSave={data => upsertMut.mutate(data)}
            onCancel={() => setEditingId(null)}
            loading={upsertMut.isPending}
            cities={availCities}
            categories={availCats}
          />
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
          placeholder="Поиск по названию..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <Combobox
          value={cityFilter}
          onChange={v => { setCityFilter(v); setPage(1) }}
          options={availCities}
          placeholder="Город"
          className="w-40"
        />
        <Combobox
          value={catFilter}
          onChange={v => { setCatFilter(v); setPage(1) }}
          options={availCats}
          placeholder="Категория"
          className="w-44"
        />
        {(search || cityFilter || catFilter) && (
          <Btn size="sm" variant="ghost" onClick={() => { setSearch(''); setCityFilter(''); setCatFilter(''); setPage(1) }}>
            Сбросить
          </Btn>
        )}
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-gray-400 dark:text-gray-500 text-4xl">🎟️</p>
            <p className="font-medium text-gray-700 dark:text-gray-300">События не найдены</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {search || cityFilter || catFilter
                ? 'Попробуйте изменить фильтры'
                : 'Добавьте первое событие или импортируйте из CSV'}
            </p>
          </div>
        ) : (
          <Table headers={['Событие', 'Город / Категория', 'Доп. ставка', 'Статус', '']}>
            {events.map(event => (
              <tr key={event.id}>
                {editingId === event.id ? (
                  <td colSpan={5} className="px-4 py-2">
                    <EventForm
                      initial={editingEvent}
                      onSave={data => upsertMut.mutate(data)}
                      onCancel={() => setEditingId(null)}
                      loading={upsertMut.isPending}
                      cities={availCities}
                      categories={availCats}
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
                          <a href={event.base_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-brand-500 hover:text-brand-600 truncate block max-w-[200px]"
                            onClick={e => e.stopPropagation()}>
                            {event.base_url}
                          </a>
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
                      {event.special_rate != null
                        ? <Badge label={`+${event.special_rate}%`} variant="success" dot />
                        : <span className="text-gray-400 dark:text-gray-500 text-xs">базовая</span>}
                    </TD>
                    <TD>
                      <Badge label={event.is_active ? 'Активно' : 'Скрыто'} variant={event.is_active ? 'success' : 'default'} dot />
                    </TD>
                    <TD>
                      <div className="flex gap-1.5 flex-wrap">
                        <Btn size="xs" variant={event.is_active ? 'outline' : 'primary'}
                          loading={activeMut.isPending}
                          onClick={() => activeMut.mutate({ id: event.id, is_active: !event.is_active })}>
                          {event.is_active ? 'Скрыть' : 'Активировать'}
                        </Btn>
                        <Btn size="xs" variant="outline" onClick={() => setRateEvent(event)}>Ставка</Btn>
                        <Btn size="xs" variant="ghost" onClick={() => setEditingId(event.id)}>✏️</Btn>
                      </div>
                    </TD>
                  </>
                )}
              </tr>
            ))}
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Btn variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</Btn>
            <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 tabular-nums">{page} / {totalPages}</span>
            <Btn variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</Btn>
          </div>
        )}
      </Card>

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
