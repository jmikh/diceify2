'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Logo from './Logo'
import ImageUploader from '@/components/Editor/ImageUploader'
import Cropper from '@/components/Editor/Cropper'
import DiceCanvas from '@/components/Editor/DiceCanvas'
import BuildProgress from '@/components/Editor/BuildProgress'
import BuildViewer from '@/components/Editor/BuildViewer'
import DiceStepper from '@/components/Editor/DiceStepper'
import AuthModal from '@/components/AuthModal'
import { DiceParams, DiceStats, DiceGrid, WorkflowStep } from '@/lib/types'
import styles from './ScrollWorkflowDemo.module.css'

// Demo stages
type DemoStage = 'hero' | 'upload' | 'crop' | 'transform' | 'tune' | 'build' | 'cta'

// Sample demo image - Mona Lisa portrait
// Using the actual Mona Lisa image from /public/mona.jpeg
// Fallback to a portrait-style SVG if image not available
const MONA_LISA_PATH = "/mona.jpeg"
const FALLBACK_PORTRAIT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Cdefs%3E%3CradialGradient id='face' cx='50%25' cy='40%25' r='60%25'%3E%3Cstop offset='0%25' style='stop-color:%23f4e4c1'/%3E%3Cstop offset='50%25' style='stop-color:%23d4b896'/%3E%3Cstop offset='100%25' style='stop-color:%23705642'/%3E%3C/radialGradient%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%236b7c59'/%3E%3Cstop offset='50%25' style='stop-color:%238b9467'/%3E%3Cstop offset='100%25' style='stop-color:%234a5c3a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='500' fill='url(%23bg)'/%3E%3Cellipse cx='200' cy='200' rx='120' ry='150' fill='url(%23face)' opacity='0.9'/%3E%3Cellipse cx='170' cy='180' rx='15' ry='20' fill='%23382818'/%3E%3Cellipse cx='230' cy='180' rx='15' ry='20' fill='%23382818'/%3E%3Cpath d='M 200 220 Q 190 240 200 245 Q 210 240 200 220' fill='%23a08060' opacity='0.7'/%3E%3Cpath d='M 170 260 Q 200 280 230 260' stroke='%238b6039' stroke-width='3' fill='none' opacity='0.6'/%3E%3C/svg%3E"

