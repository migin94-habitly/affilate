import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin } from '@/api/admin'
import { useAdminAuth } from '@/store/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAdminAuth(s => s.setAuth)
  const [form, setForm] = useState({ email: 'admin@ticketon.kz', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await loginAdmin(form.email, form.password)
      setAuth(res.token, res.admin)
      navigate('/dashboard')
    } catch {
      setError('Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-500 rounded-xl mx-auto flex items-center justify-center text-white text-xl font-bold mb-3">T</div>
          <h1 className="text-white text-xl font-bold">TAP Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Ticketon Affiliate Platform</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {error && <p className="text-sm text-red-500 mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input type="password" required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
