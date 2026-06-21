import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import { register, submitKYC, acceptOffer } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import type { PartnerSegment } from '@/types'

type Step = 1 | 2 | 3 | 4

const STEPS = [
  { id: 1, labelKey: 'onboarding.step1' },
  { id: 2, labelKey: 'onboarding.step2' },
  { id: 3, labelKey: 'onboarding.step3' },
  { id: 4, labelKey: 'onboarding.step4' }
]

export function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)

  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    segment: 'influencer' as PartnerSegment,
    email: '',
    phone: '',
    password: '',
    full_name: '',
    language: i18n.language || 'ru',
    country: 'KZ',
    iin: '',
    freedom_pay_account: ''
  })

  const segmentOptions = [
    { value: 'influencer', label: t('auth.segments.influencer') },
    { value: 'ugc', label: t('auth.segments.ugc') },
    { value: 'webservice', label: t('auth.segments.webservice') }
  ]

  const countryOptions = [
    { value: 'KZ', label: 'Казахстан / Kazakhstan' },
    { value: 'UZ', label: 'Узбекистан / Uzbekistan' },
    { value: 'KG', label: 'Кыргызстан / Kyrgyzstan' },
    { value: 'TJ', label: 'Таджикистан / Tajikistan' },
    { value: 'TR', label: 'Турция / Turkey' }
  ]

  const handleStep1 = () => setStep(2)

  const handleStep2 = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        segment: form.segment,
        language: form.language,
        country: form.country,
        phone: form.phone
      })
      setAuth(result.token, result.partner)
      setStep(3)
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleStep3 = async () => {
    setError('')
    setLoading(true)
    try {
      await submitKYC({ iin: form.iin, freedom_pay_account: form.freedom_pay_account })
      setStep(4)
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleStep4 = async () => {
    setError('')
    setLoading(true)
    try {
      await acceptOffer(i18n.language)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white text-lg font-bold">T</div>
          <span className="text-xl font-bold text-gray-900">TAP</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center mb-6 gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors
                ${step > s.id ? 'bg-brand-500 text-white' :
                  step === s.id ? 'bg-brand-500 text-white ring-2 ring-brand-200' :
                  'bg-gray-200 text-gray-500'}`}>
                {step > s.id ? '✓' : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${step > s.id ? 'bg-brand-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs text-brand-500 font-medium mb-1">{t(STEPS[step - 1].labelKey)}</p>
          <h1 className="text-lg font-semibold text-gray-900 mb-5">
            {step === 1 ? t('auth.segments.' + form.segment).split('/')[0] + ' — выберите тип' :
             step === 2 ? t('auth.registerTitle') :
             step === 3 ? 'Freedom Pay' :
             t('onboarding.offerTitle')}
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Step 1: Segment selection */}
          {step === 1 && (
            <div className="space-y-3">
              {segmentOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, segment: opt.value as PartnerSegment }))}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all
                    ${form.segment === opt.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="font-medium text-gray-900">{opt.label}</span>
                </button>
              ))}
              <Button full onClick={handleStep1} className="mt-4">{t('common.next')}</Button>
            </div>
          )}

          {/* Step 2: Contacts */}
          {step === 2 && (
            <div className="space-y-4">
              <Input label={t('auth.fullName')} required value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              <Input label={t('auth.email')} type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <Input label={t('auth.phone')} type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              <Input label={t('auth.password')} type="password" required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <Select label="Страна / Country" required value={form.country} options={countryOptions}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>{t('common.back')}</Button>
                <Button full loading={loading} onClick={handleStep2}>{t('common.next')}</Button>
              </div>
            </div>
          )}

          {/* Step 3: KYC + Freedom Pay */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                {t('onboarding.freedomPayHint')}
              </div>
              <Input label="ИИН / IIN" value={form.iin} placeholder="123456789012"
                onChange={e => setForm(f => ({ ...f, iin: e.target.value }))} />
              <Input label="Freedom Pay аккаунт" required value={form.freedom_pay_account}
                placeholder="+77XXXXXXXXX или email"
                onChange={e => setForm(f => ({ ...f, freedom_pay_account: e.target.value }))}
                hint="Привязанный телефон или email Freedom Pay" />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>{t('common.back')}</Button>
                <Button full loading={loading} onClick={handleStep3}>{t('common.next')}</Button>
              </div>
            </div>
          )}

          {/* Step 4: Accept offer */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 leading-relaxed max-h-48 overflow-y-auto">
                <p className="font-medium text-gray-900 mb-2">{t('onboarding.offerTitle')}</p>
                <p>{t('onboarding.offerText')}</p>
                <ul className="mt-3 space-y-1 list-disc list-inside text-xs">
                  <li>Размещение ссылок в соцсетях разрешено</li>
                  <li>Обязателен дисклеймер #партнёрский материал</li>
                  <li>Запрещён self-referral и cookie-stuffing</li>
                  <li>Запрещён бренд-биддинг без согласования</li>
                  <li>Выплаты через Freedom Pay в KZT/локальной валюте</li>
                </ul>
              </div>
              <Button full loading={loading} onClick={handleStep4}>
                {t('onboarding.accept')}
              </Button>
            </div>
          )}
        </div>

        {step === 1 && (
          <p className="mt-4 text-center text-sm text-gray-500">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-brand-500 font-medium hover:underline">{t('auth.login')}</Link>
          </p>
        )}
      </div>
    </div>
  )
}
