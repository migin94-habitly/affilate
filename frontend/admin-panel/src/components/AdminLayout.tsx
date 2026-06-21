import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '@/store/auth'

const nav = [
  { to: '/dashboard', label: 'Дашборд', icon: '📊' },
  { to: '/partners', label: 'Партнёры', icon: '👥' },
  { to: '/commissions', label: 'Комиссии', icon: '📈' },
  { to: '/payouts', label: 'Выплаты', icon: '💳' },
  { to: '/documents', label: 'Документы', icon: '📄' },
  { to: '/fraud', label: 'Антифрод', icon: '🛡️' },
  { to: '/faq', label: 'FAQ & Контакты', icon: '❓' }
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-14' : 'w-52'} flex-shrink-0 bg-gray-900 text-white flex flex-col transition-all`}>
        <div className="h-14 flex items-center px-3 border-b border-gray-700">
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-700 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {!collapsed && <span className="ml-2 font-bold text-sm">TAP Admin</span>}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors
                ${isActive ? 'bg-brand-500 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-700">
          {!collapsed && admin && (
            <div className="mb-2">
              <p className="text-xs text-gray-400 truncate">{admin.email}</p>
              <p className="text-xs text-gray-500 uppercase">{admin.role}</p>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <span>🚪</span>
            {!collapsed && 'Выйти'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-sm font-semibold text-gray-700">Ticketon Affiliate Platform — Admin</h1>
          {admin && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{admin.full_name || admin.email}</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs uppercase">{admin.role}</span>
            </div>
          )}
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
