import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { updateProfile } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

export function ProfilePage() {
  const { t } = useTranslation()
  const { partner, updatePartner } = useAuthStore()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    full_name: partner?.full_name ?? '',
    phone: partner?.phone ?? '',
    language: partner?.language ?? 'ru'
  })
  const [saved, setSaved] = useState(false)

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
      setTimeout(() => setSaved(false), 2000)
    }
  })

  const tierInfo = {
    bronze: { label: 'Bronze', desc: 'Базовая ставка: 15% от сервисного сбора', next: 'До Silver: 10 заказов в месяц' },
    silver: { label: 'Silver', desc: 'Ставка: 20% от сервисного сбора', next: 'Работайте с командой для перехода на Gold' },
    gold: { label: 'Gold', desc: 'Кастомные условия: 25-30%', next: 'Максимальный уровень' }
  }

  const tier = partner?.tier ?? 'bronze'

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <h1 className="text-xl font-bold text-gray-900">{t('nav.profile')}</h1>

      {/* Tier card */}
      <div className={`rounded-xl p-4 text-white ${
        tier === 'gold' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
        tier === 'silver' ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
        'bg-gradient-to-br from-orange-400 to-orange-600'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-75">Текущий уровень</p>
            <p className="text-2xl font-bold capitalize mt-0.5">{tier}</p>
            <p className="text-sm opacity-80 mt-1">{tierInfo[tier]?.desc}</p>
          </div>
          <div className="text-4xl">
            {tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : '🥉'}
          </div>
        </div>
        {tierInfo[tier]?.next && (
          <div className="mt-3 p-2 bg-white/20 rounded-lg text-xs">{tierInfo[tier].next}</div>
        )}
      </div>

      {/* Partner info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg">
            {partner?.full_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{partner?.full_name}</p>
            <p className="text-sm text-gray-500">{partner?.email}</p>
          </div>
          <Badge
            label={partner?.status ?? ''}
            variant={partner?.status === 'active' ? 'success' : partner?.status === 'pending' ? 'warning' : 'danger'}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400 text-xs">Сегмент</p>
            <p className="font-medium capitalize">{partner?.segment}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Страна</p>
            <p className="font-medium">{partner?.country}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Дата регистрации</p>
            <p className="font-medium">
              {partner?.created_at ? new Date(partner.created_at).toLocaleDateString('ru-RU') : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
        <h2 className="font-medium text-gray-900">Редактировать профиль</h2>
        {saved && <p className="text-sm text-green-600">{t('common.success')} ✓</p>}
        <Input
          label={t('auth.fullName')}
          value={form.full_name}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
        />
        <Input
          label={t('auth.phone')}
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
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
