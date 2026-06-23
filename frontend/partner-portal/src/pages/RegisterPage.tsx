import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import { register, submitKYC, acceptOffer } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { IconCheck } from '@/components/ui/Icons'
import type { PartnerSegment } from '@/types'

type Step = 1 | 2 | 3 | 4

const STEPS = [
  { id: 1, labelKey: 'onboarding.step1' },
  { id: 2, labelKey: 'onboarding.step2' },
  { id: 3, labelKey: 'onboarding.step3' },
  { id: 4, labelKey: 'onboarding.step4' }
]

const SEGMENT_INFO: Record<string, { title: string; desc: string; icon: string }> = {
  influencer: { title: 'Инфлюенсер', desc: 'YouTube, Instagram, TikTok — делитесь событиями со своей аудиторией', icon: '🎭' },
  ugc:        { title: 'UGC-создатель', desc: 'Создаёте контент для брендов и продвигаете события', icon: '📸' },
  webservice: { title: 'Веб-сервис', desc: 'Сайт, приложение или бот для автоматического продвижения', icon: '🌐' },
}

export function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)

  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

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

  const countryOptions = [
    { value: 'KZ', label: 'Казахстан' },
    { value: 'UZ', label: 'Узбекистан' },
    { value: 'KG', label: 'Кыргызстан' },
    { value: 'TJ', label: 'Таджикистан' },
    { value: 'TR', label: 'Турция' }
  ]

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col animate-fade-in">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-100 dark:bg-brand-500/5 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Header */}
      <div className="relative flex items-center px-6 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">T</div>
          <span className="font-bold text-gray-900 dark:text-gray-100">TAP</span>
        </div>
      </div>

      <div className="relative flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-[440px] animate-slide-up">
          {/* Step indicators */}
          <div className="flex items-center mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-300
                  ${step > s.id
                    ? 'bg-brand-500 text-white'
                    : step === s.id
                    ? 'bg-brand-500 text-white ring-4 ring-brand-100 dark:ring-brand-500/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                  }`}>
                  {step > s.id ? <IconCheck className="w-3.5 h-3.5" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1.5 transition-all duration-300
                    ${step > s.id ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-6">
            <p className="text-xs font-medium text-brand-500 uppercase tracking-wide mb-1">
              {t(STEPS[step - 1].labelKey)}
            </p>

            {error && (
              <div className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl mb-4 animate-slide-up">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Step 1: Segment */}
            {step === 1 && (
              <div className="space-y-3 animate-fade-in">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Выберите тип партнёра</h2>
                {Object.entries(SEGMENT_INFO).map(([value, info]) => (
                  <button
                    key={value}
                    onClick={() => setForm(f => ({ ...f, segment: value as PartnerSegment }))}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-150 active:scale-[0.98]
                      ${form.segment === value
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <p className={`font-semibold text-sm ${form.segment === value ? 'text-brand-600 dark:text-brand-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {info.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{info.desc}</p>
                      </div>
                      {form.segment === value && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                          <IconCheck className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                <Button full onClick={() => setStep(2)} className="mt-4" size="lg">
                  Продолжить
                </Button>
              </div>
            )}

            {/* Step 2: Contact info */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{t('auth.registerTitle')}</h2>
                <Input label={t('auth.fullName')} required value={form.full_name} placeholder="Иван Иванов"
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                <Input label={t('auth.email')} type="email" required value={form.email} placeholder="name@example.com"
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                <Input label={t('auth.phone')} type="tel" value={form.phone} placeholder="+7 777 000 0000"
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.password')} *</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Минимум 8 символов"
                      className="w-full rounded-xl text-sm px-3.5 py-2.5 pr-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {showPass
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      }
                    </button>
                  </div>
                </div>
                <Select label="Страна / Country" required value={form.country} options={countryOptions}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>← Назад</Button>
                  <Button full loading={loading} onClick={handleStep2} size="lg">Продолжить</Button>
                </div>
              </div>
            )}

            {/* Step 3: KYC */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Данные для выплат</h2>
                <div className="p-3.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  {t('onboarding.freedomPayHint')}
                </div>
                <Input label="ИИН / IIN" value={form.iin} placeholder="123456789012"
                  onChange={e => setForm(f => ({ ...f, iin: e.target.value }))}
                  hint="12-значный идентификационный номер" />
                <Input label="Freedom Pay аккаунт" required value={form.freedom_pay_account}
                  placeholder="+77XXXXXXXXX или email"
                  onChange={e => setForm(f => ({ ...f, freedom_pay_account: e.target.value }))}
                  hint="Привязанный телефон или email Freedom Pay" />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)}>← Назад</Button>
                  <Button full loading={loading} onClick={handleStep3} size="lg">Продолжить</Button>
                </div>
              </div>
            )}

            {/* Step 4: Offer */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{t('onboarding.offerTitle')}</h2>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-h-52 overflow-y-auto space-y-2">
                  <p>{t('onboarding.offerText')}</p>
                  <ul className="mt-2 space-y-1.5 text-xs">
                    {[
                      'Размещение ссылок в соцсетях разрешено',
                      'Обязателен дисклеймер #партнёрский материал',
                      'Запрещён self-referral и cookie-stuffing',
                      'Запрещён бренд-биддинг без согласования',
                      'Выплаты через Freedom Pay в KZT/локальной валюте'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 w-4 h-4 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button full loading={loading} onClick={handleStep4} size="lg">
                  ✓ {t('onboarding.accept')}
                </Button>
              </div>
            )}
          </div>

          {step === 1 && (
            <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">
                {t('auth.login')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
