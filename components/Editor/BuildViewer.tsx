/**
 * BuildViewer Component
 * 
 * Interactive viewer for the "build" step of the dice art creation process.
 * Think of this as a specialized viewport that lets users navigate through their 
 * dice grid one die at a time, similar to a turn-by-turn game board traversal.
 * 
 * Key features:
 * - SVG-based rendering (not Canvas) for crisp vector graphics
 * - ViewBox-based zooming (manipulates SVG viewport, not CSS transforms)
 * - Sequential navigation through dice with smart skip functionality
 * - Highlights current die position with glow effect and shows consecutive count
 * - Progress tracking from bottom-left (0%) to top-right (100%)
 * 
 * Navigation modes:
 * - Single step: Move one die at a time (arrow keys)
 * - Smart skip: Jump to next different die in same row (shift+arrow)
 * 
 * Technical notes:
 * - Uses coordinate system where bottom-left is Row 1, Col 1 (visual coordinates)
 * - Internally, array indices have bottom at index[length-1] (standard array indexing)
 * - ViewBox dynamically adjusts to show 5x5 dice window around current position
 */

'use client'

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { animate } from 'motion'
import { DiceGrid, Dice } from '@/lib/dice/types'
import { DiceSVGRenderer } from '@/lib/dice/svg-renderer'
import { theme } from '@/lib/theme'
import { overlayButtonStyles, getOverlayButtonStyle } from '@/lib/styles/overlay-buttons'

interface BuildViewerProps {
  grid: DiceGrid
  initialX?: number
  initialY?: number
  onPositionChange?: (x: number, y: number) => void
  onNavigationReady?: (handlers: {
    navigatePrev: () => void
    navigateNext: () => void
    navigatePrevDiff: () => void
    navigateNextDiff: () => void
    canNavigate: {
      prev: boolean
      next: boolean
      prevDiff: boolean
      nextDiff: boolean
    }
  }) => void
}

