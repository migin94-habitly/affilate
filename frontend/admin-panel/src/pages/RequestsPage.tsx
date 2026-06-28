import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRequests, getRequest, updateRequestStatus, addRequestNote } from '@/api/admin'

type RequestStatus = 'new' | 'in_progress' | 'resolved' | 'closed'

interface RequestNote {
  id: string
  admin_id: string
  admin_name: string
  body: string
  created_at: string
}

interface PartnerRequest {
  id: string
  partner_id: string
  partner_name: string
  type: string
  subject: string
  body: string
  status: RequestStatus
  notes: RequestNote[]
  created_at: string
  updated_at: string
}

const COLUMNS: { status: RequestStatus; label: string; color: string; bg: string; border: string }[] = [
  { status: 'new',         label: 'Новые',      color: 'text-blue-700 dark:text-blue-300',   bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-800' },
  { status: 'in_progress', label: 'В работе',   color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  { status: 'resolved',    label: 'Решённые',   color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
  { status: 'closed',      label: 'Закрытые',   color: 'text-gray-600 dark:text-gray-400',   bg: 'bg-gray-50 dark:bg-gray-800/30',   border: 'border-gray-200 dark:border-gray-700' },
]

const TYPE_LABELS: Record<string, string> = {
  general: 'Общее',
  api_access: 'API доступ',
  payment_issue: 'Платёж',
  document: 'Документы',
  technical: 'Техническое',
  other: 'Другое',
}

const NEXT_STATUS: Record<RequestStatus, RequestStatus | null> = {
  new: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
  closed: null,
}

const PREV_STATUS: Record<RequestStatus, RequestStatus | null> = {
  new: null,
  in_progress: 'new',
  resolved: 'in_progress',
  closed: 'resolved',
}

function formatDate(s: string) {
  return new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function RequestDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [noteBody, setNoteBody] = useState('')

  const { data: req, isLoading } = useQuery<PartnerRequest>({
    queryKey: ['admin-request', id],
    queryFn: () => getRequest(id),
  })

  const statusMut = useMutation({
    mutationFn: (status: string) => updateRequestStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-requests'] })
      qc.invalidateQueries({ queryKey: ['admin-request', id] })
    },
  })

  const noteMut = useMutation({
    mutationFn: (body: string) => addRequestNote(id, body),
    onSuccess: () => {
      setNoteBody('')
      qc.invalidateQueries({ queryKey: ['admin-request', id] })
      qc.invalidateQueries({ queryKey: ['admin-requests'] })
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1 min-w-0 pr-4">
            {isLoading ? (
              <div className="h-5 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {TYPE_LABELS[req?.type ?? ''] ?? req?.type}
                  </span>
                  <StatusBadge status={req?.status ?? 'new'} />
                </div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">{req?.subject}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {req?.partner_name || req?.partner_id?.slice(0, 8)} · {req?.created_at ? formatDate(req.created_at) : ''}
                </p>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Body */}
          {req && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {req.body}
            </div>
          )}

          {/* Status actions */}
          {req && (
            <div className="flex flex-wrap gap-2">
              {PREV_STATUS[req.status] && (
                <button
                  onClick={() => statusMut.mutate(PREV_STATUS[req.status]!)}
                  disabled={statusMut.isPending}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
                  {COLUMNS.find(c => c.status === PREV_STATUS[req.status])?.label}
                </button>
              )}
              {NEXT_STATUS[req.status] && (
                <button
                  onClick={() => statusMut.mutate(NEXT_STATUS[req.status]!)}
                  disabled={statusMut.isPending}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50 font-medium"
                >
                  Переместить: {COLUMNS.find(c => c.status === NEXT_STATUS[req.status])?.label}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              )}
              {req.status !== 'closed' && (
                <button
                  onClick={() => statusMut.mutate('closed')}
                  disabled={statusMut.isPending}
                  className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  Закрыть
                </button>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Комментарии</h3>
            {req?.notes?.length ? (
              req.notes.map(n => (
                <div key={n.id} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{n.admin_name || 'Admin'}</span>
                    <span className="text-[11px] text-gray-400">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{n.body}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">Комментариев нет</p>
            )}
          </div>
        </div>

        {/* Add note */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2">
            <textarea
              value={noteBody}
              onChange={e => setNoteBody(e.target.value)}
              placeholder="Добавить комментарий..."
              rows={2}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 transition-shadow"
            />
            <button
              onClick={() => noteBody.trim() && noteMut.mutate(noteBody.trim())}
              disabled={!noteBody.trim() || noteMut.isPending}
              className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-40 transition-colors self-end"
            >
              {noteMut.isPending ? '...' : 'Отправить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, { label: string; cls: string }> = {
    new:         { label: 'Новый',    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    in_progress: { label: 'В работе', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    resolved:    { label: 'Решено',   cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    closed:      { label: 'Закрыт',   cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  }
  const { label, cls } = map[status] ?? map.new
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
}

function KanbanCard({ req, onClick }: { req: PartnerRequest; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3.5 cursor-pointer hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          {TYPE_LABELS[req.type] ?? req.type}
        </span>
        {req.notes?.length > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            {req.notes.length}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug mb-2 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {req.subject}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400 truncate">{req.partner_name || req.partner_id?.slice(0, 8)}</span>
        <span className="text-[11px] text-gray-400 flex-shrink-0">{formatDate(req.created_at)}</span>
      </div>
    </div>
  )
}

export function RequestsPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ items: PartnerRequest[]; total: number }>({
    queryKey: ['admin-requests'],
    queryFn: () => getRequests({ per_page: 200 }),
    refetchInterval: 30_000,
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateRequestStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-requests'] }),
  })

  const items = data?.items ?? []

  const byStatus = (status: RequestStatus) => items.filter(r => r.status === status)

  return (
    <div className="space-y-5 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Запросы партнёров</h1>
          <p className="text-sm text-gray-500 mt-0.5">Всего: {data?.total ?? 0}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col.status} className={`rounded-2xl border ${col.border} ${col.bg} p-4`}>
              <div className={`text-xs font-bold uppercase tracking-wider ${col.color} mb-3`}>{col.label}</div>
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 animate-pulse h-20" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const cards = byStatus(col.status)
            return (
              <div key={col.status} className={`rounded-2xl border ${col.border} ${col.bg} p-4 flex flex-col`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>{col.label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
                    {cards.length}
                  </span>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
                  {cards.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-400">Нет запросов</div>
                  )}
                  {cards.map(req => (
                    <div key={req.id}>
                      <KanbanCard req={req} onClick={() => setSelectedId(req.id)} />
                      {/* Quick move buttons */}
                      <div className="flex gap-1 mt-1 px-0.5">
                        {PREV_STATUS[col.status] && (
                          <button
                            onClick={() => statusMut.mutate({ id: req.id, status: PREV_STATUS[col.status]! })}
                            disabled={statusMut.isPending}
                            className="flex-1 text-[10px] py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
                          >
                            ← {COLUMNS.find(c => c.status === PREV_STATUS[col.status])?.label}
                          </button>
                        )}
                        {NEXT_STATUS[col.status] && (
                          <button
                            onClick={() => statusMut.mutate({ id: req.id, status: NEXT_STATUS[col.status]! })}
                            disabled={statusMut.isPending}
                            className="flex-1 text-[10px] py-1 rounded-lg border border-brand-200 dark:border-brand-700 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 font-medium transition-colors disabled:opacity-40"
                          >
                            {COLUMNS.find(c => c.status === NEXT_STATUS[col.status])?.label} →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedId && (
        <RequestDetailModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
