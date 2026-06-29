import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRequests, createRequest } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import type { PartnerRequest } from '@/types'

const statusVariant = (s: string): 'info' | 'warning' | 'success' | 'danger' => {
  if (s === 'in_progress') return 'info'
  if (s === 'resolved') return 'success'
  if (s === 'closed') return 'danger'
  return 'warning'
}

const requestTypes = ['general', 'api_access', 'payment_issue', 'document', 'technical', 'other']

function RequestCard({ req, index }: { req: PartnerRequest; index: number }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden animate-slide-up"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <button
        className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg font-medium">
                {t(`requests.types.${req.type}`)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(req.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">{req.subject}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge label={t(`requests.status.${req.status}`)} variant={statusVariant(req.status)} dot />
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3 animate-fade-in">
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{req.body}</p>
          {req.notes && req.notes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('requests.adminNotes')}</p>
              {req.notes.map(note => (
                <div key={note.id} className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">{note.admin_name || 'Admin'}</p>
                    <p className="text-xs text-blue-400 dark:text-blue-500">
                      {new Date(note.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{note.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function RequestsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'general', subject: '', body: '' })
  const [formError, setFormError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: () => getRequests()
  })

  const createMutation = useMutation({
    mutationFn: (data: { type: string; subject: string; body: string }) => createRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] })
      setShowForm(false)
      setForm({ type: 'general', subject: '', body: '' })
      setFormError('')
    },
    onError: (err: any) => setFormError(err.response?.data?.error || t('common.error'))
  })

  const handleSubmit = () => {
    if (!form.subject.trim() || !form.body.trim()) {
      setFormError(t('requests.formRequired'))
      return
    }
    setFormError('')
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('requests.title')}</h1>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            {t('requests.new')}
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">{t('requests.subtitle')}</p>

      {/* New request form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-brand-100 dark:border-brand-500/20 shadow-card p-5 space-y-4 animate-slide-up">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('requests.newTitle')}</h3>

          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
              {formError}
            </div>
          )}

          {/* Type selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('requests.type')}</p>
            <div className="flex flex-wrap gap-2">
              {requestTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setForm(f => ({ ...f, type }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                    ${form.type === type
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  {t(`requests.types.${type}`)}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={t('requests.subject')}
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder={t('requests.subjectPlaceholder')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('requests.body')}
            </label>
            <textarea
              className="w-full min-h-[120px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 dark:focus:border-brand-500 transition-all resize-none"
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder={t('requests.bodyPlaceholder')}
            />
          </div>

          <div className="flex gap-2.5">
            <Button full loading={createMutation.isPending} onClick={handleSubmit}>
              {t('common.submit')}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setFormError('') }}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Requests list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !data?.items?.length ? (
        <EmptyState
          variant="notifications"
          title={t('requests.empty')}
          description={t('requests.emptyDesc')}
          action={{ label: t('requests.new'), onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-2">
          {data.items.map((req, i) => (
            <RequestCard key={req.id} req={req} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
