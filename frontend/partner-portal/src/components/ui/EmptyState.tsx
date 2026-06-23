import React from 'react'

type Variant = 'default' | 'search' | 'events' | 'payouts' | 'notifications' | 'documents' | 'promo' | 'error' | 'offline' | '404'

interface EmptyStateProps {
  variant?: Variant
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'outline'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

function IllustrationDefault() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="80" width="80" height="60" rx="6" className="fill-gray-100 dark:fill-gray-800" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5"/>
      <rect x="72" y="56" width="56" height="36" rx="4" className="fill-white dark:fill-gray-900" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
      <path d="M88 74h24M88 82h16" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="100" cy="45" r="18" className="fill-brand-50 dark:fill-brand-500/10" stroke="#E84040" strokeWidth="1.5"/>
      <path d="M100 37v12M100 52h.01" stroke="#E84040" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="56" cy="110" r="8" className="fill-gray-100 dark:fill-gray-800" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1"/>
      <circle cx="144" cy="100" r="6" className="fill-brand-50 dark:fill-brand-500/10" stroke="#E84040" strokeOpacity="0.4" strokeWidth="1"/>
      <circle cx="148" cy="128" r="4" className="fill-gray-100 dark:fill-gray-800" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1"/>
    </svg>
  )
}

function IllustrationSearch() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="90" cy="72" r="38" className="fill-gray-50 dark:fill-gray-800/60" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2"/>
      <circle cx="90" cy="72" r="28" className="fill-white dark:fill-gray-900" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
      <path d="M82 72h16M90 64v16" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round"/>
      <path d="M118 98l16 16" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="134" cy="114" r="5" className="fill-brand-100 dark:fill-brand-500/20" stroke="#E84040" strokeWidth="1.5"/>
      <path d="M55 44l-8-8M130 44l8-8M90 34v-8" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IllustrationEvents() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="48" width="120" height="90" rx="8" className="fill-white dark:fill-gray-900" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5"/>
      <rect x="40" y="48" width="120" height="28" rx="8" className="fill-brand-50 dark:fill-brand-500/10"/>
      <rect x="40" y="64" width="120" height="12" className="fill-brand-50 dark:fill-brand-500/10"/>
      <path d="M70 48v-10M130 48v-10" stroke="#E84040" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="70" cy="38" r="4" className="fill-brand-100 dark:fill-brand-500/20" stroke="#E84040" strokeWidth="1.5"/>
      <circle cx="130" cy="38" r="4" className="fill-brand-100 dark:fill-brand-500/20" stroke="#E84040" strokeWidth="1.5"/>
      <rect x="58" y="88" width="20" height="18" rx="3" className="fill-gray-100 dark:fill-gray-800"/>
      <rect x="90" y="88" width="20" height="18" rx="3" className="fill-gray-100 dark:fill-gray-800"/>
      <rect x="122" y="88" width="20" height="18" rx="3" className="fill-gray-100 dark:fill-gray-800"/>
      <path d="M85 118h30" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IllustrationPayouts() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="35" y="55" width="130" height="80" rx="10" className="fill-white dark:fill-gray-900" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5"/>
      <rect x="35" y="55" width="130" height="30" rx="10" className="fill-gray-100 dark:fill-gray-800"/>
      <rect x="35" y="73" width="130" height="12" className="fill-gray-100 dark:fill-gray-800"/>
      <circle cx="55" cy="70" r="10" className="fill-brand-50 dark:fill-brand-500/10" stroke="#E84040" strokeWidth="1.5"/>
      <path d="M55 65v10M50 70h10" stroke="#E84040" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="51" y="100" width="40" height="6" rx="3" className="fill-gray-100 dark:fill-gray-800"/>
      <rect x="51" y="113" width="25" height="6" rx="3" className="fill-gray-100 dark:fill-gray-800"/>
      <path d="M140 105l-6 6 6 6M148 105l6 6-6 6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IllustrationNotifications() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="50" className="fill-gray-50 dark:fill-gray-800/40" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
      <path d="M100 45c-17 0-28 11-28 25v14l-6 8h68l-6-8V70c0-14-11-25-28-25z" className="fill-white dark:fill-gray-900" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
      <path d="M93 108c0 3.9 3.1 7 7 7s7-3.1 7-7" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5"/>
      <text x="114" y="60" className="fill-gray-300 dark:fill-gray-600" fontSize="14" fontWeight="bold">z</text>
      <text x="124" y="48" className="fill-gray-200 dark:fill-gray-700" fontSize="10" fontWeight="bold">z</text>
      <text x="132" y="38" className="fill-gray-100 dark:fill-gray-800" fontSize="8" fontWeight="bold">z</text>
    </svg>
  )
}

