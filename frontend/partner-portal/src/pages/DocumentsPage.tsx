import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDocuments, initiateDocuments, uploadSignedDoc } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      setSelectedStatus(null)
    },
    onError: (err: any) => setError(err.response?.data?.error || t('common.error'))
  })

  const uploadMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) => uploadSignedDoc(id, url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      setUploadDocId(null)
      setFileUrl('')
    },
    onError: (err: any) => setError(err.response?.data?.error || t('common.error'))
  })

  const legalStatuses: { value: LegalStatus; label: string; desc: string }[] = [
    { value: 'legal_entity', label: t('documents.legalStatuses.legal_entity'), desc: 'ТОО, АО, ООО' },
    { value: 'sole_proprietor', label: t('documents.legalStatuses.sole_proprietor'), desc: 'ИП' },
    { value: 'individual', label: t('documents.legalStatuses.individual'), desc: 'Без юридического лица' }
  ]

  const hasActiveDocs = docs && docs.length > 0

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <h1 className="text-xl font-bold text-gray-900">{t('documents.title')}</h1>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {/* Initiate documents section */}
      {!hasActiveDocs && !selectedStatus && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">{t('documents.initiateTitle')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('documents.chooseStatus')}</p>
          <div className="space-y-2">
            {legalStatuses.map(ls => (
              <button
                key={ls.value}
                onClick={() => setSelectedStatus(ls.value)}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-brand-500 text-left transition-all group"
              >
                <p className="font-medium text-gray-900 group-hover:text-brand-600">{ls.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{ls.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedStatus && (
        <div className="bg-white rounded-xl border border-brand-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">
            Подтвердите статус: {t(`documents.legalStatuses.${selectedStatus}`)}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Будет создан пакет документов для вашего статуса. Вы получите их для скачивания, подписания и загрузки обратно.
          </p>
          <div className="flex gap-2">
            <Button loading={initiateMutation.isPending} onClick={() => initiateMutation.mutate(selectedStatus)}>
              Создать пакет документов
            </Button>
            <Button variant="outline" onClick={() => setSelectedStatus(null)}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}

      {/* Documents list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : docs && docs.length > 0 ? (
        <div className="space-y-3">
          {docs.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 text-sm">
                      {t(`documents.docTypes.${doc.doc_type}` as any)}
                    </p>
                    <Badge label={`v${doc.version}`} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {t(`documents.legalStatuses.${doc.legal_status}` as any)}
                  </p>
                </div>
                <Badge
                  label={t(`documents.status.${doc.status}` as any)}
                  variant={docStatusVariant(doc.status)}
                />
              </div>

              {doc.rejection_reason && (
                <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                  Причина отказа: {doc.rejection_reason}
                </div>
              )}

              <div className="mt-3 flex gap-2 flex-wrap">
                {/* Upload signed copy */}
                {doc.status === 'awaiting_partner_signature' && (
                  <Button size="sm" onClick={() => { setUploadDocId(doc.id); setFileUrl('') }}>
                    {t('documents.upload')}
                  </Button>
                )}

                {/* Download final */}
                {doc.status === 'signed' && doc.final_signed_url && (
                  <a href={doc.final_signed_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">{t('documents.downloadFinal')}</Button>
                  </a>
                )}
              </div>

              {/* Upload form */}
              {uploadDocId === doc.id && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-xs text-gray-500">
                    Загрузите ссылку на подписанный документ (Google Drive, Dropbox или другое облачное хранилище)
                  </p>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="https://drive.google.com/..."
                    value={fileUrl}
                    onChange={e => setFileUrl(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={uploadMutation.isPending}
                      disabled={!fileUrl}
                      onClick={() => uploadMutation.mutate({ id: doc.id, url: fileUrl })}
                    >
                      Загрузить
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setUploadDocId(null)}>
                      Отмена
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
