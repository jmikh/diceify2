/**
 * Editor Page Component
 * 
 * Main orchestrator for the dice art creation workflow.
 * This is the top-level page component that manages the entire application state
 * and coordinates between different workflow steps.
 * 
 * Workflow Steps:
 * 1. Upload: User selects/drops an image file
 * 2. Crop: Image cropping and zooming interface
 * 3. Tune: Convert image to dice with parameter controls
 * 4. Build: Interactive viewer to navigate through dice one-by-one
 * 5. Export: Download the final artwork (future)
 * 6. Share: Share creations with others (future)
 * 
 * State Management:
 * - Maintains all shared state (image, parameters, dice grid)
 * - Passes data and callbacks down to child components
 * - Controls workflow progression and step visibility
 * 
 * Key Types:
 * - WorkflowStep: Current step in the process
 * - DiceParams: Configuration for dice generation
 * - ColorMode: Black & White, Black Only, or White Only
 * - DiceStats: Statistics about the generated dice
 * - DiceGrid: The actual 2D array of dice data
 * 
 * This follows a typical React pattern where the page component
 * acts as the "smart" container and child components are mostly
 * "dumb" presentational components that receive props.
 */

'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import ImageUploader from '@/components/Editor/ImageUploader'
import Cropper from '@/components/Editor/Cropper'
import DiceCanvas from '@/components/Editor/DiceCanvas'
import ControlPanel from '@/components/Editor/ControlPanel'
import DiceStatsComponent from '@/components/Editor/DiceStats'
import BuildViewer from '@/components/Editor/BuildViewer'
import BuildProgress from '@/components/Editor/BuildProgress'
import ConfirmDialog from '@/components/Editor/ConfirmDialog'
import ProjectSelector from '@/components/Editor/ProjectSelector'
import DiceStepper from '@/components/Editor/DiceStepper'
import Logo from '@/components/Logo'
import AnimatedBackground from '@/components/AnimatedBackground'
import { theme } from '@/lib/theme'
import { WorkflowStep, ColorMode, DiceParams, DiceStats, DiceGrid } from '@/lib/types'

// Types are now imported from @/lib/types