const BuildViewer = memo(function BuildViewer({
  grid, 
  initialX = 0, 
  initialY = 0, 
  onPositionChange,
  onNavigationReady 
}: BuildViewerProps) {
  
  console.log(`[BuildViewer] Rendering with grid ${grid.width}x${grid.height}, initial position (${initialX}, ${initialY})`)
  console.log('[DEBUG BuildViewer] Props received:', { initialX, initialY })
  
  // Use refs to track the initial values but don't use them as state initializers
  // This prevents re-renders when initialX/Y change
  const initialPositionRef = useRef({ x: initialX, y: initialY })
  
  // Now using x,y coordinates where (0,0) is bottom-left
  const [currentX, setCurrentX] = useState(() => initialPositionRef.current.x)
  const [currentY, setCurrentY] = useState(() => initialPositionRef.current.y)
  const totalCols = grid.width  // Number of columns (x-axis)
  const totalRows = grid.height // Number of rows (y-axis)
  
  // Performance monitoring
  const [showDebug, setShowDebug] = useState(false)
  const [fps, setFps] = useState(60)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  
  const [zoomLevel, setZoomLevel] = useState(8) // Number of dice to show horizontally
  const svgRendererRef = useRef<DiceSVGRenderer>()
  const [svgContent, setSvgContent] = useState<string>('')
  
  // Track viewBox with ref only - no React state to avoid re-renders
  const viewBoxRef = useRef(`0 0 ${totalCols} ${totalRows}`)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const animationRef = useRef<any>(null)
  const [containerDimensions, setContainerDimensions] = useState({ width: 600, height: 600 })
  
  // Update position when props change
  useEffect(() => {
    if (initialX !== undefined && initialY !== undefined) {
      setCurrentX(initialX)
      setCurrentY(initialY)
    }
  }, [initialX, initialY])

  // Calculate index for progress (counting from bottom-left as position 0)
  // Since (0,0) is now bottom-left, the index is straightforward
  const currentIndex = useMemo(() => currentY * totalCols + currentX, [currentY, totalCols, currentX])
  const totalDice = useMemo(() => totalRows * totalCols, [totalRows, totalCols])
  const currentDice = useMemo(() => grid.dice[currentX]?.[currentY] || null, [grid.dice, currentX, currentY])

  // Calculate consecutive count for current dice (on the same row/y-level)
  const getConsecutiveCount = () => {
    if (!currentDice) return 0
    
    let count = 1
    const currentFace = currentDice.face
    const currentColor = currentDice.color
    
    // Count forward along x-axis (same y)
    for (let x = currentX + 1; x < totalCols; x++) {
      const dice = grid.dice[x][currentY]
      if (dice.face === currentFace && dice.color === currentColor) {
        count++
      } else {
        break
      }
    }
    
    // Count backward along x-axis (same y)
    for (let x = currentX - 1; x >= 0; x--) {
      const dice = grid.dice[x][currentY]
      if (dice.face === currentFace && dice.color === currentColor) {
        count++
      } else {
        break
      }
    }
    
    return count
  }

  // Calculate and animate viewBox transition
  const buildZoom = useCallback(() => {
    // Calculate container aspect ratio
    const containerAspect = containerDimensions.width / containerDimensions.height
    
    // Calculate view dimensions - width based on zoom level, height based on aspect ratio
    let viewWidth = Math.min(zoomLevel, totalCols)
    let viewHeight = viewWidth / containerAspect
    
    // Adjust if height exceeds grid bounds
    if (viewHeight > totalRows) {
      viewHeight = totalRows
      viewWidth = viewHeight * containerAspect
    }
    
    // Ensure minimum view size
    viewWidth = Math.max(3, viewWidth)
    viewHeight = Math.max(3, viewHeight)
    
    // Convert our coordinate system to SVG coordinates
    const svgY = totalRows - 1 - currentY
    
    // Calculate position to center on current dice
    let viewX = currentX - viewWidth / 2
    let viewY = svgY - viewHeight / 2
    
    // Clamp to grid boundaries with extra padding for highlights
    const edgePadding = 0.1 // Extra space so highlights aren't cut off
    if (viewX < -edgePadding) viewX = -edgePadding
    if (viewX + viewWidth > totalCols + edgePadding) viewX = totalCols + edgePadding - viewWidth
    if (viewY < -edgePadding) viewY = -edgePadding
    if (viewY + viewHeight > totalRows + edgePadding) viewY = totalRows + edgePadding - viewHeight
    
    // Ensure current dice is visible with some padding
    const padding = 0.5
    if (currentX < viewX + padding) viewX = Math.max(-edgePadding, currentX - padding)
    if (currentX >= viewX + viewWidth - padding) viewX = Math.min(totalCols + edgePadding - viewWidth, currentX - viewWidth + 1 + padding)
    if (svgY < viewY + padding) viewY = Math.max(-edgePadding, svgY - padding)
    if (svgY >= viewY + viewHeight - padding) viewY = Math.min(totalRows + edgePadding - viewHeight, svgY - viewHeight + 1 + padding)
    
    const newViewBox = `${viewX} ${viewY} ${viewWidth} ${viewHeight}`
    
    // Parse current viewBox values from ref to avoid dependency cycle
    const currentValues = viewBoxRef.current.split(' ').map(Number)
    const targetValues = newViewBox.split(' ').map(Number)
    
    // Check for valid values
    if (currentValues.some(isNaN) || targetValues.some(isNaN)) {
      viewBoxRef.current = newViewBox
      if (svgRef.current) {
        svgRef.current.setAttribute('viewBox', newViewBox)
      }
      return
    }
    
    // If viewBox hasn't changed significantly, just update it
    if (Math.abs(currentValues[0] - targetValues[0]) < 0.01 &&
        Math.abs(currentValues[1] - targetValues[1]) < 0.01 &&
        Math.abs(currentValues[2] - targetValues[2]) < 0.01 &&
        Math.abs(currentValues[3] - targetValues[3]) < 0.01) {
      viewBoxRef.current = newViewBox
      if (svgRef.current) {
        svgRef.current.setAttribute('viewBox', newViewBox)
      }
      return
    }
    
    // Cancel any existing animation
    if (animationRef.current) {
      animationRef.current.stop()
    }
    
    // Use a single progress value to interpolate all viewBox values
    animationRef.current = animate(
      0,  // from progress
      1,  // to progress
      { 
        duration: 1, // 1 second animation
        ease: [0.25, 0.1, 0.25, 1], // Custom easing curve
        onUpdate: (progress) => {
          // Manually interpolate each value based on progress
          const x = currentValues[0] + (targetValues[0] - currentValues[0]) * progress
          const y = currentValues[1] + (targetValues[1] - currentValues[1]) * progress
          const width = currentValues[2] + (targetValues[2] - currentValues[2]) * progress
          const height = currentValues[3] + (targetValues[3] - currentValues[3]) * progress
          
          const interpolatedViewBox = `${x} ${y} ${width} ${height}`
          viewBoxRef.current = interpolatedViewBox
          
          // Update the SVG element directly - no React state
          if (svgRef.current) {
            svgRef.current.setAttribute('viewBox', interpolatedViewBox)
          }
        },
        onComplete: () => {
          // Ensure we end exactly at the target
          viewBoxRef.current = newViewBox
          if (svgRef.current) {
            svgRef.current.setAttribute('viewBox', newViewBox)
          }
        }
      }
    )
  }, [currentX, currentY, totalRows, totalCols, zoomLevel, containerDimensions.width, containerDimensions.height])

  // Initialize SVG renderer and generate SVG only when grid changes
  useEffect(() => {
    if (!svgRendererRef.current) {
      svgRendererRef.current = new DiceSVGRenderer()
    }
    
    // Generate SVG without highlighting (we handle it separately now)
    const svgResult = svgRendererRef.current.renderWithStats(grid)
    setSvgContent(svgResult.svg)
  }, [grid]) // Only regenerate when the grid actually changes!
  
  // Initial setup effect - run once on mount
  useEffect(() => {
    // Calculate initial viewBox without animation
    const containerAspect = containerDimensions.width / containerDimensions.height
    let viewWidth = Math.min(zoomLevel, totalCols)
    let viewHeight = viewWidth / containerAspect
    
    if (viewHeight > totalRows) {
      viewHeight = totalRows
      viewWidth = viewHeight * containerAspect
    }
    
    viewWidth = Math.max(3, viewWidth)
    viewHeight = Math.max(3, viewHeight)
    
    const svgY = totalRows - 1 - currentY
    let viewX = currentX - viewWidth / 2
    let viewY = svgY - viewHeight / 2
    
    const edgePadding = 0.1
    if (viewX < -edgePadding) viewX = -edgePadding
    if (viewX + viewWidth > totalCols + edgePadding) viewX = totalCols + edgePadding - viewWidth
    if (viewY < -edgePadding) viewY = -edgePadding
    if (viewY + viewHeight > totalRows + edgePadding) viewY = totalRows + edgePadding - viewHeight
    
    const padding = 0.5
    if (currentX < viewX + padding) viewX = Math.max(-edgePadding, currentX - padding)
    if (currentX >= viewX + viewWidth - padding) viewX = Math.min(totalCols + edgePadding - viewWidth, currentX - viewWidth + 1 + padding)
    if (svgY < viewY + padding) viewY = Math.max(-edgePadding, svgY - padding)
    if (svgY >= viewY + viewHeight - padding) viewY = Math.min(totalRows + edgePadding - viewHeight, svgY - viewHeight + 1 + padding)
    
    const initialViewBox = `${viewX} ${viewY} ${viewWidth} ${viewHeight}`
    viewBoxRef.current = initialViewBox
    // Set initial viewBox directly on the SVG element after it mounts
    setTimeout(() => {
      if (svgRef.current) {
        svgRef.current.setAttribute('viewBox', initialViewBox)
      }
    }, 0)
  }, []) // Run only once on mount
  
  // Track container dimensions
  useEffect(() => {
    if (!containerRef.current) return
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setContainerDimensions({ width, height })
      }
    })
    
    resizeObserver.observe(containerRef.current)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [])


  // Rebuild viewBox when container dimensions or zoom changes
  useEffect(() => {
    buildZoom()
  }, [buildZoom, containerDimensions, zoomLevel])

  // Navigation functions (build order: left to right, bottom to top)
  const navigatePrev = useCallback(() => {
    if (currentX > 0) {
      setCurrentX(currentX - 1)
    } else if (currentY > 0) {
      // Use functional updates to ensure batching
      setCurrentY(prev => prev - 1)
      setCurrentX(totalCols - 1)
    }
  }, [currentX, currentY, totalCols])

  const navigateNext = useCallback(() => {
    if (currentX < totalCols - 1) {
      setCurrentX(currentX + 1)
    } else if (currentY < totalRows - 1) {
      // Use functional updates to ensure batching
      setCurrentY(prev => prev + 1)
      setCurrentX(0)
    }
  }, [currentX, currentY, totalCols, totalRows])

  const navigatePrevDiff = useCallback(() => {
    // Find previous different dice on same row first
    const currentFace = currentDice?.face
    const currentColor = currentDice?.color
    
    for (let x = currentX - 1; x >= 0; x--) {
      const dice = grid.dice[x][currentY]
      if (dice.face !== currentFace || dice.color !== currentColor) {
        setCurrentX(x)
        return
      }
    }
    
    // If no different dice found on this row and not at first row, move to previous row
    if (currentY > 0) {
      // Batch both state updates together
      setCurrentY(currentY - 1)
      setCurrentX(totalCols - 1)
    }
  }, [currentX, currentY, currentDice, totalCols, grid.dice])

  const navigateNextDiff = useCallback(() => {
    // Find next different dice on same row first
    const currentFace = currentDice?.face
    const currentColor = currentDice?.color
    
    for (let x = currentX + 1; x < totalCols; x++) {
      const dice = grid.dice[x][currentY]
      if (dice.face !== currentFace || dice.color !== currentColor) {
        setCurrentX(x)
        return
      }
    }
    
    // If no different dice found on this row and not at last row, move to next row
    if (currentY < totalRows - 1) {
      // Batch both state updates together
      setCurrentY(currentY + 1)
      setCurrentX(0)
    }
  }, [currentX, currentY, currentDice, totalCols, totalRows, grid.dice])

  // Check if navigation is possible - memoize to prevent recreation
  const canNavigate = useMemo(() => ({
    prev: currentIndex > 0,
    next: currentIndex < totalDice - 1,
    prevDiff: (() => {
      const currentFace = currentDice?.face
      const currentColor = currentDice?.color
      // Check if there's a different dice on the same row
      for (let x = currentX - 1; x >= 0; x--) {
        const dice = grid.dice[x]?.[currentY]
        if (dice && (dice.face !== currentFace || dice.color !== currentColor)) {
          return true
        }
      }
      // Or if we can move to previous row
      return currentY > 0
    })(),
    nextDiff: (() => {
      const currentFace = currentDice?.face
      const currentColor = currentDice?.color
      // Check if there's a different dice on the same row
      for (let x = currentX + 1; x < totalCols; x++) {
        const dice = grid.dice[x]?.[currentY]
        if (dice && (dice.face !== currentFace || dice.color !== currentColor)) {
          return true
        }
      }
      // Or if we can move to next row
      return currentY < totalRows - 1
    })()
  }), [currentIndex, totalDice, currentDice, currentX, currentY, totalCols, totalRows, grid.dice])

  const handleNavigate = (direction: 'prev' | 'next' | 'prevDiff' | 'nextDiff') => {
    switch (direction) {
      case 'prev':
        navigatePrev()
        break
      case 'next':
        navigateNext()
        break
      case 'prevDiff':
        navigatePrevDiff()
        break
      case 'nextDiff':
        navigateNextDiff()
        break
    }
  }

  // Notify parent when position changes - use ref to track last notified position
  const lastNotifiedPosition = useRef({ x: currentX, y: currentY })
  
  useEffect(() => {
    if (onPositionChange && 
        (lastNotifiedPosition.current.x !== currentX || 
         lastNotifiedPosition.current.y !== currentY)) {
      lastNotifiedPosition.current = { x: currentX, y: currentY }
      onPositionChange(currentX, currentY)
    }
  }, [currentX, currentY, onPositionChange])

  // Expose navigation handlers to parent - memoize the entire object
  const navigationHandlers = useMemo(() => ({
    navigatePrev,
    navigateNext,
    navigatePrevDiff,
    navigateNextDiff,
    canNavigate
  }), [navigatePrev, navigateNext, navigatePrevDiff, navigateNextDiff, canNavigate])
  
  // Call onNavigationReady whenever navigation handlers change
  useEffect(() => {
    if (onNavigationReady) {
      onNavigationReady(navigationHandlers)
    }
  }, [onNavigationReady, navigationHandlers])

  // FPS monitoring
  useEffect(() => {
    if (!showDebug) return
    
    let animationId: number
    const measureFPS = () => {
      frameCountRef.current++
      const now = performance.now()
      const delta = now - lastTimeRef.current
      
      if (delta >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / delta))
        frameCountRef.current = 0
        lastTimeRef.current = now
      }
      
      animationId = requestAnimationFrame(measureFPS)
    }
    
    animationId = requestAnimationFrame(measureFPS)
    return () => cancelAnimationFrame(animationId)
  }, [showDebug])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Toggle debug with 'D' key
      if (e.key === 'd' || e.key === 'D') {
        setShowDebug(prev => !prev)
        return
      }
      
      switch (e.key) {
        case 'ArrowLeft':
          if (e.shiftKey && canNavigate.prevDiff) {
            navigatePrevDiff()
          } else if (canNavigate.prev) {
            navigatePrev()
          }
          break
        case 'ArrowRight':
          if (e.shiftKey && canNavigate.nextDiff) {
            navigateNextDiff()
          } else if (canNavigate.next) {
            navigateNext()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [canNavigate, navigatePrev, navigateNext, navigatePrevDiff, navigateNextDiff])

  return (
    <div className="flex w-full justify-center">
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="w-full" style={{ minWidth: '320px', maxWidth: '720px' }}>
        <div 
            ref={containerRef}
            className="relative backdrop-blur-xl rounded-2xl border overflow-hidden w-full"
            style={{ 
              backgroundColor: theme.colors.glass.medium,
              borderColor: theme.colors.glass.border,
              width: '100%',
              minWidth: '320px',
              maxWidth: '720px',
              height: '600px'
            }}
          >
            {/* SVG Container - viewBox animates smoothly over 1 second */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                ref={svgRef}
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
                style={{ width: '100%', height: '100%', imageRendering: 'crisp-edges', willChange: 'transform' }}
              >
                {/* Render dice content */}
                <g dangerouslySetInnerHTML={{ __html: svgContent }} />
                
                {/* Secondary rectangle over consecutive dice group (rendered behind highlight) */}
                {currentDice && (() => {
                  // Find the extent of consecutive dice backward and forward
                  const currentFace = currentDice.face
                  const currentColor = currentDice.color
                  
                  // Count backward
                  let startX = currentX
                  for (let x = currentX - 1; x >= 0; x--) {
                    const dice = grid.dice[x][currentY]
                    if (dice.face === currentFace && dice.color === currentColor) {
                      startX = x
                    } else {
                      break
                    }
                  }
                  
                  // Count forward
                  let endX = currentX
                  for (let x = currentX + 1; x < totalCols; x++) {
                    const dice = grid.dice[x][currentY]
                    if (dice.face === currentFace && dice.color === currentColor) {
                      endX = x
                    } else {
                      break
                    }
                  }
                  
                  const groupWidth = endX - startX + 1
                  
                  // Always render the rectangle, it will be same size as highlight when groupWidth is 1
                  return (
                    <rect
                      x={startX + 0.02}
                      y={totalRows - 1 - currentY + 0.02}
                      width={groupWidth - 0.04}
                      height={1 - 0.04}
                      fill={theme.colors.accent.pink}
                      fillOpacity="0.1"
                      stroke={theme.colors.accent.purple}
                      strokeWidth="0.06"
                      strokeOpacity="1"
                      rx="0.1"
                      style={{
                        transition: 'x 0.5s cubic-bezier(0.4, 0, 0.2, 1), y 0.5s cubic-bezier(0.4, 0, 0.2, 1), width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        willChange: 'x, y, width'
                      }}
                    />
                  )
                })()}
                
                {/* Animated highlight overlay (rendered on top) */}
                <rect
                  x={currentX + 0.02}
                  y={totalRows - 1 - currentY + 0.02}
                  width={0.96}
                  height={0.96}
                  fill={theme.colors.accent.blue}
                  fillOpacity="0.2"
                  stroke={theme.colors.dice.highlightColor}
                  strokeWidth="0.06"
                  rx="0.1"
                  style={{
                    transition: 'x 0.5s cubic-bezier(0.4, 0, 0.2, 1), y 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: 'drop-shadow(0 0 2px rgba(100, 149, 255, 0.8))',
                    willChange: 'x, y'
                  }}
                />
                
                {/* Consecutive count badges */}
                {currentDice && (() => {
                  // Find the extent of consecutive dice
                  const currentFace = currentDice.face
                  const currentColor = currentDice.color
                  
                  // Count backward to get total group width
                  let startX = currentX
                  for (let x = currentX - 1; x >= 0; x--) {
                    const dice = grid.dice[x][currentY]
                    if (dice.face === currentFace && dice.color === currentColor) {
                      startX = x
                    } else {
                      break
                    }
                  }
                  
                  // Count forward for both group width and consecutive forward count
                  let endX = currentX
                  let consecutiveForward = 0
                  for (let x = currentX + 1; x < totalCols; x++) {
                    const dice = grid.dice[x][currentY]
                    if (dice.face === currentFace && dice.color === currentColor) {
                      endX = x
                      consecutiveForward++
                    } else {
                      break
                    }
                  }
                  
                  const groupWidth = endX - startX + 1
                  
                  // Show badge only when part of a group (groupWidth > 1)
                  const showBadge = groupWidth > 1
                  
                  // Position badges
                  let blueBadgeX = currentX + 0.5 // Center horizontally for blue badge
                  let purpleBadgeX = startX + 0.5 // First dice position for purple badge
                  let badgeY = totalRows - 1 - currentY - 0.32 // Above the dice
                  
                  // Adjust position if at edges
                  const isAtTopEdge = currentY >= totalRows - 2
                  
                  if (isAtTopEdge) {
                    badgeY = totalRows - 1 - currentY + 1.3 // Move below
                  }
                  
                  // Determine stick direction based on badge position
                  const stickY1 = isAtTopEdge ? -0.20 : 0.20 // Start from top if badge is below
                  const stickY2 = isAtTopEdge ? -0.35 : 0.35 // End at dice
                  const stickY1Blue = isAtTopEdge ? -0.22 : 0.22 // Slightly bigger for blue badge
                  
                  if (!showBadge) return null
                  
                  return (
                    <>
                      {/* Purple badge showing total group width (rendered first, so it's behind) */}
                      {(
                        <g 
                          transform={`translate(${purpleBadgeX}, ${badgeY})`}
                          style={{
                            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          <g>
                            <circle 
                              cx="0" 
                              cy="0" 
                              r="0.20" 
                              fill={theme.colors.accent.purple} 
                              fillOpacity="0.9"
                              stroke={theme.colors.accent.purple} 
                              strokeWidth="0.04"
                              strokeOpacity="1"
                            />
                            
                            <line 
                              x1="0" 
                              y1={stickY1} 
                              x2="0" 
                              y2={stickY2} 
                              stroke={theme.colors.accent.purple} 
                              strokeWidth="0.1"
                              strokeOpacity="1"
                            />
                            
                            <text x="0" y="0.05" fontSize="0.16" fill="#fff" textAnchor="middle">
                              &times;{groupWidth}
                            </text>
                          </g>
                        </g>
                      )}
                      

                      {/* Blue badge showing consecutive forward count (rendered second, so it's on top) */}
                      <g 
                        transform={`translate(${blueBadgeX}, ${badgeY})`}
                        style={{
                          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <g>
                          <circle 
                            cx="0" 
                            cy="0" 
                            r="0.22" 
                            fill={theme.colors.accent.blue} 
                            fillOpacity="0.9"
                            stroke={theme.colors.accent.blue} 
                            strokeWidth="0.04"
                            strokeOpacity="1"
                          />
                          
                          <line 
                            x1="0" 
                            y1={stickY1Blue} 
                            x2="0" 
                            y2={stickY2} 
                            stroke={theme.colors.accent.blue} 
                            strokeWidth="0.1"
                            strokeOpacity="1"
                          />
                          
                          <text x="0" y="0.05" fontSize="0.16" fill="#fff" textAnchor="middle">
                            &times;{consecutiveForward+1}
                          </text>
                        </g>
                      </g>
                    </>
                  )
                })()}
              </svg>
            </div>


            {/* Zoom Controls */}
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              <button
                onClick={() => setZoomLevel(Math.min(20, zoomLevel + 2))}
                className={`${overlayButtonStyles.button} text-white text-xl font-bold`}
                style={getOverlayButtonStyle('zoom', false, theme)}
              >
                −
              </button>
              <button
                onClick={() => setZoomLevel(Math.max(4, zoomLevel - 2))}
                className={`${overlayButtonStyles.button} text-white text-xl font-bold`}
                style={getOverlayButtonStyle('zoom', false, theme)}
              >
                +
              </button>
            </div>
            
            
            {/* Debug Overlay */}
            {showDebug && (
              <div className="absolute top-4 left-4 backdrop-blur-md rounded-lg p-3 font-mono text-xs"
                   style={{ 
                     backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                     border: '1px solid rgba(255, 255, 255, 0.2)' 
                   }}>
                <div className="text-green-400">FPS: {fps}</div>
                <div className="text-blue-400">Position: ({currentX}, {currentY})</div>
                <div className="text-yellow-400">Zoom: {zoomLevel}</div>
                <div className="text-purple-400">ViewBox: {viewBoxRef.current.split(' ').map(n => parseFloat(n).toFixed(1)).join(' ')}</div>
                <div className="text-gray-400 mt-2">Press 'D' to toggle</div>
              </div>
            )}
          </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if grid actually changes
  // Ignore callback reference changes and position changes since component manages its own state
  const gridEqual = prevProps.grid === nextProps.grid
  const initialXEqual = prevProps.initialX === nextProps.initialX
  const initialYEqual = prevProps.initialY === nextProps.initialY
  const onPositionChangeEqual = prevProps.onPositionChange === nextProps.onPositionChange
  const onNavigationReadyEqual = prevProps.onNavigationReady === nextProps.onNavigationReady
  
  // Only re-render if the grid object itself changes
  // Ignore initialX/initialY changes since the component tracks position internally
  return gridEqual // Grid hasn't changed, skip re-render
})

export default BuildViewer