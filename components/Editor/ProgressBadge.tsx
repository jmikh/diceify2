'use client'

import { theme } from '@/lib/theme'

interface ProgressBadgeProps {
  percentage: number
  showComplete?: boolean
  className?: string
}

export default function ProgressBadge({ percentage, showComplete = true, className = '' }: ProgressBadgeProps) {
  return (
    <span 
      className={`text-xs ${className}`}
      style={{ color: theme.colors.text.muted }}
    >
      {percentage.toFixed(1)}%{showComplete && ' Complete'}
    </span>
  )
}