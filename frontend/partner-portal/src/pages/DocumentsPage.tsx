import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDocuments, initiateDocuments, uploadSignedDoc } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { IconCheck } from '@/components/ui/Icons'
import type { LegalStatus } from '@/types'

const docStatusVariant = (s: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  if (s === 'signed') return 'success'
  if (s === 'rejected') return 'danger'
  if (s === 'under_ticketon_review' || s === 'awaiting_ticketon_signature') return 'info'
  if (s === 'awaiting_partner_signature') return 'warning'
  return 'default'
}

export function DocumentsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<LegalStatus | null>(null)
  const [uploadDocId, setUploadDocId] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [error, setError] = useState('')

  const { data: docs, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments
  })

  const initiateMutation = useMutation({
    mutationFn: (ls: LegalStatus) => initiateDocuments(ls),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); setSelectedStatus(null) },
    onError: (err: any) => setError(err.response?.data?.error || t('common.error'))
  })

  const uploadMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) => uploadSignedDoc(id, url),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); setUploadDocId(null); setFileUrl('') },
    onError: (err: any) => setError(err.response?.data?.error || t('common.error'))
  })

  const legalStatuses: { value: LegalStatus; label: string; desc: string; icon: string }[] = [
    { value: 'legal_entity',    label: t('documents.legalStatuses.legal_entity'),    desc: 'ТОО, АО, ООО', icon: '🏢' },
    { value: 'sole_proprietor', label: t('documents.legalStatuses.sole_proprietor'), desc: 'ИП',           icon: '👤' },
    { value: 'individual',      label: t('documents.legalStatuses.individual'),      desc: 'Без юридического лица', icon: '🙋' },
  ]

  const hasActiveDocs = docs && docs.length > 0

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('documents.title')}</h1>

      {error && (
        <div className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400 animate-slide-up">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      {/* Choose legal status */}
      {!hasActiveDocs && !selectedStatus && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t('documents.initiateTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('documents.chooseStatus')}</p>
          <div className="space-y-2.5">
            {legalStatuses.map(ls => (
              <button
                key={ls.value}
                onClick={() => setSelectedStatus(ls.value)}
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 hover:border-brand-400 dark:hover:border-brand-500/50 text-left transition-all duration-150 group active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ls.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{ls.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{ls.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm legal status */}
      {selectedStatus && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-brand-200 dark:border-brand-500/30 shadow-card p-5 animate-scale-in">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {t('documents.confirmStatus')}: <span className="text-brand-500">{t(`documents.legalStatuses.${selectedStatus}`)}</span>
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('documents.confirmDesc')}</p>
          <div className="flex gap-2.5">
            <Button loading={initiateMutation.isPending} onClick={() => initiateMutation.mutate(selectedStatus)}>
              {t('documents.createPackage')}
            </Button>
            <Button variant="outline" onClick={() => setSelectedStatus(null)}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}

      {/* Documents list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : hasActiveDocs ? (
        <div className="space-y-3">
          {docs.map((doc, i) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-4 animate-slide-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {t(`documents.docTypes.${doc.doc_type}` as any)}
                    </p>
                    <Badge label={`v${doc.version}`} />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {t(`documents.legalStatuses.${doc.legal_status}` as any)}
                  </p>
                </div>
                <Badge label={t(`documents.status.${doc.status}` as any)} variant={docStatusVariant(doc.status)} dot />
              </div>

              {doc.rejection_reason && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
                  <span className="font-medium">{t('documents.rejectionReason')}</span> {doc.rejection_reason}
                </div>
              )}

              <div className="mt-3 flex gap-2 flex-wrap">
                {doc.status === 'awaiting_partner_signature' && (
                  <Button size="sm" onClick={() => { setUploadDocId(doc.id); setFileUrl('') }}>
                    {t('documents.upload')}
                  </Button>
                )}
                {doc.status === 'signed' && doc.final_signed_url && (
                  <a href={doc.final_signed_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      {t('documents.downloadFinal')}
                    </Button>
                  </a>
                )}
              </div>

              {/* Upload form */}
              {uploadDocId === doc.id && (
                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl space-y-3 animate-slide-up">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('documents.uploadHint')}</p>
                  <input
                    type="url"
                    className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                    placeholder="https://drive.google.com/..."
                    value={fileUrl}
                    onChange={e => setFileUrl(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={uploadMutation.isPending}
                      disabled={!fileUrl}
                      icon={<IconCheck className="w-3.5 h-3.5" />}
                      onClick={() => uploadMutation.mutate({ id: doc.id, url: fileUrl })}
                    >
                      {t('documents.uploadBtn')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setUploadDocId(null)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
