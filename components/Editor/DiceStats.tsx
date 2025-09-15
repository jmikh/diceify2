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
import { useEffect, useRef, memo } from 'react'

interface DiceStatsProps {
  blackCount: number
  whiteCount: number
  totalCount: number
  gridWidth?: number
  gridHeight?: number
  frameWidth?: number  // in cm
  frameHeight?: number  // in cm
  dieSize?: number
  costPer1000?: number
  onDieSizeChange?: (size: number) => void
  onCostPer1000Change?: (cost: number) => void
  imageUrl?: string  // Preview image URL
}

const DiceStats = memo(function DiceStats({
  blackCount, 
  whiteCount, 
  totalCount,
  gridWidth,
  gridHeight,
  frameWidth,
  frameHeight,
  dieSize = 16,
  costPer1000 = 60,
  onDieSizeChange,
  onCostPer1000Change,
  imageUrl
}: DiceStatsProps) {
  // Track previous values for smooth transitions
  const prevCountRef = useRef(totalCount)
  const prevBlackRef = useRef(blackCount)
  const prevWhiteRef = useRef(whiteCount)
  const prevGridWidthRef = useRef(gridWidth || 0)
  const prevGridHeightRef = useRef(gridHeight || 0)
  const prevCostRef = useRef((totalCount / 1000) * costPer1000)
  
  // Calculate current cost
  const currentCost = (totalCount / 1000) * costPer1000
  
  useEffect(() => {
    prevCountRef.current = totalCount
    prevBlackRef.current = blackCount
    prevWhiteRef.current = whiteCount
    if (gridWidth) prevGridWidthRef.current = gridWidth
    if (gridHeight) prevGridHeightRef.current = gridHeight
    prevCostRef.current = currentCost
  }, [totalCount, blackCount, whiteCount, gridWidth, gridHeight, currentCost])
  
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
      {/* Total dice count - at the very top */}
      <div className="text-center mb-3">
        <div className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
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
        <div className="text-xs" style={{ color: theme.colors.text.muted }}>total dice</div>
      </div>

      {/* Proportional bar */}
      <div className="h-4 rounded-lg overflow-hidden flex mb-2 border" style={{
        backgroundColor: theme.colors.glass.light,
        borderColor: 'rgba(255, 255, 255, 0.2)'
      }}>
        {totalCount > 0 && (
          <>
            <div
              className="bg-black transition-all"
              style={{
                width: `${(blackCount / totalCount) * 100}%`
              }}
            />
            <div
              className="bg-white transition-all"
              style={{
                width: `${(whiteCount / totalCount) * 100}%`
              }}
            />
          </>
        )}
      </div>

      <div className="flex justify-between text-xs mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: 'black', borderColor: 'rgba(255, 255, 255, 0.2)' }} />
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
          <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: 'white', borderColor: 'rgba(255, 255, 255, 0.2)' }} />
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

      {/* Die Size Input */}
      {onDieSizeChange && (
        <div className="pt-3 mb-3 border-t" style={{ borderColor: theme.colors.glass.border }}>
          <div className="flex items-center justify-between">
            <label className="text-xs" style={{ color: theme.colors.text.secondary }}>
              Die Size
            </label>
            <div className="relative">
              <input
                type="number"
                value={dieSize}
                onChange={(e) => onDieSizeChange(Math.max(1, Math.min(50, parseInt(e.target.value) || 16)))}
                className="w-20 pl-2 pr-7 py-0.5 text-xs rounded border"
                style={{
                  backgroundColor: theme.colors.glass.light,
                  borderColor: theme.colors.glass.border,
                  color: theme.colors.text.primary
                }}
                min="1"
                max="50"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: theme.colors.text.muted }}>mm</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid dimensions visualization */}
      {gridWidth && gridHeight && (
        <div className="mb-1 flex justify-center">
          <div className="relative" style={{ paddingLeft: '45px', paddingBottom: '40px', paddingTop: '35px', paddingRight: '55px' }}>
            {/* Rectangle with dimensions */}
            <div 
              className="relative border-2 flex items-center justify-center overflow-hidden"
              style={{ 
                borderColor: theme.colors.glass.border,
                width: `${rectWidth}px`,
                height: `${rectHeight}px`,
                backgroundColor: theme.colors.glass.light
              }}
            >
              {/* Grayscale image preview */}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    filter: 'grayscale(100%)',
                    opacity: 1
                  }}
                />
              )}
            </div>
            
            {/* Labels positioned outside the rectangle */}
            {/* Grid Width label at bottom */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 text-xs"
              style={{ 
                color: theme.colors.text.secondary,
                bottom: '16px'
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
            
            {/* Grid Height label on left */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 text-xs"
              style={{ 
                color: theme.colors.text.secondary,
                left: '17px'
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
            
            {/* Frame Width label at top */}
            {frameWidth && (
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap"
                style={{ 
                  color: theme.colors.text.muted,
                  top: '11px'
                }}
              >
                {frameWidth.toFixed(1)} cm
              </div>
            )}
            
            {/* Frame Height label on right */}
            {frameHeight && (
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 text-xs whitespace-nowrap"
                style={{ 
                  color: theme.colors.text.muted,
                  right: '0px'
                }}
              >
                {frameHeight.toFixed(1)} cm
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cost Calculator */}
      {onCostPer1000Change && (
        <div className="pt-3 mt-3 border-t" style={{ borderColor: theme.colors.glass.border }}>
          <div className="space-y-2">
            {/* Cost Input */}
            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: theme.colors.text.secondary }}>
                cost / 1000
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: theme.colors.text.muted }}>$</span>
                <input
                  type="number"
                  value={costPer1000}
                  onChange={(e) => onCostPer1000Change(Math.max(1, Math.min(999, parseInt(e.target.value) || 60)))}
                  className="w-20 pl-6 pr-2 py-0.5 text-xs rounded border"
                  style={{ 
                    backgroundColor: theme.colors.glass.light,
                    borderColor: theme.colors.glass.border,
                    color: theme.colors.text.primary
                  }}
                  min="1"
                  max="999"
                />
              </div>
            </div>
            
            {/* Estimated Cost */}
            <div className="flex justify-between text-xs">
              <span style={{ color: theme.colors.text.muted }}>Estimated Cost:</span>
              <span className="font-semibold" style={{ color: theme.colors.accent.green }}>
                $<CountUp
                  start={prevCostRef.current}
                  end={currentCost}
                  duration={1}
                  decimals={0}
                  useEasing={true}
                  easingFn={easeOutCubic}
                  preserveValue={true}
                />
              </span>
            </div>

            {/* Amazon Buy Button */}
            <div className="flex justify-center mt-6">
              <a
                href="https://amzn.to/3VRTOMM"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80 border"
                style={{
                  backgroundColor: theme.colors.glass.light,
                  borderColor: 'rgba(255, 153, 0, 0.2)',
                  color: theme.colors.text.secondary
                }}
              >
                <img
                  src="/images/amazon-smile.png"
                  alt="Amazon"
                  className="h-4 w-4"
                  style={{ filter: 'brightness(0) saturate(100%) invert(69%) sepia(89%) saturate(1517%) hue-rotate(360deg) brightness(107%) contrast(106%)' }}
                />
                <span className="text-xs">Buy Dice on Amazon</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default DiceStats