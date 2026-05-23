'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from './card'
import { cn } from '@/lib/utils'

interface StatCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  title: string
  value: string | number
  trend?: string
  trendType?: 'up' | 'down' | 'neutral'
  description?: string
  icon?: React.ReactNode
  variant?: 'default' | 'solid' | 'glow' | 'success' | 'danger' | 'warning'
}

export function StatCard({
  className,
  title,
  value,
  trend,
  trendType = 'neutral',
  description,
  icon,
  variant = 'default',
  ...props
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
      {...(props as any)}
    >
      <Card variant={variant} padding="none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            {icon && (
              <div className="p-2 bg-slate-800 rounded-lg border-2 border-black text-white">
                {icon}
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {value}
            </h3>
            
            {(trend || description) && (
              <div className="flex items-center mt-2 space-x-2 text-xs">
                {trend && (
                  <span
                    className={cn(
                      'font-bold px-1.5 py-0.5 rounded border border-black',
                      trendType === 'up'
                        ? 'bg-emerald-600 text-white'
                        : trendType === 'down'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700 text-slate-200'
                    )}
                  >
                    {trend}
                  </span>
                )}
                {description && (
                  <span className="text-slate-400">{description}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
