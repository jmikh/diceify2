/**
 * DiceCanvas Component
 * 
 * Main rendering engine for the dice art generation step.
 * This component handles the heavy lifting of converting an image into a grid of dice.
 * 
 * Core responsibilities:
 * - Takes cropped image data and converts it to grayscale
 * - Maps brightness values to dice faces (1-6 dots, black or white)
 * - Renders dice grid using HTML5 Canvas API for performance
 * - Handles viewport-based rendering (only draws visible dice)
 * - Manages zoom, pan, and rotation interactions
 * 
 * Rendering Pipeline:
 * 1. Image → Grayscale conversion
 * 2. Brightness → Dice mapping (based on color mode)
 * 3. Progressive rendering with requestAnimationFrame
 * 4. Viewport culling for performance
 * 
 * Performance optimizations:
 * - Pre-caches dice images as ImageBitmap objects
 * - Only renders dice within viewport + buffer
 * - Uses OffscreenCanvas for dice preparation
 * - Batches draw operations by dice type
 * 
 * Supports three color modes:
 * - Black & White: Full tonal range using both dice colors
 * - Black Only: Maps all brightness to black dice (1=dark, 6=light)
 * - White Only: Maps all brightness to white dice (6=dark, 1=light)
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { DiceParams, DiceStats, WorkflowStep } from '@/lib/types'
import { DiceGenerator } from '@/lib/dice/generator'
import { DiceRenderer } from '@/lib/dice/renderer'
import { DiceSVGRenderer } from '@/lib/dice/svg-renderer'
import { DiceGrid } from '@/lib/dice/types'
import { theme } from '@/lib/theme'
import { Eye, Download } from 'lucide-react'
import { overlayButtonStyles, getOverlayButtonStyle } from '@/lib/styles/overlay-buttons'

interface DiceCanvasProps {
  imageUrl: string
  params: DiceParams
  onStatsUpdate: (stats: DiceStats) => void
  onGridUpdate?: (grid: DiceGrid) => void
  onProcessedImageReady?: (dataUrl: string) => void
  maxWidth?: number
  maxHeight?: number
  currentStep?: WorkflowStep
  cropArea?: { x: number, y: number, width: number, height: number } | null
}

export default function DiceCanvas({
  imageUrl, params, onStatsUpdate, onGridUpdate, onProcessedImageReady, maxWidth = 700, maxHeight = 500, currentStep, cropArea }: DiceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showGrayscale, setShowGrayscale] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>()
  const [grayscaleImage, setGrayscaleImage] = useState<string | null>(null)
  const [renderMode, setRenderMode] = useState<'canvas' | 'svg'>('canvas')
  const [svgContent, setSvgContent] = useState<string>('')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number } | null>(null)
  const generatorRef = useRef<DiceGenerator>()
  const rendererRef = useRef<DiceRenderer>()
  const svgRendererRef = useRef<DiceSVGRenderer>()
  const currentGridRef = useRef<DiceGrid | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const isInitializedRef = useRef(false)

  // Initialize once on mount
  useEffect(() => {
    if (!canvasRef.current || isInitializedRef.current) return

    generatorRef.current = new DiceGenerator()
    rendererRef.current = new DiceRenderer(canvasRef.current)
    svgRendererRef.current = new DiceSVGRenderer()
    isInitializedRef.current = true
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const generateDiceArt = useCallback(async (forceCanvas = false) => {
    if (!generatorRef.current || !rendererRef.current || !canvasRef.current) return

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      // Generate grayscale preview
      const grayscale = await generatorRef.current.generateGrayscalePreview(
        imageUrl,
        params.numRows,
        params.contrast,
        params.gamma,
        params.edgeSharpening,
        cropArea
      )
      setGrayscaleImage(grayscale)
      
      // Generate dice grid
      const grid = await generatorRef.current.generateDiceGrid(
        imageUrl,
        params.numRows,
        params.colorMode,
        params.contrast,
        params.gamma,
        params.edgeSharpening,
        params.rotate6,
        params.rotate3,
        params.rotate2,
        cropArea
      )

      // Store current grid
      currentGridRef.current = grid

      // Calculate and update stats
      const stats = generatorRef.current.calculateStats(grid)
      onStatsUpdate(stats)
      
      // Pass grid to parent if callback provided
      if (onGridUpdate) {
        onGridUpdate(grid)
      }

      // Always render canvas (it's faster and needed for initial display)
      await rendererRef.current.initialize()
      rendererRef.current.render(grid, 1, maxWidth, maxHeight)
      
      // Store canvas dimensions for consistent sizing
      if (canvasRef.current) {
        setCanvasDimensions({
          width: canvasRef.current.width,
          height: canvasRef.current.height
        })
        
        // Extract canvas data URL and pass to parent
        if (onProcessedImageReady) {
          const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8)
          onProcessedImageReady(dataUrl)
        }
      }
      
      // Never auto-generate SVG - only on explicit mode switch
      
      setProgress(100)
    } catch (error) {
      console.error('Error generating dice art:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [imageUrl, params.numRows, params.colorMode, params.contrast, params.gamma, params.edgeSharpening, params.rotate6, params.rotate3, params.rotate2, onStatsUpdate, onGridUpdate, onProcessedImageReady, maxWidth, maxHeight])

  // Initial generation when component mounts with image
  useEffect(() => {
    if (isInitializedRef.current && imageUrl) {
      generateDiceArt()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  // Debounced parameter updates
  useEffect(() => {
    if (!isInitializedRef.current) return
    
    // Clear SVG content when parameters change (force regeneration)
    setSvgContent('')
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout - always generate canvas for smooth sliders
    timeoutRef.current = setTimeout(() => {
      generateDiceArt(true) // Force canvas only for parameter changes
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.numRows, params.colorMode, params.contrast, params.gamma, params.edgeSharpening, params.rotate6, params.rotate3, params.rotate2])

  // Generate SVG only when switching to SVG mode
  useEffect(() => {
    if (renderMode === 'svg' && currentGridRef.current && svgRendererRef.current && !svgContent) {
      // Generate SVG from existing grid
      const svgResult = svgRendererRef.current.renderWithStats(currentGridRef.current)
      setSvgContent(svgResult.svg)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderMode])

  const handleDownload = async () => {
    if (renderMode === 'canvas' && !rendererRef.current) return
    if (renderMode === 'svg' && !svgContent) return

    try {
      if (renderMode === 'canvas' && rendererRef.current && canvasRef.current) {
        // Create a new canvas for the watermarked image
        const watermarkCanvas = document.createElement('canvas')
        const watermarkCtx = watermarkCanvas.getContext('2d')
        if (!watermarkCtx) return

        // Set canvas size to match the original
        watermarkCanvas.width = canvasRef.current.width
        watermarkCanvas.height = canvasRef.current.height

        // Draw the original dice art
        watermarkCtx.drawImage(canvasRef.current, 0, 0)

        // Add watermark only in tune step
        if (currentStep === 'tune') {
          // Configure watermark style
          const fontSize = Math.max(12, canvasRef.current.width * 0.025) // 2.5% of width, min 12px
          watermarkCtx.font = `${fontSize}px Arial`
          
          // Position watermark in bottom-right corner
          const text = 'Generated by diceify.art'
          const metrics = watermarkCtx.measureText(text)
          const padding = fontSize * 0.5
          const textPadding = fontSize * 0.3
          const x = watermarkCanvas.width - metrics.width - padding
          const y = watermarkCanvas.height - padding
          
          // Draw solid purple background with rounded corners
          const rectX = x - textPadding
          const rectY = y - fontSize - textPadding * 0.5
          const rectWidth = metrics.width + textPadding * 2
          const rectHeight = fontSize + textPadding
          const borderRadius = fontSize * 0.3
          
          // Draw rounded rectangle
          watermarkCtx.fillStyle = 'rgba(139, 92, 246, 0.85)' // Purple with 85% opacity
          watermarkCtx.beginPath()
          watermarkCtx.moveTo(rectX + borderRadius, rectY)
          watermarkCtx.lineTo(rectX + rectWidth - borderRadius, rectY)
          watermarkCtx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + borderRadius)
          watermarkCtx.lineTo(rectX + rectWidth, rectY + rectHeight - borderRadius)
          watermarkCtx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - borderRadius, rectY + rectHeight)
          watermarkCtx.lineTo(rectX + borderRadius, rectY + rectHeight)
          watermarkCtx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - borderRadius)
          watermarkCtx.lineTo(rectX, rectY + borderRadius)
          watermarkCtx.quadraticCurveTo(rectX, rectY, rectX + borderRadius, rectY)
          watermarkCtx.closePath()
          watermarkCtx.fill()
          
          // Draw white text (no outline needed on solid background)
          watermarkCtx.fillStyle = 'rgb(255, 255, 255)'
          watermarkCtx.fillText(text, x, y)
        }

        // Export the watermarked canvas
        watermarkCanvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `dice-art-${Date.now()}.jpg`
              a.click()
              URL.revokeObjectURL(url)
            }
          },
          'image/jpeg',
          0.95
        )
      } else {
        // Download SVG (no watermark for SVG)
        const blob = new Blob([svgContent], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dice-art-${Date.now()}.svg`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 500))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 25))
  }

  const handleZoomReset = () => {
    setZoomLevel(100)
  }

  return (
    <div className="flex-1 w-full lg:w-auto flex items-start justify-center" ref={containerRef}>
      {/* Image content wrapper with Eye button */}
      <div className="relative inline-block rounded-2xl border" style={{ 
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderColor: 'rgba(139, 92, 246, 0.2)',
        boxShadow: `0 10px 40px rgba(139, 92, 246, 0.25),
                   0 0 60px rgba(59, 130, 246, 0.08),
                   0 5px 20px rgba(0, 0, 0, 0.3)`
      }}>
        {/* Canvas view */}
        <canvas
          ref={canvasRef}
          className="rounded-2xl"
          style={{ 
            imageRendering: 'pixelated',
            display: showGrayscale || renderMode === 'svg' ? 'none' : 'block',
            backgroundColor: 'transparent',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto'
          }}
        />
        
        {/* Grayscale preview */}
        {grayscaleImage && (
          <img
            src={grayscaleImage}
            alt="Grayscale preview"
            className="rounded-2xl"
            style={{ 
              display: showGrayscale ? 'block' : 'none',
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              imageRendering: 'auto'
            }}
          />
        )}
        
        {/* Control buttons - only in tune step */}
        {currentStep === 'tune' && (
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          {/* Eye button for grayscale preview */}
          <button
            onClick={() => setShowGrayscale(!showGrayscale)}
            onMouseEnter={() => {
              tooltipTimeoutRef.current = setTimeout(() => setShowTooltip(true), 500)
            }}
            onMouseLeave={() => {
              if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current)
              }
              setShowTooltip(false)
            }}
            className={overlayButtonStyles.button}
            style={getOverlayButtonStyle('eye', showGrayscale, theme)}
          >
            <Eye className={overlayButtonStyles.iconSmall} style={{ color: 'white' }} />
            
            {/* Tooltip */}
            {showTooltip && (
              <span className="absolute top-full mt-2 right-0 px-2 py-1 text-xs rounded-lg transition-opacity pointer-events-none whitespace-nowrap backdrop-blur-md border"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderColor: theme.colors.glass.border,
                  color: theme.colors.text.primary
                }}
              >
                {showGrayscale ? 'View dice' : 'View grayscale'}
              </span>
            )}
          </button>
          
          {/* Download button */}
          <button
            onClick={handleDownload}
            className={overlayButtonStyles.button}
            style={getOverlayButtonStyle('download', false, theme)}
          >
            <Download className={overlayButtonStyles.iconSmall} style={{ color: 'white' }} />
          </button>
        </div>
        )}
      </div>
      
      {/* Bottom controls - only show mode toggle and download in build step */}
      {currentStep === 'build' && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
          {!showGrayscale && (
            <>
              <button
                onClick={() => setRenderMode('canvas')}
                className="px-3 py-2 backdrop-blur-md border text-xs rounded-lg transition-all"
                style={{
                  backgroundColor: renderMode === 'canvas' ? theme.colors.accent.blue : theme.colors.glass.light,
                  borderColor: renderMode === 'canvas' ? theme.colors.accent.blue : theme.colors.glass.border,
                  color: renderMode === 'canvas' ? 'white' : theme.colors.text.secondary
                }}
              >
                Canvas
              </button>
              <button
                onClick={() => setRenderMode('svg')}
                className="px-3 py-2 backdrop-blur-md border text-xs rounded-lg transition-all"
                style={{
                  backgroundColor: renderMode === 'svg' ? theme.colors.accent.blue : theme.colors.glass.light,
                  borderColor: renderMode === 'svg' ? theme.colors.accent.blue : theme.colors.glass.border,
                  color: renderMode === 'svg' ? 'white' : theme.colors.text.secondary
                }}
              >
                SVG
              </button>
            </>
          )}
          <button
            onClick={handleDownload}
            className="px-3 py-2 backdrop-blur-md border text-xs rounded-lg transition-all"
            style={{
              backgroundColor: theme.colors.accent.green,
              borderColor: theme.colors.accent.green,
              color: 'white'
            }}
          >
            Download
          </button>
        </div>
      )}
      
      {/* Zoom controls for SVG - only in build step */}
      {currentStep === 'build' && renderMode === 'svg' && !showGrayscale && (
        <div className="absolute bottom-6 right-6 flex items-center gap-2 backdrop-blur-md rounded-lg px-3 py-2" style={{ backgroundColor: theme.colors.glass.medium, border: `1px solid ${theme.colors.glass.border}` }}>
          <button
            onClick={handleZoomOut}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            disabled={zoomLevel <= 25}
          >
            −
          </button>
          <span className="text-xs font-mono min-w-[3rem] text-center" style={{ color: theme.colors.text.secondary }}>
            {zoomLevel}%
          </span>
          <button
            onClick={handleZoomIn}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            disabled={zoomLevel >= 500}
          >
            +
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 py-1 text-xs rounded hover:bg-white/10 transition-colors"
            style={{ color: theme.colors.text.secondary }}
          >
            Reset
          </button>
        </div>
      )}
      
      {/* Removed generating popup - dice generation is fast enough */}
    </div>
  )
}