export default function ScrollWorkflowDemo() {
  const { data: session, status } = useSession()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [headerOpacity, setHeaderOpacity] = useState(1)
  
  // Try to use the actual Mona Lisa image, fallback to SVG portrait
  const [sampleImage, setSampleImage] = useState(FALLBACK_PORTRAIT)
  
  useEffect(() => {
    // Check if Mona Lisa image exists
    const img = new Image()
    img.onload = () => setSampleImage(MONA_LISA_PATH)
    img.onerror = () => setSampleImage(FALLBACK_PORTRAIT)
    img.src = MONA_LISA_PATH
  }, [])
  const [currentStage, setCurrentStage] = useState<DemoStage>('hero')
  const [stageProgress, setStageProgress] = useState(0) // 0-1 within current stage
  const [overallProgress, setOverallProgress] = useState(0) // 0-1 overall
  
  // State for actual components
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [diceParams, setDiceParams] = useState<DiceParams>({
    numRows: 30,
    colorMode: 'both',
    contrast: 0,
    gamma: 1.0,
    edgeSharpening: 0,
    rotate6: false,
    rotate3: false,
    rotate2: false,
  })
  const [diceStats, setDiceStats] = useState<DiceStats>({
    blackCount: 0,
    whiteCount: 0,
    totalCount: 0,
  })
  const [diceGrid, setDiceGrid] = useState<DiceGrid | null>(null)
  const [cropperRef, setCropperRef] = useState<any>(null)
  const [initialCropState, setInitialCropState] = useState<any>(null)
  const [finalCropCoords, setFinalCropCoords] = useState<{x: number, y: number, width: number, height: number} | null>(null)
  const [buildNavigation, setBuildNavigation] = useState<any>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  
  // Define stage boundaries (each stage takes this much of total scroll)
  const stages: Record<DemoStage, { start: number; end: number }> = {
    hero: { start: 0, end: 0.15 },
    upload: { start: 0.15, end: 0.3 },
    crop: { start: 0.3, end: 0.45 },  // Crop stage
    transform: { start: 0.45, end: 0.75 },  // Extended transform stage (30% of scroll)
    tune: { start: 0.75, end: 0.75 },  // Removed - placeholder for type compatibility
    build: { start: 0.65, end: 0.85 },  // Build overlaps with transform for fade effect
    cta: { start: 0.85, end: 1.0 }
  }
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showUserMenu])
  
  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const windowHeight = window.innerHeight
        const maxScroll = windowHeight * 6 // 6 viewport heights for demo
        
        // Hide header after 50px of scroll
        if (scrollTop > 50) {
          setHeaderOpacity(0)
        } else {
          setHeaderOpacity(1)
        }
        
        // Calculate overall progress (0-1)
        const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1)
        setOverallProgress(progress)
        
        // console.log('Scroll progress:', progress, 'ScrollTop:', scrollTop, 'MaxScroll:', maxScroll)
        
        // Determine current stage and stage progress
        let newStage: DemoStage = 'hero'
        let newStageProgress = 0
        
        for (const [stageName, bounds] of Object.entries(stages)) {
          if (progress >= bounds.start && progress < bounds.end) {
            newStage = stageName as DemoStage
            newStageProgress = (progress - bounds.start) / (bounds.end - bounds.start)
            break
          }
        }
        
        // Handle final stage
        if (progress >= stages.cta.start) {
          newStage = 'cta'
          newStageProgress = (progress - stages.cta.start) / (stages.cta.end - stages.cta.start)
        }
        
        // console.log('Current stage:', newStage, 'Stage progress:', newStageProgress)
        
        setCurrentStage(newStage)
        setStageProgress(Math.min(Math.max(newStageProgress, 0), 1))
        
        
        ticking = false
      })
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  // Callback handlers for components
  const handleImageUpload = useCallback((imageUrl: string) => {
    setUploadedImage(imageUrl)
  }, [])
  
  const handleCropComplete = useCallback((croppedImageUrl: string) => {
    setCroppedImage(croppedImageUrl)
  }, [])
  
  // Save initial crop state only once when cropper is first ready
  useEffect(() => {
    if (cropperRef && !initialCropState) {
      const coords = cropperRef.getCoordinates()
      if (coords) {
        setInitialCropState({ ...coords })
        console.log('Saved initial crop state (one time):', coords)
      }
    }
  }, [cropperRef]) // Only depend on cropperRef, not initialCropState
  
  // Auto-zoom the cropper when crop stage is active
  useEffect(() => {
    if (currentStage === 'crop' && cropperRef && initialCropState) {
      if (stageProgress <= 0.4) {
        // Reset to initial state when entering or at beginning of crop stage
        try {
          cropperRef.setCoordinates({
            left: initialCropState.left,
            top: initialCropState.top,
            width: initialCropState.width,
            height: initialCropState.height
          })
        } catch (e) {
          console.error('Reset error:', e)
        }
      } else {
        // Smooth linear zoom from 40% to 100% of stage
        const zoomProgress = (stageProgress - 0.4) / 0.6 // 0 to 1 for last 60% of stage
        const absoluteZoomLevel = 1 + zoomProgress * 1 // Linear zoom from 1x to 2x
        
        try {
          const newWidth = initialCropState.width / absoluteZoomLevel
          const newHeight = initialCropState.height / absoluteZoomLevel
          
          // Center the zoom on top-center of the image
          const newLeft = initialCropState.left + (initialCropState.width - newWidth) / 2
          const newTop = initialCropState.top // Keep top aligned to focus on face
          
          cropperRef.setCoordinates({
            left: newLeft,
            top: newTop,
            width: newWidth,
            height: newHeight
          })
          
          // Calculate and save the final crop coordinates at max zoom
          // This is deterministic and doesn't depend on actual image capture
          if (stageProgress > 0.95 && !finalCropCoords) {
            const maxZoom = 2
            const finalWidth = initialCropState.width / maxZoom
            const finalHeight = initialCropState.height / maxZoom
            const finalLeft = initialCropState.left + (initialCropState.width - finalWidth) / 2
            const finalTop = initialCropState.top
            
            setFinalCropCoords({
              x: finalLeft,
              y: finalTop,
              width: finalWidth,
              height: finalHeight
            })
            console.log('Saved final crop coordinates:', { x: finalLeft, y: finalTop, width: finalWidth, height: finalHeight })
          }
          
          console.log('Smooth crop zoom:', { stageProgress, zoomProgress, absoluteZoomLevel })
        } catch (e) {
          console.error('Zoom error:', e)
        }
      }
    }
  }, [currentStage, stageProgress, cropperRef, initialCropState, finalCropCoords])
  
  
  const handleStatsUpdate = useCallback((stats: DiceStats) => {
    setDiceStats(stats)
  }, [])
  
  const handleGridUpdate = useCallback((grid: DiceGrid) => {
    setDiceGrid(grid)
  }, [])
  
  // Track when we change stages for remounting
  const buildViewerKey = useRef(0)
  const lastStage = useRef<DemoStage>('hero')
  const lastBuildProgress = useRef(0)
  
  useEffect(() => {
    // Increment key when entering build stage to force remount
    if (currentStage === 'build' && lastStage.current !== 'build') {
      buildViewerKey.current += 1
      console.log('Entered build stage, incrementing key')
      lastBuildProgress.current = 0 // Reset progress tracking
    }
    lastStage.current = currentStage
  }, [currentStage])
  
  // Navigate BuildViewer based on scroll progress
  useEffect(() => {
    if (currentStage === 'build' && buildNavigation && diceGrid) {
      // Calculate target position based on scroll progress
      const totalSteps = Math.min(diceGrid.width * 3, diceGrid.width * diceGrid.height)
      const targetIndex = Math.floor(stageProgress * totalSteps)
      const currentIndex = Math.floor(lastBuildProgress.current * totalSteps)
      
      // Calculate how many steps to navigate
      const steps = targetIndex - currentIndex
      
      if (steps !== 0) {
        console.log('Navigating BuildViewer:', { 
          steps, 
          targetIndex, 
          currentIndex,
          stageProgress,
          lastProgress: lastBuildProgress.current 
        })
        
        // Navigate forward or backward
        if (steps > 0) {
          for (let i = 0; i < steps; i++) {
            if (buildNavigation.canNavigate.next) {
              buildNavigation.navigateNext()
            }
          }
        } else {
          for (let i = 0; i < Math.abs(steps); i++) {
            if (buildNavigation.canNavigate.prev) {
              buildNavigation.navigatePrev()
            }
          }
        }
        
        lastBuildProgress.current = stageProgress
      }
    }
  }, [currentStage, stageProgress, buildNavigation, diceGrid])
  
  // Calculate spacer height on client side only
  const [spacerHeight, setSpacerHeight] = useState(4200) // Default height
  
  useEffect(() => {
    // Update spacer height once we're on the client
    setSpacerHeight(window.innerHeight * 7)
  }, [])

  return (
    <>
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 transition-opacity duration-300" 
        style={{ 
          zIndex: 100,
          opacity: headerOpacity,
          pointerEvents: headerOpacity < 0.1 ? 'none' : 'auto'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 relative flex items-center">
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <Logo />
          </div>
          
          {/* Spacer */}
          <div className="flex-1"></div>
          
          {/* Auth Button */}
          <div className="absolute right-4">
            {status === 'authenticated' && session ? (
              <div className="flex items-center gap-3">
                <div className="relative user-menu-container">
                  <div 
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    {session.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'User'} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  
                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-700">
                        <div className="text-sm font-medium text-white">
                          {session.user?.name || 'User'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {session.user?.email}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          window.location.href = '/api/auth/signout'
                        }}
                        className="w-full px-4 py-2 text-sm text-left text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)} 
      />
      
      {/* Spacer div to create scrollable area */}
      <div 
        ref={spacerRef} 
        style={{ 
          height: `${spacerHeight}px`,
          pointerEvents: 'none'
        }}
      />
      
      <div ref={containerRef} className={`${styles.container} ${styles.noInteraction}`}>
        {/* Progress indicator */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${overallProgress * 100}%` }}
          />
        </div>
        
        {/* Vertical Stepper */}
        <div className={styles.verticalStepper} style={{
          opacity: (currentStage === 'hero' || currentStage === 'cta') ? 0 : 1,
          transition: 'opacity 0.5s ease'
        }}>
          <DiceStepper 
            currentStep={
              currentStage === 'hero' || currentStage === 'cta' ? 'upload' :
              currentStage === 'upload' ? 'upload' :
              currentStage === 'crop' ? 'crop' :
              currentStage === 'transform' ? 'tune' :  // Keep as 'tune' for transform stage
              'build' as WorkflowStep
            }
            hasImage={uploadedImage !== null}
            lastReachedStep={
              overallProgress > stages.build.start ? 'build' :
              overallProgress > stages.transform.start ? 'tune' :  // Use 'tune' for transform stage
              overallProgress > stages.crop.start ? 'crop' :
              overallProgress > stages.upload.start ? 'upload' :
              undefined as WorkflowStep | undefined
            }
            vertical={true}
            onStepClick={undefined} // Disable clicking in demo
            demoMode={true} // Keep full vividity in demo
          />
        </div>
        
        {/* Main content area */}
        <div className={styles.content}>
        
        {/* Hero Stage */}
        {currentStage === 'hero' && (
          <div className={`${styles.stage} ${styles.heroStage}`}>
            <div 
              className={styles.logoContainer}
              style={{
                transform: `scale(${1 + stageProgress * 0.2})`,
                opacity: 1 - stageProgress * 0.3
              }}
            >
              <Logo />
              <div className={styles.tagline}>
                Transform photos into dice art
              </div>
            </div>
            <div className={styles.scrollHint}>
              Scroll to see how it works
              <div className={styles.scrollArrow}>↓</div>
            </div>
          </div>
        )}
        
        {/* Upload Stage */}
        {(currentStage === 'upload' || currentStage === 'crop') && (
          <div className={`${styles.stage} ${styles.uploadStage}`} style={{
            opacity: currentStage === 'crop' ? Math.max(0, 1 - stageProgress * 2) : 1,
            transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Floating JPEG file that flies in */}
            {currentStage === 'upload' && stageProgress < 0.7 && (
              <div 
                className={styles.floatingFile}
                style={{
                  transform: `
                    translateX(${-100 + (stageProgress / 0.7) * 100}vw)
                    translateY(${-27 + Math.sin(stageProgress * Math.PI / 0.7) * -30}px)
                    rotate(${360 * (stageProgress / 0.7)}deg)
                    scale(${0.5 + (stageProgress / 0.7) * 0.5})
                  `,
                  opacity: Math.min(stageProgress * 3, 1)
                }}
              >
                <div className={styles.fileIcon}>
                  <img 
                    src={sampleImage} 
                    alt="JPEG file"
                    className={styles.fileThumbnail}
                  />
                  <div className={styles.fileLabel}>mona.jpeg</div>
                </div>
              </div>
            )}
            
            {/* Upload area */}
            <div 
              className={styles.uploadWrapper}
              style={{
                transform: `scale(${0.7 + stageProgress * 0.3})`,
                opacity: Math.min(stageProgress * 2, 1),
                pointerEvents: 'none',
                animation: stageProgress >= 0.7 && stageProgress < 0.75 ? 'pulse 0.5s ease-out' : 'none',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <ImageUploader 
                onImageUpload={handleImageUpload}
                currentImage={stageProgress > 0.7 ? sampleImage : null}
              />
            </div>
          </div>
        )}
        
        {/* Crop Stage - Keep visible during transform for fade out */}
        {(currentStage === 'crop' || currentStage === 'transform') && (
          <div className={`${styles.stage} ${styles.cropStage}`} style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            opacity: currentStage === 'transform' ? Math.max(0, 1 - stageProgress * 2) : 1,
            transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div 
              className={styles.cropperWrapper}
              style={{
                '--size': `${200 + Math.min((currentStage === 'crop' ? stageProgress : 1) * 2.5, 1) * 200}px`, // Stay at full size during transform
                opacity: currentStage === 'crop' ? Math.min(stageProgress * 1.5, 1) : 1,
                pointerEvents: 'none'
              } as React.CSSProperties}
            >
              <Cropper 
                imageUrl={sampleImage}
                onCropComplete={handleCropComplete}
                containerWidth={200 + (currentStage === 'crop' ? stageProgress : 1) * 200}
                containerHeight={200 + (currentStage === 'crop' ? stageProgress : 1) * 200}
                onCropperReady={setCropperRef}
                hideControls={true}
              />
            </div>
            
            {currentStage === 'crop' && stageProgress > 0.6 && (
              <div className={styles.cropHint}>
                Perfect framing
              </div>
            )}
          </div>
        )}
        
        {/* Transform Stage - Keep rendered during build stage for fade effect */}
        {(currentStage === 'transform' || currentStage === 'build') && (
          <div className={`${styles.stage} ${styles.transformStage}`} style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: (() => {
              if (currentStage === 'transform') {
                // Fade in quickly, then start fading out in last 30% of transform stage
                if (stageProgress < 0.2) {
                  return stageProgress * 5  // Fade in
                } else if (stageProgress > 0.7) {
                  return Math.max((1 - stageProgress) * 3.33, 0)  // Fade out in last 30%
                }
                return 1  // Fully visible in middle
              } else if (currentStage === 'build') {
                // Continue fading out during build stage
                return Math.max(1 - stageProgress * 3, 0)
              }
              return 0
            })(),
            pointerEvents: currentStage === 'build' ? 'none' : undefined
          }}>
            <div 
              className={styles.transformContainer}
              style={{
                opacity: 1  // Container always fully opaque, parent div controls visibility
              }}
            >
              <DiceCanvas
                imageUrl={sampleImage}
                cropArea={finalCropCoords}
                params={{
                  ...diceParams,
                  numRows: currentStage === 'transform' 
                    ? Math.floor(40 + stageProgress * 22) // 40 to 62 rows during transform
                    : 62, // Final value for build stage
                  edgeSharpening: currentStage === 'transform'
                    ? Math.floor(stageProgress * 30) // 0 to 30 during transform
                    : 30, // Final value for build stage
                  gamma: currentStage === 'transform'
                    ? 1 + (stageProgress * -0.2) // 1 to 0.8 during transform
                    : 0.8 // Final value for build stage
                }}
                onStatsUpdate={(stats) => {
                  console.log('DiceCanvas stats update:', {
                    currentStage,
                    stageProgress,
                    numRows: currentStage === 'transform' 
                      ? Math.floor(40 + stageProgress * 22)
                      : 62,
                    stats
                  })
                  handleStatsUpdate(stats)
                }}
                onGridUpdate={(grid) => {
                  console.log('DiceCanvas grid update:', {
                    currentStage,
                    gridSize: `${grid.width}x${grid.height}`
                  })
                  handleGridUpdate(grid)
                }}
                onProcessedImageReady={() => {}}
                maxWidth={600}
                maxHeight={400}
                currentStep="tune"
              />
            </div>
            
            {/* Particle effects */}
            {currentStage === 'transform' && stageProgress > 0.2 && stageProgress < 0.9 && (
              <div className={styles.particles}>
                {Array.from({ length: 20 }, (_, i) => (
                  <div 
                    key={i}
                    className={styles.particle}
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      opacity: Math.min((stageProgress - 0.2) * 2, 1) * Math.max(1 - (stageProgress - 0.7) * 3.33, 0)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        
        {/* Build Stage */}
        {currentStage === 'build' && (
          <div className={`${styles.stage} ${styles.buildStage}`} style={{
            opacity: Math.min(stageProgress * 2, 1)  // Fade in during first 50% of build stage
          }}>
            <div className={styles.buildContainer}>
              {/* Use actual BuildViewer component */}
              <div 
                className={styles.buildViewerWrapper}
                style={{
                  opacity: 1,  // Already controlled by parent
                  pointerEvents: 'none' // Disable interaction
                }}
              >
                {diceGrid ? (
                  <BuildViewer 
                    key={`build-${buildViewerKey.current}`} // Only remount when entering build stage
                    grid={diceGrid}
                    initialX={25}  // Always start at the beginning
                    initialY={25}  // Always start at the beginning
                    onPositionChange={(x, y) => {
                      console.log('BuildViewer position:', x, y)
                    }}
                    onNavigationReady={(handlers) => {
                      console.log('Build navigation ready', handlers)
                      setBuildNavigation(handlers)
                    }}
                  />
                ) : (
                  <div className="text-white text-center">Loading dice grid...</div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Call to Action Stage */}
        {currentStage === 'cta' && (
          <div className={`${styles.stage} ${styles.ctaStage}`}>
            <div 
              className={styles.ctaContent}
              style={{
                opacity: stageProgress,
                transform: `translateY(${50 - stageProgress * 50}px)`
              }}
            >
              <h2>Start Building Yours Today</h2>
              <p>Create stunning dice art from your own photos</p>
              <Link href="/editor" className={styles.ctaButton}>
                Launch Editor
              </Link>
            </div>
          </div>
        )}
        
        </div>
      </div>
    </>
  )
}