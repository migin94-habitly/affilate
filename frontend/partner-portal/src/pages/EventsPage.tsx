import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getEvents, getEventFilters, generateLink } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonEventCard } from '@/components/ui/Skeleton'
import { IconX, IconCopy, IconCheck, IconMapPin, IconCalendar, IconChevronLeft, IconChevronRight } from '@/components/ui/Icons'
import type { Event, GeneratedLink } from '@/types'

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' }

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-card-lg text-sm font-medium
            pointer-events-auto animate-slide-up max-w-sm
            ${t.type === 'success'
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'bg-red-500 text-white'}`}
        >
          {t.type === 'success'
            ? <IconCheck className="w-4 h-4 text-green-400 dark:text-green-600 flex-shrink-0" />
            : <IconX className="w-4 h-4 flex-shrink-0" />}
          {t.message}
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
          >
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  let counter = 0

  const show = (message: string, type: Toast['type'] = 'success') => {
    const id = ++counter + Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  return { toasts, show, dismiss }
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event, onSelect, index }: { event: Event; onSelect: () => void; index: number }) {
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden hover:shadow-card-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 group animate-slide-up"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      {event.image_url ? (
        <div className="relative overflow-hidden h-36">
          <img
            src={event.image_url} alt={event.title} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {event.special_rate && (
            <span className="absolute top-2 right-2 px-2 py-0.5 bg-green-500 text-white rounded-lg text-xs font-bold shadow-sm">
              +{event.special_rate}%
            </span>
          )}
        </div>
      ) : (
        <div className="relative h-36 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-500/10 dark:to-brand-500/5 flex items-center justify-center">
          <span className="text-5xl">🎟️</span>
          {event.special_rate && (
            <span className="absolute top-2 right-2 px-2 py-0.5 bg-green-500 text-white rounded-lg text-xs font-bold">
              +{event.special_rate}%
            </span>
          )}
        </div>
      )}
      <div className="p-3.5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 leading-snug">
          {event.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
          {event.city && (
            <span className="flex items-center gap-1"><IconMapPin className="w-3 h-3" /> {event.city}</span>
          )}
          {event.date && (
            <span className="flex items-center gap-1">
              <IconCalendar className="w-3 h-3" />
              {new Date(event.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        {event.min_price > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">от {event.min_price.toLocaleString()} ₸</p>
        )}
        <Button full size="sm" className="mt-3" onClick={onSelect}>Получить ссылку</Button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function EventsPage() {
  const { t } = useTranslation()
  const { toasts, show: showToast, dismiss } = useToast()

  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [activeCategory, setActiveCategory] = useState('') // '' = all
  const [page, setPage] = useState(1)

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(null)
  const [channel, setChannel] = useState('instagram')

  const { data: filters } = useQuery({
    queryKey: ['event-filters'],
    queryFn: getEventFilters,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['events', search, city, activeCategory, page],
    queryFn: () => getEvents({ search, city, category: activeCategory, page, per_page: 12 }),
    placeholderData: prev => prev,
  })

  const generateMutation = useMutation({
    mutationFn: (eventId: string) => generateLink({ event_id: eventId, channel }),
    onSuccess: link => setGeneratedLink(link),
  })

  // Unique tracking URL copy with toast
  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      showToast('Ссылка скопирована в буфер обмена', 'success')
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      showToast('Ссылка скопирована', 'success')
    }
  }

  const closeModal = () => { setSelectedEvent(null); setGeneratedLink(null) }

  const categories = filters?.categories ?? []
  const cityOptions = [
    { value: '', label: t('events.allCities') },
    ...(filters?.cities?.map(c => ({ value: c, label: c })) ?? [])
  ]
  const channelOptions = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok',    label: 'TikTok'    },
    { value: 'youtube',   label: 'YouTube'   },
    { value: 'telegram',  label: 'Telegram'  },
    { value: 'web',       label: 'Веб-сайт'  },
  ]

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [search, city, activeCategory])

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('events.title')}</h1>

      {/* Search + city filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          placeholder={t('events.search')}
          value={search}
          prefix={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
          onChange={e => setSearch(e.target.value)}
        />
        <Select value={city} options={cityOptions} onChange={e => setCity(e.target.value)} />
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all
              ${activeCategory === ''
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            {t('events.allCategories')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? '' : cat)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all
                ${activeCategory === cat
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Reset filters */}
      {(search || city || activeCategory) && (
        <button
          onClick={() => { setSearch(''); setCity(''); setActiveCategory('') }}
          className="text-xs text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
        >
          × Сбросить фильтры
        </button>
      )}

      {/* Events grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonEventCard key={i} />)}
        </div>
      ) : !data?.items?.length ? (
        <EmptyState
          variant="search"
          title={t('events.noEvents')}
          description="Попробуйте изменить фильтры или поисковый запрос"
          action={(search || city || activeCategory) ? {
            label: 'Сбросить фильтры',
            onClick: () => { setSearch(''); setCity(''); setActiveCategory('') }
          } : undefined}
        />
      ) : (
        <>
          {/* Section header when category is active */}
          {activeCategory && (
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{activeCategory}</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">{data.total} событий</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                index={i}
                onSelect={() => { setSelectedEvent(event); setGeneratedLink(null) }}
              />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {data && (data.total_pages ?? 0) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
            icon={<IconChevronLeft className="w-4 h-4" />} />
          <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 tabular-nums">
            {page} / {data.total_pages}
          </span>
          <Button variant="outline" size="sm" disabled={page === data.total_pages} onClick={() => setPage(p => p + 1)}
            icon={<IconChevronRight className="w-4 h-4" />} />
        </div>
      )}

      {/* Link generation modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-card-lg border border-gray-100 dark:border-gray-800 p-5 animate-slide-up">
            <div className="flex items-start justify-between mb-5">
              <div className="min-w-0 pr-3">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('links.title')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{selectedEvent.title}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {!generatedLink ? (
              <div className="space-y-4">
                <Select label={t('links.channel')} value={channel} options={channelOptions} onChange={e => setChannel(e.target.value)} />
                <Button full size="lg" loading={generateMutation.isPending} onClick={() => generateMutation.mutate(selectedEvent.id)}>
                  {t('links.generate')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <IconCheck className="w-3 h-3" />
                  </div>
                  <span className="text-sm font-medium">{t('links.generated')}</span>
                </div>

                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('links.trackingUrl')}</p>
                  <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all leading-relaxed">
                    {generatedLink.tracking_url}
                  </p>
                </div>

                {generatedLink.qr_code_url && (
                  <div className="flex justify-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <img src={generatedLink.qr_code_url} alt="QR Code" className="w-32 h-32" />
                  </div>
                )}

                <div className="flex gap-2.5">
                  <Button
                    full
                    onClick={() => handleCopy(generatedLink.tracking_url)}
                    icon={<IconCopy className="w-4 h-4" />}
                  >
                    {t('common.copy')}
                  </Button>
                  <Button variant="outline" onClick={closeModal}>{t('common.close')}</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