function IllustrationDocuments() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="65" y="35" width="75" height="95" rx="6" className="fill-white dark:fill-gray-900" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" transform="rotate(-6 65 35)"/>
      <rect x="70" y="32" width="75" height="95" rx="6" className="fill-white dark:fill-gray-900" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" transform="rotate(-2 70 32)"/>
      <rect x="75" y="30" width="75" height="95" rx="6" className="fill-white dark:fill-gray-900" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5"/>
      <path d="M90 50h45M90 62h45M90 74h30" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="100" cy="96" r="12" className="fill-brand-50 dark:fill-brand-500/10" stroke="#E84040" strokeWidth="1.5"/>
      <path d="M96 96l3 3 5-5" stroke="#E84040" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IllustrationPromo() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="55" width="140" height="70" rx="10" className="fill-white dark:fill-gray-900" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="6 4"/>
      <circle cx="30" cy="90" r="12" className="fill-gray-50 dark:fill-gray-950" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
      <circle cx="170" cy="90" r="12" className="fill-gray-50 dark:fill-gray-950" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
      <path d="M78 78h44M78 90h44M78 102h32" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="155" cy="65" r="20" className="fill-brand-50 dark:fill-brand-500/10" stroke="#E84040" strokeWidth="1.5"/>
      <path d="M148 65l4 4 8-8" stroke="#E84040" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IllustrationError() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="52" className="fill-brand-50 dark:fill-brand-500/10" stroke="#E84040" strokeOpacity="0.2" strokeWidth="1.5"/>
      <circle cx="100" cy="80" r="38" className="fill-white dark:fill-gray-900" stroke="#E84040" strokeOpacity="0.3" strokeWidth="1.5"/>
      <path d="M100 58v26" stroke="#E84040" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="100" cy="97" r="3" fill="#E84040"/>
      <path d="M55 35L45 25M145 35l10-10M60 125l-8 10M140 125l8 10" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function IllustrationOffline() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="50" className="fill-gray-50 dark:fill-gray-800/40" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
      <path d="M60 68a57 57 0 0180 0" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M72 82a38 38 0 0156 0" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M82 96a20 20 0 0136 0" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="100" cy="110" r="5" className="fill-gray-200 dark:fill-gray-700"/>
      <path d="M44 44l112 112" stroke="#E84040" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function Illustration404() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="15" y="110" className="fill-gray-100 dark:fill-gray-800" fontSize="80" fontWeight="900" fontFamily="Inter, system-ui">404</text>
      <rect x="55" y="45" width="90" height="70" rx="8" className="fill-white dark:fill-gray-900" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
      <circle cx="100" cy="73" r="16" className="fill-brand-50 dark:fill-brand-500/10" stroke="#E84040" strokeWidth="1.5"/>
      <path d="M100 64v12M100 79h.01" stroke="#E84040" strokeWidth="2" strokeLinecap="round"/>
      <path d="M75 100h50" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const illustrations: Record<Variant, React.ComponentType> = {
  default: IllustrationDefault,
  search: IllustrationSearch,
  events: IllustrationEvents,
  payouts: IllustrationPayouts,
  notifications: IllustrationNotifications,
  documents: IllustrationDocuments,
  promo: IllustrationPromo,
  error: IllustrationError,
  offline: IllustrationOffline,
  '404': Illustration404,
}

export function EmptyState({
  variant = 'default',
  title,
  description,
  action,
  secondaryAction,
  className = ''
}: EmptyStateProps) {
  const Illustration = illustrations[variant]

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in ${className}`}>
      <div className="w-44 h-36 mb-5 text-gray-400 dark:text-gray-600">
        <Illustration />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed text-balance">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            <button
              onClick={action.onClick}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95
                ${(action.variant ?? 'primary') === 'primary'
                  ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-md'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
