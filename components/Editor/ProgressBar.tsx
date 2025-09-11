'use client'

import { theme } from '@/lib/theme'

interface ProgressBarProps {
  percentage: number
  showComplete?: boolean
  className?: string
}

export default function ProgressBar({ percentage, showComplete = true, className = '' }: ProgressBarProps) {
  return (
    <div className={className}>
      <div className="h-2 rounded-full overflow-hidden" 
           style={{ backgroundColor: theme.colors.glass.border }}>
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: theme.colors.accent.green
          }}
        />
      </div>
      <div className="text-center mt-1">
        <span className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>
          {percentage === 100 && showComplete ? 'Complete' : `${percentage}%`}
        </span>
      </div>
    </div>
  )
}