import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { getProfile, updateProfile, submitKYC, acceptOffer } from '@/api/partner'
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
  const qc = useQueryClient()
  const { hash } = useLocation()

  const [form, setForm] = useState({
    full_name: partner?.full_name ?? '',
    phone: partner?.phone ?? '',
    language: partner?.language ?? 'ru'
  })
  const [saved, setSaved] = useState(false)
  const [kycForm, setKycForm] = useState({
    iin: '',
    bank_name: '',
    bank_account: '',
    bank_bic: '',
    account_holder: '',
    freedom_pay_account: ''
  })
  const [kycError, setKycError] = useState('')
  const [offerError, setOfferError] = useState('')

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile
  })

  useEffect(() => {
    if (!hash) return
    const el = document.querySelector(hash)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash, profile])

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

  const kycMutation = useMutation({
    mutationFn: () => submitKYC({
      iin: kycForm.iin || undefined,
      bank_name: kycForm.bank_name || undefined,
      bank_account: kycForm.bank_account || undefined,
      bank_bic: kycForm.bank_bic || undefined,
      account_holder: kycForm.account_holder || undefined,
      freedom_pay_account: kycForm.freedom_pay_account || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      setKycError('')
    },
    onError: (err: any) => setKycError(err.response?.data?.error || t('common.error'))
  })

  const offerMutation = useMutation({
    mutationFn: () => acceptOffer(partner?.language ?? 'ru'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      setOfferError('')
    },
    onError: (err: any) => setOfferError(err.response?.data?.error || t('common.error'))
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

      {/* KYC / Bank details section */}
      <div id="kyc" className="scroll-mt-4">
        {profile?.kyc?.status === 'verified' ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                <IconCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('kyc.verified')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('kyc.verifiedDesc')}</p>
              </div>
            </div>
            {profile.kyc.bank_name && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm">
                {profile.kyc.bank_name && (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('kyc.bankName')}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{profile.kyc.bank_name}</p>
                  </div>
                )}
                {profile.kyc.bank_account && (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('kyc.bankAccount')}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5 font-mono">{profile.kyc.bank_account}</p>
                  </div>
                )}
                {profile.kyc.account_holder && (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('kyc.accountHolder')}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{profile.kyc.account_holder}</p>
                  </div>
                )}
                {profile.kyc.bank_bic && (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('kyc.bankBic')}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5 font-mono">{profile.kyc.bank_bic}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-brand-100 dark:border-brand-500/20 shadow-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('kyc.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('kyc.subtitle')}</p>
            </div>
            {kycError && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                {kycError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('kyc.accountHolder')}
                value={kycForm.account_holder}
                onChange={e => setKycForm(f => ({ ...f, account_holder: e.target.value }))}
                placeholder={t('kyc.accountHolderPlaceholder')}
              />
              <Input
                label={t('kyc.iin')}
                value={kycForm.iin}
                onChange={e => setKycForm(f => ({ ...f, iin: e.target.value }))}
                placeholder="000000000000"
              />
            </div>
            <Input
              label={t('kyc.bankName')}
              value={kycForm.bank_name}
              onChange={e => setKycForm(f => ({ ...f, bank_name: e.target.value }))}
              placeholder={t('kyc.bankNamePlaceholder')}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('kyc.bankAccount')}
                value={kycForm.bank_account}
                onChange={e => setKycForm(f => ({ ...f, bank_account: e.target.value }))}
                placeholder="KZ00 0000 0000 0000 0000"
              />
              <Input
                label={t('kyc.bankBic')}
                value={kycForm.bank_bic}
                onChange={e => setKycForm(f => ({ ...f, bank_bic: e.target.value }))}
                placeholder={t('kyc.bankBicPlaceholder')}
              />
            </div>
            <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('kyc.freedomPayOptional')}</p>
              <Input
                label={`Freedom Pay ${t('kyc.accountOptional')}`}
                value={kycForm.freedom_pay_account}
                onChange={e => setKycForm(f => ({ ...f, freedom_pay_account: e.target.value }))}
                placeholder={t('kyc.freedomPayPlaceholder')}
              />
            </div>
            <Button
              loading={kycMutation.isPending}
              disabled={!kycForm.bank_account && !kycForm.freedom_pay_account}
              onClick={() => kycMutation.mutate()}
            >
              {t('kyc.save')}
            </Button>
          </div>
        )}
      </div>

      {/* Offer section */}
      <div id="offer" className="scroll-mt-4">
        {profile?.offer_accepted ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                <IconCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Оферта принята</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Партнёрское соглашение подписано</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-brand-100 dark:border-brand-500/20 shadow-card p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('onboarding.offerTitle')}</h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('onboarding.offerText')}
            </div>
            {offerError && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                {offerError}
              </div>
            )}
            <Button
              loading={offerMutation.isPending}
              onClick={() => offerMutation.mutate()}
            >
              {t('onboarding.accept')}
            </Button>
          </div>
        )}
      </div>

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
