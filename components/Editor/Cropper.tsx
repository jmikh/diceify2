'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Cropper, CropperRef, ImageRestriction } from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'
import 'react-advanced-cropper/dist/themes/corners.css'
import styles from './Cropper.module.css'
import { theme } from '@/lib/theme'
import { overlayButtonStyles, getOverlayButtonStyle } from '@/lib/styles/overlay-buttons'
import { RotateCw, Upload, Image as ImageIcon, Proportions } from 'lucide-react'
import { devLog, devError } from '@/lib/utils/debug'
import { useEditorStore } from '@/lib/store/useEditorStore'

interface CropperProps {
  containerWidth?: number
  containerHeight?: number
  onCropperReady?: (cropper: CropperRef) => void
  hideControls?: boolean
  onBack?: () => void
  onContinue?: () => void
}

type AspectRatio = '1:1' | '3:4' | '4:3' | '2:3' | '16:9'

interface AspectRatioOption {
  value: AspectRatio
  label: string
  ratio: number | null
  width: number
  height: number
  icon: JSX.Element
}

const aspectRatioOptions: AspectRatioOption[] = [
  {
    value: '1:1',
    label: '1:1',
    ratio: 1,
    width: 1,
    height: 1,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
  {
    value: '3:4',
    label: '3:4',
    ratio: 3 / 4,
    width: 3,
    height: 4,
    icon: (
      <svg className="w-4 h-5" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="28" rx="2" />
      </svg>
    ),
  },
  {
    value: '4:3',
    label: '4:3',
    ratio: 4 / 3,
    width: 4,
    height: 3,
    icon: (
      <svg className="w-5 h-4" viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="28" height="20" rx="2" />
      </svg>
    ),
  },
  {
    value: '2:3',
    label: '2:3',
    ratio: 2 / 3,
    width: 2,
    height: 3,
    icon: (
      <svg className="w-4 h-6" viewBox="0 0 24 36" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="32" rx="2" />
      </svg>
    ),
  },
  {
    value: '16:9',
    label: '16:9',
    ratio: 16 / 9,
    width: 16,
    height: 9,
    icon: (
      <svg className="w-6 h-4" viewBox="0 0 36 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="32" height="16" rx="2" />
      </svg>
    ),
  },
]

export default function ImageCropper({
  containerWidth, containerHeight, onCropperReady, hideControls = false, onBack, onContinue }: CropperProps) {
  const imageUrl = useEditorStore(state => state.originalImage)
  const initialCrop = useEditorStore(state => state.cropParams)
  const completeCrop = useEditorStore(state => state.completeCrop)
  const updateCrop = useEditorStore(state => state.updateCrop)

  const fixedCropperRef = useRef<CropperRef>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('1:1')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentRatio, setCurrentRatio] = useState<string>('1:1')
  const [hasAppliedInitialCrop, setHasAppliedInitialCrop] = useState(false)
  const [hoveredRatio, setHoveredRatio] = useState<AspectRatio | null>(null)

  // Track window size for responsive cropper
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 800)

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    handleResize() // Set initial size
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate responsive cropper size taking sidebar into account
  const getResponsiveCropperSize = () => {
    // Available width = Window width - Sidebar (320) - Gap (24) - Padding (32) - Scrollbar/Margin (~24)
    const sidebarWidth = 320 + 24 + 32 + 24
    const availableWidth = windowWidth - sidebarWidth

    // Max width increased to 1400px to fill screen, min 320
    const cropperSize = Math.min(1400, Math.max(320, availableWidth))
    return cropperSize
  }

  const responsiveCropperSize = getResponsiveCropperSize()

  // Reset the flag when imageUrl or initialCrop changes
  useEffect(() => {
    setHasAppliedInitialCrop(false)
  }, [imageUrl, initialCrop])

  // Recalculate coordinates when container size changes
  useEffect(() => {
    if (fixedCropperRef.current && imageLoaded && (containerWidth || containerHeight)) {
      // Force the cropper to refresh its calculations
      const cropper = fixedCropperRef.current
      cropper.refresh()

      // Re-notify parent in case it needs the updated ref
      if (onCropperReady) {
        onCropperReady(cropper)
      }
    }
  }, [containerWidth, containerHeight, imageLoaded, onCropperReady])

  const selectedOption = aspectRatioOptions.find(opt => opt.value === selectedRatio) || aspectRatioOptions[2]

  // Update current ratio when fixed ratio is selected
  useEffect(() => {
    if (selectedOption) {
      setCurrentRatio(selectedOption.label)
    }
  }, [selectedRatio, selectedOption])

  // Calculate stencil size
  const defaultContainerHeight = Math.min(window.innerHeight - 200, responsiveCropperSize * 0.8)
  const defaultContainerWidth = responsiveCropperSize
  const actualContainerHeight = containerHeight || defaultContainerHeight
  const actualContainerWidth = containerWidth || defaultContainerWidth
  const paddingPercent = 0.9  // 90% of container (10% remaining space as requested)


  const performAutoCrop = useCallback(async (isComplete = false) => {
    if (isProcessing) return

    try {
      const cropper = fixedCropperRef.current
      if (!cropper) return

      // Get the canvas with the cropped image
      const canvas = cropper.getCanvas({
        width: 2048,
        height: (!selectedOption.ratio) ? 2048 : 2048 / selectedOption.ratio,
      })

      if (canvas) {
        // Get crop coordinates
        const coordinates = cropper.getCoordinates()
        const state = cropper.getState()

        // Convert to data URL
        const croppedImage = canvas.toDataURL('image/jpeg', 0.95)

        const cropData = {
          x: coordinates?.left || 0,
          y: coordinates?.top || 0,
          width: coordinates?.width || 0,
          height: coordinates?.height || 0,
          rotation: state?.transforms?.rotate || 0
        }

        if (isComplete) {
          completeCrop(croppedImage, cropData)
        } else {
          updateCrop(croppedImage, cropData)
        }
      }
    } catch (error) {
      devError('Error auto-cropping image:', error)
    }
  }, [isProcessing, selectedOption.ratio, completeCrop, updateCrop])

  // Auto-crop when image is ready or when aspect ratio changes
  useEffect(() => {
    if (imageLoaded) {
      // Small delay to ensure cropper is fully initialized
      const timeout = setTimeout(() => {
        performAutoCrop(false)
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [imageLoaded, selectedRatio, performAutoCrop])

  const handleCrop = async () => {
    setIsProcessing(true)
    try {
      await performAutoCrop(true)
      if (onContinue) onContinue()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRotate = (angle: number) => {
    fixedCropperRef.current?.rotateImage(angle)
  }

  // Debounced handler for when user drags/zooms the crop
  const cropChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCropperChange = useCallback(() => {
    // Clear any existing timeout
    if (cropChangeTimeoutRef.current) {
      clearTimeout(cropChangeTimeoutRef.current)
    }

    // Set new timeout to perform auto-crop after user stops interacting
    cropChangeTimeoutRef.current = setTimeout(() => {
      performAutoCrop(false)
    }, 500) // Wait 500ms after user stops dragging/zooming
  }, [performAutoCrop])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (cropChangeTimeoutRef.current) {
        clearTimeout(cropChangeTimeoutRef.current)
      }
    }
  }, [])

  if (!imageUrl) return null

  return (
    <div className="w-full mx-auto px-4 flex gap-6 items-stretch justify-center h-[calc(100vh-180px)] min-h-[600px]" style={{ maxWidth: '1400px' }}>

      {/* Left Panel: Aspect Ratio & Controls */}
      <div className="flex-shrink-0 flex flex-col" style={{ width: '320px' }}>
        <div className="bg-[#0f0f12]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Proportions className="w-4 h-4 text-pink-500" />
            </div>
            <h3 className="text-lg font-bold text-white">Aspect Ratio</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {aspectRatioOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedRatio(option.value)}
                className={`
                    group relative flex flex-col items-center justify-center gap-3
                    aspect-square rounded-xl border transition-all duration-200
                    ${selectedRatio === option.value
                    ? 'bg-pink-500/10 border-pink-500'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }
                  `}
              >
                <div className={`
                    transition-colors duration-200
                    ${selectedRatio === option.value ? 'text-pink-500' : 'text-gray-400 group-hover:text-gray-300'}
                  `}>
                  {option.icon}
                </div>
                <span className={`
                    text-xs font-semibold
                    ${selectedRatio === option.value ? 'text-pink-500' : 'text-gray-500 group-hover:text-gray-400'}
                  `}>
                  {option.label}
                </span>

                {/* Selected glow effect */}
                {selectedRatio === option.value && (
                  <div className="absolute inset-0 bg-pink-500/5 rounded-xl animate-pulse pointer-events-none" />
                )}
              </button>
            ))}
          </div>

          {/* Additional Controls */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleRotate(90)}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition-colors text-sm font-medium text-gray-300"
            >
              <RotateCw className="w-4 h-4" />
              Rotate 90°
            </button>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div className="flex-grow" />

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
            <button
              onClick={onBack}
              className="flex-1 py-3.5 rounded-full border border-white/10 hover:bg-white/5 text-white/70 hover:text-white font-semibold transition-all flex items-center justify-center gap-2 text-sm"
            >
              ← Back
            </button>

            <button
              onClick={handleCrop}
              disabled={isProcessing}
              className="
                  flex-1 py-3.5 rounded-full
                  bg-pink-500 hover:bg-pink-600
                  text-white font-semibold
                  shadow-[0_0_20px_rgba(236,72,153,0.3)]
                  hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]
                  transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 text-sm
                "
            >
              {isProcessing ? 'Processing...' : 'Continue'} →
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Cropper Canvas */}
      <div className="flex-grow flex flex-col items-center justify-center h-full" style={{ maxWidth: '900px' }}>
        <div className="group relative w-full h-full rounded-3xl bg-[#0a0a0f] transition-all duration-500 ease-out flex items-center justify-center overflow-hidden border border-white/10">

          {/* Glass Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-20 pointer-events-none z-10" />
          <Cropper
            ref={fixedCropperRef}
            src={imageUrl}
            className={`h-full ${styles.cropper}`}
            stencilProps={{
              aspectRatio: selectedOption.ratio,
              grid: true,
              overlayClassName: styles.overlay,
            }}
            defaultSize={({ visibleArea }) => {
              if (!visibleArea) return { width: 0, height: 0 }
              return {
                width: visibleArea.width * 0.9,
                height: visibleArea.height * 0.9,
              }
            }}
            imageRestriction={ImageRestriction.stencil}
            onReady={() => {
              devLog('Cropper onReady fired')
              setImageLoaded(true)

              if (fixedCropperRef.current) {
                const state = fixedCropperRef.current.getState()
                devLog('Cropper state on ready:', {
                  state: state,
                  coordinates: fixedCropperRef.current.getCoordinates()
                })

                // Refresh to ensure proper sizing
                fixedCropperRef.current.refresh()

                // Notify parent component that cropper is ready
                if (onCropperReady) {
                  onCropperReady(fixedCropperRef.current)
                }
              }
            }}
            onChange={handleCropperChange}
          />
        </div>
      </div>
    </div>
  )
}