/**
 * BuildProgress Component
 * 
 * Navigation control panel and progress tracker for the build step.
 * Think of this as the controller for navigating through a large dataset (the dice grid)
 * with both sequential and smart navigation capabilities.
 * 
 * Features:
 * - Four navigation buttons: prev, next, smart-prev, smart-next
 * - Progress bar showing completion percentage (0% at bottom-left, 100% at top-right)
 * - Current position display (Row X, Col Y) and dice count
 * - Visual feedback for disabled states when navigation isn't possible
 * 
 * Smart Navigation Logic:
 * - Smart skip (<</>>) finds the next/previous DIFFERENT die in the SAME ROW only
 * - Regular navigation (</>>) moves sequentially through all dice
 * - Buttons disable intelligently based on current position and available moves
 * 
 * This component is stateless - it receives position data and callbacks from parent
 */

'use client'

import { theme } from '@/lib/theme'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Dice } from '@/lib/dice/types'
import ProgressBar from './ProgressBar'

interface BuildProgressProps {
  currentX: number
  currentY: number
  totalRows: number
  totalCols: number
  currentDice: Dice | null
  currentIndex: number
  totalDice: number
  onNavigate: (direction: 'prev' | 'next' | 'prevDiff' | 'nextDiff') => void
  canNavigate: {
    prev: boolean
    next: boolean
    prevDiff: boolean
    nextDiff: boolean
  }
}

export default function BuildProgress({
  currentX,
  currentY,
  totalRows,
  totalCols,
  currentDice,
  currentIndex,
  totalDice,
  onNavigate,
  canNavigate
}: BuildProgressProps) {
  return (
    <div className="space-y-3">
      {/* Position Info */}
      <div className="text-center">
        <div className="text-sm" style={{ color: theme.colors.accent.blue }}>
          Row: {currentY + 1}, Column: {currentX + 1}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => onNavigate('prevDiff')}
          disabled={!canNavigate.prevDiff}
          className="p-2 rounded-lg transition-all disabled:opacity-30"
          style={{ 
            backgroundColor: theme.colors.glass.light,
            color: canNavigate.prevDiff ? theme.colors.text.primary : theme.colors.text.muted
          }}
          title="Previous different dice (same row)"
        >
          <ChevronsLeft size={20} />
        </button>
        
        <button
          onClick={() => onNavigate('prev')}
          disabled={!canNavigate.prev}
          className="p-2 rounded-lg transition-all disabled:opacity-30"
          style={{ 
            backgroundColor: theme.colors.glass.light,
            color: canNavigate.prev ? theme.colors.text.primary : theme.colors.text.muted
          }}
          title="Previous dice"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={() => onNavigate('next')}
          disabled={!canNavigate.next}
          className="p-2 rounded-lg transition-all disabled:opacity-30"
          style={{ 
            backgroundColor: theme.colors.glass.light,
            color: canNavigate.next ? theme.colors.text.primary : theme.colors.text.muted
          }}
          title="Next dice"
        >
          <ChevronRight size={20} />
        </button>
        
        <button
          onClick={() => onNavigate('nextDiff')}
          disabled={!canNavigate.nextDiff}
          className="p-2 rounded-lg transition-all disabled:opacity-30"
          style={{ 
            backgroundColor: theme.colors.glass.light,
            color: canNavigate.nextDiff ? theme.colors.text.primary : theme.colors.text.muted
          }}
          title="Next different dice (same row)"
        >
          <ChevronsRight size={20} />
        </button>
      </div>

      {/* Progress Bar */}
      <ProgressBar percentage={(currentIndex / totalDice) * 100} />
    </div>
  )
}