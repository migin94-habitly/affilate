import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { getProfile, updateProfile } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { IconCheck } from '@/components/ui/Icons'

const tierGradients: Record<string, string> = {
  bronze: 'from-orange-400 to-amber-500',
  silver: 'from-slate-400 to-slate-500',
  gold:   'from-yellow-400 to-amber-400',
}

const tierInfo: Record<string, { desc: string; next: string; emoji: string; rate: string }> = {
  bronze: { desc: 'Базовая ставка от сервисного сбора', next: 'До Silver: 10 заказов в месяц', emoji: '🥉', rate: '15%' },
  silver: { desc: 'Ставка от сервисного сбора', next: 'Работайте с командой для перехода на Gold', emoji: '🥈', rate: '20%' },
  gold:   { desc: 'Кастомные условия', next: 'Максимальный уровень', emoji: '🥇', rate: '25–30%' },
}

export function ProfilePage() {
  const { t } = useTranslation()
  const { partner, updatePartner } = useAuthStore()

  const [form, setForm] = useState({
    full_name: partner?.full_name ?? '',
    phone: partner?.phone ?? '',
    language: partner?.language ?? 'ru'
  })
  const [saved, setSaved] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile
  })

  const langOptions = [
    { value: 'ru', label: 'Русский' },
    { value: 'en', label: 'English' },
    { value: 'kz', label: 'Қазақша' },
    { value: 'uz', label: "O'zbek" },
    { value: 'kg', label: 'Кыргызча' },
    { value: 'tj', label: 'Тоҷикӣ' },
    { value: 'tr', label: 'Türkçe' }
  ]

  const mutation = useMutation({
    mutationFn: () => updateProfile(form),
    onSuccess: (data) => {
      updatePartner(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  })

  const tier = (partner?.tier ?? 'bronze') as keyof typeof tierInfo
  const info = tierInfo[tier]
  const gradient = tierGradients[tier]

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('nav.profile')}</h1>

      {/* Tier card */}
      <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-card-md relative overflow-hidden`}>
        <div className="absolute right-4 top-4 text-6xl opacity-20 select-none pointer-events-none">
          {info.emoji}
        </div>
        <div className="flex items-start justify-between relative">
          <div>
            <p className="text-xs font-medium opacity-75 uppercase tracking-wide">Текущий уровень</p>
            <p className="text-3xl font-bold capitalize mt-0.5">{tier}</p>
            <p className="text-sm opacity-80 mt-1">{info.desc}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-bold">
                {info.rate} ставка
              </span>
            </div>
          </div>
        </div>
        {info.next && (
          <div className="mt-4 p-2.5 bg-white/15 rounded-xl text-xs text-white/80">
            📈 {info.next}
          </div>
        )}
      </div>

      {/* Partner info card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm`}>
            {partner?.full_name?.charAt(0)?.toUpperCase() ?? 'P'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{partner?.full_name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{partner?.email}</p>
            <div className="mt-1">
              <Badge
                label={partner?.status === 'active' ? 'Активен' : partner?.status === 'pending' ? 'На проверке' : 'Заблокирован'}
                variant={partner?.status === 'active' ? 'success' : partner?.status === 'pending' ? 'warning' : 'danger'}
                dot
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          {[
            { label: 'Сегмент',          value: partner?.segment   },
            { label: 'Страна',           value: partner?.country   },
            { label: 'Дата регистрации', value: partner?.created_at ? new Date(partner.created_at).toLocaleDateString('ru-RU') : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5 capitalize">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KYC status */}
      {profile?.kyc?.status === 'verified' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
              <IconCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">KYC верифицирован</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Платёжные данные подтверждены</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Редактировать профиль</h2>

        {saved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-xl text-sm text-green-700 dark:text-green-400 animate-bounce-soft">
            <IconCheck className="w-4 h-4" />
            {t('common.success')}
          </div>
        )}

        <Input
          label={t('auth.fullName')}
          value={form.full_name}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
        />
        <Input
          label={t('auth.phone')}
          type="tel"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="+7 777 000 0000"
        />
        <Select
          label="Язык интерфейса"
          value={form.language}
          options={langOptions}
          onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
        />
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
