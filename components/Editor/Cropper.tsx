'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { FixedCropper, FixedCropperRef, ImageRestriction } from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'
import 'react-advanced-cropper/dist/themes/corners.css'
import styles from './Cropper.module.css'
import { theme } from '@/lib/theme'
import { overlayButtonStyles, getOverlayButtonStyle } from '@/lib/styles/overlay-buttons'
import { RotateCw } from 'lucide-react'

interface CropperProps {
  imageUrl: string
  onCropComplete: (croppedImageUrl: string, params: { x: number, y: number, width: number, height: number, rotation: number }) => void
  initialCrop?: { x: number, y: number, width: number, height: number, rotation: number }
  containerWidth?: number
  containerHeight?: number
  onCropperReady?: (cropper: FixedCropperRef) => void
  hideControls?: boolean
}

type AspectRatio = '4:3' | '3:2' | '1:1' | '2:3' | '3:4'

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
    value: '3:2',
    label: '3:2',
    ratio: 3 / 2,
    width: 3,
    height: 2,
    icon: (
      <svg className="w-6 h-4" viewBox="0 0 36 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="1" width="34" height="22" rx="1" />
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
        <rect x="1" y="1" width="30" height="22" rx="1" />
      </svg>
    ),
  },
  {
    value: '1:1',
    label: '1:1',
    ratio: 1,
    width: 1,
    height: 1,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="1" width="22" height="22" rx="1" />
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
        <rect x="1" y="1" width="22" height="30" rx="1" />
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
        <rect x="1" y="1" width="22" height="34" rx="1" />
      </svg>
    ),
  },
]

