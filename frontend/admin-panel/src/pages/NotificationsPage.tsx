import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminNotifications, sendAdminNotification } from '@/api/admin'
import { Btn, Badge, Card, Table, TD } from '@/components/ui'

interface AdminNotification {
  id: string
  partner_id: string
  partner_email: string
  partner_name: string
  type: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

const TYPE_OPTIONS = [
  { value: 'admin_message',     label: 'Сообщение' },
  { value: 'partner_approved',  label: 'Партнёр одобрен' },
  { value: 'tier_upgraded',     label: 'Повышение тира' },
  { value: 'payout_processing', label: 'Выплата обрабатывается' },
  { value: 'payout_paid',       label: 'Выплата выполнена' },
  { value: 'document_signed',   label: 'Документ подписан' },
]

function typeLabel(t: string) {
  return TYPE_OPTIONS.find(o => o.value === t)?.label ?? t
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'только что'
  if (m < 60) return `${m} мин. назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч. назад`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d} дн. назад` : new Date(dateStr).toLocaleDateString('ru-RU')
}

export function NotificationsPage() {
  const qc = useQueryClient()
  const [partnerFilter, setPartnerFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ partner_id: '', type: 'admin_message', title: '', body: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', partnerFilter, page],
    queryFn: () => getAdminNotifications({ partner_id: partnerFilter || undefined, page, per_page: 20 }),
    placeholderData: prev => prev,
  })

  const sendMut = useMutation({
    mutationFn: sendAdminNotification,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-notifications'] })
      setSent(res.sent)
      setForm({ partner_id: '', type: 'admin_message', title: '', body: '' })
      setShowForm(false)
      setTimeout(() => setSent(null), 4000)
    },
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Обязательное поле'
    if (!form.body.trim()) e.body = 'Обязательное поле'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSend = () => {
    if (!validate()) return
    sendMut.mutate({
      partner_id: form.partner_id || undefined,
      type: form.type,
      title: form.title.trim(),
      body: form.body.trim(),
    })
  }

  const f = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const inp = 'w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500'
  const lbl = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'

  const items: AdminNotification[] = data?.items ?? []
  const totalPages = data?.total_pages ?? 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Уведомления партнёров</h1>
        <Btn size="sm" onClick={() => { setShowForm(v => !v); setSent(null) }}>
          {showForm ? 'Отмена' : '+ Отправить уведомление'}
        </Btn>
      </div>

      {/* Success banner */}
      {sent !== null && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-green-700 dark:text-green-400 text-sm font-medium">
          <span className="text-base">✅</span>
          Отправлено {sent} {sent === 1 ? 'партнёру' : 'партнёрам'}
        </div>
      )}

      {/* Send form */}
      {showForm && (
        <Card title="Новое уведомление">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Получатель</label>
                <input
                  className={`${inp} border-gray-200 dark:border-gray-700`}
                  value={form.partner_id}
                  onChange={e => f('partner_id', e.target.value)}
                  placeholder="ID партнёра (пусто = все активные)"
                />
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Оставьте пустым для рассылки всем активным партнёрам</p>
              </div>
              <div>
                <label className={lbl}>Тип уведомления</label>
                <select
                  className={`${inp} border-gray-200 dark:border-gray-700`}
                  value={form.type}
                  onChange={e => f('type', e.target.value)}
                >
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={lbl}>Заголовок *</label>
              <input
                className={`${inp} ${errors.title ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
                value={form.title}
                onChange={e => f('title', e.target.value)}
                placeholder="Новое уведомление"
                maxLength={200}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>
            <div>
              <label className={lbl}>Текст сообщения *</label>
              <textarea
                rows={3}
                className={`${inp} ${errors.body ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
                value={form.body}
                onChange={e => f('body', e.target.value)}
                placeholder="Текст уведомления для партнёра..."
                maxLength={1000}
              />
              {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body}</p>}
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 text-right">{form.body.length}/1000</p>
            </div>
            <div className="flex gap-2 pt-1">
              <Btn loading={sendMut.isPending} onClick={handleSend}>
                {form.partner_id ? 'Отправить партнёру' : 'Разослать всем'}
              </Btn>
              <Btn variant="outline" onClick={() => setShowForm(false)}>Отмена</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <input
          className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          placeholder="Фильтр по ID партнёра..."
          value={partnerFilter}
          onChange={e => { setPartnerFilter(e.target.value); setPage(1) }}
        />
        {partnerFilter && (
          <Btn size="sm" variant="ghost" onClick={() => { setPartnerFilter(''); setPage(1) }}>Сбросить</Btn>
        )}
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">🔔</p>
            <p className="font-medium text-gray-700 dark:text-gray-300">Уведомлений нет</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Отправьте первое уведомление партнёру или всем сразу</p>
          </div>
        ) : (
          <>
            <Table headers={['Партнёр', 'Тип', 'Заголовок', 'Статус', 'Дата']}>
              {items.map(n => (
                <tr key={n.id}>
                  <TD>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.partner_name || '—'}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{n.partner_email}</p>
                    </div>
                  </TD>
                  <TD>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-mono">
                      {typeLabel(n.type)}
                    </span>
                  </TD>
                  <TD>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{n.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">{n.body}</p>
                  </TD>
                  <TD>
                    <Badge
                      label={n.is_read ? 'Прочитано' : 'Непрочитано'}
                      variant={n.is_read ? 'default' : 'info'}
                      dot={!n.is_read}
                    />
                  </TD>
                  <TD className="text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                    {timeAgo(n.created_at)}
                  </TD>
                </tr>
              ))}
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Btn variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</Btn>
                <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                  {page} / {totalPages}
                </span>
                <Btn variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</Btn>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
