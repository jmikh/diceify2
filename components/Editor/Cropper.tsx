'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { FixedCropper, FixedCropperRef, ImageRestriction } from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'
import 'react-advanced-cropper/dist/themes/corners.css'
import styles from './Cropper.module.css'
import { theme } from '@/lib/theme'

interface CropperProps {
  imageUrl: string
  onCropComplete: (croppedImageUrl: string) => void
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

export default function Cropper({ imageUrl, onCropComplete }: CropperProps) {
  const fixedCropperRef = useRef<FixedCropperRef>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('1:1')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentRatio, setCurrentRatio] = useState<string>('1:1')

  const selectedOption = aspectRatioOptions.find(opt => opt.value === selectedRatio) || aspectRatioOptions[2]
  
  // Update current ratio when fixed ratio is selected
  useEffect(() => {
    if (selectedOption) {
      setCurrentRatio(selectedOption.label)
    }
  }, [selectedRatio, selectedOption])
  
  // Calculate stencil size to maintain 3% padding from top and bottom
  const containerHeight = 500  // Height of the container div
  const containerWidth = 700  // Approximate max width we want for the stencil
  const paddingPercent = 0.94  // 94% of container (3% padding on each side)
  
  
  // Calculate based on height with 3% padding
  let stencilHeight = containerHeight * paddingPercent
  let stencilWidth = selectedOption.ratio ? stencilHeight * selectedOption.ratio : stencilHeight
  
  // If width would exceed container, scale down proportionally
  if (stencilWidth > containerWidth * paddingPercent) {
    stencilWidth = containerWidth * paddingPercent
    stencilHeight = selectedOption.ratio ? stencilWidth / selectedOption.ratio : stencilWidth
  }



  const performAutoCrop = useCallback(async () => {
    if (isProcessing) return
    
    try {
      const cropper = fixedCropperRef.current
      if (!cropper) return

      // Get the canvas with the cropped image
      const canvas = cropper.getCanvas({
        width: 2048,
        height: 2048 / selectedOption.ratio,
      })
      
      if (canvas) {
        // Convert to data URL
        const croppedImage = canvas.toDataURL('image/jpeg', 0.95)
        onCropComplete(croppedImage)
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
    <div className="w-full max-w-4xl mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden w-full mx-auto border" style={{ 
            minWidth: '300px',
            maxWidth: '700px',
            height: '500px',
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
              onReady={() => setImageLoaded(true)}
              onChange={handleCropperChange}
            />
            
            {/* Floating card for ratio display */}
            <div className="absolute top-6 left-6 bg-gray-900/80 border border-white/20 text-white px-4 py-3 rounded-2xl shadow-xl z-10">
              <div className="text-xs text-white/60 mb-1">
                Aspect Ratio
              </div>
              <div className="text-xl font-bold tracking-wider">
                {currentRatio}
              </div>
            </div>
            
            {/* Floating rotate button */}
            <button
              onClick={() => handleRotate(90)}
              className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-gray-900/80 hover:bg-gray-800/90 border border-white/20 text-white rounded-2xl transition-all hover:scale-110 shadow-xl z-10"
              title="Rotate 90°"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            
            {/* Floating aspect ratio selector */}
            <div className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-gray-900/80 rounded-2xl border border-white/20 overflow-hidden shadow-2xl z-10">
              {aspectRatioOptions.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedRatio(option.value)}
                  className={`relative flex items-center justify-center p-3 transition-all w-full ${
                    selectedRatio === option.value
                      ? 'text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  } ${index !== 0 ? 'border-t border-white/10' : ''}`}
                  style={{
                    backgroundColor: selectedRatio === option.value ? theme.colors.glass.heavy : 'transparent'
                  }}
                  title={option.label}
                >
                  {selectedRatio === option.value && (
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: theme.colors.accent.blue }}></div>
                  )}
                  <div className="flex items-center justify-center" style={{ height: '24px', width: '32px' }}>
                    {option.icon}
                  </div>
                </button>
              ))}
            </div>
          </div>
    </div>
  )
}