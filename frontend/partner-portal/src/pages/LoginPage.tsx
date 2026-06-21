import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import { login } from '@/api/partner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      setAuth(result.token, result.partner)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white text-lg font-bold">T</div>
          <span className="text-xl font-bold text-gray-900">TAP</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-5">{t('auth.loginTitle')}</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
            <Input
              label={t('auth.password')}
              type="password"
              required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
            <Button type="submit" full loading={loading}>
              {t('auth.login')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-brand-500 font-medium hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
