import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { getUnreadCount } from '@/api/partner'

const navItems = [
  { to: '/dashboard', label: 'nav.dashboard', icon: '📊' },
  { to: '/events', label: 'nav.events', icon: '🎟️' },
  { to: '/promo-codes', label: 'nav.promoCodes', icon: '🎫' },
  { to: '/payouts', label: 'nav.payouts', icon: '💳' },
  { to: '/documents', label: 'nav.documents', icon: '📄' },
  { to: '/faq', label: 'nav.faq', icon: '❓' },
  { to: '/profile', label: 'nav.profile', icon: '👤' }
]

const languages = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'kz', label: 'KZ' },
  { code: 'uz', label: 'UZ' }
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const { partner, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60_000
  })
  const unreadCount = countData?.unread ?? 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleLang = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('tap-language', code)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">T</div>
              <span className="font-semibold text-gray-900 text-sm">TAP Partner</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tier badge */}
            {partner && (
              <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase
                ${partner.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                  partner.tier === 'silver' ? 'bg-gray-200 text-gray-700' :
                  'bg-orange-100 text-orange-700'}`}>
                {partner.tier}
              </span>
            )}

            {/* Notification bell */}
            <NavLink to="/notifications" className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>

            {/* Language switcher */}
            <div className="flex gap-1">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => handleLang(l.code)}
                  className={`px-1.5 py-0.5 text-xs rounded transition-colors
                    ${i18n.language === l.code ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex w-52 flex-shrink-0 pt-4 px-3">
          <nav className="w-full space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-100'}`
                }
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{t(item.label)}</span>
                {item.to === '/notifications' && unreadCount > 0 && (
                  <span className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
            <div className="relative w-64 bg-white h-full pt-4 px-3 shadow-lg">
              <nav className="space-y-1">
                {navItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-100'}`
                    }
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="flex-1">{t(item.label)}</span>
                    {item.to === '/notifications' && unreadCount > 0 && (
                      <span className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-30">
        {[navItems[0], navItems[1], navItems[3], navItems[5], navItems[6]].map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-colors relative
              ${isActive ? 'text-brand-500' : 'text-gray-400'}`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{t(item.label)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
