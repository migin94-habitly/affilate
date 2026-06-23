import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/store/auth'
import { useThemeStore, type ThemeMode } from '@/store/theme'

type IconProps = { className?: string }
const icon = (d: React.ReactNode) => ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{d}</svg>
)

const IconGrid      = icon(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>)
const IconUsers     = icon(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>)
const IconTrending  = icon(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>)
const IconCard      = icon(<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>)
const IconFile      = icon(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></>)
const IconShield    = icon(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>)
const IconHelp      = icon(<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></>)
const IconMenu      = icon(<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>)
const IconLogOut    = icon(<path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>)
const IconSun       = icon(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>)
const IconMoon      = icon(<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>)
const IconMonitor   = icon(<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>)
const IconChevRight = icon(<path d="M9 18l6-6-6-6"/>)
const IconChevLeft  = icon(<path d="M15 18l-6-6 6-6"/>)

const nav = [
  { to: '/dashboard',   label: 'Дашборд',        Icon: IconGrid     },
  { to: '/partners',    label: 'Партнёры',        Icon: IconUsers    },
  { to: '/commissions', label: 'Комиссии',        Icon: IconTrending },
  { to: '/payouts',     label: 'Выплаты',         Icon: IconCard     },
  { to: '/documents',   label: 'Документы',       Icon: IconFile     },
  { to: '/fraud',       label: 'Антифрод',        Icon: IconShield   },
  { to: '/faq',         label: 'FAQ & Контакты',  Icon: IconHelp     },
]

function ThemeDropdown() {
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

  const options: { value: ThemeMode; label: string; Icon: React.ComponentType<IconProps> }[] = [
    { value: 'light',  label: 'Светлая',   Icon: IconSun     },
    { value: 'dark',   label: 'Тёмная',    Icon: IconMoon    },
    { value: 'system', label: 'Системная', Icon: IconMonitor },
  ]
  const current = options.find(o => o.value === theme) ?? options[2]
  const CurrentIcon = current.Icon

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Тема"
        className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-all"
      >
        <CurrentIcon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden animate-scale-in z-50">
          {options.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors
                ${theme === value
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {theme === value && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo */}
      <div className={`flex items-center border-b border-gray-800 dark:border-gray-700 h-14 px-4 flex-shrink-0
        ${collapsed && !mobile ? 'justify-center' : 'gap-3'}`}>
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">T</div>
            <span className="font-bold text-sm text-white">TAP Admin</span>
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(v => !v)}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-700 hover:text-white transition-all flex-shrink-0"
          >
            {collapsed ? <IconChevRight className="w-4 h-4" /> : <IconChevLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center rounded-xl transition-all duration-150
              ${collapsed && !mobile ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'}
              ${isActive
                ? 'bg-brand-500/20 text-brand-400 font-medium'
                : 'text-gray-400 hover:bg-gray-800/80 hover:text-gray-100'
              }`
            }
            title={collapsed && !mobile ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || mobile) && <span className="text-sm truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-gray-800 dark:border-gray-700 flex-shrink-0">
        {(!collapsed || mobile) && admin && (
          <div className={`px-3 py-2 mb-1 ${collapsed && !mobile ? 'hidden' : ''}`}>
            <p className="text-xs font-medium text-gray-300 truncate">{admin.full_name || admin.email}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{admin.role}</p>
          </div>
        )}
        <button
          onClick={() => { logout(); navigate('/login') }}
          className={`flex items-center rounded-xl transition-all text-gray-400 hover:text-white hover:bg-gray-800 w-full
            ${collapsed && !mobile ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'}`}
          title={collapsed && !mobile ? 'Выйти' : undefined}
        >
          <IconLogOut className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || mobile) && <span className="text-sm">Выйти</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar desktop */}
      <aside className={`hidden md:flex flex-col flex-shrink-0 bg-gray-900 dark:bg-gray-950 border-r border-gray-800 dark:border-gray-800 transition-all duration-300
        ${collapsed ? 'w-[60px]' : 'w-56'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 flex flex-col animate-slide-in">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileOpen(v => !v)}
            >
              <IconMenu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:block">
              Ticketon Affiliate Platform
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeDropdown />
            {admin && (
              <div className="flex items-center gap-2 text-sm pl-2 border-l border-gray-100 dark:border-gray-800">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                  {(admin.full_name || admin.email)?.charAt(0)?.toUpperCase()}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{admin.full_name || admin.email}</p>
                  <p className="text-[10px] text-gray-400 uppercase">{admin.role}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div key={location.pathname} className="p-4 md:p-6 animate-fade-in min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
