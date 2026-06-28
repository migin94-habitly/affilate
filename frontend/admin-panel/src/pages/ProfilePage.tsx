import { useQuery } from '@tanstack/react-query'
import { useAdminAuth } from '@/store/auth'
import { getAdminMe } from '@/api/admin'
import { Card, Stat } from '@/components/ui'

const roleLabel = (role: string) => {
  switch (role) {
    case 'super_admin': return 'Суперадминистратор'
    case 'moderator':   return 'Модератор'
    case 'support':     return 'Поддержка'
    default:            return role
  }
}

const roleBadge = (role: string) => {
  if (role === 'super_admin') return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
  if (role === 'moderator')   return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
  return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
}

const permissions: Record<string, string[]> = {
  super_admin: [
    'Управление партнёрами (статус, тир)',
    'Управление выплатами',
    'Управление событиями и спец. ставками',
    'Управление комиссиями',
    'Просмотр антифрода',
    'Отправка уведомлений',
    'Управление документами',
    'Управление FAQ и контактами',
    'Просмотр входящих запросов',
  ],
  moderator: [
    'Управление партнёрами (статус, тир)',
    'Управление событиями и спец. ставками',
    'Управление комиссиями',
    'Управление выплатами',
    'Просмотр антифрода',
    'Отправка уведомлений',
    'Управление документами',
    'Просмотр входящих запросов',
  ],
  support: [
    'Просмотр партнёров',
    'Просмотр документов',
    'Отправка уведомлений',
    'Просмотр входящих запросов',
  ],
}

export function ProfilePage() {
  const { admin } = useAdminAuth()
  const { data: me } = useQuery({
    queryKey: ['admin-me'],
    queryFn: getAdminMe,
    staleTime: 5 * 60_000,
  })

  const profile = me ?? admin
  const role = profile?.role ?? ''
  const perms = permissions[role] ?? []

  const initial = (profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Профиль администратора</h1>

      {/* Identity card */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-sm">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
              {profile?.full_name || '—'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{profile?.email}</p>
            <span className={`inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge(role)}`}>
              {roleLabel(role)}
            </span>
          </div>
        </div>
      </Card>

      {/* Role details */}
      <Card title="Права доступа">
        {perms.length > 0 ? (
          <ul className="space-y-2">
            {perms.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
                {p}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">Права не определены для роли «{role}»</p>
        )}
      </Card>

      {/* Account info */}
      <Card title="Информация об аккаунте">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{profile?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">Полное имя</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{profile?.full_name || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">Роль</span>
            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${roleBadge(role)}`}>{roleLabel(role)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">ID аккаунта</span>
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{profile?.id?.slice(0, 18)}…</span>
          </div>
        </div>
      </Card>

      <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl text-sm text-blue-700 dark:text-blue-300">
        Для изменения пароля или данных аккаунта обратитесь к суперадминистратору.
      </div>
    </div>
  )
}
