import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const paddingSizes = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5 md:p-6'
}

export function Card({
  children,
  className = '',
  onClick,
  padding = 'md',
  hover = false
}: CardProps) {
  const isClickable = !!onClick
  return (
    <div
      className={`
        bg-white dark:bg-gray-900
        rounded-2xl
        border border-gray-100 dark:border-gray-800
        shadow-card
        ${isClickable || hover
          ? 'cursor-pointer transition-all duration-200 hover:shadow-card-md hover:border-gray-200 dark:hover:border-gray-700'
          : 'transition-colors duration-200'
        }
        ${paddingSizes[padding]}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  trend?: { value: number; label?: string }
  loading?: boolean
}

const iconColors = {
  blue:   'bg-blue-50   dark:bg-blue-500/10   text-blue-600   dark:text-blue-400',
  green:  'bg-green-50  dark:bg-green-500/10  text-green-600  dark:text-green-400',
  orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
  red:    'bg-brand-50  dark:bg-brand-500/10  text-brand-500  dark:text-brand-400',
  purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
}

export function StatCard({ label, value, sub, icon, color = 'blue', trend }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium
              ${trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              <span>{trend.value >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="text-gray-400 font-normal">{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconColors[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

interface SectionCardProps {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = '',
  bodyClassName = ''
}: SectionCardProps) {
  return (
    <Card padding="none" className={className}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            )}
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-4 md:p-5 ${bodyClassName}`}>
        {children}
      </div>
    </Card>
  )
}