export default function Cropper({
  imageUrl, onCropComplete, initialCrop, containerWidth, containerHeight, onCropperReady, hideControls = false }: CropperProps) {
  // console.log('Cropper component rendering, imageUrl:', imageUrl)
  // console.log('Cropper initialCrop:', initialCrop)
  const fixedCropperRef = useRef<FixedCropperRef>(null)
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

  // Calculate responsive cropper size: max 720px, min 320px
  const getResponsiveCropperSize = () => {
    // Use 90% of window width for smaller screens, with padding
    const availableWidth = windowWidth * 0.9
    const cropperSize = Math.min(720, Math.max(320, availableWidth))
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
  
  // Calculate stencil size to maintain 3% padding from top and bottom
  const defaultContainerHeight = responsiveCropperSize * 0.714  // Maintain aspect ratio (~500/700)
  const defaultContainerWidth = responsiveCropperSize
  const actualContainerHeight = containerHeight || defaultContainerHeight
  const actualContainerWidth = containerWidth || defaultContainerWidth
  const paddingPercent = 0.94  // 94% of container (3% padding on each side)
  
  
  // Calculate based on height with 3% padding
  let stencilHeight = actualContainerHeight * paddingPercent
  let stencilWidth = selectedOption.ratio ? stencilHeight * selectedOption.ratio : stencilHeight
  
  // If width would exceed container, scale down proportionally
  if (stencilWidth > actualContainerWidth * paddingPercent) {
    stencilWidth = actualContainerWidth * paddingPercent
    stencilHeight = selectedOption.ratio ? stencilWidth / selectedOption.ratio : stencilWidth
  }
  
  console.log('Stencil size calculation:', {
    actualContainerHeight,
    actualContainerWidth,
    paddingPercent,
    selectedRatio,
    selectedOption,
    stencilWidth,
    stencilHeight
  })



  const performAutoCrop = useCallback(async () => {
    if (isProcessing) return
    
    try {
      const cropper = fixedCropperRef.current
      if (!cropper) return

      // Get the canvas with the cropped image
      const canvas = cropper.getCanvas({
        width: 2048,
        height: selectedOption.ratio ? 2048 / selectedOption.ratio : 2048,
      })
      
      if (canvas) {
        // Get crop coordinates
        const coordinates = cropper.getCoordinates()
        const state = cropper.getState()
        
        // Convert to data URL
        const croppedImage = canvas.toDataURL('image/jpeg', 0.95)
        onCropComplete(croppedImage, {
          x: coordinates?.left || 0,
          y: coordinates?.top || 0,
          width: coordinates?.width || 0,
          height: coordinates?.height || 0,
          rotation: state?.transforms?.rotate || 0
        })
      }
    } catch (error) {
      console.error('Error auto-cropping image:', error)
    }
  }, [isProcessing, selectedOption.ratio, onCropComplete])

  // Auto-crop when image is ready or when aspect ratio changes
  useEffect(() => {
    if (imageLoaded) {
      // Small delay to ensure cropper is fully initialized
      const timeout = setTimeout(() => {
        performAutoCrop()
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [imageLoaded, selectedRatio, performAutoCrop])

  const handleCrop = async () => {
    setIsProcessing(true)
    try {
      await performAutoCrop()
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
      performAutoCrop()
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


  return (
    <div className={containerWidth ? "" : "w-full max-w-4xl mx-auto px-4"}>
          <div className="relative rounded-xl overflow-hidden mx-auto border" style={{
            width: containerWidth ? `${containerWidth}px` : `${responsiveCropperSize}px`,
            height: containerHeight ? `${containerHeight}px` : `${responsiveCropperSize * 0.714}px`, // Maintain aspect ratio
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(139, 92, 246, 0.2)',
            boxShadow: `0 20px 60px rgba(139, 92, 246, 0.3),
                       0 0 100px rgba(59, 130, 246, 0.1),
                       0 10px 30px rgba(0, 0, 0, 0.3)`
          }}>
            <FixedCropper
              ref={fixedCropperRef}
              src={imageUrl}
              className={`h-full ${styles.cropper}`}
              stencilProps={{
                aspectRatio: selectedOption.ratio,
                handlers: false,
                lines: true,
                movable: false,
                resizable: false,
                grid: true,
                overlayClassName: styles.overlay,
              }}
              stencilSize={{
                width: stencilWidth,
                height: stencilHeight,
              }}
              imageRestriction={ImageRestriction.stencil}
              onReady={() => {
                console.log('Cropper onReady fired')
                setImageLoaded(true)
                
                if (fixedCropperRef.current) {
                  const state = fixedCropperRef.current.getState()
                  console.log('Cropper state on ready:', {
                    state: state,
                    coordinates: fixedCropperRef.current.getCoordinates()
                  })
                  
                  // Refresh to ensure proper sizing
                  fixedCropperRef.current.refresh()
                  
                  // Notify parent component that cropper is ready
                  if (onCropperReady) {
                    console.log('Cropper ready, passing ref to parent')
                    onCropperReady(fixedCropperRef.current)
                  }
                }
                
                // Apply initial crop if provided, but only once
                if (initialCrop && fixedCropperRef.current && !hasAppliedInitialCrop) {
                  const cropper = fixedCropperRef.current
                  console.log('Applying initial crop:', initialCrop)
                  // Don't apply rotation - it's cumulative and causes issues
                  // The rotation is already applied when we generate the cropped image
                  // Just set the crop coordinates
                  cropper.setCoordinates({
                    left: initialCrop.x,
                    top: initialCrop.y,
                    width: initialCrop.width,
                    height: initialCrop.height
                  })
                  setHasAppliedInitialCrop(true)
                }
              }}
              onChange={handleCropperChange}
            />
            
            {/* Floating rotate button */}
            {!hideControls && (
              <div className="absolute top-3 right-3 flex gap-2 z-10">
                <button
                  onClick={() => handleRotate(90)}
                  className={overlayButtonStyles.button}
                  style={getOverlayButtonStyle('rotate', false, theme)}
                  title="Rotate 90°"
                >
                  <RotateCw className={overlayButtonStyles.iconSmall} style={{ color: 'white' }} />
                </button>
              </div>
            )}
            
            {/* Floating aspect ratio selector */}
            {!hideControls && (
              <div className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-gray-900/80 rounded-l border border-white/20 overflow-hidden shadow-2xl z-10">
                {aspectRatioOptions.map((option, index) => (
                <div key={option.value} className="relative">
                  <button
                    onClick={() => setSelectedRatio(option.value)}
                    onMouseEnter={() => setHoveredRatio(option.value)}
                    onMouseLeave={() => setHoveredRatio(null)}
                    className={`relative flex items-center justify-center p-3 transition-all w-full ${
                      selectedRatio === option.value
                        ? 'text-white'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    } ${index !== 0 ? 'border-t border-white/10' : ''}`}
                    style={{
                      backgroundColor: selectedRatio === option.value ? theme.colors.glass.heavy : 'transparent'
                    }}
                  >
                    {selectedRatio === option.value && (
                      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: theme.colors.accent.purple }}></div>
                    )}
                    <div className="flex items-center justify-center" style={{ height: '24px', width: '32px' }}>
                      {option.icon}
                    </div>
                  </button>
                  
                  {/* Tooltip */}
                  {hoveredRatio === option.value && (
                    <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-black/80 backdrop-blur-sm rounded-lg border border-white/20 pointer-events-none z-20 whitespace-nowrap">
                      <div className="text-xs text-white/60 mb-1">Aspect Ratio</div>
                      <div className="text-sm font-medium text-white">{option.label}</div>
                    </div>
                  )}
                </div>
                ))}
              </div>
            )}
          </div>
    </div>
  )
}