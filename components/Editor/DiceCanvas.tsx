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

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { DiceGenerator } from '@/lib/dice/generator'
import { DiceRenderer } from '@/lib/dice/renderer'
import { DiceSVGRenderer } from '@/lib/dice/svg-renderer'
import { DiceGrid } from '@/lib/dice/types'
import { theme } from '@/lib/theme'
import { devError } from '@/lib/utils/debug'
import { useEditorStore } from '@/lib/store/useEditorStore'

interface DiceCanvasProps {
  maxWidth?: number
  maxHeight?: number
}

export interface DiceCanvasRef {
  download: () => void;
}

const DiceCanvas = forwardRef<DiceCanvasRef, DiceCanvasProps>(({ maxWidth = 700, maxHeight = 500 }, ref) => {
  const imageUrl = useEditorStore(state => state.croppedImage)
  const params = useEditorStore(state => state.diceParams)
  const currentStep = useEditorStore(state => state.step)
  // ... (keep unused state access to prevent regressions if needed, or clean up if strictly unused)
  const cropArea = useEditorStore(state => state.cropParams)

  const setDiceStats = useEditorStore(state => state.setDiceStats)
  const setDiceGrid = useEditorStore(state => state.setDiceGrid)
  const setProcessedImageUrl = useEditorStore(state => state.setProcessedImageUrl)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // svgContainerRef unused? keeping for safety
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
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
    if (!generatorRef.current || !rendererRef.current || !canvasRef.current || !imageUrl) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsGenerating(true)
    setProgress(0)

    try {
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
        null
      )

      currentGridRef.current = grid

      const stats = generatorRef.current.calculateStats(grid)
      setDiceStats(stats)

      setDiceGrid(grid)

      await rendererRef.current.initialize()
      rendererRef.current.render(grid, 1, maxWidth, maxHeight)

      if (canvasRef.current) {
        setCanvasDimensions({
          width: canvasRef.current.width,
          height: canvasRef.current.height
        })

        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8)
        setProcessedImageUrl(dataUrl)
      }

      setProgress(100)
    } catch (error) {
      devError('Error generating dice art:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [imageUrl, params.numRows, params.colorMode, params.contrast, params.gamma, params.edgeSharpening, params.rotate6, params.rotate3, params.rotate2, setDiceStats, setDiceGrid, setProcessedImageUrl, maxWidth, maxHeight, cropArea])

  useEffect(() => {
    if (isInitializedRef.current && imageUrl) {
      generateDiceArt()
    }
  }, [imageUrl])

  useEffect(() => {
    if (!isInitializedRef.current) return
    setSvgContent('')
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      generateDiceArt(true)
    }, 300)
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [params.numRows, params.colorMode, params.contrast, params.gamma, params.edgeSharpening, params.rotate6, params.rotate3, params.rotate2])

  useEffect(() => {
    if (renderMode === 'svg' && currentGridRef.current && svgRendererRef.current && !svgContent) {
      const svgResult = svgRendererRef.current.renderWithStats(currentGridRef.current)
      setSvgContent(svgResult.svg)
    }
  }, [renderMode])

  const handleDownload = async () => {
    if (renderMode === 'canvas' && !rendererRef.current) return
    if (renderMode === 'svg' && !svgContent) return

    try {
      if (renderMode === 'canvas' && rendererRef.current && canvasRef.current) {
        const watermarkCanvas = document.createElement('canvas')
        const watermarkCtx = watermarkCanvas.getContext('2d')
        if (!watermarkCtx) return

        watermarkCanvas.width = canvasRef.current.width
        watermarkCanvas.height = canvasRef.current.height

        watermarkCtx.drawImage(canvasRef.current, 0, 0)

        // Add watermark only in tune step - wait, parent says removing download button from here implies logic might be called from parent
        // Logic remains here, just triggered from parent.
        if (currentStep === 'tune') {
          const fontSize = Math.max(12, canvasRef.current.width * 0.025)
          watermarkCtx.font = `${fontSize}px Arial`
          const text = 'Generated by diceify.art'
          const metrics = watermarkCtx.measureText(text)
          const padding = fontSize * 0.5
          const textPadding = fontSize * 0.3
          const x = watermarkCanvas.width - metrics.width - padding
          const y = watermarkCanvas.height - padding
          const rectX = x - textPadding
          const rectY = y - fontSize - textPadding * 0.5
          const rectWidth = metrics.width + textPadding * 2
          const rectHeight = fontSize + textPadding
          const borderRadius = fontSize * 0.3
          watermarkCtx.fillStyle = 'rgba(139, 92, 246, 0.85)'
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
          watermarkCtx.fillStyle = 'rgb(255, 255, 255)'
          watermarkCtx.fillText(text, x, y)
        }

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
        const blob = new Blob([svgContent], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dice-art-${Date.now()}.svg`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      devError('Error downloading image:', error)
    }
  }

  useImperativeHandle(ref, () => ({
    download: handleDownload
  }));

  // Handlers for Zoom
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 500))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 25))
  const handleZoomReset = () => setZoomLevel(100)

  if (!imageUrl) return null

  return (
    <div className="flex-1 w-full lg:w-auto flex items-start justify-center" ref={containerRef}>
      <div className={`relative inline-block ${currentStep !== 'tune' ? 'rounded-2xl border' : ''}`}>
        <canvas
          ref={canvasRef}
          className="rounded-2xl"
          style={{
            imageRendering: 'pixelated',
            display: renderMode === 'svg' ? 'none' : 'block',
            backgroundColor: 'transparent',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto'
          }}
        />

        {/* Internal Download button REMOVED from here */}
      </div>

      {currentStep === 'build' && (
        // ... (keep build step controls as they are, or does parent handle those too? 
        // User only said move download button parent div. Build step controls (zoom, render mode) are usually fine here.
        // But wait, the build step 'Download' button is also here.
        // For 'tune' step, user specifically asked to move it.
        // For 'build' step, it's usually at the bottom.
        // I will keep build controls here, but assume the parent wants to control 'tune' step download.
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
          {/* ... */}
          {/* keeping build controls for now, logic below */}
          <button
            onClick={() => setRenderMode('canvas')}
            className="px-3 py-2 backdrop-blur-md border text-xs rounded-lg transition-all"
            style={{
              backgroundColor: renderMode === 'canvas' ? theme.colors.accent.pink : theme.colors.glass.light,
              borderColor: renderMode === 'canvas' ? theme.colors.accent.pink : theme.colors.glass.border,
              color: renderMode === 'canvas' ? 'white' : theme.colors.text.secondary
            }}
          >
            Canvas
          </button>
          <button
            onClick={() => setRenderMode('svg')}
            className="px-3 py-2 backdrop-blur-md border text-xs rounded-lg transition-all"
            style={{
              backgroundColor: renderMode === 'svg' ? theme.colors.accent.pink : theme.colors.glass.light,
              borderColor: renderMode === 'svg' ? theme.colors.accent.pink : theme.colors.glass.border,
              color: renderMode === 'svg' ? 'white' : theme.colors.text.secondary
            }}
          >
            SVG
          </button>
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

      {currentStep === 'build' && renderMode === 'svg' && (
        <div className="absolute bottom-6 right-6 flex items-center gap-2 backdrop-blur-md rounded-lg px-3 py-2" style={{ backgroundColor: theme.colors.glass.medium, border: `1px solid ${theme.colors.glass.border}` }}>
          {/* Zoom controls... */}
          <button onClick={handleZoomOut} disabled={zoomLevel <= 25} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-white/70 hover:text-white">−</button>
          <span className="text-xs font-mono min-w-[3rem] text-center" style={{ color: theme.colors.text.secondary }}>{zoomLevel}%</span>
          <button onClick={handleZoomIn} disabled={zoomLevel >= 500} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-white/70 hover:text-white">+</button>
          <button onClick={handleZoomReset} className="px-2 py-1 text-xs rounded hover:bg-white/10 transition-colors" style={{ color: theme.colors.text.secondary }}>Reset</button>
        </div>
      )}
    </div>
  )
})

DiceCanvas.displayName = 'DiceCanvas'

export default DiceCanvas