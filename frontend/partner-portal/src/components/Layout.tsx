import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { useThemeStore, type ThemeMode } from '@/store/theme'
import { getUnreadCount } from '@/api/partner'
import {
  IconDashboard, IconTicket, IconTag, IconCreditCard, IconFileText,
  IconHelpCircle, IconUser, IconBell, IconLogOut, IconMenu, IconX,
  IconSun, IconMoon, IconMonitor, IconChevronDown, IconTrendingUp
} from './ui/Icons'

const navItems = [
  { to: '/dashboard',   labelKey: 'nav.dashboard',   Icon: IconDashboard   },
  { to: '/events',      labelKey: 'nav.events',       Icon: IconTicket      },
  { to: '/tariffs',     labelKey: 'nav.tariffs',      Icon: IconTrendingUp  },
  { to: '/promo-codes', labelKey: 'nav.promoCodes',   Icon: IconTag         },
  { to: '/payouts',     labelKey: 'nav.payouts',      Icon: IconCreditCard  },
  { to: '/documents',   labelKey: 'nav.documents',    Icon: IconFileText    },
  { to: '/requests',    labelKey: 'nav.requests',     Icon: IconHelpCircle  },
  { to: '/faq',         labelKey: 'nav.faq',          Icon: IconFileText    },
  { to: '/profile',     labelKey: 'nav.profile',      Icon: IconUser        },
]

const bottomNavItems = [
  navItems[0], // dashboard
  navItems[1], // events
  navItems[4], // payouts
  navItems[6], // requests
  navItems[8], // profile
]

const languages = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'kz', label: 'KZ' },
  { code: 'uz', label: 'UZ' },
]

const tierGradients: Record<string, string> = {
  bronze: 'from-orange-500 to-amber-500',
  silver: 'from-slate-400 to-slate-500',
  gold:   'from-yellow-400 to-amber-400',
}

const tierRings: Record<string, string> = {
  bronze: 'ring-orange-400',
  silver: 'ring-slate-400',
  gold:   'ring-yellow-400',
}

function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const options: { value: ThemeMode; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'light',  label: 'Светлая',  Icon: IconSun     },
    { value: 'dark',   label: 'Тёмная',   Icon: IconMoon    },
    { value: 'system', label: 'Системная', Icon: IconMonitor },
  ]

  const current = options.find(o => o.value === theme) ?? options[2]
  const CurrentIcon = current.Icon

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-150"
        title="Тема"
      >
        <CurrentIcon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-card-lg overflow-hidden animate-scale-in z-50">
          {options.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors duration-150
                ${theme === value
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {theme === value && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const { partner, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60_000
  })
  const unreadCount = countData?.unread ?? 0

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleLang = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('tap-language', code)
    setLangOpen(false)
  }

  const tierGradient = partner ? (tierGradients[partner.tier] ?? 'from-brand-500 to-brand-600') : ''
  const tierRing = partner ? (tierRings[partner.tier] ?? 'ring-brand-500') : ''

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Меню"
            >
              {mobileOpen
                ? <IconX className="w-5 h-5" />
                : <IconMenu className="w-5 h-5" />
              }
            </button>

            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 bg-gradient-to-br ${tierGradient || 'from-brand-500 to-brand-600'} rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0`}>
                T
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">TAP Partner</p>
                {partner && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 capitalize">{partner.segment}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1">
            {/* Tier badge */}
            {partner && (
              <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide
                bg-gradient-to-r ${tierGradient} text-white shadow-sm mr-1`}>
                {partner.tier}
              </span>
            )}

            {/* Lang switcher */}
            <div ref={langRef} className="relative hidden sm:block">
              <button
                onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {i18n.language.toUpperCase()}
                <IconChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-28 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-card-lg overflow-hidden animate-scale-in z-50">
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => handleLang(l.code)}
                      className={`w-full text-left px-3.5 py-2 text-sm transition-colors
                        ${i18n.language === l.code
                          ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <NavLink
              to="/notifications"
              className="relative p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-150"
            >
              <IconBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none animate-bounce-soft">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>

            {/* Logout (desktop) */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-150 ml-1"
            >
              <IconLogOut className="w-4 h-4" />
              <span className="text-xs">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-56 flex-shrink-0 pt-5 px-3 pb-6">
          <nav className="w-full space-y-0.5 sticky top-20">
            {navItems.map(({ to, labelKey, Icon }) => {
              const isNotif = to === '/notifications'
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'
                    }`
                  }
                >
                  <Icon className="w-4.5 h-4.5 w-[18px] h-[18px] flex-shrink-0" />
                  <span className="flex-1">{t(labelKey)}</span>
                  {isNotif && unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              )
            })}

            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
              {/* Partner info */}
              {partner && (
                <div className="px-3 py-2.5 rounded-xl">
                  <div className={`w-8 h-8 bg-gradient-to-br ${tierGradient} rounded-full ring-2 ${tierRing} ring-offset-1 ring-offset-white dark:ring-offset-gray-950 flex items-center justify-center text-white text-xs font-bold mb-2`}>
                    {partner.full_name?.charAt(0)?.toUpperCase() ?? 'P'}
                  </div>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{partner.full_name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{partner.email}</p>
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 shadow-card-lg flex flex-col animate-slide-in">
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 bg-gradient-to-br ${tierGradient || 'from-brand-500 to-brand-600'} rounded-xl flex items-center justify-center text-white text-sm font-bold`}>T</div>
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">TAP Partner</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              {/* Partner info */}
              {partner && (
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${tierGradient} rounded-full ring-2 ${tierRing} ring-offset-1 ring-offset-white dark:ring-offset-gray-900 flex items-center justify-center text-white font-bold`}>
                      {partner.full_name?.charAt(0)?.toUpperCase() ?? 'P'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{partner.full_name}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-gradient-to-r ${tierGradient} text-white mt-0.5`}>
                        {partner.tier}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                {navItems.map(({ to, labelKey, Icon }) => {
                  const isNotif = to === '/notifications'
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150
                        ${isActive
                          ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{t(labelKey)}</span>
                      {isNotif && unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>

              {/* Bottom: lang + theme + logout */}
              <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
                {/* Language */}
                <div className="flex gap-1 px-1 flex-wrap">
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => handleLang(l.code)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors
                        ${i18n.language === l.code
                          ? 'bg-brand-500 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <IconLogOut className="w-5 h-5" />
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div key={location.pathname} className="p-4 md:p-6 animate-fade-in pb-24 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 supports-[backdrop-filter]:bg-white/80">
        <div className="flex items-stretch h-16 px-2">
          {bottomNavItems.map(({ to, labelKey, Icon }) => {
            const isNotif = to === '/notifications'
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-0.5 px-1 py-2 rounded-xl mx-0.5 my-1.5 text-[10px] font-medium transition-all duration-150 relative
                  ${isActive
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10'
                    : 'text-gray-400 dark:text-gray-500'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{t(labelKey)}</span>
                {isNotif && unreadCount > 0 && (
                  <span className="absolute top-1.5 right-2 min-w-[14px] h-3.5 px-0.5 bg-brand-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
