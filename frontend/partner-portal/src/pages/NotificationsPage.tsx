import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/partner'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonNotification } from '@/components/ui/Skeleton'
import type { Notification } from '@/types'

const typeIconMap: Record<string, { icon: string; color: string }> = {
  partner_approved:  { icon: '✅', color: 'bg-green-50 dark:bg-green-500/10' },
  partner_suspended: { icon: '⚠️', color: 'bg-yellow-50 dark:bg-yellow-500/10' },
  partner_banned:    { icon: '🚫', color: 'bg-red-50 dark:bg-red-500/10' },
  tier_upgraded:     { icon: '⭐', color: 'bg-yellow-50 dark:bg-yellow-500/10' },
  payout_processing: { icon: '🔄', color: 'bg-blue-50 dark:bg-blue-500/10' },
  payout_paid:       { icon: '💳', color: 'bg-green-50 dark:bg-green-500/10' },
  payout_failed:     { icon: '❌', color: 'bg-red-50 dark:bg-red-500/10' },
  document_signed:   { icon: '📄', color: 'bg-brand-50 dark:bg-brand-500/10' },
  document_rejected: { icon: '📋', color: 'bg-orange-50 dark:bg-orange-500/10' },
  welcome:           { icon: '👋', color: 'bg-purple-50 dark:bg-purple-500/10' },
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
  const typeInfo = typeIconMap[n.type] ?? { icon: '🔔', color: 'bg-gray-50 dark:bg-gray-800' }

  return (
    <button
      className={`w-full flex gap-3.5 p-4 rounded-2xl border text-left transition-all duration-150 hover:shadow-card group
        ${n.is_read
          ? 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
          : 'border-brand-100 dark:border-brand-500/20 bg-brand-50/50 dark:bg-brand-500/5 hover:bg-brand-50 dark:hover:bg-brand-500/10'
        }`}
      onClick={() => !n.is_read && onRead(n.id)}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${typeInfo.color}`}>
        {typeInfo.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold leading-snug
            ${n.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
            {n.title}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!n.is_read && (
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-dot" />
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{timeAgo(n.created_at)}</p>
      </div>
    </button>
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
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {unreadCount} непрочитанных
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="text-sm text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors disabled:opacity-50 px-3 py-1.5 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-500/10"
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <SkeletonNotification key={i} />)}
        </div>
      ) : !data?.items?.length ? (
        <EmptyState
          variant="notifications"
          title={t('notifications.empty')}
          description="Здесь будут появляться важные уведомления о вашем аккаунте и выплатах"
        />
      ) : (
        <div className="space-y-2">
          {data.items.map((n, i) => (
            <div
              key={n.id}
              className="animate-slide-up"
              style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
            >
              <NotificationItem n={n} onRead={id => markRead.mutate(id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
