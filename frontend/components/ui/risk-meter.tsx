'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface RiskMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

export function RiskMeter({
  className,
  score,
  size = 120,
  strokeWidth = 10,
  showLabel = true,
  ...props
}: RiskMeterProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference

  // Color mapping based on score
  const getRiskColor = (s: number) => {
    if (s < 30) return 'stroke-emerald-500'
    if (s < 60) return 'stroke-amber-500'
    if (s < 85) return 'stroke-orange-500'
    return 'stroke-red-500'
  }

  const getRiskText = (s: number) => {
    if (s < 30) return 'LOW'
    if (s < 60) return 'MEDIUM'
    if (s < 85) return 'HIGH'
    return 'CRITICAL'
  }

  const getRiskTextColor = (s: number) => {
    if (s < 30) return 'text-emerald-400'
    if (s < 60) return 'text-amber-400'
    if (s < 85) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)} {...props}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-black"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated indicator arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={cn(getRiskColor(score), 'transition-colors duration-500')}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>

      {showLabel && (
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-white tracking-tight">{score}</span>
          <span className={cn('text-[10px] font-bold tracking-wider mt-0.5', getRiskTextColor(score))}>
            {getRiskText(score)}
          </span>
        </div>
      )}
    </div>
  )
}
