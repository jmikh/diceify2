/**
 * DiceStats Component
 * 
 * Reusable statistics display component that visualizes dice distribution.
 * Think of this as a simple analytics dashboard widget that shows the 
 * composition breakdown of your dice grid.
 * 
 * Displays:
 * - Total dice count (prominently featured)
 * - Black vs White dice counts with percentages
 * - Visual percentage bar showing the distribution ratio
 * 
 * This is a pure presentation component (stateless) - it just receives
 * counts and renders them. Used in multiple places throughout the app
 * where dice statistics need to be shown.
 * 
 * The percentage bar provides immediate visual feedback about the 
 * balance between black and white dice in the artwork.
 */

'use client'

import { theme } from '@/lib/theme'
import CountUp from 'react-countup'
import { useEffect, useRef } from 'react'

interface DiceStatsProps {
  blackCount: number
  whiteCount: number
  totalCount: number
  gridWidth?: number
  gridHeight?: number
  frameWidth?: number  // in cm
  frameHeight?: number  // in cm
}

export default function DiceStats({ 
  blackCount, 
  whiteCount, 
  totalCount,
  gridWidth,
  gridHeight,
  frameWidth,
  frameHeight
}: DiceStatsProps) {
  // Log re-renders
  console.log('DiceStats re-rendered:', {
    totalCount,
    blackCount,
    whiteCount,
    gridWidth,
    gridHeight,
    frameWidth,
    frameHeight
  })
  
  // Track previous values for smooth transitions
  const prevCountRef = useRef(totalCount)
  const prevBlackRef = useRef(blackCount)
  const prevWhiteRef = useRef(whiteCount)
  const prevGridWidthRef = useRef(gridWidth || 0)
  const prevGridHeightRef = useRef(gridHeight || 0)
  
  useEffect(() => {
    prevCountRef.current = totalCount
    prevBlackRef.current = blackCount
    prevWhiteRef.current = whiteCount
    if (gridWidth) prevGridWidthRef.current = gridWidth
    if (gridHeight) prevGridHeightRef.current = gridHeight
  }, [totalCount, blackCount, whiteCount, gridWidth, gridHeight])
  
  // Ease-out cubic function for smooth deceleration
  const easeOutCubic = (t: number, b: number, c: number, d: number) => {
    return c * ((t = t / d - 1) * t * t + 1) + b
  }
  
  // Calculate aspect ratio and scale the rectangle appropriately
  const aspectRatio = gridWidth && gridHeight ? gridWidth / gridHeight : 1
  const padding = 16 // Internal padding
  const maxContentWidth = 140  // Max content area width
  const maxContentHeight = 80   // Max content area height
  
  let contentWidth = maxContentWidth
  let contentHeight = maxContentWidth / aspectRatio
  
  // If height exceeds max, scale by height instead
  if (contentHeight > maxContentHeight) {
    contentHeight = maxContentHeight
    contentWidth = maxContentHeight * aspectRatio
  }
  
  // Ensure minimum size for content
  contentWidth = Math.max(contentWidth, 60)
  contentHeight = Math.max(contentHeight, 40)
  
  // Total rectangle dimensions including padding
  const rectWidth = contentWidth + (padding * 2)
  const rectHeight = contentHeight + (padding * 2)
  
  return (
    <div>
      {/* Grid dimensions visualization */}
      {gridWidth && gridHeight && (
        <div className="mb-8 flex justify-center">
          <div className="relative" style={{ paddingLeft: '45px', paddingBottom: '40px', paddingTop: '35px', paddingRight: '55px' }}>
            {/* Rectangle with dimensions */}
            <div 
              className="relative border-2 flex items-center justify-center"
              style={{ 
                borderColor: theme.colors.glass.border,
                width: `${rectWidth}px`,
                height: `${rectHeight}px`,
                backgroundColor: theme.colors.glass.light
              }}
            >
              {/* Total count inside */}
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: theme.colors.accent.blue }}>
                  <CountUp
                    start={prevCountRef.current}
                    end={totalCount}
                    duration={1.5}
                    separator=","
                    useEasing={true}
                    easingFn={easeOutCubic}
                    preserveValue={true}
                  />
                </div>
                <div className="text-xs" style={{ color: theme.colors.text.muted }}>total</div>
              </div>
              
              {/* Grid Width label at bottom (inside) */}
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 text-xs"
                style={{ 
                  color: theme.colors.text.secondary,
                  bottom: '-24px'
                }}
              >
                <CountUp
                  start={prevGridWidthRef.current}
                  end={gridWidth || 0}
                  duration={1}
                  useEasing={true}
                  easingFn={easeOutCubic}
                  preserveValue={true}
                />
              </div>
              
              {/* Grid Height label on left (inside) */}
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 text-xs"
                style={{ 
                  color: theme.colors.text.secondary,
                  left: '-28px'
                }}
              >
                <CountUp
                  start={prevGridHeightRef.current}
                  end={gridHeight || 0}
                  duration={1}
                  useEasing={true}
                  easingFn={easeOutCubic}
                  preserveValue={true}
                />
              </div>
              
              {/* Frame Width label at top (outside) */}
              {frameWidth && (
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap"
                  style={{ 
                    color: theme.colors.text.muted,
                    top: '-24px'
                  }}
                >
                  {frameWidth.toFixed(1)} cm
                </div>
              )}
              
              {/* Frame Height label on right (outside) */}
              {frameHeight && (
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 text-xs whitespace-nowrap"
                  style={{ 
                    color: theme.colors.text.muted,
                    right: '-56px'
                  }}
                >
                  {frameHeight.toFixed(1)} cm
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Fallback for when no dimensions */}
      {(!gridWidth || !gridHeight) && (
        <div className="text-center mb-3">
          <div className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
            <CountUp
              start={prevCountRef.current}
              end={totalCount}
              duration={1}
              separator=","
              useEasing={true}
              easingFn={easeOutCubic}
              preserveValue={true}
            />
          </div>
          <div className="text-xs" style={{ color: theme.colors.text.muted }}>dice</div>
        </div>
      )}
      
      {/* Proportional bar */}
      <div className="h-8 rounded-lg overflow-hidden flex mb-2" style={{ backgroundColor: theme.colors.glass.light }}>
        {totalCount > 0 && (
          <>
            <div 
              className="bg-black flex items-center justify-center text-white text-xs font-bold transition-all"
              style={{ 
                width: `${(blackCount / totalCount) * 100}%`,
                minWidth: blackCount > 0 ? '40px' : '0'
              }}
            >
              {blackCount > 0 && `${((blackCount / totalCount) * 100).toFixed(0)}%`}
            </div>
            <div 
              className="bg-white flex items-center justify-center text-black text-xs font-bold transition-all"
              style={{ 
                width: `${(whiteCount / totalCount) * 100}%`,
                minWidth: whiteCount > 0 ? '40px' : '0'
              }}
            >
              {whiteCount > 0 && `${((whiteCount / totalCount) * 100).toFixed(0)}%`}
            </div>
          </>
        )}
      </div>
      
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'black' }} />
          <span style={{ color: theme.colors.text.secondary }}>
            <CountUp
              start={prevBlackRef.current}
              end={blackCount}
              duration={1}
              separator=","
              useEasing={true}
              easingFn={easeOutCubic}
              preserveValue={true}
            />
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: 'white', borderColor: theme.colors.glass.border }} />
          <span style={{ color: theme.colors.text.secondary }}>
            <CountUp
              start={prevWhiteRef.current}
              end={whiteCount}
              duration={1}
              separator=","
              useEasing={true}
              easingFn={easeOutCubic}
              preserveValue={true}
            />
          </span>
        </div>
      </div>
    </div>
  )
}