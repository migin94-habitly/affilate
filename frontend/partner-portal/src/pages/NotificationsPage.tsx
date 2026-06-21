import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/partner'
import type { Notification } from '@/types'

const typeIcons: Record<string, string> = {
  partner_approved: '✅',
  partner_suspended: '⚠️',
  partner_banned: '🚫',
  tier_upgraded: '⬆️',
  payout_processing: '🔄',
  payout_paid: '💳',
  payout_failed: '❌',
  document_signed: '📄',
  document_rejected: '📋',
  welcome: '👋',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'только что'
  if (m < 60) return `${m} мин. назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч. назад`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} дн. назад`
  return new Date(dateStr).toLocaleDateString('ru-RU')
}

function NotificationItem({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const icon = typeIcons[n.type] || '🔔'
  return (
    <div
      className={`flex gap-3 p-4 rounded-xl border transition-colors cursor-pointer
        ${n.is_read ? 'border-gray-100 bg-white' : 'border-brand-100 bg-brand-50'}`}
      onClick={() => !n.is_read && onRead(n.id)}
    >
      <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
            {n.title}
          </p>
          {!n.is_read && (
            <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(1)
  })

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notif-count'] })
    }
  })

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notif-count'] })
    }
  })

  const unreadCount = data?.items.filter(n => !n.is_read).length ?? 0

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('notifications.title')}</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate()}
            className="text-sm text-brand-500 hover:text-brand-600 font-medium"
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">🔔</span>
          <p className="mt-3 text-gray-500">{t('notifications.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.items.map(n => (
            <NotificationItem
              key={n.id}
              n={n}
              onRead={id => markRead.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
