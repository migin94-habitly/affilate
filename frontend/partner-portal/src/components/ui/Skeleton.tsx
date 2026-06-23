import React from 'react'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton ${className}`} aria-hidden="true" />
  )
}

export function SkeletonStatCard() {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      </div>
    </div>
  )
}

export function SkeletonEventCard() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="w-full h-36 rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-8 w-full mt-1" />
      </div>
    </div>
  )
}

export function SkeletonNotification() {
  return (
    <div className="card p-4 flex gap-3">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 ${i === 1 ? 'w-32' : i === 5 ? 'w-16' : 'w-24'}`} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonPage() {
  return (
    <div className="space-y-5 animate-pulse">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div className="card p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  )
}
