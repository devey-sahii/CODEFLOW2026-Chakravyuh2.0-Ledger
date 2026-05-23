'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ============================================================
// VARIANTS
// ============================================================

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md font-bold transition-all duration-200 border-2 border-black',
  {
    variants: {
      variant: {
        default:
          'bg-slate-800 text-slate-100 hover:bg-slate-700',
        primary:
          'bg-indigo-600 text-white hover:bg-indigo-500',
        success:
          'bg-emerald-600 text-white hover:bg-emerald-500',
        warning:
          'bg-amber-500 text-black hover:bg-amber-400',
        danger:
          'bg-red-600 text-white hover:bg-red-500',
        info:
          'bg-blue-600 text-white hover:bg-blue-500',
        ghost:
          'bg-transparent text-slate-300 border-dashed hover:bg-slate-800',
        orange:
          'bg-orange-600 text-white hover:bg-orange-500',
        purple:
          'bg-purple-600 text-white hover:bg-purple-500',
        glow:
          'bg-indigo-600 text-white shadow-[2px_2px_0px_0px_#6366f1] hover:shadow-[3px_3px_0px_0px_#6366f1]',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

// ============================================================
// TYPES
// ============================================================

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  dotAnimate?: boolean
  icon?: React.ReactNode
  removable?: boolean
  onRemove?: () => void
}

// ============================================================
// COMPONENT
// ============================================================

function Badge({
  className,
  variant,
  size,
  dot,
  dotAnimate,
  icon,
  removable,
  onRemove,
  children,
  ...props
}: BadgeProps) {
  const dotColorMap: Record<string, string> = {
    default: 'bg-slate-400',
    primary: 'bg-indigo-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400',
    ghost: 'bg-slate-500',
    orange: 'bg-orange-400',
    purple: 'bg-purple-400',
    glow: 'bg-indigo-400',
  }

  const dotColor = dotColorMap[variant ?? 'default'] ?? 'bg-slate-400'

  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span className={cn('inline-block rounded-full', size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5', dotColor, dotAnimate && 'animate-pulse')} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="ml-0.5 rounded-full opacity-60 hover:opacity-100 transition-opacity focus:outline-none"
          aria-label="Remove"
        >
          <svg
            className={cn(size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ============================================================
// STATUS BADGE HELPER
// ============================================================

const statusVariantMap: Record<string, BadgeVariant> = {
  approved: 'success',
  rejected: 'danger',
  flagged: 'orange',
  pending: 'warning',
  low: 'success',
  medium: 'warning',
  high: 'orange',
  critical: 'danger',
  active: 'success',
  inactive: 'ghost',
  completed: 'success',
  processing: 'info',
  failed: 'danger',
  open: 'danger',
  investigating: 'warning',
  confirmed: 'danger',
  dismissed: 'ghost',
}

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: string
}

function StatusBadge({ status, children, ...props }: StatusBadgeProps) {
  const variant = statusVariantMap[status] ?? 'default'
  const label = children ?? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')

  return (
    <Badge variant={variant} dot dotAnimate={status === 'processing'} {...props}>
      {label}
    </Badge>
  )
}

// ============================================================
// RISK BADGE HELPER
// ============================================================

interface RiskBadgeProps extends Omit<BadgeProps, 'variant'> {
  score: number
}

function RiskBadge({ score, ...props }: RiskBadgeProps) {
  let variant: BadgeVariant
  let label: string

  if (score >= 80) {
    variant = 'danger'
    label = 'CRITICAL'
  } else if (score >= 60) {
    variant = 'orange'
    label = 'HIGH'
  } else if (score >= 40) {
    variant = 'warning'
    label = 'MEDIUM'
  } else {
    variant = 'success'
    label = 'LOW'
  }

  return (
    <Badge variant={variant} dot {...props}>
      {label}
    </Badge>
  )
}

export { Badge, StatusBadge, RiskBadge, badgeVariants }
