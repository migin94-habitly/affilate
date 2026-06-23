import React from 'react'
import { Spinner } from './PageLoader'

// ─── Button ───────────────────────────────────────────────────────────────────

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md'
  loading?: boolean
  icon?: React.ReactNode
}

const btnVariants = {
  primary: 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-sm',
  outline: 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
  ghost:   'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
  danger:  'bg-red-500 hover:bg-red-600 text-white shadow-sm',
}
const btnSizes = {
  xs: 'px-2.5 py-1 text-xs gap-1.5',
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
}

export function Btn({ variant = 'primary', size = 'md', loading, icon, className = '', children, disabled, ...props }: BtnProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
        ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
    >
      {loading ? <Spinner className="w-3.5 h-3.5" /> : icon}
      {children && <span>{children}</span>}
    </button>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  success: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400',
  warning: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  danger:  'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
  info:    'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
  purple:  'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
}

export function Badge({ label, variant = 'default', dot }: { label: string; variant?: BadgeVariant; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${badgeStyles[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'success' ? 'bg-green-500' : variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />}
      {label}
    </span>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            {headers.map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800">
          {children}
        </tbody>
      </table>
    </div>
  )
}

export function TD({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </td>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  title,
  children,
  action,
  className = ''
}: {
  title?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

export function Stat({
  label,
  value,
  sub,
  color = 'text-gray-900',
  icon,
  iconBg = 'bg-gray-100'
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon?: React.ReactNode
  iconBg?: string
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 tabular-nums dark:text-gray-100 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconBg}`}>{icon}</div>
        )}
      </div>
    </div>
  )
}

// ─── Filter select ────────────────────────────────────────────────────────────

export function Filter({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{label}:</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="pl-3 pr-8 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500
            appearance-none"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>
    </div>
  )
}
