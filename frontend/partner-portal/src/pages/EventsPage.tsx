import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getEvents, getEventFilters, generateLink } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import type { Event, GeneratedLink } from '@/types'

export function EventsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(null)
  const [channel, setChannel] = useState('instagram')
  const [copied, setCopied] = useState(false)

  const { data: filters } = useQuery({
    queryKey: ['event-filters'],
    queryFn: getEventFilters
  })

  const { data, isLoading } = useQuery({
    queryKey: ['events', search, city, category, page],
    queryFn: () => getEvents({ search, city, category, page, per_page: 12 }),
    placeholderData: prev => prev
  })

  const generateMutation = useMutation({
    mutationFn: (eventId: string) =>
      generateLink({ event_id: eventId, channel }),
    onSuccess: (link) => {
      setGeneratedLink(link)
    }
  })

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const channels = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'web', label: 'Веб-сайт' }
  ]

  const cityOptions = [
    { value: '', label: t('events.allCities') },
    ...(filters?.cities?.map(c => ({ value: c, label: c })) ?? [])
  ]

  const catOptions = [
    { value: '', label: t('events.allCategories') },
    ...(filters?.categories?.map(c => ({ value: c, label: c })) ?? [])
  ]

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <h1 className="text-xl font-bold text-gray-900">{t('events.title')}</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder={t('events.search')}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <Select value={city} options={cityOptions}
          onChange={e => { setCity(e.target.value); setPage(1) }} />
        <Select value={category} options={catOptions}
          onChange={e => { setCategory(e.target.value); setPage(1) }} />
      </div>

      {/* Events grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-52 animate-pulse" />
          ))}
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎟️</p>
          <p>{t('events.noEvents')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items?.map(event => (
            <div key={event.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {event.image_url && (
                <img src={event.image_url} alt={event.title}
                  className="w-full h-36 object-cover" loading="lazy" />
              )}
              {!event.image_url && (
                <div className="w-full h-36 bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center text-4xl">
                  🎟️
                </div>
              )}
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{event.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  {event.city && <span>📍 {event.city}</span>}
                  {event.date && <span>📅 {new Date(event.date).toLocaleDateString('ru-RU')}</span>}
                </div>
                {event.min_price > 0 && (
                  <p className="text-xs text-gray-400 mt-1">от {event.min_price.toLocaleString()} ₸</p>
                )}
                {event.special_rate && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                    +{event.special_rate}% комиссия
                  </span>
                )}
                <Button
                  full
                  size="sm"
                  className="mt-2.5"
                  onClick={() => {
                    setSelectedEvent(event)
                    setGeneratedLink(null)
                  }}
                >
                  {t('events.getLink')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages && data.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</Button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {data.total_pages}</span>
          <Button variant="outline" size="sm" disabled={page === data.total_pages} onClick={() => setPage(p => p + 1)}>→</Button>
        </div>
      )}

      {/* Link generation modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{t('links.title')}</h3>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{selectedEvent.title}</p>
              </div>
              <button onClick={() => { setSelectedEvent(null); setGeneratedLink(null) }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {!generatedLink ? (
              <div className="space-y-4">
                <Select
                  label={t('links.channel')}
                  value={channel}
                  options={channels}
                  onChange={e => setChannel(e.target.value)}
                />
                <Button
                  full
                  loading={generateMutation.isPending}
                  onClick={() => generateMutation.mutate(selectedEvent.id)}
                >
                  {t('links.generate')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-green-600">✓ {t('links.generated')}</p>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{t('links.trackingUrl')}</p>
                  <p className="text-sm font-mono text-gray-800 break-all">
                    {generatedLink.tracking_url}
                  </p>
                </div>
                {generatedLink.qr_code_url && (
                  <div className="flex justify-center">
                    <img src={generatedLink.qr_code_url} alt="QR Code" className="w-32 h-32" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    full
                    onClick={() => handleCopy(generatedLink.tracking_url)}
                  >
                    {copied ? t('common.copied') : t('common.copy')}
                  </Button>
                  <Button variant="outline" onClick={() => { setSelectedEvent(null); setGeneratedLink(null) }}>
                    {t('common.close')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
