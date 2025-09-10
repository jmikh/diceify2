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
import { useSession, signOut } from 'next-auth/react'
import { Save, Loader2 } from 'lucide-react'
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
import AuthModal from '@/components/AuthModal'
import { theme } from '@/lib/theme'
import { WorkflowStep, ColorMode, DiceParams, DiceStats, DiceGrid } from '@/lib/types'

// Types are now imported from @/lib/types

export default function Editor() {
  const { data: session, status } = useSession()
  const [step, setStep] = useState<WorkflowStep>('upload')
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // Debug refs to track callback stability
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
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null) // Processed dice grid image
  const [dieSize, setDieSize] = useState(16) // mm
  const [costPer1000, setCostPer1000] = useState(60) // dollars
  const [projectName, setProjectName] = useState('Untitled Project')
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  
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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

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
  
  // Throttle position updates to reduce parent re-renders
  const lastUpdateTimeRef = useRef(0)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleBuildProgressUpdate = useCallback((x: number, y: number) => {
    if (!diceGrid) return
    
    
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current
    
    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = null
    }
    
    // Store the pending update
    pendingUpdateRef.current = { x, y }
    
    // Throttle updates to max 10 per second (100ms)
    if (timeSinceLastUpdate >= 100) {
      // Enough time has passed, update immediately
      lastUpdateTimeRef.current = now
      setBuildProgress(prev => {
        if (prev.x === x && prev.y === y) {
          return prev // No change, return same reference
        }
        
        const totalDice = diceGrid.width * diceGrid.height
        const currentIndex = y * diceGrid.width + x
        const percentage = Math.round((currentIndex / totalDice) * 100)
        return { x, y, percentage }
      })
      pendingUpdateRef.current = null
    } else {
      // Schedule an update for when the throttle period expires
      const delay = 100 - timeSinceLastUpdate
      updateTimeoutRef.current = setTimeout(() => {
        const pending = pendingUpdateRef.current
        if (pending) {
          lastUpdateTimeRef.current = Date.now()
          setBuildProgress(prev => {
            if (prev.x === pending.x && prev.y === pending.y) {
              return prev // No change, return same reference
            }
            
            const totalDice = diceGrid.width * diceGrid.height
            const currentIndex = pending.y * diceGrid.width + pending.x
            const percentage = Math.round((currentIndex / totalDice) * 100)
            return { x: pending.x, y: pending.y, percentage }
          })
          pendingUpdateRef.current = null
        }
        updateTimeoutRef.current = null
      }, delay)
    }
  }, [diceGrid])
  
  // Handle navigation with build progress check
  const handleStepNavigation = useCallback((newStep: WorkflowStep) => {
    // Check if trying to enter build step without auth
    if (newStep === 'build' && status !== 'authenticated') {
      setShowAuthModal(true)
      return
    }
    
    // Check if leaving build step with progress
    if (shouldWarnOnExit && newStep !== 'build') {
      setAttemptedStep(newStep)
      setShowBuildProgressDialog(true)
    } else {
      setStep(newStep)
    }
  }, [shouldWarnOnExit, status])
  
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
    setProcessedImageUrl(null)
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
  // Create a new project
  const createProject = useCallback(async () => {
    if (!session?.user?.id) return

    // Reset all states for new project
    resetWorkflow()
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Untitled Project',
          originalImage: null,
          croppedImage: null,
          numRows: 50,
          colorMode: 'both',
          contrast: 0,
          gridData: null,
          totalDice: 0,
          completedDice: 0,
          currentX: 0,
          currentY: 0,
          percentComplete: 0
        })
      })

      if (response.ok) {
        const project = await response.json()
        setCurrentProjectId(project.id)
        setProjectName(project.name)
        setLastSavedAt(new Date())
        // Navigate to upload step for new project
        setStep('upload')
      } else if (response.status === 403) {
        const data = await response.json()
        alert(data.error || 'Project limit reached. Maximum 5 projects allowed.')
      } else {
        console.error('Failed to create project')
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsSaving(false)
    }
  }, [session])

  // Save current project
  const saveProject = useCallback(async () => {
    if (!session?.user?.id || !currentProjectId) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/projects/${currentProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          originalImage,
          croppedImage,
          numRows: diceParams.numRows,
          colorMode: diceParams.colorMode,
          contrast: diceParams.contrast,
          gridData: diceGrid ? JSON.stringify(diceGrid) : null,
          totalDice: diceStats.totalCount,
          completedDice: buildProgress.completedDice,
          currentX: buildProgress.x,
          currentY: buildProgress.y,
          percentComplete: buildProgress.percentage
        })
      })

      if (response.ok) {
        setLastSavedAt(new Date())
      }
    } catch (error) {
      console.error('Failed to save project:', error)
    } finally {
      setIsSaving(false)
    }
  }, [session, currentProjectId, projectName, originalImage, croppedImage, diceParams, diceGrid, diceStats, buildProgress])

  // Load a project
  const loadProject = useCallback(async (project: any) => {
    // If we only have basic project info, fetch the full project
    if (!project.originalImage && !project.gridData) {
      try {
        const response = await fetch(`/api/projects/${project.id}`)
        if (response.ok) {
          const fullProject = await response.json()
          project = fullProject
        }
      } catch (error) {
        console.error('Failed to fetch full project:', error)
        return
      }
    }

    console.log('Loading project:', project)
    
    setCurrentProjectId(project.id)
    setProjectName(project.name)
    
    // Load images
    if (project.originalImage) {
      console.log('Setting original image')
      setOriginalImage(project.originalImage)
    }
    if (project.croppedImage) {
      console.log('Setting cropped image')
      setCroppedImage(project.croppedImage)
    }
    
    // Reset processed image URL when loading a project
    setProcessedImageUrl(null)
    
    // Load parameters
    setDiceParams(prev => ({
      ...prev,
      numRows: project.numRows || 30,
      colorMode: project.colorMode || 'both',
      contrast: project.contrast || 0
    }))
    
    // Load grid data
    if (project.gridData) {
      try {
        console.log('Parsing grid data')
        const grid = JSON.parse(project.gridData)
        setDiceGrid(grid)
        // Also update stats from grid
        if (grid.stats) {
          setDiceStats(grid.stats)
        }
      } catch (e) {
        console.error('Failed to parse grid data:', e)
      }
    }
    
    // Load progress
    setBuildProgress({
      x: project.currentX || 0,
      y: project.currentY || 0,
      completedDice: project.completedDice || 0,
      percentage: project.percentComplete || 0
    })
    
    // Navigate to appropriate step
    if (project.gridData) {
      console.log('Navigating to build step')
      setStep('build')
    } else if (project.croppedImage) {
      console.log('Navigating to tune step')
      setStep('tune')
    } else if (project.originalImage) {
      console.log('Navigating to crop step')
      setStep('crop')
    }
  }, [])

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
    console.log('🧭 handleNavigationReady called')
    setBuildNavigation(nav)
  }, [])

  // Auto-create project when user uploads image and is signed in
  useEffect(() => {
    if (originalImage && session?.user?.id && !currentProjectId) {
      createProject()
    }
  }, [originalImage, session, currentProjectId, createProject])

  // Auto-save on build progress changes (debounced)
  useEffect(() => {
    if (!currentProjectId || !session?.user?.id) return

    const saveTimer = setTimeout(() => {
      // Only save if we have meaningful changes
      if (buildProgress.completedDice > 0) {
        saveProject()
      }
    }, 3000) // Save after 3 seconds of no changes

    return () => clearTimeout(saveTimer)
  }, [buildProgress.completedDice, currentProjectId, session, saveProject])

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#000000' }}>
      
      <header className="relative" style={{ backgroundColor: 'transparent', zIndex: 50 }}>
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
                {/* Save button */}
                {currentProjectId && (
                  <button
                    onClick={saveProject}
                    disabled={isSaving}
                    className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                )}
                {lastSavedAt && (
                  <span className="text-xs text-gray-400">
                    Saved {lastSavedAt.toLocaleTimeString()}
                  </span>
                )}
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
                        onError={(e) => {
                          console.error('Image failed to load:', session.user?.image)
                          // Hide the broken image and show fallback
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center text-white font-semibold"
                      style={{ display: session.user?.image ? 'none' : 'flex' }}
                    >
                      {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
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
                          signOut()
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

      {/* Main Content Area */}
      <main className="relative h-[calc(100vh-73px)] overflow-y-auto p-8">
        {/* Project Selector and Stepper - Always visible at top */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
          <ProjectSelector 
            currentProject={projectName}
            currentProjectId={currentProjectId}
            onProjectChange={setProjectName}
            onProjectSelect={loadProject}
            onCreateProject={createProject}
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
                  key={`tune-stats-${currentProjectId}-${diceStats.totalCount}-${croppedImage?.substring(0, 20)}`}
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
                  imageUrl={processedImageUrl || croppedImage}
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
              onProcessedImageReady={setProcessedImageUrl}
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
                  key={`build-stats-${currentProjectId}-${diceStats.totalCount}-${croppedImage?.substring(0, 20)}`}
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
                  imageUrl={processedImageUrl || croppedImage}
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
              key={`${currentProjectId}-viewer`}
              grid={diceGrid}
              initialX={0}
              initialY={0}
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
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          setStep('build')
        }}
        message="Sign in to save your progress and start building your dice art"
      />
    </div>
  )
}