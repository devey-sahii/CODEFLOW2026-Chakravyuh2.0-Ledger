'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ============================================================
// VARIANTS
// ============================================================

const cardVariants = cva(
  'rounded-2xl overflow-hidden transition-all duration-200 bg-slate-900 border-2 border-black',
  {
    variants: {
      variant: {
        default:
          'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
        solid:
          'bg-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-900',
        outline:
          'bg-transparent border-slate-800 shadow-none hover:bg-slate-900/30',
        glow:
          'border-indigo-500 shadow-[4px_4px_0px_0px_#6366f1] hover:shadow-[6px_6px_0px_0px_#6366f1]',
        success:
          'border-emerald-500 shadow-[4px_4px_0px_0px_#10b981] hover:shadow-[6px_6px_0px_0px_#10b981]',
        danger:
          'border-red-500 shadow-[4px_4px_0px_0px_#ef4444] hover:shadow-[6px_6px_0px_0px_#ef4444]',
        warning:
          'border-amber-500 shadow-[4px_4px_0px_0px_#f59e0b] hover:shadow-[6px_6px_0px_0px_#f59e0b]',
        elevated:
          'border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]',
        ghost:
          'bg-transparent border-0 hover:bg-white/5 shadow-none',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      interactive: {
        true: 'cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      interactive: false,
    },
  },
)

// ============================================================
// TYPES
// ============================================================

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

// ============================================================
// CARD COMPONENTS
// ============================================================

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

// ============================================================
// CARD HEADER
// ============================================================

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5', className)}
      {...props}
    />
  ),
)
CardHeader.displayName = 'CardHeader'

// ============================================================
// CARD TITLE
// ============================================================

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-white leading-none tracking-tight', className)}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

// ============================================================
// CARD DESCRIPTION
// ============================================================

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-slate-400 leading-relaxed', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

// ============================================================
// CARD CONTENT
// ============================================================

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

// ============================================================
// CARD FOOTER
// ============================================================

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 border-t border-white/5', className)}
      {...props}
    />
  ),
)
CardFooter.displayName = 'CardFooter'

// ============================================================
// CARD SECTION (with divider)
// ============================================================

const CardSection = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-b border-white/5 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0', className)}
      {...props}
    />
  ),
)
CardSection.displayName = 'CardSection'

// ============================================================
// GLOW CARD (with animated border)
// ============================================================

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: 'indigo' | 'blue' | 'emerald' | 'red' | 'amber'
}

function GlowCard({ className, glowColor = 'indigo', children, ...props }: GlowCardProps) {
  const glowColorMap = {
    indigo: 'from-indigo-500 via-purple-500 to-blue-500',
    blue: 'from-blue-400 via-cyan-500 to-blue-600',
    emerald: 'from-emerald-400 via-teal-500 to-emerald-600',
    red: 'from-red-400 via-rose-500 to-red-600',
    amber: 'from-amber-400 via-yellow-500 to-amber-600',
  }

  return (
    <div className={cn('relative rounded-2xl p-px', className)} {...props}>
      {/* Gradient border */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl bg-gradient-to-r opacity-50',
          glowColorMap[glowColor],
        )}
      />
      {/* Inner content */}
      <div className="relative rounded-2xl bg-slate-900/90 backdrop-blur-md">
        {children}
      </div>
    </div>
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardSection,
  GlowCard,
  cardVariants,
}
