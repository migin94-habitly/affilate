import React from 'react'

interface PageLoaderProps {
  fullscreen?: boolean
  label?: string
}

export function PageLoader({ fullscreen = false, label }: PageLoaderProps) {
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 animate-fade-in">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-xl font-bold shadow-glow animate-pulse">
            T
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-brand-500/20 animate-ping" />
        </div>
        {label && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 animate-pulse">{label}</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12 animate-fade-in">
      <div className="flex items-center gap-2">
        <Spinner />
        {label && <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>}
      </div>
    </div>
  )
}

export function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin text-brand-500 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function InlineLoader({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) {
  const sizes = { xs: 'w-3.5 h-3.5', sm: 'w-4 h-4', md: 'w-5 h-5' }
  return <Spinner className={sizes[size]} />
}
