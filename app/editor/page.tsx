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
import { theme } from '@/lib/theme'
import { WorkflowStep, ColorMode, DiceParams, DiceStats, DiceGrid } from '@/lib/types'
import CountUp from 'react-countup'

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
  
  // Track previous cost for animation
  const prevCostRef = useRef((diceStats.totalCount / 1000) * costPer1000)
  
  // Calculate current cost
  const currentCost = (diceStats.totalCount / 1000) * costPer1000
  
  // Update previous cost when current changes
  useEffect(() => {
    prevCostRef.current = currentCost
  }, [currentCost])
  
  // Ease-out cubic function for smooth deceleration
  const easeOutCubic = (t: number, b: number, c: number, d: number) => {
    return c * ((t = t / d - 1) * t * t + 1) + b
  }
  
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
    setStep('tune')
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
  const handleStepNavigation = (newStep: WorkflowStep) => {
    // Check if leaving build step with progress
    if (step === 'build' && buildProgress.percentage > 0 && newStep !== 'build') {
      setAttemptedStep(newStep)
      setShowBuildProgressDialog(true)
    } else {
      setStep(newStep)
    }
  }
  
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
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: theme.colors.background.primary }}>
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: theme.colors.glow.purple }} />
        <div className="absolute top-1/2 -right-20 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000" style={{ backgroundColor: theme.colors.glow.blue }} />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse delay-500" style={{ backgroundColor: theme.colors.glow.pink }} />
      </div>
      
      <header className="relative backdrop-blur-xl border-b" style={{ backgroundColor: theme.colors.glass.light, borderColor: theme.colors.glass.border }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
            Dice Art Generator
          </h1>
          
          {/* Project Selector in header */}
          <ProjectSelector 
            currentProject={projectName}
            onProjectChange={setProjectName}
            onProjectSelect={(id) => {
              // In a real app, this would load the project data
              console.log('Selected project:', id)
            }}
          />
        </div>
      </header>

      {/* Main layout with side panel */}
      <div className="relative flex h-[calc(100vh-73px)]">
        {/* Left Side Panel */}
        <div className="w-80 backdrop-blur-xl border-r overflow-y-auto" 
             style={{ 
               backgroundColor: theme.colors.glass.light, 
               borderColor: theme.colors.glass.border 
             }}>
          <div className="p-4 space-y-4">
            {/* Stats display - shown for tune and build steps */}
            {(step === 'tune' || step === 'build') && (
              <div className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-3 rounded-2xl shadow-xl">
                <DiceStatsComponent 
                  blackCount={diceStats.blackCount}
                  whiteCount={diceStats.whiteCount}
                  totalCount={diceStats.totalCount}
                  gridWidth={diceGrid?.width}
                  gridHeight={diceGrid?.height}
                  frameWidth={frameWidth}
                  frameHeight={frameHeight}
                />
                
                {/* Cost Calculator */}
                <div className="pt-3 mt-3 border-t" style={{ borderColor: theme.colors.glass.border }}>
                  <div className="space-y-2">
                    {/* Die Size Input */}
                    <div className="flex items-center justify-between">
                      <label className="text-xs" style={{ color: theme.colors.text.secondary }}>
                        Die Size
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={dieSize}
                          onChange={(e) => setDieSize(Math.max(1, Math.min(50, parseInt(e.target.value) || 16)))}
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
                    
                    {/* Cost Input */}
                    <div className="flex items-center justify-between">
                      <label className="text-xs" style={{ color: theme.colors.text.secondary }}>
                        Cost/1000
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: theme.colors.text.muted }}>$</span>
                        <input
                          type="number"
                          value={costPer1000}
                          onChange={(e) => setCostPer1000(Math.max(1, Math.min(999, parseInt(e.target.value) || 60)))}
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
                  </div>
                  
                  {/* Calculations */}
                  <div className="mt-3 pt-2 border-t space-y-1" style={{ borderColor: theme.colors.glass.border }}>
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
                  </div>
                </div>
              </div>
            )}
            
            {/* Control panel - shown for tune step */}
            {step === 'tune' && (
              <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 overflow-hidden shadow-xl">
                <ControlPanel
                  params={diceParams}
                  onParamChange={handleParamChange}
                />
              </div>
            )}
            
            {/* Build Progress - shown for build step */}
            {step === 'build' && diceGrid && buildNavigation && (
              <BuildProgress
                currentX={buildProgress.x}
                currentY={buildProgress.y}
                totalRows={diceGrid.height}
                totalCols={diceGrid.width}
                currentDice={diceGrid.dice[buildProgress.x]?.[buildProgress.y] || null}
                currentIndex={buildProgress.y * diceGrid.width + buildProgress.x}
                totalDice={diceGrid.width * diceGrid.height}
                onNavigate={(direction) => {
                  switch (direction) {
                    case 'prev':
                      buildNavigation.navigatePrev()
                      break
                    case 'next':
                      buildNavigation.navigateNext()
                      break
                    case 'prevDiff':
                      buildNavigation.navigatePrevDiff()
                      break
                    case 'nextDiff':
                      buildNavigation.navigateNextDiff()
                      break
                  }
                }}
                canNavigate={buildNavigation.canNavigate}
              />
            )}
          </div>
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto p-4 z-10">
        {/* Stepper at top of main content */}
        <div className="mb-6 flex justify-center">
          <DiceStepper 
            currentStep={step} 
            onStepClick={handleStepperClick}
            hasImage={!!originalImage}
          />
        </div>
        
        {step === 'upload' && (
          <div className="mt-8">
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>
        )}

        {step === 'crop' && originalImage && (
          <div className="mt-8">
            <Cropper
              imageUrl={originalImage}
              onCropComplete={handleCropComplete}
              onBack={() => handleStepNavigation('upload')}
            />
          </div>
        )}

        {step === 'tune' && croppedImage && (
          <div className="max-w-6xl mx-auto mt-8">
            {/* Main container with glassmorphism - same as cropper */}
            <div className="relative">
              {/* Background glow effects */}
              <div className="absolute -inset-4 opacity-50">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
              </div>

              <div className="relative backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-6 shadow-2xl">
                {/* Canvas area - now takes full width */}
                <div className="flex items-center justify-center" style={{ 
                  maxWidth: '900px',
                  maxHeight: '600px',
                  width: '100%',
                  height: '600px',
                  margin: '0 auto'
                }}>
                  <div className="relative rounded-2xl overflow-hidden flex items-center justify-center" style={{ 
                    border: `2px solid ${theme.colors.dice.activeBorder}`,
                    backgroundColor: 'transparent'
                  }}>
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
                </div>

                {/* Action buttons */}
                <div className="mt-6 flex justify-center gap-4">
                  <button
                    onClick={() => handleStepNavigation('crop')}
                    className="px-6 py-3 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all hover:scale-105"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleStepNavigation('build')}
                    className="px-8 py-3 text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ 
                      backgroundColor: theme.colors.accent.blue,
                      boxShadow: `0 0 20px ${theme.colors.glow.blue}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.accent.purple;
                      e.currentTarget.style.boxShadow = `0 0 30px ${theme.colors.glow.purple}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.accent.blue;
                      e.currentTarget.style.boxShadow = `0 0 20px ${theme.colors.glow.blue}`;
                    }}
                  >
                    Continue to Build 🎲
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'build' && diceGrid && (
          <div className="mt-8">
            <BuildViewer 
              grid={diceGrid}
              stats={diceStats}
              initialX={buildProgress.x}
              initialY={buildProgress.y}
              onPositionChange={handleBuildProgressUpdate}
              onNavigationReady={handleNavigationReady}
            />
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => handleStepNavigation('tune')}
                className="px-6 py-3 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all hover:scale-105"
              >
                Back
              </button>
              <button 
                onClick={() => handleStepNavigation('export')}
                className="px-8 py-3 text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl"
                style={{ 
                  backgroundColor: theme.colors.accent.green,
                  boxShadow: `0 0 20px ${theme.colors.glow.green}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.accent.blue;
                  e.currentTarget.style.boxShadow = `0 0 30px ${theme.colors.glow.blue}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.accent.green;
                  e.currentTarget.style.boxShadow = `0 0 20px ${theme.colors.glow.green}`;
                }}
              >
                Continue to Export 📦
              </button>
            </div>
          </div>
        )}

        {step === 'export' && (
          <div className="mt-8 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.accent.green }}>
                Export Your Art
              </h2>
            <p className="text-white/60">Choose your export format and download your dice art.</p>
            <button 
              onClick={() => handleStepNavigation('share')}
              className="mt-6 px-6 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: theme.colors.accent.green }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.accent.blue}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.accent.green}
            >
              Continue to Share
            </button>
          </div>
        )}

        {step === 'share' && (
          <div className="mt-8 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.accent.purple }}>
              Share Your Creation
            </h2>
            <p className="text-white/60">Share your dice art with the community!</p>
            <button 
              onClick={resetWorkflow}
              className="mt-6 px-6 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: theme.colors.accent.purple }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.accent.pink}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.accent.purple}
            >
              Create Another
            </button>
          </div>
        )}
        </main>
      </div>
      
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