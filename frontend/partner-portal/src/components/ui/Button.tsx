import React from 'react'
import { Spinner } from './PageLoader'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  full?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const variants = {
  primary: `bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-sm
             hover:shadow-md dark:shadow-none`,
  secondary: `bg-gray-900 hover:bg-gray-800 active:bg-gray-700 text-white dark:bg-gray-700 dark:hover:bg-gray-600`,
  outline: `border border-gray-200 dark:border-gray-700
            text-gray-700 dark:text-gray-300
            hover:bg-gray-50 dark:hover:bg-gray-800/60
            hover:border-gray-300 dark:hover:border-gray-600`,
  ghost: `text-gray-600 dark:text-gray-400
          hover:bg-gray-100 dark:hover:bg-gray-800/60
          hover:text-gray-900 dark:hover:text-gray-100`,
  danger: `bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm`
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs gap-1.5',
  sm: 'px-3.5 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2'
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  full = false,
  icon,
  iconRight,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-xl
        transition-all duration-150 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
        dark:focus-visible:ring-offset-gray-900
        active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]}
        ${sizes[size]}
        ${full ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <Spinner className={size === 'xs' || size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  )
}
