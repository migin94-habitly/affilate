import React from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  dot?: boolean
  size?: 'sm' | 'md'
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  success: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400',
  warning: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  danger:  'bg-red-50   dark:bg-red-500/10   text-red-600   dark:text-red-400',
  info:    'bg-blue-50  dark:bg-blue-500/10  text-blue-700  dark:text-blue-400',
  purple:  'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-400 dark:bg-gray-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  purple:  'bg-purple-500',
}

export function Badge({ label, variant = 'default', dot = false, size = 'sm' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 font-medium rounded-full
      ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
      ${variants[variant]}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />
      )}
      {label}
    </span>
  )
}

interface TierBadgeProps {
  tier: 'bronze' | 'silver' | 'gold'
}

const tierStyles = {
  bronze: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20',
  silver: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600',
  gold:   'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20',
}

export function TierBadge({ tier }: TierBadgeProps) {
  const icons = { bronze: '🥉', silver: '🥈', gold: '🥇' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${tierStyles[tier]}`}>
      <span>{icons[tier]}</span>
      {tier}
    </span>
  )
}