export default function Editor() {
  const [step, setStep] = useState<WorkflowStep>('upload')
  const [originalImage, setOriginalImage] = useState<string | null>(null)
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
  const [dieSize, setDieSize] = useState(16) // mm
  const [costPer1000, setCostPer1000] = useState(60) // dollars
  const [projectName, setProjectName] = useState('Untitled Project')
  
  // Memoize frame dimensions to prevent re-renders
  const frameWidth = useMemo(() => {
    return diceGrid ? (diceGrid.width * dieSize) / 10 : undefined
  }, [diceGrid?.width, dieSize])
  
  const frameHeight = useMemo(() => {
    return diceGrid ? (diceGrid.height * dieSize) / 10 : undefined
  }, [diceGrid?.height, dieSize])
  
  // Build progress tracking
  const [buildProgress, setBuildProgress] = useState<{ x: number; y: number; percentage: number }>({ 
    x: 0, 
    y: 0, 
    percentage: 0 
  })
  const [lastGridHash, setLastGridHash] = useState<string>('')
  
  // Compute if we should warn when exiting build step (only true if there's progress)
  const shouldWarnOnExit = step === 'build' && buildProgress.percentage > 0
  
  // Navigation confirmation dialog
  const [showBuildProgressDialog, setShowBuildProgressDialog] = useState(false)
  const [attemptedStep, setAttemptedStep] = useState<WorkflowStep | null>(null)
  
  // Build navigation handlers
  const [buildNavigation, setBuildNavigation] = useState<{
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
  } | null>(null)

  const handleImageUpload = (imageUrl: string) => {
    setOriginalImage(imageUrl)
    setCroppedImage(null)
    setDiceGrid(null)
    setBuildProgress({ x: 0, y: 0, percentage: 0 })
    setDiceStats({
      blackCount: 0,
      whiteCount: 0,
      totalCount: 0,
    })
    setStep('crop')
  }

  const handleCropComplete = (croppedImageUrl: string) => {
    setCroppedImage(croppedImageUrl)
    // Don't auto-navigate - let user use stepper
  }

  // Generate hash from grid parameters to detect changes
  const generateGridHash = (params: DiceParams): string => {
    return JSON.stringify({
      numRows: params.numRows,
      colorMode: params.colorMode,
      contrast: params.contrast,
      gamma: params.gamma,
      edgeSharpening: params.edgeSharpening,
      rotate6: params.rotate6,
      rotate3: params.rotate3,
      rotate2: params.rotate2,
    })
  }

  const handleParamChange = (params: Partial<DiceParams>) => {
    setDiceParams(prev => ({ ...prev, ...params }))
  }

  const handleStatsUpdate = (stats: DiceStats) => {
    setDiceStats(stats)
  }

  const handleGridUpdate = (grid: DiceGrid) => {
    setDiceGrid(grid)
    
    // Check if grid has changed
    const newHash = generateGridHash(diceParams)
    if (newHash !== lastGridHash) {
      setLastGridHash(newHash)
      // Reset build progress when grid changes
      setBuildProgress({ x: 0, y: 0, percentage: 0 })
    }
  }
  
  const handleBuildProgressUpdate = useCallback((x: number, y: number) => {
    if (!diceGrid) return
    
    // Only update if position actually changed
    setBuildProgress(prev => {
      if (prev.x === x && prev.y === y) {
        return prev // No change, return same reference
      }
      
      const totalDice = diceGrid.width * diceGrid.height
      const currentIndex = y * diceGrid.width + x
      const percentage = Math.round((currentIndex / totalDice) * 100)
      return { x, y, percentage }
    })
  }, [diceGrid])
  
  // Handle navigation with build progress check
  const handleStepNavigation = useCallback((newStep: WorkflowStep) => {
    // Check if leaving build step with progress
    if (shouldWarnOnExit && newStep !== 'build') {
      setAttemptedStep(newStep)
      setShowBuildProgressDialog(true)
    } else {
      setStep(newStep)
    }
  }, [shouldWarnOnExit])
  
  // Reset build progress and navigate to attempted step
  const handleResetBuildProgress = () => {
    setBuildProgress({ x: 0, y: 0, percentage: 0 })
    setShowBuildProgressDialog(false)
    if (attemptedStep) {
      setStep(attemptedStep)
      setAttemptedStep(null)
    }
  }
  
  // Cancel navigation and stay in build
  const handleStayInBuild = () => {
    setShowBuildProgressDialog(false)
    setAttemptedStep(null)
  }

  const resetWorkflow = () => {
    setStep('upload')
    setOriginalImage(null)
    setCroppedImage(null)
    setDiceParams({
      numRows: 30,
      colorMode: 'both',
      contrast: 0,
      gamma: 1.0,
      edgeSharpening: 0,
      rotate6: false,
      rotate3: false,
      rotate2: false,
    })
    setDiceStats({
      blackCount: 0,
      whiteCount: 0,
      totalCount: 0,
    })
    setBuildProgress({ x: 0, y: 0, percentage: 0 })
    setDiceGrid(null)
  }
  
  // Handle stepper click navigation - simplified: allow clicking any step if image is uploaded
  const handleStepperClick = useCallback((clickedStep: WorkflowStep) => {
    // Always allow upload
    if (clickedStep === 'upload') {
      handleStepNavigation('upload')
      return
    }
    
    // Allow any step if there's an image
    if (originalImage) {
      handleStepNavigation(clickedStep)
    }
  }, [originalImage, handleStepNavigation])
  
  // Memoize the navigation ready handler
  const handleNavigationReady = useCallback((nav: any) => {
    setBuildNavigation(nav)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#000000' }}>
      
      <header className="relative backdrop-blur-xl border-b" style={{ backgroundColor: theme.colors.glass.light, borderColor: theme.colors.glass.border, zIndex: 50 }}>
        <div className="max-w-7xl mx-auto px-4 py-4 relative flex items-center">

          
          {/* Centered Logo */}
          <div className="flex-1 flex justify-center">
            <Logo />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative h-[calc(100vh-73px)] overflow-y-auto p-8">
        {/* Project Selector and Stepper - Always visible at top */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
          <ProjectSelector 
            currentProject={projectName}
            onProjectChange={setProjectName}
          />
          <DiceStepper 
            currentStep={step} 
            onStepClick={handleStepperClick}
            hasImage={!!originalImage}
          />
        </div>

        {/* Step Content */}
        {step === 'upload' && (
          <ImageUploader onImageUpload={handleImageUpload} />
        )}

        {step === 'crop' && originalImage && (
          <Cropper
            imageUrl={originalImage}
            onCropComplete={handleCropComplete}
          />
        )}

        {step === 'tune' && croppedImage && (
          <div className="flex flex-wrap lg:flex-nowrap gap-6 justify-center">
            {/* Left floating panels */}
            <div className="space-y-4 w-80 flex-shrink-0">
              {/* Stats display */}
              <div 
                className="backdrop-blur-md border text-white px-4 py-3 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: `${theme.colors.accent.purple}33`,
                  boxShadow: `0 10px 40px rgba(139, 92, 246, 0.25),
                             0 0 60px rgba(59, 130, 246, 0.08),
                             0 5px 20px rgba(0, 0, 0, 0.3)`
                }}
              >
                <DiceStatsComponent 
                  blackCount={diceStats.blackCount}
                  whiteCount={diceStats.whiteCount}
                  totalCount={diceStats.totalCount}
                  gridWidth={diceGrid?.width}
                  gridHeight={diceGrid?.height}
                  frameWidth={frameWidth}
                  frameHeight={frameHeight}
                  dieSize={dieSize}
                  costPer1000={costPer1000}
                  onDieSizeChange={setDieSize}
                  onCostPer1000Change={setCostPer1000}
                />
              </div>
              
              {/* Control panel */}
              <div 
                className="backdrop-blur-md rounded-2xl border overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: `${theme.colors.accent.purple}33`,
                  boxShadow: `0 10px 40px rgba(139, 92, 246, 0.25),
                             0 0 60px rgba(59, 130, 246, 0.08),
                             0 5px 20px rgba(0, 0, 0, 0.3)`
                }}
              >
                <ControlPanel
                  params={diceParams}
                  onParamChange={handleParamChange}
                />
              </div>
            </div>
            
            {/* Main content */}
            <DiceCanvas
              imageUrl={croppedImage}
              params={diceParams}
              onStatsUpdate={handleStatsUpdate}
              onGridUpdate={handleGridUpdate}
              maxWidth={900}
              maxHeight={600}
              currentStep={step}
            />
          </div>
        )}

        {step === 'build' && diceGrid && (
          <div className="flex flex-wrap lg:flex-nowrap gap-6 justify-center">
            {/* Left floating panels */}
            <div className="space-y-4 w-80 flex-shrink-0">
              {/* Stats display */}
              <div 
                className="backdrop-blur-md border text-white px-4 py-3 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: `${theme.colors.accent.purple}33`,
                  boxShadow: `0 10px 40px rgba(139, 92, 246, 0.25),
                             0 0 60px rgba(59, 130, 246, 0.08),
                             0 5px 20px rgba(0, 0, 0, 0.3)`
                }}
              >
                <DiceStatsComponent 
                  blackCount={diceStats.blackCount}
                  whiteCount={diceStats.whiteCount}
                  totalCount={diceStats.totalCount}
                  gridWidth={diceGrid?.width}
                  gridHeight={diceGrid?.height}
                  frameWidth={frameWidth}
                  frameHeight={frameHeight}
                  dieSize={dieSize}
                  costPer1000={costPer1000}
                  onDieSizeChange={setDieSize}
                  onCostPer1000Change={setCostPer1000}
                />
              </div>
              
              {/* Build progress */}
              {buildNavigation && (
                <div 
                  className="backdrop-blur-md border text-white px-4 py-3 rounded-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderColor: `${theme.colors.accent.purple}33`,
                    boxShadow: `0 10px 40px rgba(139, 92, 246, 0.25),
                               0 0 60px rgba(59, 130, 246, 0.08),
                               0 5px 20px rgba(0, 0, 0, 0.3)`
                  }}
                >
                  <BuildProgress
                    currentX={buildProgress.x}
                    currentY={buildProgress.y}
                    totalRows={diceGrid.height}
                    totalCols={diceGrid.width}
                    currentDice={null}
                    currentIndex={buildProgress.y * diceGrid.width + buildProgress.x}
                    totalDice={diceGrid.width * diceGrid.height}
                    onNavigate={(direction) => {
                      if (direction === 'prev') buildNavigation.navigatePrev()
                      else if (direction === 'next') buildNavigation.navigateNext()
                      else if (direction === 'prevDiff') buildNavigation.navigatePrevDiff()
                      else if (direction === 'nextDiff') buildNavigation.navigateNextDiff()
                    }}
                    canNavigate={buildNavigation.canNavigate}
                  />
                </div>
              )}
            </div>
            
            {/* Main build viewer */}
            <BuildViewer 
              grid={diceGrid}
              stats={diceStats}
              initialX={buildProgress.x}
              initialY={buildProgress.y}
              onPositionChange={handleBuildProgressUpdate}
              onNavigationReady={handleNavigationReady}
            />
          </div>
        )}

      </main>
      
      {/* Build Progress Dialog */}
      <ConfirmDialog
        isOpen={showBuildProgressDialog}
        title="Build in Progress"
        message="You have a build in progress. Are you sure you want to reset?"
        progress={buildProgress.percentage}
        confirmText="Reset"
        confirmButtonColor={theme.colors.accent.pink}
        cancelText="Back to Build"
        cancelButtonColor={theme.colors.accent.blue}
        onConfirm={handleResetBuildProgress}
        onCancel={handleStayInBuild}
      />
    </div>
  )
}