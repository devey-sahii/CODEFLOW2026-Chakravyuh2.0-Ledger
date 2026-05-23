'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// SHIMMER EFFECT
// ============================================================

const shimmerClasses =
  'bg-gradient-to-r from-slate-800/60 via-slate-700/60 to-slate-800/60 bg-[length:200%_100%] animate-shimmer'

// ============================================================
// BASE SKELETON
// ============================================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean
}

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading..."
      className={cn(
        'rounded-lg',
        shimmer ? shimmerClasses : 'bg-slate-800/60',
        className,
      )}
      {...props}
    />
  )
}

// ============================================================
// TEXT SKELETON
// ============================================================

interface TextSkeletonProps {
  lines?: number
  lastLineWidth?: string
  className?: string
  gap?: string
}

function TextSkeleton({
  lines = 3,
  lastLineWidth = 'w-3/5',
  className,
  gap = 'gap-2',
}: TextSkeletonProps) {
  return (
    <div className={cn('flex flex-col', gap, className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? lastLineWidth : 'w-full')}
        />
      ))}
    </div>
  )
}

// ============================================================
// AVATAR SKELETON
// ============================================================

interface AvatarSkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

function AvatarSkeleton({ size = 'md', className }: AvatarSkeletonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return <Skeleton className={cn('rounded-full shrink-0', sizeClasses[size], className)} />
}

// ============================================================
// CARD SKELETON
// ============================================================

interface CardSkeletonProps {
  className?: string
  showHeader?: boolean
  showFooter?: boolean
  lines?: number
}

function CardSkeleton({
  className,
  showHeader = true,
  showFooter = false,
  lines = 3,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4',
        className,
      )}
    >
      {showHeader && (
        <div className="flex items-center gap-3">
          <AvatarSkeleton size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      )}
      <TextSkeleton lines={lines} />
      {showFooter && (
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      )}
    </div>
  )
}

// ============================================================
// STAT CARD SKELETON
// ============================================================

function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-1/2" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

// ============================================================
// TABLE SKELETON
// ============================================================

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
  showHeader?: boolean
}

function TableSkeleton({
  rows = 5,
  columns = 5,
  className,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className={cn('w-full overflow-hidden', className)}>
      {showHeader && (
        <div className="flex gap-4 px-4 py-3 border-b border-white/10 mb-2">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                'h-4',
                i === 0 ? 'w-1/4' : i === columns - 1 ? 'w-16 ml-auto' : 'flex-1',
              )}
            />
          ))}
        </div>
      )}
      <div className="space-y-1">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5"
          >
            {Array.from({ length: columns }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                className={cn(
                  'h-4',
                  colIdx === 0
                    ? 'w-1/4'
                    : colIdx === columns - 1
                      ? 'w-16 ml-auto'
                      : 'flex-1',
                  // Vary widths for natural look
                  colIdx === 1 && rowIdx % 3 === 0 ? 'w-2/3' : '',
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// CHART SKELETON
// ============================================================

function ChartSkeleton({ className, height = 'h-64' }: { className?: string; height?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-8 w-28" />
      </div>
      <Skeleton className={cn('w-full rounded-xl', height)} shimmer={false}>
        {/* Fake bar chart bars */}
        <div className="h-full flex items-end gap-3 px-4 pb-4 pt-8">
          {[70, 45, 85, 60, 90, 40, 75, 55, 80, 65, 88, 72].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-slate-700/60 animate-shimmer bg-gradient-to-r from-slate-800/60 via-slate-700/60 to-slate-800/60 bg-[length:200%_100%]"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </Skeleton>
    </div>
  )
}

// ============================================================
// DASHBOARD SKELETON
// ============================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6">
          <ChartSkeleton />
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <ChartSkeleton height="h-48" />
        </div>
      </div>
      {/* Table */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <TableSkeleton rows={5} columns={6} />
      </div>
    </div>
  )
}

export {
  Skeleton,
  TextSkeleton,
  AvatarSkeleton,
  CardSkeleton,
  StatCardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  DashboardSkeleton,
}
