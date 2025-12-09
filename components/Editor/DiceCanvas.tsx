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
  const [svgContent, setSvgContent] = useState<string>('')
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number } | null>(null)
  const generatorRef = useRef<DiceGenerator>()
  const rendererRef = useRef<DiceRenderer>()

  const currentGridRef = useRef<DiceGrid | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const isInitializedRef = useRef(false)

  // Initialize once on mount
  useEffect(() => {
    if (!canvasRef.current || isInitializedRef.current) return

    generatorRef.current = new DiceGenerator()
    rendererRef.current = new DiceRenderer(canvasRef.current)
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

  const handleDownload = async () => {
    if (!rendererRef.current) return

    try {
      if (rendererRef.current && canvasRef.current) {
        const watermarkCanvas = document.createElement('canvas')
        const watermarkCtx = watermarkCanvas.getContext('2d')
        if (!watermarkCtx) return

        watermarkCanvas.width = canvasRef.current.width
        watermarkCanvas.height = canvasRef.current.height

        watermarkCtx.drawImage(canvasRef.current, 0, 0)

        // Add watermark only in tune step
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
      }
    } catch (error) {
      devError('Error downloading image:', error)
    }
  }

  useImperativeHandle(ref, () => ({
    download: handleDownload
  }));


  if (!imageUrl) return null

  return (
    <div className="flex-1 w-full lg:w-auto flex items-start justify-center" ref={containerRef}>
      <div className={`relative inline-block }`}>
        <canvas
          ref={canvasRef}
          style={{
            imageRendering: 'pixelated',
            display: 'block',
            backgroundColor: 'transparent',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto'
          }}
        />

      </div>


    </div>
  )
})

DiceCanvas.displayName = 'DiceCanvas'

export default DiceCanvas